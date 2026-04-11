import { type PathLike, readFile } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import type { Code, Root } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

import { logger } from "./logger";

// Minimal shape of a remark-directive leafDirective node. Inlining this lets
// the CLI package avoid a devDependency on `mdast-util-directive` just for
// types — `md-plugins` owns that dependency and this file only needs the
// subset of fields it actually reads.
type LeafDirectiveLike = {
  type: "leafDirective";
  name: string;
  attributes?: Record<string, string | null | undefined> | null;
  children: Array<{ type: string; value?: string }>;
};

const readFileAsync = promisify(readFile);

// Mapping from file extension (including the leading dot, lower-cased) to the
// prism language id used by rehype-prism-plus. Keep in sync with the prism
// languages supported by the current refractor version.
const LANG_BY_EXT: Record<string, string> = {
  ".nix": "nix",
  ".py": "python",
  ".ts": "typescript",
  ".tsx": "tsx",
  ".js": "javascript",
  ".jsx": "jsx",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".sh": "bash",
  ".bash": "bash",
  ".zsh": "bash",
  ".fish": "bash",
  ".rs": "rust",
  ".go": "go",
  ".toml": "toml",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".json": "json",
  ".jsonc": "json",
  ".md": "markdown",
  ".mdx": "markdown",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",
  ".sql": "sql",
  ".c": "c",
  ".h": "c",
  ".cpp": "cpp",
  ".hpp": "cpp",
  ".java": "java",
  ".rb": "ruby",
  ".php": "php",
};

// Mapping from well-known basenames (for files that conventionally have no
// extension) to a prism language id.
const LANG_BY_BASENAME: Record<string, string> = {
  Dockerfile: "docker",
  Makefile: "makefile",
};

export function detectLanguage(filePath: string): string {
  const basename = path.basename(filePath);
  if (LANG_BY_BASENAME[basename]) {
    return LANG_BY_BASENAME[basename];
  }
  const ext = path.extname(filePath).toLowerCase();
  return LANG_BY_EXT[ext] ?? "text";
}

type Option = {
  postPath: PathLike;
};

/**
 * Remark plugin that expands `::file[./path/to/file]` leaf directives into
 * fenced code blocks whose contents are read from disk at compile time.
 *
 * - The path is resolved relative to the directory of the post being
 *   compiled, mirroring how `optimizeImage` resolves image URIs.
 * - The language is auto-detected from the file extension, but can be
 *   overridden via the `lang` directive attribute (`::file[./x]{lang=text}`).
 * - The title shown above the code block defaults to the file basename, and
 *   can be overridden via the `title` attribute. The resulting `code` node
 *   carries `meta=title=<value>` so that the shared `codeTitle` remark plugin
 *   picks it up later in the pipeline and wraps it with the usual title bar.
 *
 * The plugin is intentionally kept in the CLI workspace rather than
 * `md-plugins` because it needs the absolute post path and direct filesystem
 * access, same as `optimizeImage` and `resolveInternalLinks`.
 */
const embedFile = (option: Option) => {
  const postDirPath = path.resolve(path.dirname(option.postPath.toString()));

  return async (ast: Root) => {
    const tasks: (() => Promise<void>)[] = [];

    visit(
      ast,
      "leafDirective",
      (
        node: LeafDirectiveLike,
        index: number | null | undefined,
        parent: { children: unknown[] } | undefined,
      ) => {
        if (node.name !== "file") return;
        if (!parent || index == null) return;

        tasks.push(async () => {
          const relPath = mdastToString(node).trim();
          if (!relPath) {
            logger.error(
              { postPath: String(option.postPath) },
              "Empty path in ::file directive",
            );
            throw new Error(
              `Empty path in ::file directive (post: ${option.postPath})`,
            );
          }

          const absPath = path.resolve(postDirPath, relPath);
          let content: string;
          try {
            content = (await readFileAsync(absPath)).toString();
          } catch (err) {
            logger.error(
              { postPath: String(option.postPath), filePath: absPath, err },
              "Failed to read file for ::file directive",
            );
            throw new Error(
              `Failed to read file for ::file directive: ${absPath} (post: ${option.postPath})`,
            );
          }

          // Strip a single trailing newline so the rendered code block does
          // not have an ugly empty final line. Authors who really want the
          // trailing whitespace can always add it back with an override.
          const value = content.replace(/\n+$/, "");

          const attrs = (node.attributes ?? {}) as Record<
            string,
            string | null | undefined
          >;
          const langOverride = typeof attrs.lang === "string" ? attrs.lang : "";
          const titleOverride =
            typeof attrs.title === "string" ? attrs.title : "";

          const lang = langOverride || detectLanguage(absPath);
          const title = titleOverride || path.basename(absPath);

          const codeNode: Code = {
            type: "code",
            lang,
            meta: `title=${title}`,
            value,
          };

          parent.children[index] = codeNode;
        });
      },
    );

    await Promise.all(tasks.map((f) => f()));
  };
};

export default embedFile;
