import { describe, expect, it } from "vitest";

import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import remarkDirectiveEmbedGenerator from ".";
import { YouTubeTransformer } from "./youtube";

const remarkEmbed = remarkDirectiveEmbedGenerator([new YouTubeTransformer()]);
const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkEmbed)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("test youtube embed", () => {
  it("test a line", async () => {
    const vile = await processor.process("::youtube[NXTO3m1B_h4]");

    expect(vile.value).toStrictEqual(
      '<iframe id="ytplayer" class="youtube-embed" src="https://www.youtube.com/embed/NXTO3m1B_h4"></iframe>',
    );
  });
});
