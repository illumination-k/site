import axios from "axios";
import { Paragraph, Parent } from "mdast";
import { Directive } from "mdast-util-directive";
import { toString } from "mdast-util-to-string";
import { DirectiveTransformer } from ".";

// https://www.crossref.org/blog/dois-and-matching-regular-expressions/
export const doiRegExp = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;

export class DoiTransformer implements DirectiveTransformer {
  url?: string;

  constructor() {}

  shouldTransform(node: Directive): boolean {
    if (node.type !== "leafDirective") return false;
    if (node.name !== "doi") return false;

    const s = toString(node);

    if (s.startsWith("https://doi.org/")) {
      if (!doiRegExp.test(s.replace("https://doi.org/", ""))) {
        return false;
      }
      this.url = s;
    } else {
      if (!doiRegExp.test(s)) {
        return false;
      }

      this.url = `https://doi.org/${s}`;
    }

    return true;
  }

  async transform(node: Directive, index: number | null, parent: Parent) {
    if (!this.url) return;

    let style = "apa";
    if (node.attributes && "id" in node.attributes) {
      style = node.attributes.id as string;
    }

    const resp = await axios.get(this.url, { headers: { Accept: "text/x-bibliography", style } });
    const citation = resp.data as string;

    const newNode: Paragraph = {
      type: "paragraph",
      children: [
        { type: "text", value: citation },
      ],
      data: { hProperties: { className: "doi" } },
    };

    parent.children[index || 0] = newNode;
  }
}
