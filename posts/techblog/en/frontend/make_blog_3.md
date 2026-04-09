---
uuid: f3530c63-09a6-46da-bd19-c81f7241620b
title: Applying Styles to a Next.js Blog
description: I had a blog on WordPress, but the performance was slow, so I rebuilt it with Next.js. Now that markdown rendering works, it's time to apply styles.
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

In the previous article, I got markdown rendering working properly, so the next step is applying styles. As mentioned in the first article, the targets are:

- material-ui
- Code syntax highlighting with Prism.js
- Mathematical formulas with amp-mathml
- GitHub markdown CSS

Making these AMP-compatible is the real challenge.

## Applying Styles

### Prism.js && GitHub Markdown CSS

Download the CSS from the [prism.js](https://prismjs.com) official site. Download from [github-markdown-css](https://github.com/sindresorhus/github-markdown-css). Since `github-markdown-css` is auto-generated and uses `!important`, which isn't AMP-compatible, we remove those parts.

Starting with Next.js 12, loading CSS in `_document.js` now throws an error.
As a workaround, I'm currently saving CSS as JavaScript strings, importing them in components, and expressing them via styled-jsx.

```js title=css.js
export const css = `
  css
`
```

Create a file like the above, then:

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

Import it in the component and pass it directly to styled-jsx. This approach works for now.

:::details[2021/07/01 revision - Next.js v11]

When using webpack5, you can implement `raw-loader` functionality using `asset modules`. First, write the configuration in `next.config.js`. Since we're doing full AMP, we don't expect CSS to be imported normally.

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

This allows you to load CSS files like `raw-loader` would.

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

:::details[2020/9/7 Implementation using raw-loader]

After that, use raw-loader to import CSS in _app.tsx and embed it directly. Ideally, I'd want to load it only on Markdown pages, but...

It has some material-ui elements mixed in, but `_document.js` looks like this:

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

By using [refractor](https://github.com/wooorm/refractor) in the custom loader to tokenize code, syntax highlighting works even with AMP. Due to ordering issues, the dark theme for prismjs didn't render properly, so I set the background to black in `github-markdown-css` instead.

**example**

```rust
const MOD: usize = 1e9 as usize + 7;
```

```python
>>> import pandas as pd
>>> pd.read_csv("/path/to/file.csv")
```

### amp-mathml

KaTeX is not AMP-compatible.

Instead, first use `remark-math` to convert formulas into `math` and `inlineMath` nodes. Then use the custom loader to embed amp-mathml for `type === "math"` and `type === "inlineMath"`. Note that inline formulas are children of paragraph nodes.

**example**

Inline $\frac{a}{b}$ formula

A regular formula:

$$
\sum_{k=1}^{n}{\frac{N}{k}} = O(N\log{n})
$$

### material-ui

**2021/09/23**

```bash
yarn add @mui/material @mui/styles @mui/lab @mui/icons-material @emotion/react @emotion/styled @emotion/server
```

The Material-UI version has been updated, requiring various configuration changes. Since it's Emotion-based, you need to be careful when making it AMP-compatible. Apparently, using `extractCriticalToChunks` from `@emotion/server` is important ([reference](https://spectrum.chat/emotion/development/emotion-with-amp-pages~710d31dc-1cec-4f38-b39a-6a4110a03859)).

The reason is that when server-side rendering with `next.js`, CSS loading can sometimes get reset ([reference](https://blog.narumium.net/2020/01/29/next-js-with-material-uiでスタイルが崩れる/)). This actually happened on my site and cost me quite a bit of time.
Fortunately, the material-ui team provides official template examples ([JavaScript](https://github.com/mui-org/material-ui/tree/master/examples/nextjs), [TypeScript](https://github.com/mui-org/material-ui/tree/master/examples/nextjs-with-typescript)). Using these as reference, update `_app.tsx` and `_document.tsx`. Also, there can be className issues between Next.js links and Material-UI links, so create a Link component.

Note that components using `!important` cannot be used.

## Impressions

That's how style application went. However, material-ui requires quite a bit of CSS-like work, which is pretty challenging. Bootstrap handled most things automatically, so my CSS skills are truly lacking.
