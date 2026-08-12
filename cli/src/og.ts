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

/**
 * Site-wide social preview card.
 *
 * Used by every page that has no image of its own — the locale homepages,
 * article and tag listings, and the static pages. Without it those pages share
 * as a bare link on every social platform.
 */
export function buildDefaultOgSvgMarkup({
  siteName,
  tagline,
}: {
  siteName: string;
  tagline: string;
}) {
  return {
    type: "div",
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "24px",
        padding: "60px",
        background:
          "linear-gradient(135deg, #0c1222 0%, #1a2744 50%, #0f2040 100%)",
        color: "#ffffff",
        fontFamily: "NotoSansJP",
      },
      children: [
        {
          type: "span",
          props: {
            style: {
              fontSize: "72px",
              fontWeight: 700,
              color: "#0ea5e9",
            },
            children: siteName,
          },
        },
        {
          type: "span",
          props: {
            style: {
              fontSize: "32px",
              color: "#94a3b8",
              textAlign: "center",
            },
            children: tagline,
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

type OgFonts = Awaited<ReturnType<typeof loadOgFonts>>;

async function loadOgFonts(fontDir: PathLike) {
  const [fontRegular, fontBold] = await Promise.all([
    loadFont(path.join(fontDir.toString(), "NotoSansJP-Regular.ttf")),
    loadFont(path.join(fontDir.toString(), "NotoSansJP-Bold.ttf")),
  ]);

  return [
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
}

async function renderOgPng(
  markup: ReturnType<typeof buildOgSvgMarkup | typeof buildDefaultOgSvgMarkup>,
  fonts: OgFonts,
): Promise<Buffer> {
  // satori accepts plain objects as virtual DOM nodes at runtime
  const svg = await satori(markup as unknown as ReactNode, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });

  return sharp(Buffer.from(svg)).png({ quality: 85 }).toBuffer();
}

/**
 * Writes the site-wide default OG image referenced by `DEFAULT_OG_IMAGE` in
 * `web/src/lib/seo.ts`. Runs as part of `pnpm cli:og`, before the Next.js
 * build, so the file exists by the time pages link to it.
 */
export async function generateDefaultOgImage(
  dst: PathLike,
  fontDir: PathLike,
  siteName: string,
  tagline: string,
) {
  const dstStr = dst.toString();
  await mkdirAsync(path.dirname(dstStr), { recursive: true });

  const fonts = await loadOgFonts(fontDir);
  const png = await renderOgPng(
    buildDefaultOgSvgMarkup({ siteName, tagline }),
    fonts,
  );
  await writeFileAsync(dstStr, png);

  logger.info({ dst: dstStr }, "Default OG image generated");
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

  const fonts = await loadOgFonts(fontDir);

  logger.info({ count: dump.posts.length, prefix }, "Generating OG images");

  for (const post of dump.posts) {
    const markup = buildOgSvgMarkup({
      title: post.meta.title,
      category: post.meta.category,
      tags: post.meta.tags,
      siteName: "illumination-k.dev",
    });

    const png = await renderOgPng(markup, fonts);
    const outPath = path.join(dstStr, `${post.meta.uuid}.png`);
    await writeFileAsync(outPath, png);
  }

  logger.info(
    { count: dump.posts.length, dst: dstStr },
    "OG image generation complete",
  );
}
