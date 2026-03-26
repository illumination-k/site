import { type PathLike, readFile, writeFile } from "node:fs";
import { promisify } from "node:util";
import fm, { type FrontMatterResult } from "front-matter";
import { glob } from "glob";

import { remark } from "remark";

import { compile } from "@mdx-js/mdx";
import { REHYPE_PLUGINS, REMARK_PLUGINS } from "md-plugins";

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

const readFileAsync = promisify(readFile);

export async function readPost(path: PathLike): Promise<Post> {
  const rawPost = (await readFileAsync(path)).toString();
  const fmResult: FrontMatterResult<PostMeta> = fm(rawPost);

  const meta = postMetaSchema.safeParse({
    ...fmResult.attributes,
  });

  if (!meta.success) {
    logger.error(
      { path: String(path), validationError: meta.error },
      "Failed to parse post front-matter",
    );
    throw new Error(`Failed to parse front-matter: ${path}`);
  }

  return { meta: meta.data, markdown: fmResult.body };
}

export async function dumpPost(
  post: Post,
  postPath: PathLike,
  imageDist: string,
): Promise<DumpPost> {
  // @ts-ignore
  const stripFile = await remark().use(extractHeader).process(post.markdown);

  let compiledMarkdown: string;
  try {
    compiledMarkdown = String(
      await compile(post.markdown, {
        outputFormat: "function-body",
        format: "mdx",
        development: false,

        // @ts-ignore
        remarkPlugins: [[optimizeImage, { postPath, imageDist }]].concat(
          // @ts-ignore
          REMARK_PLUGINS,
        ),
        rehypePlugins: [
          REHYPE_PLUGINS.rehypeKatex,
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
  const mdFiles = await glob(`${src}/**/*.md`, { ignore: "node_modules/*" });

  return Promise.all(
    mdFiles.map(async (f) => {
      return await dumpPost(await readPost(f), f, imageDist);
    }),
  );
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
