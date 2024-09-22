import type { Image, Link } from "mdast";
import type { Directives } from "mdast-util-directive";
import { toString as mdastToString } from "mdast-util-to-string";
import type { DirectiveTransformer } from ".";

export default class GithubCardTransformer implements DirectiveTransformer {
  repo?: string;

  shouldTransform(node: Directives): boolean {
    if (node.type !== "leafDirective") return false;
    if (node.name !== "gh-card") return false;

    this.repo = mdastToString(node);

    return true;
  }

  async transform(node: Directives) {
    if (!this.repo) return;

    const repoUrl = `https://github.com/${this.repo}`;
    const svgUrl = `https://gh-card.dev/repos/${this.repo}.svg?fullname=`;

    const imageNode: Image = { type: "image", url: svgUrl, alt: this.repo };
    const linkNode: Link = {
      type: "link",
      url: repoUrl,
      children: [imageNode],
    };

    node.data = { hProperties: { className: "gh-card" } };

    node.children = [linkNode];
  }
}
