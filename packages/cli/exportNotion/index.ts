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

import { type PostMeta, postMetaSchema } from "common";
import YAML from "yaml";

import { pageObjectSchema } from "./propertiesSchema";

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
  postMeta: PostMeta,
  publicDir: string,
  outputDir: string,
) {
  const pageId = postMeta.uuid;

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

  const content = `---
${YAML.stringify(postMeta).trim()}
---
${mdString.parent}`;

  writeFileAsync(path.join(outputDir, `${pageMeta.id}.md`), content);
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

  const filteredPageObjects = database.results.filter(
    (o) => isPageObjectResponse(o) && filterFunc(o),
  );

  const postMetas = filteredPageObjects.map((o) => {
    const parsed = pageObjectSchema.parse(o);
    const uuid = parsed.id;
    const createdAt = parsed.created_time;
    const updatedAt = parsed.last_edited_time;
    const title = parsed.properties.Name.title
      .map((t) => t.plain_text)
      .join("");
    const description = parsed.properties.AiDesc.rich_text
      .map((t) => t.plain_text)
      .join("");

    const tags = [
      ...parsed.properties.Tag.multi_select.map((t) => t.name),
      ...parsed.properties.Journal.multi_select.map((t) => t.name),
    ];

    const obj = {
      uuid,
      title,
      description,
      tags,
      lang: "ja",
      category: "paper-stream",
      created_at: createdAt,
      updated_at: updatedAt,
    };

    return postMetaSchema.parse(obj);
  });

  for (const postMeta of postMetas) {
    await getNotionPages(postMeta, publicDir, outputDir);
  }
}
