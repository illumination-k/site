---
uuid: ea7cfff1-676a-4f54-8cf0-2e66fd27ae2c
title: "pagefindを使って全文検索エンジンをNext.jsのSSGブログに導入する"
description: "このブログ記事では、PagefindというWeb上で動作する軽量な全文検索エンジンを、Next.jsのSSG（静的サイト生成）に導入する方法を紹介しています。Pagefindは日本語にも限定的に対応しています。具体的なセットアップ手順や、検索コンポーネントの実装方法、検索結果を型安全に取得するためのコード例について説明します。"
category: "techblog"
lang: ja
tags: ["nextjs", "frontend"]
created_at: 2024-09-23
updated_at: 2024-09-23
---

## pagefindとは

pagefindは最近作成されているWeb上で動作する全文検索エンジンです。
公式では以下のように述べられています。

> Pagefind is a fully static search library that aims to perform well on large sites, while using as little of your users’ bandwidth as possible, and without hosting any infrastructure.Pagefind runs after Hugo, Eleventy, Jekyll, Next, Astro, SvelteKit, or any other website framework. The installation process is always the same: Pagefind only requires a folder containing the built static files of your website, so in most cases no configuration is needed to get started.

> (GPT訳) Pagefindは、ユーザーの帯域幅を最小限に抑え、大規模なサイトでも高速に動作する完全な静的検索ライブラリです。特定のインフラをホスティングする必要がなく、Hugo、Eleventy、Jekyll、Next、Astro、SvelteKitなど、ほとんどのウェブサイトフレームワークで動作します。ビルドされた静的ファイルのフォルダを指定するだけで、ほとんどの場合、設定は不要です。

[pagefindのGithub](https://github.com/CloudCannon/pagefind)を見るとわかるように (Webassembly) で書かれています。
stemming -> indexing -> searchあたりはwebassemblyっぽい感じです。

### 日本語対応

Multilingual supportもあります。日本語に関しては限定的な対応ですが、一応whitespaceのstemmingではなくて中国語向けのstemmingが適用されるらしいです。
対応言語は、htmlのlangを参照しているようです。

また、検索時の分割には対応していないようなので熟語とかのtokenizeは検索時には行われないようです。自前でwhitespace区切りをする必要があります。
stemmingは[この辺](https://github.com/CloudCannon/pagefind/tree/main/pagefind_stem)に書いてありますが、詳しくないので詳細は理解できていないのですが、辞書とかを使用しているわけではなくてRule baseっぽい雰囲気があります。

- [Multilingual search](https://pagefind.app/docs/multilingual/)

> Currently when indexing, Pagefind does not support stemming for specialized languages, but does support segmentation for words not separated by whitespace.s
> Pagefind does not yet support segmentation of the search query, so searching in the browser requires that words in the search query are separated by whitespace.
> In practice, this means that on a page tagged as a zh- language, 每個月都 will be indexed as the words 每個, 月, and 都.
> When searching in the browser, searching for 每個, 月, or 都 individually will work. Additionally, searching 每個 月 都 will return results containing each word in any order, and searching "每個 月 都" in quotes will match 每個月都 exactly.
> Searching for 每個月都 will return zero results, as Pagefind is not able to segment it into words in the browser. Work to improve this is underway and will hopefully remove this limitation in the future.

> (GPT訳) Pagefindは、現在のインデックス作成時に特殊な言語のステミング（単語の語幹処理）をサポートしていませんが、空白で区切られていない単語のセグメンテーションはサポートしています。ただし、ブラウザ内での検索時には、検索クエリの単語が空白で区切られている必要があります。
> 具体的には、zh言語タグが付けられたページで「每個月都」は「每個」「月」「都」のように単語としてインデックスされます。ブラウザで「每個」「月」「都」といった単語を個別に検索することは可能であり、「每個 月 都」と空白を挟んで検索すれば、どの順序であってもこれらの単語を含む結果が返されます。また、引用符付きで「"每個 月 都"」と検索すれば、正確に「每個月都」に一致する結果が返されます。
> ただし、空白なしで「每個月都」を検索すると結果は返されません。これは、Pagefindがブラウザで単語をセグメントすることができないためです。この制限を取り除くための改善作業が進行中です。

### 検索アルゴリズム

検索アルゴリズムについては公式ページでは見つけられませんが、コードを読む限りは現時点では (2024/09/23) BM25を採用しているようです。

::gh[https://github.com/CloudCannon/pagefind/blob/20a4206471f8618709aeaa3515ea92d1c0d528e5/pagefind_web/src/search.rs#L65-L75]

## Next.jsへの実装

今回はSSGであることを前提にしています。nextjsの設定等は省略しますが、`output: "export"`である必要があります。

### Setup

```bash
pnpm -i -D pagefind npm-run-all
```

[npm-run-all](https://www.npmjs.com/package/npm-run-all)をtask runnerとして使用しています。

```json
{
  "scripts": {
    "build": "run-s build:next build:pagefind",
    "build:next": "next build",
    "build:pagefind": "pagefind --site out",
    "dev": "next dev",
    "dev-pagefind": "pagefind --site out --output-path ./public/pagefind"
  }
}
```

pagefindのcliでは、`--site`以下に`next build`で生成された`out`を指定します。
これによって、`--output-path`を指定しなければ`out/pagefind/`以下にindexや`pagefind.js`等が生成されます。

参考までに、大体以下のようなものが出力されます。

:::details

```
out/pagefind/
├── fragment/
│  ├── ja_1e5d60d.pf_fragment
|   ...
├── index/
│  ├── ja_4dc97e6.pf_index
|   ...
├── pagefind-entry.json
├── pagefind-highlight.js
├── pagefind-modular-ui.css
├── pagefind-modular-ui.js
├── pagefind-ui.css
├── pagefind-ui.js
├── pagefind.ja_5f3319f7c9.pf_meta
├── pagefind.ja_e8a5abf83a.pf_meta
├── pagefind.js
└── wasm.unknown.pagefind
```

:::

また、dev開発環境でも`pagefind.js`をloadできる必要があるので、dev開発時には`public/pagefind`以下に生成することにします。
この部分は、git管理したいわけではないので、`.gitignore`に足しておきます。

```txt title=.gitignore
# pagefind
public/pagefind
```

### Componentを書く

- `useEffect`で`/pagefind/pagefind.js`をdynamic importして使用します。
  - このpathは、`pagefind`のCLIで指定したoutput pathに準拠してください。
- zodを使って、型安全に結果を取得しています。

```tsx
import React, { useEffect, useState } from "react";

import { z } from "zod";

const pagefindResultSchema = z.object({
	url: z.string().transform((url) => url.replace(".html", "")),
	excerpt: z.string(),
	meta: z.object({
		title: z.string().optional(),
		image: z.string().optional(),
	}),
});

type PagefindResult = z.infer<typeof pagefindResultSchema>;

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		pagefind: any;
	}
}

const pagefindResultSchema = z.object({
	// exportするとhtmlが末尾につくので削除してある。
	url: z.string().transform((url) => url.replace(".html", "")),
	excerpt: z.string(),
	meta: z.object({
		title: z.string().optional(),
		image: z.string().optional(),
	}),
});

type PagefindResult = z.infer<typeof pagefindResultSchema>;

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		pagefind: any;
	}
}

export default function Search() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<PagefindResult[]>([]);

	useEffect(() => {
		async function loadPagefind() {
			if (typeof window.pagefind === "undefined") {
				try {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					window.pagefind = await import(
						// @ts-expect-error @types of pagefind are not available
						// eslint-disable-next-line import/no-unresolved
						/* webpackIgnore: true */ "/pagefind/pagefind.js"
					);
				} catch (e) {
					console.error(e);
					window.pagefind = { search: () => ({ results: [] }) };
				}
			}
		}
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		loadPagefind();
	}, []);

	async function handleSearch() {
		if (!window.pagefind) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const search = await window.pagefind.search(query);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
		const results = await Promise.all(search.results.map((r: any) => r.data()));

		setResults(z.array(pagefindResultSchema).parse(results));
	}

	return (
		<div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					// eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises
					handleSearch();
				}}
			>
				<input
					type="text"
					value={query}
					placeholder="Search articles..."
					onChange={(e) => setQuery(e.target.value)}
				/>
				<button type="submit">検索</button>
			</form>

			{results.map((result) => (
				<div key={result.url}>
					<h2>
						<Link href={result.url}>{result.meta.title ?? "Untitled"}</Link>
					</h2>
					<div dangerouslySetInnerHTML={{ __html: result.excerpt }} />
				</div>
			))}
		</div>
	);
}
```

また、型情報については以下を参照すると良いです。今回は必要そうな部分だけ使用しました。

::gh[https://github.com/CloudCannon/pagefind/blob/8a16ce730cf3bcef1c6b326322810be4ad3c4706/pagefind_web_js/types/index.d.ts#L123-L160]

## 検索indexする場所の指定

`data-pagefind-*` tagを指定することでindexされる場所をコントロールできます。

一番わかりやすいのは、以下のように`data-pagefind-body`を指定すると`main`の中身だけindexingされます。

```html
<body>
    <main data-pagefind-body>
        <h1>Condimentum Nullam</h1>
        <p>Nullam id dolor id nibh ultricies.</p>
    </main>
    <aside>
        This content will not be indexed.
    </aside>
</body>
```

`data-pagefind-ignore`を指定するとその部分をindexingから除外したりす事も可能です。

詳しくは以下を参照してください。

- [pagefind.app - Indexing - Configure the index](https://pagefind.app/docs/indexing/)

## Conclusion

かなり簡単にSSGサイトに検索エンジンが入って感動しました。
これでcloudflare等でブログをホストしても十分に必要な機能がホストできるように思えます。
