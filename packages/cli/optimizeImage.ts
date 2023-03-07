import fs from "fs";
import path from "path";

import type { Image, Root } from "mdast";

import axios from "axios";
import sharp from "sharp";
import tmpPromise from "tmp-promise";
import { visit } from "unist-util-visit";

type Size = {
  width?: number;
  height?: number;
};

// width=100,height=100,...
function parseTitleToSize(title: string | null | undefined): Size | undefined {
  let size: Size = {};
  if (!title) {
    return undefined;
  }

  title.split(",").forEach((v) => {
    const tokens = v.split("=");
    if (tokens.length !== 2) {
      return;
    }

    if (tokens[0] === "width" || tokens[0] === "w") {
      size.width = Number(tokens[1]);
    } else if (tokens[0] === "height" || tokens[0] === "h") {
      size.height = Number(tokens[1]);
    }
  });

  return size;
}

type Option = {
  imageDist: string;
};

export default function optimizeImage(option: Option) {
  return (ast: Root) => {
    const promises: (() => Promise<void>)[] = [];
    // @ts-ignore
    visit(ast, "image", (node: Image) => {
      promises.push(async () => {
        const size = parseTitleToSize(node.title);

        const uri = node.url;

        const filename = path.basename(uri);
        const fileNameBase = filename.split(".")[0];
        const ext = path.extname(uri);

        let imagePath: string;

        // temporary file for download
        const { path: tmpPath, cleanup } = await tmpPromise.file({ postfix: ext });

        if (ext === ".svg" || ext === ".gif") {
          // todo!()
        } else {
          if (uri.startsWith("http") || (uri.startsWith("ftp"))) {
            const buf = await axios.get(uri, { responseType: "arraybuffer" });

            // @ts-ignore
            fs.writeFile(tmpPath, buf, (err) => {
              throw err;
            });

            imagePath = tmpPath;
          } else {
            imagePath = uri;
          }

          const optimizedImagePath = path.join(option.imageDist, `${fileNameBase}.webp`);
          node.url = optimizedImagePath;
          sharp(imagePath).webp({
            quality: 75,
          }).resize(size?.width, size?.height).toFile(
            optimizedImagePath,
            (err) => {
              throw err;
            },
          );

          node.data = { hProperties: size };
        }

        await cleanup();
      });
    });
  };
}

// httpsならDL
// size調整
// webp変換
