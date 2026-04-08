---
uuid: 178a4f3e-b473-446f-9bdb-242b671656cc
title: Making a Next.js Blog Support AMP and PWA
description: I made my AMP-only blog built with Next.js also support PWA.
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

When it comes to PWA support for Next.js, [next-offline](https://github.com/hanford/next-offline) and [next-pwa](https://github.com/shadowwalker/next-pwa) are well-known options. However, caching AMP pages is not supported by default in these packages, so you need to handle it yourself ([related issue](https://github.com/shadowwalker/next-pwa/issues/65)). I spent a lot of time trying various things with these two packages and could never get PWA working, so if you're trying to support both AMP and PWA simultaneously, be careful.

That said, most of the work is just copying from [example/amp-first](https://github.com/vercel/next.js/tree/ebd1434a847bb086d13fe4e6671b3b9f482e32c6/examples/amp-first)...

## Preparing the public Folder

### manifest.json

First, prepare a manifest.json. You can create it however you like, but the following are required ([reference](https://web.dev/installable-manifest/?utm_source=lighthouse&utm_medium=lr)). Since preparing icons is tedious, I used [PWA manifest generator](https://www.simicart.com/manifest-generator.html/).

- `start_url`
- `name` or `shortname`
- `icons` (192 - 512 px)
- `display`

Also, the icons need to be maskable, so after converting them with [Maskable.app Editor](https://maskable.app/editor), add `"purpose": "any maskable"` to the icon properties.

Here's what this site's manifest.json looks like:

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

It's faster to check [here](https://web.dev/apple-touch-icon/?utm_source=lighthouse&utm_medium=lr), but add the following to the header of the page you want to make PWA-compatible:

```jsx
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />;
```

The icon size needs to be 192x192 or 180x180.

### serviceworker.js

Copy [examples/amp-first/public/serviceworker.js](https://github.com/vercel/next.js/blob/ebd1434a847bb086d13fe4e6671b3b9f482e32c6/examples/amp-first/public/serviceworker.js) and place it in `public`. It's basically [amp-sw](https://github.com/ampproject/amp-sw).

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

### Registering the Service Worker

Copy [examples/amp-first/public/install-serviceworker.html](https://github.com/vercel/next.js/blob/ebd1434a847bb086d13fe4e6671b3b9f482e32c6/examples/amp-first/public/install-serviceworker.html) and place it in public.

```html title=install-serviceworker.html
<!DOCTYPE html>
<title>installing service worker</title>
<script type="text/javascript">
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker.js')
  }
</script>
```

### Installing the Service Worker on PWA-Compatible Pages

In AMP, service worker installation can be done with [amp-install-serviceworker](https://amp.dev/documentation/examples/components/amp-install-serviceworker/).

Add the following to the body of the component you want to make PWA-compatible:

```jsx
<amp-install-serviceworker
	src="/serviceworker.js"
	data-iframe-src="/install-serviceworker.html"
	layout="nodisplay"
/>;
```

### Creating the Offline Page

I don't fully understand this yet and may look into it later, but the amp-first example includes an offline page. Let's just copy and place it. It's probably for the service worker's offlinePageOption.

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

## Results

With the above, PWA support is complete. Here's the Lighthouse performance for this site's top page as of 2020/09/30:

![lighthouse-next-blog](../../public/lighthouse-nextblog-top.PNG)

For comparison, here's what it looked like during the WordPress era, so you can see significant improvement. Getting all 100s is tough...

![lighthouse-wordpress-top](../../public//lighthouse-wordpress-top.PNG)
