---
uuid: f3530c63-09a6-46da-bd19-c81f7241620b
title: Next.jsで作ったブログにStyleを適用していく
description: Wordpressでブログを作っていたが、パフォーマンスが遅いのでNext.jsで作り直した。markdwonでレンダリングできるようになったので、Styleを適用していく。
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

前回の記事で、markdown をうまくレンダリングできるようになったので、次は Style を適用していく。適用すべき対象は、最初の記事に書いたように、

- material-ui
- Prism.jsでのcode syntax
- amp-mathmlによる数式
- Github markdown css

である。AMP対応するには鬼門である。

## Styleの適用

### Prism.js && Github markdown css

[prism.js](https://prismjs.com)公式サイトからcssをダウンロードしておく。[github-markdown-css](https://github.com/sindresorhus/github-markdown-css)からダウンロードする。`github-markdown-css`は自動生成なので`!important`とかが使われていてAMPに対応できないのでそのへんは除いてしまう。

Next.js 12になって、`_document.js`でcssをロードすると怒られるようになってしまった。
仕方ないので、現状はcssをjsのstringとして保存しておいて、componentでimportし、sytled-jsxで表現している。

```js title=css.js
export const css = `
  css
`
```

上のようなファイルを作成しておき

```jsx title=component.jsx
import {css} from "css.js"

export default function Component() {
  return (
    <>
      <div>styled</div>
      <style jsx>{css}</style>
    </>
  )
}
```

componentで読み込んで、そのままsytled-jsxに突っ込むことで、一応対応できている。

:::details[2021/07/01改稿 Next.js v11]

webpack5を使っていると`asset modules`を使うことで`raw-loader`の機能が実装できる。まずは`next.config.js`に設定を書く。フルAMPなので、cssをimportすることは想定していない。

```js title=next.config.js
module.exports = {
  webpack(config, options) {
    config.module.rules.push({
      test: /\.css/,
      resourceQuery: /raw/,
      type: 'asset/source'
    })
    return config
  },
}
```

これでcssファイルを`raw-loader`のように読み込める。

```js title=_document.js
import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheets } from "@material-ui/core/styles";

import theme from "@libs/theme";

// @ts-ignore
import css from "../styles/github_markdown.css?raw";
// @ts-ignore
import prismCss from "../styles/prism.css?raw";
// @ts-ignore
import globalCss from "../styles/global.css?raw";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="ja">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with server-side generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
    });

  const initialProps = await Document.getInitialProps(ctx);

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      ...React.Children.toArray(initialProps.styles),
      <style
        key="custom"
        dangerouslySetInnerHTML={{
          __html: `${globalCss}\n${css}\n${prismCss}`,
        }}
      />,
      sheets.getStyleElement(),
    ],
  };
};
```

:::

:::details[2020/9/7 raw-loaderを使った実装]

そのあと、raw-loaderを使ってcssを_app.tsxでimportして、直接埋め込む。できるならMarkdownのページだけで読み込みたいが...

ちょっとmaterial-ui成分も入ってしまっているが、`_document.js`は以下の感じ。

```js title=_document.js
import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheets } from "@material-ui/core/styles";

import theme from "@libs/theme";

// @ts-ignore
import css from "!!raw-loader!../styles/github_markdown.css";
// @ts-ignore
import prismCss from "!!raw-loader!../styles/prism.css";
// @ts-ignore
import globalCss from "!!raw-loader!../styles/global.css";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="ja">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with server-side generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
    });

  const initialProps = await Document.getInitialProps(ctx);

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      ...React.Children.toArray(initialProps.styles),
      <style
        key="custom"
        dangerouslySetInnerHTML={{
          __html: `${globalCss}\n${css}\n${prismCss}`,
        }}
      />,
      sheets.getStyleElement(),
    ],
  };
};
```

:::

custom loaderで[refactor](https://github.com/wooorm/refractor)を使ってcodeをTokenに落とす作業をしておけばAMPでもコードがハイライトされる。順番の関係か、prismjsはダーク系のテーマにしたのに黒くならなかったので、`github-markdown-css`側で背景を黒にしておいた。

**example**

```rust
const MOD: usize = 1e9 as usize + 7;
```

```python
>>> import pandas as pd
>>> pd.read_csv("/path/to/file.csv")
```

### amp-mathml

KatexはAMPに対応できない。

そこで、まず、`remark-math`を使って、`math`と`inlineMath`のノードに変換する。その後、custom loaderを使って、`type === "math"`と`type === "inlineMath"`に対応するamp-mathmlを埋め込む。インラインの数式はparagraphのchildrenなので注意が必要。

**example**

インライン$\frac{a}{b}$数式

普通の数式

$$
\sum_{k=1}^{n}{\frac{N}{k}} = O(N\log{n})
$$

### material-ui

**2021/09/23**

```bash
yarn add @mui/material @mui/styles @mui/lab @mui/icons-material @emotion/react @emotion/styled @emotion/server
```

Material-UIのversionが上がったので、色々設定が必要になった。Emotionベースなので、AMP対応する場合は注意が必要。`@emotion/server`の`extractCriticalToChunks`を使うのが重要らしい([参考](https://spectrum.chat/emotion/development/emotion-with-amp-pages~710d31dc-1cec-4f38-b39a-6a4110a03859))。

というのは、サーバーサイドレンダリングを`next.js`でするときに、CSSの読み込みがリセットされてしまうことがあるらしい([参考](https://blog.narumium.net/2020/01/29/next-js-with-material-uiでスタイルが崩れる/))。実際に自分の画面でも崩れていて、結構時間を溶かした。
幸いなことに、material-uiの公式がテンプレート例を作成してくれている([javascript](https://github.com/mui-org/material-ui/tree/master/examples/nextjs), [typescript](https://github.com/mui-org/material-ui/tree/master/examples/nextjs-with-typescript))。これを参考にしながら`_app.tsx`と`_document.tsx`を書き換えておく。あとnext.jsのリンクとmaterial-uiのリンクもclassNameの問題とかでうまく行かないことがあるので、Linkコンポーネントを作っておく。

`!important`を使用しているコンポーネントは使用できないので注意が必要になる。

## 感想

スタイルの適用はこんな感じ。しかし、material-uiは結構がっつりcssっぽいものを触らないとだめで結構難しい。Bootstrapはだいたいよしなにやってくれていたので、css力が本当に無い。
