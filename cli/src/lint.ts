import { type PathLike, readFile } from "node:fs";
import { glob } from "node:fs/promises";
import { promisify } from "node:util";
import fm from "front-matter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

import type { PostMeta } from "common";
import { REMARK_LINT_PLUGINS } from "md-plugins";

import { extractFrontMatterLines, lintSeoMeta } from "./lintSeoMeta";
import { logger } from "./logger";

const readFileAsync = promisify(readFile);

export interface LintError {
  file: string;
  message: string;
  line?: number;
  column?: number;
  ruleId?: string;
}

async function lintFile(filePath: string): Promise<LintError[]> {
  const raw = (await readFileAsync(filePath)).toString();
  const { body, attributes } = fm<PostMeta>(raw);

  const frontMatterLines = extractFrontMatterLines(raw);
  const seoErrors = lintSeoMeta(attributes, filePath, frontMatterLines);

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStringify);
  for (const plugin of REMARK_LINT_PLUGINS) {
    processor.use(plugin);
  }

  const vfile = await processor.process(body);

  const remarkErrors = vfile.messages.map((msg) => ({
    file: filePath,
    message: msg.message,
    line: msg.line ?? undefined,
    column: msg.column ?? undefined,
    ruleId: msg.ruleId ?? undefined,
  }));

  return [...seoErrors, ...remarkErrors];
}

export async function lintPosts(src: PathLike): Promise<LintError[]> {
  const mdFiles = await Array.fromAsync(
    glob(`${src}/**/*.md`, { exclude: ["**/node_modules/**"] }),
  );

  if (mdFiles.length === 0) {
    logger.warn({ src: String(src) }, "No markdown files found");
    return [];
  }

  logger.info({ src: String(src), count: mdFiles.length }, "Linting posts");

  const allErrors: LintError[] = [];

  const results = await Promise.allSettled(mdFiles.map(lintFile));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      allErrors.push(...result.value);
    } else {
      allErrors.push({
        file: mdFiles[i],
        message: `Failed to lint: ${result.reason}`,
      });
    }
  }

  return allErrors;
}
