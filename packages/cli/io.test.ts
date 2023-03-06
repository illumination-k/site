import { describe, it } from "vitest";

import { readPost } from "./io";

describe("test read post", () => {
  it("sample post", async () => {
    const post = await readPost("./test/test1.md");
    console.log(post);
  });
});
