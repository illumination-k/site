---
uuid: 364f008f-fec9-4d56-b78d-48848c42e17f
title: MDX or Markdown ?
description: ブログ記事を書くのに、MDXを使うのか、Markdownを使うのか
lang: ja
category: techblog
tags:
  - frontend
  - development
  - next.js
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Next.jsを使ってブログを書く際に、Next.jsはmdxフォーマットをサポートしている[@next/mdx](https://github.com/vercel/next.js/tree/canary/packages/next-mdx)があります。

mdxの特徴として、

1. Markdown内でJSXがかける
2. 外部のコンポーネントをimportできる
3. 内部の変数などをexportできる

というものがあります。しかし、ブログ記事を書くだけならこれらの機能はオーバースペックに見えます。

記事書くだけならそんなに拡張性はいらない気がします。なので、今回は記事を書くときに`mdx`を採用しなかった理由について書きます。
簡単にまとめると、以下です。

1. `Next.js`の`dynamic import`が動かなかったので、メタデータのexportができない。
2. VSCodeの拡張の補完がMarkdownと比べてかなり弱い。

これらの理由は単純に発展途上であることに起因する問題なので、これ以後の流行りによっては改善されていくと期待されます。しかし、現時点では問題です。

なので、このブログでは`md`拡張子を使って記事を書き、レンダリングする際に`mdx`へと変換しています。また、`export`の代わりにfrontmatterを使うことでメタデータを表現しています。

### mdxのデメリット

個人的にブログ書くときにmdxを使う際に不安だったのが、

```jsx
import snowfallData from './snowfall.json'
import BarChart from './charts/BarChart'
# Recent snowfall trends
2019 has been a particularly snowy year when compared to the last decade.
<BarChart data={snowfallData} />
```

上のようなコードです。サイトなどを作る際にはすごく便利に見えます。しかし、記事のテンプレートとしての統一がしにくくて、`<BarChart>`とかをもし変更してしまうと割と容易にエラーが出たりしそうでちょっといやだなーという感じでした。

また、もう1つの理由が、`mdx`は、

```jsx
export meta = {
    title: "new Blog!"
}
```

みたいなことができます。しかし、`dynamic import`するとうまくexportされたメタデータを取得できませんでした。
いろんなブログとか見たんですけど、exampleが下の感じで、

```jsx
const meta = dynamic(() => import(`../_posts/${filename}`)).then((m) => m.meta);
```

見た目いけそうなんですけど、実際にはエラーが起こってうまく動かない。なので、記事用のコンポーネントとして切り出すときにexportなどが使えないので日付やタイトルなどのメタデータを扱いにくいという問題点があります。

また、記事を書くときに不満なのが、VSCodeのmdx向けの拡張です。markdownならVSCodeのExtensionとかが充実しているので、補完やlintなども効いて生産効率が非常に高いです。しかし、mdxは補完がまだまだかなーという印象を受けました。

なので、ブログ記事はできるだけ純粋なMarkdownで書けるようにしたいです。

### mdxのメリット

Next.jsでmdxを使うメリットとして、Next.jsのmdxに関するレンダリングシステムが挙げられます。Next.jsでは、mdxを`pages/posts/hoge.mdx`におくと`localhost:3000/posts/hoge`にmdxがページとしてレンダリングされます。また、`remark`とか`rehype`系のプラグインを`next.config.js`に書くだけでMdxに対して適用できます。

とはいえ、これらのシステムはMarkdownにもNext.jsで適用できます。つまり、`next.config.js`に`remark`, `rehype`プラグインを書くだけでMarkdownを容易に拡張でき、ページとしてレンダリングできます。そのためにやることはシンプルで、`next.config.js`内の`pageExtensions`に`.md`を加えるだけです。

例えば、以下のような感じで、コードシンタクスとかkatexとかに対応でき、Markdownをレンダリングできます([参考](https://blog.hellorusk.net/posts/20191209))

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

もしMarkdownを自前でレンダリングするなら、`react-markdown`を使ったり、remarkとrehypeでパースしたHTMLを`dangerousInnerHTML`で埋め込むことになります。それに比べると、`@next/mdx`を利用するのが非常に楽な方法だという印象を受けました。

## レンダリングする方法

Markdownをレンダリングする方法を一番素直に考えると、以下のようなコードが想定されます。`[postId].jsx`的な感じです。contentLoaderは名前で察してくれるとありがたいです。

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

`getStaticPaths`で`fs`モジュールを使ってmarkdownファイルの一覧を取得します。その後、`getStaticProps`でファイルの場所に戻して、ついでにメタデータをとってきて、そのパスに対応するmarkdownファイルと、Layoutにメタデータを渡します。
このときにLayoutもメタデータで指定したいなら、

```yaml
layout:
    path: /path/to/Layout.tsx
    component: Layout
```

みたいなメタデータを作って`dynamic`を使えばそれも実現できます。
もはや大体これでいいじゃん、って思ったのですが、サイドバーが作れない。headerをうまくとってきてそれを元にサイドバーが作りたい。

そこで考えたのが、remarkのcustom loaderを作る方法です。
`remark-mdx`を使うと、だいたい下のmdxファイルは以下のようにパースされます。

ただのfrontmatter付きのマークダウンファイルは以下のような感じでMDASTに変換されます。

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

`remark-frontmatter`を使うと、frontmatter部分は`type === yaml`のchildrenとして取得できるようになります。また、header部分は`type === headings`を探せば取得できます。つまり、MDASTをparseしてfrontmatter部分とheaderをmetadataとして取得できます。
そして、layoutで指定されたコンポーネントを行頭でimportし、メタデータをexportし、importしたコンポーネントをexportします。

つまり、上のようなfrontmatter付きのMarkdownを

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

こうすれば、markdownファイルを置くだけでカスタムコンポーネント付きのmdxに解釈されてレンダリングされるようになります。

さらにheaderの情報を含んだmetadataをコンポーネントが受け取れるので、sidebarやtocをJSX側で作ることができます。リファクタリングがしたくなれば、ほとんどカスタムローダー側を触れば解決しそうなところもいけてる気がします。あとこの方法のメリットは突如として

```jsx
<button>Push!!!!!!!</button>;
```

とか入れたくなったときに入れられることです。パースは`mdx`に準拠してやってるので、突然mdxフォーマットで書いても自動で対応されます。

個人的にいい案だろって思ってるんですが、誰もこんなアプローチとってないので少し不安だったりします。なんか問題があるのだろうか（もっといい案が知りたい）。
