---
uuid: 3eca6f16-95ec-4df2-b232-309b38b28fea
title: Summary of next.config.js Settings
description: When using Next.js, you often customize settings with next.config.js. This article summarizes what can be configured in next.config.js and how to set it up.
lang: en
category: techblog
tags:
  - frontend
  - next.js
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

When using Next.js, you often customize settings with next.config.js. This article summarizes what can be configured in next.config.js and how to set it up.

## Basics

```javascript title=next.config.js
module.exports = {}
```

Export the config as an object like above.

## reactStrictMode

Enables Strict Mode, which is nice.

## redirect

You can configure redirects. Define a `redirects` function that returns an array of redirect configurations.

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

Changes where JavaScript and CSS are loaded from. By default, it loads from `/_next/static/`, but in the example below, it loads from `https://cdn.mydomain.com/_next/static/`.

```javascript title=next.config.js
module.exports = {
  // Use the CDN in production and localhost for development.
  assetPrefix: 'https://cdn.mydomain.com',
}
```

- [CDN Support with Asset Prefix](https://nextjs.org/docs/api-reference/next.config.js/cdn-support-with-asset-prefix)

## publicRuntimeConfig, serverRuntimeConfig

By using `getConfig`, you can define variables to use in pages and components. The two types differ as follows:

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

This can also be used when using paths other than root (`/`). For example, if you set `basePath` in `publicRuntimeConfig`, you can define a `Link` component as follows:

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

You can configure webpack similar to `webpack.config.js`. The `config` parameter works like webpack's `config` object.

Updating `Next.js` to version `11.0.0` makes `webpack5` the default. This can be configured by setting `webpack5` to a boolean value. Also, starting from webpack5, you can set aliases manually.

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

When switching to webpack5, I was stuck on this error:

```
error - ./node_modules/fs.realpath/index.js:8:0
Module not found: Can't resolve 'fs'
```

Following [this issue](https://github.com/webpack-contrib/css-loader/issues/447#issuecomment-761853289), I set:

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

and it was fixed. However, looking at the [webpack5 documentation](https://webpack.js.org/configuration/resolve/#resolvefallback), the `fallback` feature is:

> Redirect module requests when normal resolving fails.

So it might just be preventing the module from loading. Since `next build` works, it's probably fine, but using `target: 'node'` might be a more appropriate solution.
