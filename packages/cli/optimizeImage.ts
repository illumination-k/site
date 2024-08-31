import fs, { PathLike } from "fs";
import path from "path";
import util from "util";

import type { Image, Root } from "mdast";

import sizeOf from "image-size";

import axios from "axios";
import sharp from "sharp";
import { file } from "tmp-promise";
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

function replacePathAsPublicRoot(imagePath: string) {
  const pathElems = path.resolve(imagePath).split(path.sep);

  let startPublic = false;

  // joinするときに先頭に"/"を入れる
  const newPathElems = [""];
  for (const pathElem of pathElems) {
    if (startPublic) {
      newPathElems.push(pathElem);
    }

    if (pathElem === "public") {
      startPublic = true;
    }
  }

  if (!startPublic) {
    throw `${imagePath} is not in public dir`;
  }

  return newPathElems.join("/");
}

type Option = {
  postPath: PathLike;
  imageDist: string;
};

const writeAsync = util.promisify(fs.writeFile);
const copyAsync = util.promisify(fs.copyFile);
const sizeOfAsync = util.promisify(sizeOf);

const optimizeImage = (option: Option) => {
  const postDirPath = path.resolve(path.dirname(option.postPath.toString()));

  return (async (ast: Root) => {
    const promises: (() => Promise<void>)[] = [];
    // @ts-ignore
    visit(ast, "image", (node: Image) => {
      promises.push(async () => {
        const size = parseTitleToSize(node.title);

        const uri = node.url;

        const filename = path.basename(uri);
        const fileNameBase = filename.split(".")[0];
        const ext = path.extname(uri);

        let imagePath: string = path.resolve(path.join(postDirPath, uri));

        // temporary file for download
        const { path: tmpPath, cleanup } = await file({ postfix: ext });

        if (uri.startsWith("http") || (uri.startsWith("ftp"))) {
          const buf = await (await axios.get(uri, { responseType: "arraybuffer" })).data;

          await writeAsync(tmpPath, buf);

          imagePath = tmpPath;
        }

        const sharpExts = [".png", ".jpg", ".webp", ".jepg", ".gif", ".tiff"];

        if (ext === ".svg") {
          const copyImagePath = path.join(option.imageDist, filename);
          await copyAsync(imagePath, copyImagePath);

          node.url = replacePathAsPublicRoot(copyImagePath);
        } else if (sharpExts.includes(ext.toLowerCase())) {
          const optimizedImagePath = path.join(option.imageDist, `${fileNameBase}.avif`);

          await sharp(imagePath).avif({
            quality: 75,
          }).resize(size?.width, size?.height).toFile(
            optimizedImagePath,
          );

          const newUri = replacePathAsPublicRoot(optimizedImagePath);

          const dim = await sizeOfAsync(optimizedImagePath);
          node.url = newUri;

          if (dim) {
            node.data = {
              hProperties: {
                width: dim.width,
                height: dim.height,
              },
            };
          }
        }

        await cleanup();
      });
    });

    await Promise.all(promises.map((f) => f()));
  });
};

export default optimizeImage;
