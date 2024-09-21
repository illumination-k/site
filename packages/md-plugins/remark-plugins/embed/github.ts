import axios from "axios";
import type { Code, Link, Parent } from "mdast";

import { URL } from "node:url";
import type { Directives } from "mdast-util-directive";

import { toString as mdastToString } from "mdast-util-to-string";

import type { DirectiveTransformer } from ".";

function parseGithubUrl(url: string) {
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

  return {
    user,
    repository,
    branch,
    filePath,
    fileExtension,
    rawFileUrl,
    startLine,
    endLine,
  };
}

/*
Directive = `::gh[url]` or `::github[url]`
*/
export class GithubTransformer implements DirectiveTransformer {
  url?: string;

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

    this.url = url;

    return true;
  }

  async transform(
    node: Directives,
    index: number | null | undefined,
    parent: Parent,
  ) {
    if (!this.url) return;
    const parsed = parseGithubUrl(this.url);

    const allValue = (await axios.get(parsed.rawFileUrl)).data;
    let lines = allValue.split("\n");

    if (Number(parsed.startLine) > 0) {
      lines = lines.slice(Number(parsed.startLine) - 1, parsed.endLine);
    }

    const newNode: Code = {
      type: "code",
      meta: `showLineNumbers=${parsed.startLine},github-embed`,
      lang: parsed.fileExtension,
      value: lines.join("\n"),
    };

    const linkNode: Link = {
      type: "link",
      url: this.url,
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

    // @ts-ignore
    parent.children[index || 0] = githubNode;
  }
}
