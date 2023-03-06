import { Image, Link, Parent } from "mdast";
import { Directive } from "mdast-util-directive";
import { toString } from "mdast-util-to-string";
import { DirectiveTransformer } from ".";

export default class GithubCardTransformer implements DirectiveTransformer {
  repo?: string;

  constructor() {}

  shouldTransform(node: Directive): boolean {
    if (node.type !== "leafDirective") return false;
    if (node.name !== "gh-card") return false;

    this.repo = toString(node);

    return true;
  }

  async transform(node: Directive, index: number | null, parent: Parent) {
    if (!this.repo) return;

    const repoUrl = `https://github.com/${this.repo}`;
    const svgUrl = `https://gh-card.dev/repos/${this.repo}.svg?fullname=`;

    const imageNode: Image = { type: "image", url: svgUrl, alt: this.repo };
    const linkNode: Link = { type: "link", url: repoUrl, children: [imageNode] };

    parent.children[index || 0] = linkNode;
  }
}
