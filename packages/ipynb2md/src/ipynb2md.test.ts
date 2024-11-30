import { describe, expect, it } from "vitest";

import IpynbToMdContext from "./ipynb2md";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IPYNB_PATH = path.join(__dirname, "../assets/test.ipynb");
const OUTPUT_DIR = path.join(__dirname, "../assets/output");

IpynbToMdContext.imageFileGenerator = (extension: string) =>
  `test.${extension}`;

describe("ipynb2md", () => {
  it("constructor IpynbToMdContext", () => {
    const context = IpynbToMdContext.from({
      ipynbFilePath: IPYNB_PATH,
      outputDir: OUTPUT_DIR,
    });

    expect(context).toBeDefined();
  });

  it("mdFilePath", () => {
    const context = IpynbToMdContext.from({
      ipynbFilePath: IPYNB_PATH,
      outputDir: OUTPUT_DIR,
    });

    expect(context.mdFilePath()).toBe(path.join(OUTPUT_DIR, "test.md"));
  });

  it("writeMdFile", () => {
    const context = IpynbToMdContext.from({
      ipynbFilePath: IPYNB_PATH,
      outputDir: OUTPUT_DIR,
    });

    context.writeMdFile();
  });
});
