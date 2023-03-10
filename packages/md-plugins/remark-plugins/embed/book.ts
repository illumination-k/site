import axios from "axios";
import { Parent } from "mdast";
import { Directive } from "mdast-util-directive";
import { toString } from "mdast-util-to-string";
import { DirectiveTransformer } from ".";

type BookInfo = {
  title: string;
  description: string;
  authors: string[];
  thumbnail: string;
  isbn10: string;
};

export async function getBookInfo(isbn10: string): Promise<BookInfo> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn10}`;

  const resp = await axios.get(url);

  const book = resp.data.items[0].volumeInfo;
  return {
    title: book.title,
    description: book.description,
    authors: book.authors,
    thumbnail: book.imageLinks.thumbnail,
    isbn10: isbn10,
  };
}

export class BookTransformer implements DirectiveTransformer {
  isbn10?: string;

  constructor() {}

  shouldTransform(node: Directive) {
    if (node.type !== "leafDirective") return false;
    if (node.name !== "isbn") return false;

    const v = toString(node);

    if (v.length !== 10) {
      return false;
    }

    this.isbn10 = v;
    return true;
  }

  async transform(node: Directive, index: number | null, parent: Parent) {
    if (!this.isbn10) return;

    const bookInfo = await getBookInfo(this.isbn10);

    // todo!
  }
}
