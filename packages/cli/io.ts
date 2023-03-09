import { PathLike, readFile, writeFile } from "fs";
import { promisify } from "util";

import fm, { FrontMatterResult } from "front-matter";
import { glob } from "glob";

import { remark } from "remark";

import { compile } from "@mdx-js/mdx";
import { REHYPE_PLUGINS, REMARK_PLUGINS } from "md-plugins";
import stripMarkdown from "strip-markdown";

// @ts-ignore
import tinysegmenter from "tiny-segmenter";

import { Dump, DumpPost, headingsSchema, Post, PostMeta, postMetaSchema } from "common";

import extractHeader from "./extractHeader";
import optimizeImage from "./optimizeImage";

const readFileAsync = promisify(readFile);

export async function readPost(path: PathLike): Promise<Post> {
  const rawPost = (await readFileAsync(path)).toString();
  const fmResult: FrontMatterResult<PostMeta> = fm(rawPost);

  const meta = postMetaSchema.safeParse({
    ...fmResult.attributes,
  });

  if (!meta.success) {
    console.error(meta.error);
    throw new Error(`${path}: ${JSON.stringify(meta.error, null, 2)}`);
  }

  return { meta: meta.data, markdown: fmResult.body };
}

export async function dumpPost(post: Post, postPath: PathLike, imageDist: string): Promise<DumpPost> {
  const segmenter = new tinysegmenter();

  // @ts-ignore
  const stripFile = await remark()
    .use(extractHeader)
    .use(stripMarkdown)
    .process(post.markdown);

  let compiledMarkdown: string;
  try {
    compiledMarkdown = String(
      await compile(post.markdown, {
        outputFormat: "function-body",
        format: "mdx",
        development: false,

        // @ts-ignore
        remarkPlugins: [[optimizeImage, { postPath, imageDist }]].concat(REMARK_PLUGINS),
        rehypePlugins: [
          REHYPE_PLUGINS.rehypeKatex,
          [REHYPE_PLUGINS.rehypePrism, { ignoreMissing: true }],
        ],
      }),
    );
  } catch (err) {
    throw `Error in ${postPath}:
    ${err}
    `;
  }

  const tokens = segmenter.segment(String(stripFile));
  const _headings: unknown = stripFile.data.headings;
  const parsed = headingsSchema.safeParse(_headings);

  if (!parsed.success) {
    console.error(_headings);
    throw "Error in extracting headers";
  }
  return { ...post, compiledMarkdown, tokens, headings: parsed.data };
}

export async function getDumpPosts(src: PathLike, imageDist: string): Promise<DumpPost[]> {
  const mdFiles = await glob(`${src}/**/*.md`, { ignore: "node_modules/*" });

  return Promise.all(mdFiles.map(async (f) => {
    return await dumpPost(await readPost(f), f, imageDist);
  }));
}

function getDump(dumpPosts: DumpPost[]): Dump {
  const tags = [...new Set(dumpPosts.map((p) => p.meta.tags).flat())];
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
