import { PathLike, readFile, writeFile } from "fs";
import { promisify } from "util";

import fm, { FrontMatterResult } from "front-matter";
import { glob } from "glob";

// @ts-ignore
import tinysegmenter from "tiny-segmenter";

import { remark } from "remark";
import stripMarkdown from "strip-markdown";

import { Dump, DumpPost, headingsSchema, Post, PostMeta, postMetaSchema } from "common";

import extractHeader from "./extractHeader";
import optimizeImage from "./optimizeImage";
import { visit } from "unist-util-visit";

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
    .use(stripMarkdown)
    .process(post.markdown);

  const file = await remark()
    .use(extractHeader)
    .use(optimizeImage, { imageDist, postPath })
    .process(post.markdown);

  post.markdown = String(file);

  console.log(file);

  const tokens = segmenter.segment(String(stripFile));
  const _headings: unknown = file.data.headings;
  const parsed = headingsSchema.safeParse(_headings);

  if (!parsed.success) {
    console.error(_headings);
    throw "Error in extracting headers";
  }
  return { ...post, tokens, headings: parsed.data };
}

export async function getDumpPosts(src: PathLike, imageDist: string): Promise<DumpPost[]> {
  const mdFiles = await glob(`${src}/**/*.md`, { ignore: "node_modules/*" });
  return Promise.all(mdFiles.map(async (f) => await dumpPost(await readPost(f), f, imageDist)));
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
