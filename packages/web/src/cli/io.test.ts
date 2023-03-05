import { readPost } from "./io";

describe("test read post", () => {
  test("sample post", async () => {
    const post = await readPost("./test/test1.md");
    console.log(post);
  });
});
