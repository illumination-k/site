import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  type Cell,
  Convert,
  type IpynbSchemaV44,
  type Output,
  OutputType,
} from "./ipynb_schema.v4.4";

import { ansiToHtml } from "anser";
import { z } from "zod";

const contextInputSchema = z.object({
  ipynbFilePath: z.string().endsWith(".ipynb"),
  outputDir: z.string(),
});

const imageExtensionSchema = z.enum([
  "png",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "avif",
]);

type ImageFile = {
  imageFilePath: string;
  data: Buffer;
};

type ContentWithFile = {
  outputString: string;
  imageFiles: ImageFile[];
};

export default class IpynbToMdContext {
  outputDir: string;
  ipynbFilePath: string;
  ipynbInput: IpynbSchemaV44;

  contents: string[] = [];
  imageFiles: ImageFile[] = [];

  static imageFileGenerator: (extension: string) => string = (
    extension: string,
  ) => `${randomUUID()}.${extension}`;

  private constructor(ipynbFilePath: string, outputDir: string) {
    this.outputDir = outputDir;
    this.ipynbFilePath = ipynbFilePath;
    this.ipynbInput = Convert.toIpynbSchemaV44(
      readFileSync(ipynbFilePath, "utf-8"),
    );
  }

  static from(obj: unknown): IpynbToMdContext {
    const context = contextInputSchema.parse(obj);
    return new IpynbToMdContext(context.ipynbFilePath, context.outputDir);
  }

  mdFilePath(): string {
    return path.join(
      this.outputDir,
      `${path.basename(this.ipynbFilePath, ".ipynb")}.md`,
    );
  }

  imageName(imageFilePath: string): string {
    return path.join(this.outputDir, imageFilePath);
  }

  writeImageFile(imageFilePath: string, data: Buffer): void {
    writeFileSync(this.imageName(imageFilePath), data);
  }

  writeMdFile(): void {
    this.contents.push(this.metadata2summary());

    for (const cell of this.ipynbInput.cells) {
      const { outputString, imageFiles } = this.cell2contentWithFile(cell);

      if (outputString.trim()) {
        this.contents.push(outputString);
      }
      this.imageFiles.push(...imageFiles);
    }

    // Join cells with double newlines to ensure proper markdown formatting
    const contents = this.contents.join("\n\n").replace(/\n{4,}/g, "\n\n\n");
    writeFileSync(this.mdFilePath(), contents);

    for (const { imageFilePath, data } of this.imageFiles) {
      this.writeImageFile(imageFilePath, data);
    }
  }

  metadata2summary(): string {
    return `<details>
<summary>Notebook Metadata</summary>

\`\`\`json
${JSON.stringify(this.ipynbInput.metadata, null, 2)}
\`\`\`

</details>
`;
  }

  cell2contentWithFile(cell: Cell, language?: string): ContentWithFile {
    switch (cell.cell_type) {
      case "markdown":
        if (typeof cell.source === "string") {
          return { outputString: cell.source, imageFiles: [] };
        }

        return { outputString: cell.source.join(""), imageFiles: [] };

      case "code": {
        let code = `\`\`\`${language || "python"}\n`;

        if (typeof cell.source === "string") {
          code += cell.source;
        } else {
          code += cell.source.join("");
        }

        code += "\n```\n";

        if (!cell.outputs) {
          return { outputString: code, imageFiles: [] };
        }

        const { outputString, imageFiles } = this.output2contentWithFile(
          cell.outputs,
        );

        // Add empty line between code and output if output exists and is not empty
        if (outputString.trim()) {
          return { outputString: `${code}\n${outputString}`, imageFiles };
        }
        return { outputString: code, imageFiles };
      }
      case "raw": {
        let raw = "```text\n";
        if (typeof cell.source === "string") {
          raw += cell.source;
        } else {
          raw += cell.source.join("");
        }

        raw += "\n```";

        return { outputString: raw, imageFiles: [] };
      }
      default:
        throw new Error(`Unknown cell type: ${cell.cell_type}`);
    }
  }

  output2contentWithFile(outputs: Output[]): ContentWithFile {
    const outputContents: string[] = [];
    const imageFilesLocal: ImageFile[] = [];

    for (const output of outputs) {
      switch (output.output_type) {
        case OutputType.DisplayData: {
          if (output.data) {
            const { outputString, imageFiles } = this.data2contentWithFile(
              output.data,
            );
            outputContents.push(outputString);
            imageFilesLocal.push(...imageFiles);
          }
          break;
        }
        case OutputType.Error: {
          outputContents.push("<div class='ipynb-error'>");
          if (output.traceback) {
            for (const t of output.traceback) {
              outputContents.push(`<p>${ansiToHtml(t)}</p>`);
            }
          }
          outputContents.push("</div>");
          break;
        }
        case OutputType.ExecuteResult:
          if (output.data) {
            const { outputString, imageFiles } = this.data2contentWithFile(
              output.data,
            );
            outputContents.push(outputString);
            imageFilesLocal.push(...imageFiles);
          }
          break;
        case OutputType.Stream:
          if (output.text) {
            if (typeof output.text === "string") {
              outputContents.push(`\`${output.text}\``);
            } else {
              outputContents.push(`\`${output.text.join("")}\``);
            }
          }
          break;
        default:
          throw new Error(`Unknown output type: ${output.output_type}`);
      }
    }

    // Join with double newlines to properly separate output blocks
    return {
      outputString: outputContents.join("\n\n"),
      imageFiles: imageFilesLocal,
    };
  }

  data2contentWithFile(data: {
    [key: string]: string[] | string;
  }): ContentWithFile {
    const outputContents: string[] = [];
    const imageFiles: ImageFile[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith("text")) {
        if (typeof value === "string") {
          outputContents.push(`\`${value}\``);
        } else {
          outputContents.push(`\`${value.join("")}\``);
        }
      } else if (key.startsWith("image")) {
        const extension = imageExtensionSchema.parse(key.split("/")[1]);
        const imageFilePath = IpynbToMdContext.imageFileGenerator(extension);

        if (typeof value === "string") {
          const buffer = Buffer.from(value, "base64");
          imageFiles.push({ imageFilePath, data: buffer });
          outputContents.push(`![${imageFilePath}](./${imageFilePath})`);
          outputContents.push("\n")
        } else {
          throw new Error(`Unknown image type: ${typeof value}`);
        }
      }
    }

    return {
      outputString: outputContents.join("\n\n"),
      imageFiles
    };
  }
}
