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

export type LineRange = {
  start: number;
  end: number;
};

export type ParsedPath = {
  filePath: string;
  range?: LineRange;
};

/**
 * Parse a `::file` directive argument of the form:
 *
 * - `./foo.py`             → whole file
 * - `./foo.py#L15`         → line 15 only
 * - `./foo.py#L10-L20`     → lines 10 through 20 inclusive
 *
 * Line numbers are 1-indexed (matching GitHub's URL fragment convention). A
 * malformed fragment, a non-positive start, or an end < start is rejected
 * with an explanatory Error so that authors get a fast, obvious failure
 * rather than silently embedding the wrong slice of the file.
 */
export function parsePathAndRange(input: string): ParsedPath {
  const hashIdx = input.indexOf("#L");
  if (hashIdx === -1) {
    return { filePath: input };
  }

  const filePath = input.slice(0, hashIdx);
  const fragment = input.slice(hashIdx + 1);
  const match = fragment.match(/^L(\d+)(?:-L(\d+))?$/);
  if (!match) {
    throw new Error(
      `Invalid line range in ::file path: "${input}" (expected "#L<n>" or "#L<n>-L<m>")`,
    );
  }

  const start = Number(match[1]);
  const end = match[2] !== undefined ? Number(match[2]) : start;

  if (start < 1) {
    throw new Error(
      `Invalid line range in ::file path "${input}": line numbers are 1-indexed`,
    );
  }
  if (end < start) {
    throw new Error(
      `Invalid line range in ::file path "${input}": end (L${end}) must be >= start (L${start})`,
    );
  }

  return { filePath, range: { start, end } };
}

/**
 * Slice the file content down to the requested 1-indexed inclusive line
 * range. Throws if the requested end exceeds the file length so an out-of-
 * range slice surfaces as an error at build time rather than a silent empty
 * excerpt.
 *
 * Trailing newlines are normalised away first so that a file ending with
 * "\n" does not add a phantom empty final line to the line count.
 */
export function sliceLines(content: string, range: LineRange): string {
  const stripped = content.replace(/\n+$/, "");
  const lines = stripped.split(/\r?\n/);
  if (range.end > lines.length) {
    throw new Error(
      `Line range L${range.start}-L${range.end} exceeds file length (${lines.length} lines)`,
    );
  }
  return lines.slice(range.start - 1, range.end).join("\n");
}

/** Format a LineRange back into the `#L<n>` / `#L<n>-L<m>` suffix. */
export function formatRangeSuffix(range: LineRange): string {
  return range.start === range.end
    ? `#L${range.start}`
    : `#L${range.start}-L${range.end}`;
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
 * - The title shown above the code block defaults to the file basename (plus
 *   the `#L<n>-L<m>` suffix if a range was requested), and can be overridden
 *   via the `title` attribute. The resulting `code` node carries
 *   `meta=title=<value>` so that the shared `codeTitle` remark plugin picks
 *   it up later in the pipeline and wraps it with the usual title bar.
 * - An optional GitHub-style line range fragment (`#L10`, `#L10-L20`) in the
 *   path selects a slice of the file; out-of-range or malformed ranges fail
 *   the build.
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
          const rawInput = mdastToString(node).trim();
          if (!rawInput) {
            logger.error(
              { postPath: String(option.postPath) },
              "Empty path in ::file directive",
            );
            throw new Error(
              `Empty path in ::file directive (post: ${option.postPath})`,
            );
          }

          let parsed: ParsedPath;
          try {
            parsed = parsePathAndRange(rawInput);
          } catch (err) {
            logger.error(
              { postPath: String(option.postPath), rawInput, err },
              "Failed to parse ::file directive path",
            );
            throw err;
          }

          const absPath = path.resolve(postDirPath, parsed.filePath);
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

          let value: string;
          if (parsed.range) {
            try {
              value = sliceLines(content, parsed.range);
            } catch (err) {
              logger.error(
                {
                  postPath: String(option.postPath),
                  filePath: absPath,
                  range: parsed.range,
                  err,
                },
                "Line range out of bounds for ::file directive",
              );
              throw err;
            }
          } else {
            // Strip a single trailing newline so the rendered code block does
            // not have an ugly empty final line. Authors who really want the
            // trailing whitespace can always add it back with an override.
            value = content.replace(/\n+$/, "");
          }

          const attrs = (node.attributes ?? {}) as Record<
            string,
            string | null | undefined
          >;
          const langOverride = typeof attrs.lang === "string" ? attrs.lang : "";
          const titleOverride =
            typeof attrs.title === "string" ? attrs.title : "";

          const lang = langOverride || detectLanguage(absPath);
          const defaultTitle = parsed.range
            ? `${path.basename(absPath)}${formatRangeSuffix(parsed.range)}`
            : path.basename(absPath);
          const title = titleOverride || defaultTitle;

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
