---
uuid: 3eca6f16-95ec-4df2-b232-309b38b28fea
title: next.config.jsで設定することのまとめ
description: next.jsを使っているとnext.config.jsを使って設定をカスタマイズすることが多いです。next.config.jsで設定できることと、その設定の仕方についてまとめておきます。
lang: ja
category: techblog
tags:
  - frontend
  - next.js
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

next.jsを使っているとnext.config.jsを使って設定をカスタマイズすることが多いです。next.config.jsで設定できることと、その設定の仕方についてまとめておきます。

## 基本

```javascript title=next.config.js
module.exports = {}
```

のようにconfigをオブジェクト形式でエクスポートする。

## reactStrictMode

Strict Modeを使用でき、嬉しい。

## redirect

リダイレクトの設定をかける。`redirects`関数を定義して、設定を書いた配列を返す。

```javascript title=next.config.js
module.exports = {
    async redirects() {
        return [
            {
                source: "/test",
                destination: "/",
                permanent: true,
            }
        ]
    }
}
```

## assetPrefix

JavaScriptとCSSを読み込む先を変える。DEFAULTでは、`/_next/static/`を読みに行くが、以下の例では、`https://cdn.mydomain.com/_next/static/`を読み込みにいく。

```javascript title=next.config.js
module.exports = {
  // Use the CDN in production and localhost for development.
  assetPrefix: 'https://cdn.mydomain.com',
}
```

- [CDN Support with Asset Prefix](https://nextjs.org/docs/api-reference/next.config.js/cdn-support-with-asset-prefix)

## publicRuntimeConfig, serverRuntimeConfig

`getConfig`を使うことで、ページやコンポーネントで使いたい変数を定義できる。2種類の使い分けは以下。

- publicRuntimeConfig: Server or Client
- serverRuntimeConfig: Server only

```javascript title=next.config.js
module.exports = {
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: 'secret',
    secondSecret: process.env.SECOND_SECRET, // Pass through env variables
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: '/static',
  },
}
```

root (`/`) 以外のパスを使うときなどにも使用できる。例えば、`basePath`を`publicRuntimeConfig`で設定すれば、以下のように`Link`コンポーネントを定義できる。

```jsx:title:Link.tsx
import NextLink, { LinkProps } from 'next/link'
import { format } from 'url'
import getConfig from 'next/config'

const { publicRuntimeConfig } = getConfig()

const Link: React.FunctionComponent<LinkProps> = ({ children, ...props }) => (
  <NextLink
    {...props}
    as={`${publicRuntimeConfig.basePath || ''}${format(props.href)}`}
  >
    {children}
  </NextLink>
)

export default Link
```

- [Runtime Configuration](https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration)
- [Deploy your NextJS Application on a different base path (i.e. not root)](https://levelup.gitconnected.com/deploy-your-nextjs-application-on-a-different-base-path-i-e-not-root-1c4d210cce8a)

## webpack

webpackの`webpack.config.js`的な話ができる。`config`が`webpack`の`config`オブジェクトのような感じ。

`Next.js`のversionを`11.0.0`にすると`webpack5`が基本的に使われるようになる。この辺は`webpack5`に真偽値を入れることで設定できる。
また、webpack5からエイリアスが自前で設定できるようになっている。

```javascript title=next.config.js
module.export = {
    webpack(config, options) {
      config.resolve.alias['@component'] = path.join(__dirname, "component");
      config.resolve.alias['@libs'] = path.join(__dirname, "libs");
      config.resolve.fallback = {"fs": false};
      return config
    },

    webpack5: true,
}
```

webpack5にしたとき、

```
error - ./node_modules/fs.realpath/index.js:8:0
Module not found: Can't resolve 'fs'
```

というエラーが出て困っていたが、[このissue](https://github.com/webpack-contrib/css-loader/issues/447#issuecomment-761853289)のとおりに

```js
module.exports = {
    ...
    resolve: {
        fallback: {
            ...config.resolve.fallback,
            "fs": false
        },
    }
}
```

にしたら治った。治ったが、[webpack5のドキュメント](https://webpack.js.org/configuration/resolve/#resolvefallback)読むと`fallback`の機能は

> Redirect module requests when normal resolving fails.

なので、読み込まないようにしているだけの可能性がある。`next build`は動くので多分大丈夫問題ないと思われるが、`target: 'node'`とかを使った方が妥当な可能性もある。
