---
uuid: ebaa13d3-6af6-4c07-afb9-977755a79dbc
title: Adding Search Functionality to a Next.js Blog
description: Adding search functionality to a Next.js blog using morphological analysis and flexsearch.
lang: en
category: techblog
tags:
  - frontend
  - development
  - next.js
  - fulltext-search
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

I wanted search functionality after all, so I implemented it using morphological analysis and [flexsearch](https://github.com/nextapps-de/flexsearch). The sensitivity still feels a bit off, so it might be better to combine it with n-grams.

## Basic Strategy

Since I want full AMP compatibility, queries are received in `getServerSideProps` and passed through flexsearch. The search targets are cached in a `data.js` file before uploading to the server, and that file is referenced.

The form is created like this, using GET to send the user to the search page with something like `/search?q=word`.

```jsx
<form
method="get"
action="/search"
target="_top"
>
<input
    type="text"
    name="q"
></input>>
```

For AMP forms, the `target` attribute is required and must be either `_top` or `_blank`. `_top` navigates in the same tab, while `_blank` opens a new tab.

## Morphological Analysis

I used [kuromojin](https://github.com/azu/kuromojin). First, fetch all blog posts, convert the markdown to text, run morphological analysis, and save the results in a format like `cache/data.js`. I used [strip-markdown](https://github.com/remarkjs/strip-markdown) for the markdown-to-text conversion.

From the morphological analysis results, I removed parts that might interfere with regex (thinking it might cause issues with highlight functionality), and kept nouns, verbs, and adjectives that are useful for search. I also kept only words with a length of 2 or more. These settings should probably be tuned further. For now, only the title and body are searched, but adding more fields is just a matter of including them.

The general flow is: `getAllPostsPath` fetches all posts, `gray-matter` reads the content, `filterToken` extracts the desired tokens, and all extracted tokens are saved as words.

```js title=makeCache.js
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const glob = require("glob");
const remark = require(`remark`);
const strip = require(`strip-markdown`);
const { tokenize } = require(`kuromojin`);

const POSTDIRPATH = path.join(process.cwd(), "src", "pages", "posts");

function getAllPostsPath() {
  const pattern = path.join(POSTDIRPATH, "**", "*.md");
  const posts = glob.sync(pattern);
  return posts;
}

function markdownToText(content) {
  let text;
  remark()
    .use(strip, { keep: ["code"] })
    .process(content, (err, file) => {
      if (err) throw err;
      text = file.contents;
    });
  return text;
}

async function filterToken(text) {
  const res = await tokenize(text);
  const POS_LIST = [`名詞`, `動詞`, `形容詞`];
  const IGNORE_REGEX = /^[!-/:-@[-`{-~、-〜"'・]+$/;
  return res
    .filter((token) => POS_LIST.includes(token.pos))
    .map((token) => token.surface_form)
    .filter((word) => !IGNORE_REGEX.test(word))
    .filter((word) => word.length >= 2);
}

async function makePostsCache() {
  const filepaths = getAllPostsPath();

  const posts = await Promise.all(
    filepaths.map(async (filepath) => {
      const id = path.parse(filepath).base.replace(".md", "");
      const contents = fs.readFileSync(filepath);
      const matterResult = matter(contents);
      const text = markdownToText(matterResult.content);

      const text_words = await filterToken(text);
      const title_words = await filterToken(matterResult.data.title);
      const all_words = [
        ...text_words,
        ...title_words,
      ];
      const words = [...new Set(all_words)];

      return {
        id: id,
        data: {
          title: matterResult.data.title,
          words: words.join(" "),
        },
      };
    })
  );

  const fileContents = `export const posts = ${JSON.stringify(posts)}`;
  const outdir = path.join(process.cwd(), "cache");
  fs.writeFileSync(path.join(outdir, "data.js"), fileContents);
}

makePostsCache();
```

## pre-commit

Since I'd inevitably forget to run this every time, I used a package called [husky](https://github.com/typicode/husky).

Modify the build scripts section of package.json like this:

```json title=package.json
"scripts": {
  "dev": "next",
  "build": "next build",
  "start": "next start",
  "cache-posts": "node script/makeCache.js"
},
"husky": {
  "hooks": {
    "pre-commit": "yarn cache-posts && git add cache/data.js"
  }
},
```

This way, `makeCache.js` runs automatically with every commit, which is convenient.

When you don't want the `pre-commit` hook configured via husky to run:

```bash
git commit -m "no-hooks!" --no-verify
```

This will skip it.

## Search Page

Now let's build the search page. `getServerSideProps` receives a ctx variable that contains most of the information. This time we only need the query result, so we'll use `ctx.query`.

```jsx
import Layout from "@components/Layout";
import Link from "next/link";

const SearchResult = (props) => {
	const { query, meta } = props;
	const listitems = meta.map((res, idx) => {
		const url = `/posts/${res.id}`;
		return (
			<li key={idx}>
				<Link href={url}>{res.title}</Link>
			</li>
		);
	});
	return (
		<Layout>
			<h1>Search Results</h1>
			<h2>Query: {query}</h2>
			<ul>{listitems}</ul>
		</Layout>
	);
};

export async function getServerSideProps(ctx) {
	const { posts } = await require("../../cache/data");
	const FlexSearch = require("flexsearch");
	const query = ctx.query.q;

	let index = new FlexSearch({
		tokenize: function (str) {
			return str.split(" ");
		},
		doc: {
			id: "id",
			field: ["data:words"],
		},
	});

	await index.add(posts);

	const res = await index.search(query);
	const meta = res.map((r) => ({
		id: r.id,
		title: r.data.title,
	}));

	return {
		props: { query: query, meta: meta },
	};
}

export default SearchResult;
```

Since words are saved as space-separated strings during the makeCache.js step, the flexsearch tokenizer uses a custom one (which simply splits on whitespace to create an array). Everything else follows the flexsearch documentation. The id serves as the URL path, so it's passed through directly.

So that's how I implemented in-site article search for now. Google really is amazing.

## References

- [Building Full-Text Search for a Gridsome Blog from Scratch](https://blog.solunita.net/posts/develop-blog-by-gridsome-from-scratch-full-text-search/)
- [Building a search component for your Next.js markdown blog](https://medium.com/@matswainson/building-a-search-component-for-your-next-js-markdown-blog-9e75e0e7d210)
