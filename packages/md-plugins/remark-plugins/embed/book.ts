import type { Image, Link, Paragraph } from "mdast";
import type { Directives } from "mdast-util-directive";
import { toString as mdastToString } from "mdast-util-to-string";
import type { Parent } from "unist";
import type { DirectiveTransformer } from ".";
import { cachedFetch } from "../../cachedFetch";

type BookInfo = {
  title: string;
  description: string;
  authors: string[];
  thumbnail: string;
  isbn: string;
};

export async function getBookInfo(isbn: string): Promise<BookInfo> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;

  const resp = await cachedFetch(url);

  const data = resp.data as {
    items?: {
      volumeInfo: {
        title: string;
        description?: string;
        authors?: string[];
        imageLinks?: { thumbnail?: string };
      };
    }[];
  };

  if (!data.items || data.items.length === 0) {
    throw new Error(`No book found for ISBN: ${isbn}`);
  }

  const book = data.items[0].volumeInfo;
  return {
    title: book.title,
    description: book.description ?? "",
    authors: book.authors ?? [],
    thumbnail: book.imageLinks?.thumbnail ?? "",
    isbn,
  };
}

export function buildAmazonUrl(
  isbn: string,
  region: "jp" | "us",
): string {
  const domain =
    region === "us" ? "www.amazon.com" : "www.amazon.co.jp";
  const tag =
    region === "us"
      ? (process.env.AMAZON_ASSOCIATE_TAG_US ?? "")
      : (process.env.AMAZON_ASSOCIATE_TAG_JP ?? "");
  const tagParam = tag ? `?tag=${tag}` : "";
  return `https://${domain}/dp/${isbn}${tagParam}`;
}

export class BookTransformer implements DirectiveTransformer {
  isbn?: string;

  shouldTransform(node: Directives) {
    if (node.type !== "leafDirective") return false;
    if (node.name !== "isbn") return false;

    const v = mdastToString(node);

    if (v.length !== 10 && v.length !== 13) {
      return false;
    }

    this.isbn = v;
    return true;
  }

  async transform(
    node: Directives,
    index: number | null | undefined,
    parent: Parent,
  ) {
    const isbn = mdastToString(node);
    const bookInfo = await getBookInfo(isbn);

    const region: "jp" | "us" =
      node.attributes && "id" in node.attributes && node.attributes.id === "us"
        ? "us"
        : "jp";

    const amazonUrl = buildAmazonUrl(isbn, region);
    const buttonText = region === "us" ? "View on Amazon" : "Amazonで見る";

    const thumbnailImage: Image = {
      type: "image",
      url: bookInfo.thumbnail,
      alt: bookInfo.title,
      data: { hProperties: { className: "book-card-thumbnail" } },
    };

    const thumbnailLink: Link = {
      type: "link",
      url: amazonUrl,
      data: {
        hProperties: { target: "_blank", rel: "noopener sponsored" },
      },
      children: [thumbnailImage],
    };

    const titleLink: Link = {
      type: "link",
      url: amazonUrl,
      data: {
        hProperties: { target: "_blank", rel: "noopener sponsored" },
      },
      children: [
        {
          type: "strong",
          children: [{ type: "text", value: bookInfo.title }],
        },
      ],
    };

    const authorsNode: Paragraph = {
      type: "paragraph",
      data: {
        hName: "p",
        hProperties: { className: "book-card-authors" },
      },
      children: [
        { type: "text", value: bookInfo.authors.join(", ") || "Unknown" },
      ],
    };

    const amazonButton: Paragraph = {
      type: "paragraph",
      data: {
        hName: "a",
        hProperties: {
          className: "book-card-amazon-link",
          href: amazonUrl,
          target: "_blank",
          rel: "noopener sponsored",
        },
      },
      children: [{ type: "text", value: buttonText }],
    };

    const infoNode: Paragraph = {
      type: "paragraph",
      data: {
        hName: "div",
        hProperties: { className: "book-card-info" },
      },
      children: [titleLink, authorsNode, amazonButton],
    };

    const cardNode: Paragraph = {
      type: "paragraph",
      data: {
        hName: "div",
        hProperties: { className: "book-card" },
      },
      children: [thumbnailLink, infoNode],
    };

    parent.children[index || 0] = cardNode;
  }
}
