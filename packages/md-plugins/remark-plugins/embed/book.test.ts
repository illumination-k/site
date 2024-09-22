import { describe, it } from "vitest";
import { getBookInfo } from "./book";

describe("test get book info", () => {
  it("isbn10", async () => {
    const result = await getBookInfo("4873117984");

    console.log(result);
  });
});
