import axios from "axios";
import type { Code, Link } from "mdast";
import type { Parent } from "unist";

import { URL } from "node:url";
import type { Directives } from "mdast-util-directive";

import { toString as mdastToString } from "mdast-util-to-string";

import type { DirectiveTransformer } from ".";

import { z } from "zod";

const parsedGithubUrlSchema = z.object({
  user: z.string(),
  repository: z.string(),
  branch: z.string(),
  filePath: z.string(),
  fileExtension: z.string(),
  rawFileUrl: z.string(),
  startLine: z
    .union([z.string(), z.literal(-1)])
    .transform((v) => Number(v))
    .pipe(z.number({ message: "startLine must be a number or -1" })),
  endLine: z
    .union([z.string(), z.literal(-1)])
    .transform((v) => Number(v))
    .pipe(z.number({ message: "endLine must be a number or -1" })),
});

type ParsedGithubUrl = z.infer<typeof parsedGithubUrlSchema>;

export function parseGithubUrl(url: string): ParsedGithubUrl {
  const target = new URL(url);
  const lineSplit = target.hash.split("-");
  const startLine =
    (target.hash !== "" && lineSplit[0].replace("#L", "")) || -1;
  const endLine =
    (target.hash !== "" &&
      lineSplit.length > 1 &&
      lineSplit[1].replace("L", "")) ||
    startLine;

  const pathSplit = target.pathname.split("/");
  const user = pathSplit[1];
  const repository = pathSplit[2];
  const branch = pathSplit[4];
  const filePath = pathSplit.slice(5, pathSplit.length).join("/");

  const fileExtension =
    filePath.split(".").length > 1 ? filePath.split(".").pop() : "txt";

  const rawFileUrl = `https://raw.githubusercontent.com/${user}/${repository}/${branch}/${filePath}`;

  return parsedGithubUrlSchema.parse({
    user,
    repository,
    branch,
    filePath,
    fileExtension,
    rawFileUrl,
    startLine,
    endLine,
  });
}

/*
Directive = `::gh[url]` or `::github[url]`
*/
export class GithubTransformer implements DirectiveTransformer {
  shouldTransform(node: Directives) {
    if (node.type !== "leafDirective") return false;

    if (!(node.name === "gh" || node.name === "github")) {
      return false;
    }

    const url = mdastToString(node);

    if (!url && typeof url !== "string") {
      return false;
    }

    if (!url.startsWith("https://github.com/")) {
      return false;
    }

    return true;
  }

  async transform(
    node: Directives,
    index: number | null | undefined,
    parent: Parent,
  ) {
    const url = mdastToString(node);
    const parsed = parseGithubUrl(url);

    const allValue: unknown = (await axios.get(parsed.rawFileUrl)).data;

    let lines: string[] = [];
    if (typeof allValue === "string") {
      lines = allValue.split("\n");
    } else {
      lines = JSON.stringify(allValue, null, 2).split("\n");
    }

    if (parsed.startLine > 0) {
      lines = lines.slice(parsed.startLine - 1, parsed.endLine);
    }

    const newNode: Code = {
      type: "code",
      meta: `showLineNumbers=${parsed.startLine},github-embed`,
      lang: parsed.fileExtension,
      value: lines.join("\n"),
    };

    const linkNode: Link = {
      type: "link",
      url: url,
      children: [
        {
          type: "text",
          value: `${parsed.user}/${parsed.repository}/${parsed.filePath}`,
        },
      ],
    };

    linkNode.data = {};
    linkNode.data.hProperties = { className: "github-embed-title" };

    const githubNode: Parent = {
      type: "github-embed",
      children: [linkNode, newNode],
      data: { hName: "div", hProperties: { className: "github-embed" } },
    };

    parent.children[index || 0] = githubNode;
  }
}
