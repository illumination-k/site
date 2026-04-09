import fs, { type PathLike } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import util from "node:util";

import type { Image, Root } from "mdast";

import sizeOf from "image-size";

import { cacheGet, cacheSet, fetchWithRetry, getCacheKey } from "md-plugins";
import sharp from "sharp";
import { file } from "tmp-promise";
import { visit } from "unist-util-visit";

import { logger } from "./logger";

type Size = {
  width?: number;
  height?: number;
};

// width=100,height=100,...
function parseTitleToSize(title: string | null | undefined): Size | undefined {
  const size: Size = {};
  if (!title) {
    return undefined;
  }

  for (const v of title.split(",")) {
    const tokens = v.split("=");
    if (tokens.length !== 2) {
      return;
    }

    if (tokens[0] === "width" || tokens[0] === "w") {
      size.width = Number(tokens[1]);
    } else if (tokens[0] === "height" || tokens[0] === "h") {
      size.height = Number(tokens[1]);
    }
  }

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
    throw new Error(`${imagePath} is not in public dir`);
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

  return async (ast: Root) => {
    const promises: (() => Promise<void>)[] = [];
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

        try {
          const isRemote = uri.startsWith("http") || uri.startsWith("ftp");
          const sharpExts = [".png", ".jpg", ".webp", ".jepg", ".gif", ".tiff"];

          if (isRemote && ext === ".svg") {
            const cacheKey = getCacheKey(uri, { type: "svg" });
            const cached = await cacheGet(`${cacheKey}.svg`);
            const copyImagePath = path.join(option.imageDist, filename);

            if (cached) {
              await writeAsync(copyImagePath, cached);
            } else {
              try {
                const resp = await fetchWithRetry(uri, {
                  responseType: "arraybuffer",
                });
                await writeAsync(
                  tmpPath,
                  Buffer.from(resp.data as ArrayBuffer),
                );
              } catch (err) {
                logger.error(
                  { uri, postPath: String(option.postPath), err },
                  "Failed to download remote image",
                );
                throw new Error(`Failed to download image: ${uri}`);
              }
              await copyAsync(tmpPath, copyImagePath);
              await cacheSet(`${cacheKey}.svg`, await readFile(copyImagePath));
            }

            node.url = replacePathAsPublicRoot(copyImagePath);
          } else if (isRemote && sharpExts.includes(ext.toLowerCase())) {
            const sizeStr = size
              ? `w=${size.width ?? ""},h=${size.height ?? ""}`
              : "";
            const cacheKey = getCacheKey(uri, { type: "avif", size: sizeStr });
            const cached = await cacheGet(`${cacheKey}.avif`);
            const optimizedImagePath = path.join(
              option.imageDist,
              `${fileNameBase}.avif`,
            );

            if (cached) {
              await writeAsync(optimizedImagePath, cached);
            } else {
              try {
                const resp = await fetchWithRetry(uri, {
                  responseType: "arraybuffer",
                });
                await writeAsync(
                  tmpPath,
                  Buffer.from(resp.data as ArrayBuffer),
                );
                imagePath = tmpPath;
              } catch (err) {
                logger.error(
                  { uri, postPath: String(option.postPath), err },
                  "Failed to download remote image",
                );
                throw new Error(`Failed to download image: ${uri}`);
              }

              try {
                await sharp(imagePath)
                  .avif({ quality: 75 })
                  .resize(size?.width, size?.height)
                  .toFile(optimizedImagePath);
              } catch (err) {
                logger.error(
                  {
                    imagePath,
                    optimizedImagePath,
                    postPath: String(option.postPath),
                    err,
                  },
                  "Failed to optimize image with sharp",
                );
                throw new Error(
                  `Failed to optimize image: ${imagePath} (post: ${option.postPath})`,
                );
              }

              await cacheSet(
                `${cacheKey}.avif`,
                await readFile(optimizedImagePath),
              );
            }

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
          } else if (!isRemote && ext === ".svg") {
            const copyImagePath = path.join(option.imageDist, filename);
            await copyAsync(imagePath, copyImagePath);
            node.url = replacePathAsPublicRoot(copyImagePath);
          } else if (!isRemote && sharpExts.includes(ext.toLowerCase())) {
            const optimizedImagePath = path.join(
              option.imageDist,
              `${fileNameBase}.avif`,
            );

            const alreadyExists =
              fs.existsSync(optimizedImagePath) &&
              fs.statSync(optimizedImagePath).size > 0;

            if (!alreadyExists) {
              const tmpOutput = `${optimizedImagePath}.${process.pid}.tmp`;
              try {
                await sharp(imagePath)
                  .avif({ quality: 75 })
                  .resize(size?.width, size?.height)
                  .toFile(tmpOutput);
                fs.renameSync(tmpOutput, optimizedImagePath);
              } catch (err) {
                // Another process may have written the file concurrently
                if (
                  fs.existsSync(optimizedImagePath) &&
                  fs.statSync(optimizedImagePath).size > 0
                ) {
                  try {
                    fs.unlinkSync(tmpOutput);
                  } catch {}
                } else {
                  try {
                    fs.unlinkSync(tmpOutput);
                  } catch {}
                  logger.error(
                    {
                      imagePath,
                      optimizedImagePath,
                      postPath: String(option.postPath),
                      err,
                    },
                    "Failed to optimize image with sharp",
                  );
                  throw new Error(
                    `Failed to optimize image: ${imagePath} (post: ${option.postPath})`,
                  );
                }
              }
            }

            // Wait for file to be fully written if another process is writing
            let dim: Awaited<ReturnType<typeof sizeOfAsync>> | undefined;
            for (let attempt = 0; attempt < 5; attempt++) {
              try {
                const stat = fs.statSync(optimizedImagePath);
                if (stat.size > 0) {
                  dim = await sizeOfAsync(optimizedImagePath);
                  break;
                }
              } catch {}
              await new Promise((r) => setTimeout(r, 200));
            }

            const newUri = replacePathAsPublicRoot(optimizedImagePath);
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
        } finally {
          await cleanup();
        }
      });
    });

    await Promise.all(promises.map((f) => f()));
  };
};

export default optimizeImage;
