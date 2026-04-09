import { type PathLike, readFile, writeFile } from "node:fs";
import { glob } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import fm, { type FrontMatterResult } from "front-matter";

import { remark } from "remark";

import { compile } from "@mdx-js/mdx";
import {
  BookTransformer,
  REHYPE_PLUGINS,
  REMARK_PLUGINS,
  remarkDirectiveEmbedGenerator,
} from "md-plugins";

import {
  type Dump,
  type DumpPost,
  type Post,
  type PostMeta,
  headingsSchema,
  postMetaSchema,
} from "common";

import extractHeader from "./extractHeader";
import { logger } from "./logger";
import optimizeImage from "./optimizeImage";
import resolveInternalLinks, { type PostMetaMap } from "./resolveInternalLinks";

const readFileAsync = promisify(readFile);

export async function readPost(filePath: PathLike): Promise<Post> {
  let rawPost: string;
  try {
    rawPost = (await readFileAsync(filePath)).toString();
  } catch (err) {
    logger.error({ path: String(filePath), err }, "Failed to read post file");
    throw new Error(`Failed to read post file: ${filePath}`);
  }

  let fmResult: FrontMatterResult<PostMeta>;
  try {
    fmResult = fm(rawPost);
  } catch (err) {
    logger.error(
      { path: String(filePath), err },
      "Failed to parse YAML front-matter",
    );
    throw new Error(`Failed to parse YAML front-matter: ${filePath}`);
  }

  const meta = postMetaSchema.safeParse({
    ...fmResult.attributes,
  });

  if (!meta.success) {
    logger.error(
      { path: String(filePath), validationError: meta.error },
      "Front-matter validation failed",
    );
    throw new Error(`Front-matter validation failed: ${filePath}`);
  }

  return { meta: meta.data, markdown: fmResult.body };
}

export async function dumpPost(
  post: Post,
  postPath: PathLike,
  imageDist: string,
  postMetaMap?: PostMetaMap,
): Promise<DumpPost> {
  let stripFile: Awaited<ReturnType<ReturnType<typeof remark>["process"]>>;
  try {
    // @ts-ignore
    stripFile = await remark().use(extractHeader).process(post.markdown);
  } catch (err) {
    logger.error(
      { postPath: String(postPath), err },
      "Failed to extract headers via remark",
    );
    throw new Error(`Failed to extract headers via remark: ${postPath}`);
  }

  let compiledMarkdown: string;
  try {
    compiledMarkdown = String(
      await compile(post.markdown, {
        outputFormat: "function-body",
        format: "mdx",
        development: false,

        // @ts-ignore
        remarkPlugins: [
          [optimizeImage, { postPath, imageDist }],
          ...(postMetaMap
            ? [
                [
                  resolveInternalLinks,
                  { postPath: String(postPath), postMetaMap },
                ],
              ]
            : []),
        ]
          .concat(
            // @ts-ignore
            REMARK_PLUGINS,
          )
          .concat([
            remarkDirectiveEmbedGenerator([
              new BookTransformer({
                associateTagJp: process.env.AMAZON_ASSOCIATE_TAG_JP,
                associateTagUs: process.env.AMAZON_ASSOCIATE_TAG_US,
              }),
            ]),
          ]),
        rehypePlugins: [
          REHYPE_PLUGINS.rehypeKatex,
          [
            REHYPE_PLUGINS.rehypeMermaid,
            {
              strategy: "inline-svg",
              mermaidConfig: { theme: "neutral" },
            },
          ],
          [REHYPE_PLUGINS.rehypePrism, { ignoreMissing: true }],
        ],
      }),
    );
  } catch (err) {
    logger.error(
      { postPath: String(postPath), err },
      "Failed to compile markdown",
    );
    throw new Error(`Failed to compile markdown: ${postPath}`);
  }

  const _headings: unknown = stripFile.data.headings;
  const parsed = headingsSchema.safeParse(_headings);

  if (!parsed.success) {
    logger.error(
      {
        postPath: String(postPath),
        headings: _headings,
        validationError: parsed.error,
      },
      "Failed to extract headers",
    );
    throw new Error(`Failed to extract headers: ${postPath}`);
  }

  const { markdown: _, ...meta } = post;
  return {
    ...meta,
    compiledMarkdown,
    rawMarkdown: String(stripFile),
    headings: parsed.data,
  };
}

export async function getDumpPosts(
  src: PathLike,
  imageDist: string,
): Promise<DumpPost[]> {
  const mdFiles = await Array.fromAsync(
    glob(`${src}/**/*.md`, { exclude: ["**/node_modules/**"] }),
  );

  if (mdFiles.length === 0) {
    logger.warn({ src: String(src) }, "No markdown files found");
    return [];
  }

  logger.info(
    { src: String(src), count: mdFiles.length },
    "Processing markdown files",
  );

  // Phase 1: Read all posts to build the metadata map
  const readResults = await Promise.allSettled(
    mdFiles.map(async (f) => ({ filePath: f, post: await readPost(f) })),
  );

  const postMetaMap: PostMetaMap = new Map();
  const readSucceeded: { filePath: string; post: Post }[] = [];
  const readFailed: { file: string; reason: unknown }[] = [];

  for (let i = 0; i < readResults.length; i++) {
    const result = readResults[i];
    if (result.status === "fulfilled") {
      const absPath = path.resolve(result.value.filePath);
      postMetaMap.set(absPath, {
        uuid: result.value.post.meta.uuid,
        category: result.value.post.meta.category,
      });
      readSucceeded.push(result.value);
    } else {
      readFailed.push({ file: mdFiles[i], reason: result.reason });
    }
  }

  // Phase 2: Compile all posts with the complete metadata map
  const compileResults = await Promise.allSettled(
    readSucceeded.map(async ({ filePath, post }) => {
      return await dumpPost(post, filePath, imageDist, postMetaMap);
    }),
  );

  const succeeded: DumpPost[] = [];
  const failed: { file: string; reason: unknown }[] = [...readFailed];

  for (let i = 0; i < compileResults.length; i++) {
    const result = compileResults[i];
    if (result.status === "fulfilled") {
      succeeded.push(result.value);
    } else {
      failed.push({
        file: readSucceeded[i].filePath,
        reason: result.reason,
      });
    }
  }

  if (failed.length > 0) {
    for (const f of failed) {
      logger.error({ file: f.file, err: f.reason }, "Failed to process post");
    }
    logger.error(
      {
        total: mdFiles.length,
        succeeded: succeeded.length,
        failed: failed.length,
        failedFiles: failed.map((f) => f.file),
      },
      "Some posts failed to process",
    );
    throw new Error(
      `${failed.length}/${mdFiles.length} posts failed to process: ${failed.map((f) => f.file).join(", ")}`,
    );
  }

  logger.info({ count: succeeded.length }, "All posts processed successfully");
  return succeeded;
}

function getDump(dumpPosts: DumpPost[]): Dump {
  const tags = [...new Set(dumpPosts.flatMap((p) => p.meta.tags))];
  const categories = [...new Set(dumpPosts.map((p) => p.meta.category))];

  return {
    tags,
    categories,
    posts: dumpPosts,
  };
}

export async function writeDump(path: PathLike, dumpPosts: DumpPost[]) {
  const dump = getDump(dumpPosts);
  const writeAsync = promisify(writeFile);

  await writeAsync(path, JSON.stringify(dump, null, 2));
}
