import { afterEach, beforeEach, describe, expect, it } from "vitest";

import IpynbToMdContext from ".";

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IPYNB_PATH = path.join(__dirname, "../assets/test.ipynb");

IpynbToMdContext.imageFileGenerator = (extension: string) =>
  `test.${extension}`;

describe("ipynb2md", () => {
  let outputDir: string;

  beforeEach(() => {
    outputDir = mkdtempSync(path.join(tmpdir(), "ipynb2md-test-"));
  });

  afterEach(() => {
    rmSync(outputDir, { recursive: true, force: true });
  });

  it("constructor IpynbToMdContext", () => {
    const context = IpynbToMdContext.from({
      ipynbFilePath: IPYNB_PATH,
      outputDir,
    });

    expect(context).toBeDefined();
  });

  it("mdFilePath", () => {
    const context = IpynbToMdContext.from({
      ipynbFilePath: IPYNB_PATH,
      outputDir,
    });

    expect(context.mdFilePath()).toBe(path.join(outputDir, "test.md"));
  });

  it("writeMdFile", () => {
    const context = IpynbToMdContext.from({
      ipynbFilePath: IPYNB_PATH,
      outputDir,
    });

    context.writeMdFile();
  });
});
