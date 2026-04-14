import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import type { PathLike } from "node:fs";
import { readDump } from "common/io";
import type { ReactNode } from "react";
import satori from "satori";
import sharp from "sharp";

import { logger } from "./logger";

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

const WIDTH = 1200;
const HEIGHT = 630;

interface OgImageOptions {
  title: string;
  category: string;
  tags: string[];
  siteName: string;
}

export function buildOgSvgMarkup({
  title,
  category,
  tags,
  siteName,
}: OgImageOptions) {
  const displayTags = tags.slice(0, 4);
  const truncatedTitle = title.length > 60 ? `${title.slice(0, 57)}...` : title;

  return {
    type: "div",
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px",
        background:
          "linear-gradient(135deg, #0c1222 0%, #1a2744 50%, #0f2040 100%)",
        color: "#ffffff",
        fontFamily: "NotoSansJP",
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: "20px" },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          background: "#0ea5e9",
                          color: "#ffffff",
                          padding: "6px 16px",
                          borderRadius: "6px",
                          fontSize: "22px",
                          fontWeight: 700,
                        },
                        children: category,
                      },
                    },
                  ],
                },
              },
              {
                type: "h1",
                props: {
                  style: {
                    fontSize: truncatedTitle.length > 30 ? "42px" : "52px",
                    fontWeight: 700,
                    lineHeight: 1.3,
                    margin: 0,
                    color: "#f0f6ff",
                  },
                  children: truncatedTitle,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", gap: "10px", flexWrap: "wrap" },
                  children: displayTags.map((tag) => ({
                    type: "span",
                    props: {
                      style: {
                        background: "rgba(255,255,255,0.12)",
                        color: "#94a3b8",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        fontSize: "18px",
                      },
                      children: `#${tag}`,
                    },
                  })),
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#0ea5e9",
                  },
                  children: siteName,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function loadFont(fontPath: string): Promise<ArrayBuffer> {
  const buffer = await readFileAsync(fontPath);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
}

export default async function generateOgImages(
  dumpPath: PathLike,
  dst: PathLike,
  prefix: string,
  fontDir: PathLike,
) {
  const dump = await readDump(dumpPath);
  const dstStr = dst.toString();

  await mkdirAsync(dstStr, { recursive: true });

  const fontRegular = await loadFont(
    path.join(fontDir.toString(), "NotoSansJP-Regular.ttf"),
  );
  const fontBold = await loadFont(
    path.join(fontDir.toString(), "NotoSansJP-Bold.ttf"),
  );

  const fonts = [
    {
      name: "NotoSansJP",
      data: fontRegular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "NotoSansJP",
      data: fontBold,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];

  logger.info({ count: dump.posts.length, prefix }, "Generating OG images");

  for (const post of dump.posts) {
    const markup = buildOgSvgMarkup({
      title: post.meta.title,
      category: post.meta.category,
      tags: post.meta.tags,
      siteName: "illumination-k.dev",
    });

    // satori accepts plain objects as virtual DOM nodes at runtime
    const svg = await satori(markup as unknown as ReactNode, {
      width: WIDTH,
      height: HEIGHT,
      fonts,
    });

    const png = await sharp(Buffer.from(svg)).png({ quality: 85 }).toBuffer();
    const outPath = path.join(dstStr, `${post.meta.uuid}.png`);
    await writeFileAsync(outPath, png);
  }

  logger.info(
    { count: dump.posts.length, dst: dstStr },
    "OG image generation complete",
  );
}
