import axios from "axios";
import { Parent } from "mdast";
import { Directive } from "mdast-util-directive";
import { toString } from "mdast-util-to-string";
import { DirectiveTransformer } from ".";

export class YouTubeTransformer implements DirectiveTransformer {
  video_id?: string;

  constructor() {}

  shouldTransform(node: Directive): boolean {
    if (node.type !== "leafDirective") return false;
    if (node.name !== "youtube") return false;

    this.video_id = toString(node);
    return true;
  }

  async transform(node: Directive, index: number | null, parent: Parent) {
    if (!this.video_id) return;

    let style = "apa";
    if (node.attributes && "id" in node.attributes) {
      style = node.attributes.id as string;
    }

    const newNode = {
      type: "youtube",
      data: {
        hName: "iframe",
        hProperties: {
          id: "ytplayer",
          className: "youtube-embed",
          src: `https://www.youtube.com/embed/${this.video_id}`,
        },
      },
    };

    // @ts-ignore
    parent.children[index || 0] = newNode;
  }
}
