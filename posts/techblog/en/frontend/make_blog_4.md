---
uuid: ac895f1e-9e84-4d68-aa1c-229d69fa4db8
title: Making MDX AMP-Compatible with a Custom Loader in Next.js
description: I had a blog on WordPress, but the performance was slow, so I rebuilt it with Next.js. This article is about creating a custom loader for rendering MDX to make it AMP-compatible.
lang: en
category: techblog
tags:
  - frontend
  - development
  - next.js
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Markdown and MDX files use tags like `<img>` by default. Furthermore, they can't handle mathematical formula rendering or code syntax highlighting under AMP. So by creating a custom MDX loader, we can make them AMP-compatible.

For details on custom loaders, the [MDX official documentation](https://mdxjs.com/guides/custom-loader) is a good resource.

## AMP Compatibility Using JSX

The MDX format supports JSX. And there are AMP components for JSX. So to make things AMP-compatible, we just need to transform each default tag (like `img`) into its corresponding AMP component (like `<amp-img ... />`).

### Basics

In the AST, JSX syntax is represented as follows:

```yaml
type: "jsx"
value: "<button>push!!!!</button>"
position: ...
```

So when we find a node containing a certain tag, we just need to transform it into a JSX node with the corresponding AMP component embedded in its value.

### Mathematical Formulas

The AMP tag for rendering formulas is `<amp-mathml>`. For inline formulas, `<amp-mathml inline>` makes it inline.

Using `remark-math`, portions enclosed in `$$` are converted to `math` and those enclosed in `$` to `inlineMath`. So we transform `math` to `<amp-mathml>` and `inlineMath` to `<amp-mathml inline>`.

```js:toAmpMathml.js
const visit = require("unist-util-visit");

module.exports = toMathml;

function toMathml() {
  return transformer;

  function transformToJsxNode(parent, index, value, position) {
    const newNode = {
      type: "jsx",
      value: value,
      position: position,
    };

    parent.children[index] = newNode;
  }

  function transformer(ast) {
    visit(ast, "math", mathVisitor);
    function mathVisitor(node, index, parent) {
      const value = `<amp-mathml layout="container" data-formula="\\[${node.value}\\]" />`;
      transformToJsxNode(parent, index, value, node.position);
    }

    visit(ast, "inlineMath", inlineMathVistor);
    function inlineMathVistor(node, index, parent) {
      const value = `<amp-mathml
                            layout="container"
                            inline
                            data-formula="\\[${node.value}\\]"
                            />`;
      transformToJsxNode(parent, index, value, node.position);
    }
  }
}
```

- [amp-mathml](https://amp.dev/documentation/components/amp-mathml/)

### img

Formula conversion was straightforward since it's just a simple transformation. However, the AMP component corresponding to the `img` tag is `<amp-img />`, which requires `width` and `height` attributes. One workaround is to resize via CSS ([reference](https://qiita.com/narikei/items/50c0c805846c0bd69423)), but you need to fix either width or height, and the fixed dimension pulls the layout, sometimes creating unnatural whitespace above and below images on mobile.

This time, since MDX parsing happens on the server side anyway, I decided to use a Node module to get the actual image size and set the dimensions properly.

The `image-size` package makes it easy to get dimensions. Getting sizes from URLs is a bit tricky because you can't use async processing. If you do, the width and height only become available after parsing is complete. I don't fully understand the details, but I solved it by using `sync-request`, a module that makes synchronous requests.

**Note**
However, `sync-request` is apparently deprecated ([reference](https://designetwork.daichi703n.com/entry/2017/02/21/node-then-request)), so use it at your own risk. The issue is that the client side can become crash-prone, but since it only runs during builds, I'd like to think it's not a problem. It might become an issue if you start using `dynamic import`.

```js
const visit = require("unist-util-visit");
const p = require("path");
const sizeOf = require("image-size");

// Without sync-request, the request happens after parsing is complete.
const sr = require("sync-request");

module.exports = toAmpImg;

function toAmpImg() {
	return transformer;

	function makeValue(url, alt, dimensions) {
		const width = dimensions.width;
		const height = dimensions.height;
		const value = `<amp-img layout="responsive" src="${url}" alt="${alt}" height="${height}" width="${width}" />`;
		return value;
	}

	function transformToJsxNode(parent, index, value, position) {
		const newNode = {
			type: "jsx",
			value: value,
			postion: position,
		};

		parent.children[index] = newNode;
	}

	function transformer(ast) {
		visit(ast, "image", visitor);
		function visitor(node, index, parent) {
			const url = node.url;
			const alt = node.alt;
			const position = node.position;
			let path = url;

			if (url.startsWith("/")) {
				path = p.join(process.cwd(), "public", url);
				const dimensions = sizeOf(path);
				const value = makeValue(url, alt, dimensions);

				transformToJsxNode(parent, index, value, position);
			} else if (url.startsWith("http") || url.startsWith("ftp")) {
				const res = sr("GET", url);
				const buf = Buffer.from(res.getBody());
				const dimensions = sizeOf(buf);
				const value = makeValue(url, alt, dimensions);

				transformToJsxNode(parent, index, value, position);
			}
		}
	}
}
```

- [amp-img](https://amp.dev/ja/documentation/components/amp-img/)
- [image-size](https://www.npmjs.com/package/image-size)
- [sync-request](https://www.npmjs.com/package/sync-request)

### Syntax Highlighting

This simply does the tokenization (normally done by prismjs) on the custom loader side. Register the languages you want to use with refractor.register. For this, I used the code from [amdx](https://github.com/mizchi/amdx) as-is. I've thoroughly studied this repository. Thank you very much.

```js
const visit = require("unist-util-visit");

module.exports = highlighter;

// @ts-ignore
const refractor = require("refractor/core.js");

refractor.register(require("refractor/lang/javascript.js"));

function highlighter() {
	return (tree) => {
		visit(tree, "code", (node) => {
			const [lang] = (node.lang || "").split(":");
			if (lang) {
				node.lang = lang;
				if (!refractor.registered(lang)) {
					return;
				}
				if (node.data == null) {
					node.data = {};
				}
				node.data.hChildren = refractor.highlight(node.value, lang);
			}
		});
	};
}
```

- [amdx](https://github.com/mizchi/amdx)
