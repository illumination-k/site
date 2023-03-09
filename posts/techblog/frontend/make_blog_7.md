---
uuid: 178a4f3e-b473-446f-9bdb-242b671656cc
title: Next.jsで作ったブログをAMPとPWAに対応させる
description: Next.jsで作ったAMPオンリーのブログをPWAにも対応させてみた。
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

Next.jsのPWA対応というと[next-offline](https://github.com/hanford/next-offline)とか[next-pwa](https://github.com/shadowwalker/next-pwa)が有名かと思います。しかし、AMPページのキャッシュはこれらがデフォルトで対応していないので、自前でやる必要があります([参考issue](https://github.com/shadowwalker/next-pwa/issues/65))。自分はこの2つのパッケージを使って色々やってて永遠にPWA対応できなかったので、AMPと同時に対応しようとしている人は注意が必要です。

とはいえ、やることはほとんど[example/amp-first](https://github.com/vercel/next.js/tree/ebd1434a847bb086d13fe4e6671b3b9f482e32c6/examples/amp-first)をコピペするだけなのですが...。

## publicフォルダの準備

### manifest.json

まず、manifest.jsonを用意します。何で用意してもいいですが、必要なものとして以下が挙げられます([参考](https://web.dev/installable-manifest/?utm_source=lighthouse&utm_medium=lr))。iconとか用意するのはめんどうなので、[PWA manifest generator](https://www.simicart.com/manifest-generator.html/)を使いました。

- `start_url`
- `name` or `shortname`
- `icons` (192 - 512 px)
- `display`

また、このiconはmaskableである必要があるので、[Maskable.app Editor](https://maskable.app/editor)で変換した後、`"purpose": "any maskable"`をiconのプロパティに足します。

とりあえずこのサイトのmanifest.jsonは以下のような感じです。

```json title=manifest.json
{
    "name": "illumination-k dev",
    "theme_color": "#f69435",
    "background_color": "#f69435",
    "display": "standalone",
    "start_url": "/",
    "icons": [
        {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/icons/icon-256x256.png",
            "sizes": "256x256",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/icons/icon-384x384.png",
            "sizes": "384x384",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        }
    ],
    "short_name": "ik.dev",
    "description": "Homepage of illumination-k"
}
```

### apple touch icon

[ここ](https://web.dev/apple-touch-icon/?utm_source=lighthouse&utm_medium=lr)を見てもらったほうが早いですが、PWA対応したいページのヘッダーに

```jsx
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />;
```

を加えておきます。アイコンのサイズは192x192か180x180である必要があります。

### serviceworker.js

[examples/amp-first/public/serviceworker.js](https://github.com/vercel/next.js/blob/ebd1434a847bb086d13fe4e6671b3b9f482e32c6/examples/amp-first/public/serviceworker.js)をコピペして`public`に置きます。たぶん、だいたい[amp-sw](https://github.com/ampproject/amp-sw)です。

```js title=serviceworker.js
/* global importScripts, AMP_SW */
importScripts('https://cdn.ampproject.org/sw/amp-sw.js')

/*
  This configures the AMP service worker to enhance network resiliency and
  optimizes asset caching. This configuration will:
  - Cache AMP scripts with a stale-while-revalidate strategy for a longer duration
    than the default http response headers indicate.
  - Cache valid visited AMP documents, and serve only in case of flaky network conditions.
  - Cache and serve an offline page.
  - Serve static assets with a cache first strategy.
  Checkout https://github.com/ampproject/amp-sw/ to learn more about how to configure
  asset caching and link prefetching.
*/
AMP_SW.init({
  assetCachingOptions: [
    {
      regexp: /\.(png|jpg|woff2|woff|css|js)/,
      cachingStrategy: 'CACHE_FIRST', // options are NETWORK_FIRST | CACHE_FIRST | STALE_WHILE_REVALIDATE
    },
  ],
  offlinePageOptions: {
    url: '/offline',
    assets: [],
  },
})
```

### serviceworkerのregister

[examples/amp-first/public/install-serviceworker.html](https://github.com/vercel/next.js/blob/ebd1434a847bb086d13fe4e6671b3b9f482e32c6/examples/amp-first/public/install-serviceworker.html)をコピペしてpublicに置きます。

```html title=install-serviceworker.html
<!DOCTYPE html>
<title>installing service worker</title>
<script type="text/javascript">
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker.js')
  }
</script>
```

### PWA対応したいページでserviceworkerをインストールする

ampではserviceworkerのインストールは[amp-install-serviceworker](https://amp.dev/documentation/examples/components/amp-install-serviceworker/)で行えます。

PWA対応したいコンポーネントのbodyに以下を入れます。

```jsx
<amp-install-serviceworker
  src="/serviceworker.js"
  data-iframe-src="/install-serviceworker.html"
  layout="nodisplay"
/>;
```

### offlineページの作成

これよくわかってないので後で調べるかもしれませんが、amp-firstの例ではofflineページが準備されています。コピペして置いておきましょう。serviceworkerのofflinePageOptionなんでしょう。

```jsx title=offline.js
import Layout from '../components/Layout'

export const config = { amp: true }

const Home = () => (
  <Layout>
    <h1>Offline</h1>
    <p>Please try again later.</p>
  </Layout>
)

export default Home
```

## 結果

以上でPWA対応は完了です。当サイトtopの2020/09/30現在のlighthouse performanceです。

![lighthouse-next-blog](/images/lighthouse-nextblog-top.PNG)

ちなみにWordpress時代はこんなんなので、非常に成長していると言えるでしょう。all 100は難しいですね...。

![lighthouse-wordpress-top](/images/lighthouse-wordpress-top.PNG)
