import { describe, expect, it } from "vitest";

import { dumpPost, readPost } from "./io";

describe("test read post", () => {
  it("sample read post", async () => {
    const post = await readPost("./test/test1.md");
  });

  it("dump smaple post", async () => {
    const post = await readPost("./test/test1.md");
    const dump = await dumpPost(
      post,
      "./test/test1.md",
      "./test/public/imageDist",
    );
  });
});
