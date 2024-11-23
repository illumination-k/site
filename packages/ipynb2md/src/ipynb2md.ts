import { type PathLike, readFileSync } from "node:fs";

import {
  type Cell,
  Convert,
  type IpynbSchemaV44,
  type IpynbSchemaV44_Metadata,
} from "./ipynb_schema.v4.4";

export function readIpynbFile(ipynbPath: PathLike): IpynbSchemaV44 {
  return Convert.toIpynbSchemaV44(readFileSync(ipynbPath, "utf-8"));
}

export function metadata2summary(metadata: IpynbSchemaV44_Metadata): string {
  return `<details>
<summary>Notebook Metadata</summary>
\`\`\`json
${JSON.stringify(metadata, null, 2)}
\`\`\`
</details>
`;
}

export function cell2string(cell: Cell, language?: string): string {
  switch (cell.cell_type) {
    case "markdown":
      if (typeof cell.source === "string") {
        return cell.source;
      }

      return cell.source.join("\n");
    case "code": {
      let code = `\`\`\`${language || "python"}\n`;

      if (typeof cell.source === "string") {
        code += cell.source;
      } else {
        code += cell.source.join("\n");
      }

      code += "\n```";

      const output = cell.outputs?.map((o) => {
        o.data;
      });

      if (output) {
        code += "\n\n";
        code += output.join("\n");
      }

      return code;
    }
    case "raw": {
      let raw = "```\n";
      if (typeof cell.source === "string") {
        raw += cell.source;
      } else {
        raw += cell.source.join("\n");
      }

      raw += "\n```";

      return raw;
    }
    default:
      throw new Error(`Unknown cell type: ${cell.cell_type}`);
  }
}

export function ipynb2md(ipynb: IpynbSchemaV44): string {}
