---
uuid: 364f008f-fec9-4d56-b78d-48848c42e17f
title: MDX or Markdown?
description: Should you use MDX or Markdown for writing blog articles?
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

When writing a blog with Next.js, there's [@next/mdx](https://github.com/vercel/next.js/tree/canary/packages/next-mdx), which supports the MDX format.

The key features of MDX are:

1. You can write JSX within Markdown
2. You can import external components
3. You can export internal variables

However, for just writing blog articles, these features seem like overkill.

For writing articles alone, you probably don't need that much extensibility. So this time, I'll explain why I chose not to use `mdx` for writing articles.
In short, the reasons are:

1. `Next.js`'s `dynamic import` didn't work, making metadata export impossible.
2. VSCode extension support for MDX is significantly weaker compared to Markdown.

These issues stem from MDX simply being still in development, so they're expected to improve over time depending on adoption trends. However, they're problems right now.

So for this blog, articles are written with the `.md` extension, and converted to `mdx` at render time. Also, instead of `export`, frontmatter is used to express metadata.

### Downsides of MDX

What personally concerned me about using MDX for blogging was code like this:

```jsx
import snowfallData from './snowfall.json'
import BarChart from './charts/BarChart'
# Recent snowfall trends
2019 has been a particularly snowy year when compared to the last decade.
<BarChart data={snowfallData} />
```

This looks very convenient for building sites. However, it makes it hard to maintain template consistency for articles, and changing something like `<BarChart>` could easily cause errors, which felt undesirable.

Another reason is that `mdx` supports things like:

```jsx
export meta = {
    title: "new Blog!"
}
```

However, when using `dynamic import`, the exported metadata couldn't be retrieved properly.
I looked at various blogs and the examples looked like this:

```jsx
const meta = dynamic(() => import(`../_posts/${filename}`)).then((m) => m.meta);
```

It looks like it should work, but in practice it throws errors and doesn't work. So when extracting articles as components, you can't use export, which makes it difficult to handle metadata like dates and titles.

Also, what's frustrating when writing articles is VSCode's MDX extension support. For Markdown, VSCode extensions are well-developed, so you get great completion and linting, making productivity very high. However, MDX completion still felt lacking.

So I want to write blog articles in pure Markdown as much as possible.

### Benefits of MDX

One benefit of using MDX with Next.js is Next.js's MDX rendering system. In Next.js, placing an MDX file at `pages/posts/hoge.mdx` renders it as a page at `localhost:3000/posts/hoge`. Also, `remark` and `rehype` plugins can be applied to MDX just by writing them in `next.config.js`.

That said, these systems can also be applied to Markdown in Next.js. In other words, just by writing `remark` and `rehype` plugins in `next.config.js`, you can easily extend Markdown and render it as pages. All you need to do is add `.md` to `pageExtensions` in `next.config.js`.

For example, you can support code syntax, KaTeX, and render Markdown like this ([reference](https://blog.hellorusk.net/posts/20191209)):

```js title=next.config.js
// remark plugins
const remarkMath = require('remark-math')
const remarkFrontmatter = require('remark-frontmatter')
const remarkSlug = require("remark-slug");
const remarkHeadings = require('remark-autolink-headings')
const remarkFootnotes = require('remark-footnotes')

// rehype plugins
const rehypeKatex = require('rehype-katex')
const rehypePrism = require('@mapbox/rehype-prism')

const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      remarkFrontmatter, remarkSlug, remarkHeadings, remarkFootnotes, remarkMath],
    rehypePlugins: [rehypeKatex, rehypePrism],
  }
})

module.exports = withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx']
})
```

If you were to render Markdown yourself, you'd use `react-markdown` or embed HTML parsed with remark and rehype via `dangerousInnerHTML`. In comparison, using `@next/mdx` felt like a much easier approach.

## How to Render

The most straightforward way to render Markdown would look like the following code. Think of it as something like `[postId].jsx`. Please infer what contentLoader does from its name.

```jsx
import next/dynamic;
import Layout from "../components/Layout";
import {
    getFilePath,
    getFileMeta,
    getMdNames,
} from "../lib/contentLoader"

const BlogPostPage = ({filename, meta}) => {
    const MDContent = dynamic(() => import(`../post/${filename}`))
    return (
        <Layout meta={meta}>
            <MDContent />
        </Layout>
    )
}

export async function getStaticProps({ params} ) {
    const filename = params.postId + ".md"
    const filepath = await getFilePath(filename);
    const meta = await getFileMeta(filepath);
    return {
        props: {
            filename: filename,
            meta: meta,
        }
    }
}

export async function getStaticPaths() {
    const mdNames = await getMdNames();
    const paths = mdNames.map((mdName) => ({
        params: {
            postId: mdName
        }
    }));

    return {
        paths,
        fallback: false,
    }
}
```

In `getStaticPaths`, we use the `fs` module to get a list of markdown files. Then in `getStaticProps`, we resolve the file path, grab the metadata, and pass the corresponding markdown file and metadata to the Layout.
If you also want to specify the Layout via metadata, you could create metadata like:

```yaml
layout:
    path: /path/to/Layout.tsx
    component: Layout
```

and use `dynamic` to achieve that as well.
At this point I thought, "This is basically all we need," but I couldn't create a sidebar. I wanted to extract headers and build a sidebar from them.

So the approach I came up with was creating a custom remark loader.
Using `remark-mdx`, a Markdown file is parsed roughly as follows.

A simple Markdown file with frontmatter is converted to an MDAST like this:

```md
---
title: A
date: a/a/a/a
layout:
    path: ../../components/Layout
    component: Layout
---

# a

## aa

### aaa
```

Using `remark-frontmatter`, the frontmatter part becomes accessible as children with `type === yaml`. Also, headers can be found by looking for `type === headings`. In other words, by parsing the MDAST, you can extract the frontmatter and headers as metadata.
Then, import the component specified in layout at the top of the file, export the metadata, and export the imported component.

In other words, we transform frontmatter-containing Markdown like above into:

```jsx
import Layout from "../../components/Layout"

export const meta = {
    title: "A",
    date: "a/a/a/a",
    headers: [
        {
            value: "a",
            depth: 1,
        },
        {
            value: "aa",
            depth: 2
        },
        {
            value: "aaa",
            depth: 3,
        }
    ]
}

export default ({meta, children}) => <Layout meta={meta} children={children} />

# a

## aa

### aaa
```

This way, just by placing a markdown file, it gets interpreted as MDX with a custom component and rendered.

Furthermore, since the component receives metadata that includes header information, you can build sidebars and table of contents on the JSX side. If refactoring is needed, it seems like most changes can be handled on the custom loader side, which feels elegant. Another benefit of this approach is that if you suddenly want to add something like:

```jsx
<button>Push!!!!!!!</button>;
```

you can just do it. Since parsing follows the `mdx` spec, writing in MDX format will be automatically supported.

I personally think this is a great approach, but since nobody else seems to take this approach, I'm a little worried. Maybe there's some issue I'm not seeing (I'd love to know if there's a better approach).
