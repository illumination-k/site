import type { Parent } from "mdast";
import type { Directives } from "mdast-util-directive";
import { toString as mdastToString } from "mdast-util-to-string";
import type { DirectiveTransformer } from ".";

export class YouTubeTransformer implements DirectiveTransformer {
  video_id?: string;

  shouldTransform(node: Directives): boolean {
    if (node.type !== "leafDirective") return false;
    if (node.name !== "youtube") return false;

    this.video_id = mdastToString(node);
    return true;
  }

  async transform(
    node: Directives,
    index: number | null | undefined,
    parent: Parent,
  ) {
    if (!this.video_id) return;

    node.children = [];
    node.data = {
      hName: "iframe",
      hProperties: {
        id: "ytplayer",
        className: "youtube-embed",
        src: `https://www.youtube.com/embed/${this.video_id}`,
      },
    };
  }
}
