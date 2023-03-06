import { describe, expect, it } from "vitest";
import { getBookInfo } from "./book";

import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import remarkDirectiveEmbedGenerator from ".";

describe("test get book info", () => {
  it("isbn10", async () => {
    const result = await getBookInfo("4873117984");

    console.log(result);
  });
});
