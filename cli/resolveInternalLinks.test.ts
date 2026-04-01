import path from "node:path";
import type { Link, Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";

import resolveInternalLinks, { type PostMetaMap } from "./resolveInternalLinks";

function collectLinks(ast: Root): Link[] {
	const links: Link[] = [];
	visit(ast, "link", (node: Link) => {
		links.push(node);
	});
	return links;
}

const postMetaMap: PostMetaMap = new Map([
	[
		path.resolve("/posts/techblog/biology/seq_summary.md"),
		{ uuid: "dbb49f31-2bca-4a97-857e-a1d7a95b645d", category: "techblog" },
	],
	[
		path.resolve("/posts/techblog/algorithm/bitsearch.md"),
		{ uuid: "e0b5ed90-0b5e-406b-9b13-d7bb0185a74f", category: "techblog" },
	],
	[
		path.resolve("/posts/paperStream/some-paper.md"),
		{ uuid: "aaa-bbb-ccc", category: "paperstream" },
	],
]);

const currentPostPath = "/posts/techblog/frontend/pagefind.md";

function processMarkdown(md: string): Root {
	const plugin = resolveInternalLinks({ postPath: currentPostPath, postMetaMap });
	const processor = unified().use(remarkParse);
	const ast = processor.parse(md);
	plugin(ast as Root);
	return ast as Root;
}

describe("resolveInternalLinks", () => {
	it("resolves a relative .md link to internal URL", () => {
		const ast = processMarkdown(
			"[seq summary](../biology/seq_summary.md)",
		);
		const links = collectLinks(ast);
		expect(links).toHaveLength(1);
		expect(links[0].url).toBe(
			"/techblog/post/dbb49f31-2bca-4a97-857e-a1d7a95b645d",
		);
	});

	it("resolves a link with fragment", () => {
		const ast = processMarkdown(
			"[heading](../biology/seq_summary.md#overview)",
		);
		const links = collectLinks(ast);
		expect(links).toHaveLength(1);
		expect(links[0].url).toBe(
			"/techblog/post/dbb49f31-2bca-4a97-857e-a1d7a95b645d#overview",
		);
	});

	it("resolves links to different categories", () => {
		const ast = processMarkdown(
			"[paper](../../paperStream/some-paper.md)",
		);
		const links = collectLinks(ast);
		expect(links).toHaveLength(1);
		expect(links[0].url).toBe("/paperstream/post/aaa-bbb-ccc");
	});

	it("does not modify external links", () => {
		const ast = processMarkdown("[google](https://google.com)");
		const links = collectLinks(ast);
		expect(links).toHaveLength(1);
		expect(links[0].url).toBe("https://google.com");
	});

	it("does not modify anchor-only links", () => {
		const ast = processMarkdown("[section](#heading)");
		const links = collectLinks(ast);
		expect(links).toHaveLength(1);
		expect(links[0].url).toBe("#heading");
	});

	it("does not modify non-.md links", () => {
		const ast = processMarkdown("[image](./photo.png)");
		const links = collectLinks(ast);
		expect(links).toHaveLength(1);
		expect(links[0].url).toBe("./photo.png");
	});

	it("keeps original URL when target not found", () => {
		const ast = processMarkdown("[missing](./nonexistent.md)");
		const links = collectLinks(ast);
		expect(links).toHaveLength(1);
		expect(links[0].url).toBe("./nonexistent.md");
	});

	it("resolves multiple links in one document", () => {
		const md = [
			"[a](../biology/seq_summary.md)",
			"[b](../algorithm/bitsearch.md)",
			"[c](https://example.com)",
		].join("\n\n");
		const ast = processMarkdown(md);
		const links = collectLinks(ast);
		expect(links).toHaveLength(3);
		expect(links[0].url).toBe(
			"/techblog/post/dbb49f31-2bca-4a97-857e-a1d7a95b645d",
		);
		expect(links[1].url).toBe(
			"/techblog/post/e0b5ed90-0b5e-406b-9b13-d7bb0185a74f",
		);
		expect(links[2].url).toBe("https://example.com");
	});
});
