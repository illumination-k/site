import { describe, expect, it } from "vitest";

import { metadata2summary, readIpynbFile } from "./ipynb2md";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IPYNB_PATH = path.join(__dirname, "../assets/test.ipynb");

describe("ipynb2md", () => {
  it("read ipynb", () => {
    const ipynb = readIpynbFile(IPYNB_PATH);

    expect(ipynb).toBeDefined();
  });

  it("metadata2string", () => {
    const ipynb = readIpynbFile(IPYNB_PATH);

    const metadata = ipynb.metadata;
    const s = metadata2summary(metadata);

    console.log(s);

    expect(s.startsWith("<details>")).toBeTruthy();
    expect(s.endsWith("</details>\n")).toBeTruthy();
    expect(s).includes("<summary>Notebook Metadata</summary>");
  });
});
