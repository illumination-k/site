import type { PathLike } from "node:fs";
import path from "node:path";
import { glob } from "glob";
import { readPost } from "./io";

export async function generateRedirect(src: PathLike) {
	const mdFiles = await glob(`${src}/**/*.md`);

	const redirects = Promise.all(
		mdFiles.map(async (mdFile) => {
			const post = await readPost(mdFile);

			const slug = path.basename(mdFile).replace(/\.md*/, "");

			return {
				source: `/techblog/posts/${slug}`,
				destination: `/techblog/post/${post.meta.uuid}`,
				permanent: true,
			};
		}),
	);

	return redirects;
}
