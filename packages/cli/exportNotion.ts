import { Client } from "@notionhq/client";
import axios from "axios";
import { NotionToMarkdown } from "notion-to-md";

import type {
	ImageBlockObjectResponse,
	PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import { z } from "zod";
import { zArgs } from "./zArgs";

const writeFileAsync = promisify(fs.writeFile);

function isPageObjectResponse(obj: unknown): obj is PageObjectResponse {
	return (obj as PageObjectResponse).object === "page";
}

function isImageBlockObjectResponse(
	obj: unknown,
): obj is ImageBlockObjectResponse {
	return (obj as ImageBlockObjectResponse).type === "image";
}

const notion = new Client({
	auth: process.env.NOTION_TOKEN,
});

export async function getNotionPages(
	pageId: string,
	publicDir: string,
	outputDir: string,
) {
	const pageMeta = await notion.pages.retrieve({
		page_id: pageId,
	});

	const n2m = new NotionToMarkdown({
		notionClient: notion,
	});

	n2m.setCustomTransformer("image", async (block) => {
		if (!isImageBlockObjectResponse(block)) {
			const msg = `Expected ImageBlockObjectResponse, but got ${block.object}`;
			throw new Error(msg);
		}

		const imageBlock = block;

		let imageUri: string;

		if (imageBlock.image.type === "external") {
			imageUri = imageBlock.image.external.url;
		} else if (imageBlock.image.type === "file") {
			imageUri = imageBlock.image.file.url;
		} else {
			throw new Error("Invalid image type");
		}

		const imageResponse = await axios.get(imageUri, {
			responseType: "arraybuffer",
		});

		const imageBuffer = Buffer.from(imageResponse.data, "binary");

		const imageFileName = `${imageBlock.id}.png`;
		const imagePath = path.join(publicDir.toString(), imageFileName);
		await writeFileAsync(imagePath, imageBuffer);

		const relativePath = path.relative(outputDir, imagePath);

		return `![${imageBlock.id}](${relativePath})`;
	});

	const mdBlocks = await n2m.pageToMarkdown(pageId);

	const mdString = n2m.toMarkdownString(mdBlocks);

	writeFileAsync(path.join(outputDir, `${pageMeta.id}.md`), mdString.parent);
}

export async function exportDatabase(
	databaseId: string,
	filterFunc: (o: PageObjectResponse) => boolean,
	publicDir: string,
	outputDir: string,
) {
	const database = await notion.databases.query({
		database_id: databaseId,
	});

	const pageIds = database.results
		.filter((o) => {
			return isPageObjectResponse(o) && filterFunc(o);
		})
		.map((o) => o.id);

	for (const pageId of pageIds) {
		await getNotionPages(pageId, publicDir, outputDir);
	}
}
