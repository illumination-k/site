import type { Directives } from "mdast-util-directive";
import { toString as mdastToString } from "mdast-util-to-string";
import type { DirectiveTransformer } from ".";

export class YouTubeTransformer implements DirectiveTransformer {
  shouldTransform(node: Directives): boolean {
    if (node.type !== "leafDirective") return false;
    if (node.name !== "youtube") return false;

    return true;
  }

  async transform(node: Directives) {
    const video_id = mdastToString(node);

    node.children = [];
    node.data = {
      hName: "iframe",
      hProperties: {
        id: "ytplayer",
        className: "youtube-embed",
        src: `https://www.youtube.com/embed/${video_id}`,
      },
    };
  }
}
