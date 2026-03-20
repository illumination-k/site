import figure from "./figure";

import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(figure)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("FigureDirective", async () => {
  it("wraps image with figure and auto-numbered figcaption", async () => {
    const vfile = await processor.process(`:::figure[システム構成図]
![arch](./assets/arch.png)
:::
`);

    expect(vfile.value).toStrictEqual(
      '<figure><p><img src="./assets/arch.png" alt="arch"></p><figcaption>Figure 1: システム構成図</figcaption></figure>',
    );
  });

  it("auto-numbers multiple figures sequentially", async () => {
    const vfile = await processor.process(`:::figure[最初の図]
![first](./first.png)
:::

:::figure[二番目の図]
![second](./second.png)
:::
`);

    const html = String(vfile.value);
    expect(html).toContain("<figcaption>Figure 1: 最初の図</figcaption>");
    expect(html).toContain("<figcaption>Figure 2: 二番目の図</figcaption>");
  });

  it("adds figcaption without label text", async () => {
    const vfile = await processor.process(`:::figure
![arch](./assets/arch.png)
:::
`);

    expect(vfile.value).toStrictEqual(
      '<figure><p><img src="./assets/arch.png" alt="arch"></p><figcaption>Figure 1</figcaption></figure>',
    );
  });

  it("does not affect other container directives", async () => {
    const vfile = await processor.process(`:::details[test]
Some details
:::
`);

    // details directive is not registered here, so it falls through as a div
    expect(String(vfile.value)).not.toContain("<figure>");
    expect(String(vfile.value)).not.toContain("<figcaption>");
  });
});
