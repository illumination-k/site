import axios from "axios";
import { Code, Link, Root, Text } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import { URL } from "url";

function parseGithubUrl(url: string) {
  const target = new URL(url);
  const lineSplit = target.hash.split("-");
  const startLine = target.hash !== "" && lineSplit[0].replace("#L", "") || -1;
  const endLine = target.hash !== "" && lineSplit.length > 1 && lineSplit[1].replace("L", "") || startLine;

  const pathSplit = target.pathname.split("/");
  const user = pathSplit[1];
  const repository = pathSplit[2];
  const branch = pathSplit[4];
  const filePath = pathSplit.slice(5, pathSplit.length).join("/");

  const fileExtension = filePath.split(".").length > 1 ? filePath.split(".").pop() : "txt";

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

export default function embedGithub() {
  return async (ast: Root) => {
    const transforms: (() => Promise<void>)[] = [];

    // @ts-ignore
    visit(ast, "paragraph", (node, index, parent) => {
      const text = toString(node);
      if (!text.startsWith("https://github.com/")) {
        return;
      }

      const parsed = parseGithubUrl(text);

      transforms.push(async () => {
        const allValue = (await axios.get(parsed.rawFileUrl)).data;
        let lines = allValue.split("\n");

        if (parsed.startLine > 0) {
          lines = lines.slice(Number(parsed.startLine) - 1, parsed.endLine);
        }

        const newNode: Code = {
          type: "code",
          meta: `showLineNumber=${parsed.startLine}`,
          lang: parsed.fileExtension,
          value: lines.join("\n"),
        };

        const linkNode: Link = { type: "link", url: text, children: [{ type: "text", value: parsed.filePath }] };
        linkNode.data = {};
        linkNode.data.hProperties = { className: "github-embed-title" };
        parent.children.splice(index, 1, linkNode, newNode)
      });
    });

    await Promise.all(transforms.map((f) => f()));
  };
}
