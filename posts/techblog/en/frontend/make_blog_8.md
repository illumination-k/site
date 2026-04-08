---
uuid: 0ad74ef3-f869-46e3-aae6-db2825ef5493
title: Using amp-list to Add Random Related Article Suggestions to a Next.js Static Site
description: To add random related articles at the bottom of blog posts (a common blog feature), I implemented an API in Next.js and then used amp-list to dynamically generate them.
lang: en
category: techblog
tags:
  - frontend
  - development
  - next.js
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-08-19T11:42:42+00:00"
---

## TL;DR

I wanted to add random related articles at the bottom of blog posts, which is a common blog feature, but I wasn't sure how to do it on a static site. One approach would be to call `ServersideProps` every time, but I got confused about how to combine that with `getStaticsProps`. I didn't want to do server-side rendering every time since it would make things slower...

So the approach I took was to first implement an API in Next.js, then use `amp-list` to fetch from it and render the results.

## amp-list and amp-mustache

`amp-list` is an AMP extension component that dynamically fetches data from a JSON endpoint and renders it using `amp-mustache` templates.

Here's an example from the official documentation ([amp-list](https://amp.dev/ja/documentation/components/amp-list/), [amp-mustache](https://amp.dev/ja/documentation/components/amp-mustache/)):

```html
<amp-list width="auto"
  height="100"
  layout="fixed-height"
  src="/static/inline-examples/data/amp-list-urls.json">
  <template type="amp-mustache">
    <div class="url-entry">
      <a href="{{url}}">{{title}}</a>
    </div>
</template>
</amp-list>
```

[Official Playground](https://playground.amp.dev/?url=https%3A%2F%2Fpreview.amp.dev%2Fja%2Fdocumentation%2Fcomponents%2Famp-list.example.1.html%3Fformat%3Dwebsites&format=websites)

The JSON being used:

```json
{
  "items": [
    {
      "title": "AMP YouTube Channel",
      "url": "https://www.youtube.com/channel/UCXPBsjgKKG2HqsKBhWA4uQw"
    },
    {
      "title": "AMP.dev",
      "url": "https://amp.dev/"
    },
    {
      "title": "AMP Validator",
      "url": "https://validator.amp.dev/"
    },
    {
      "title": "AMP Playground",
      "url": "https://playground.amp.dev/"
    }
  ]
}
```

Basically, you specify the layout and endpoint within `<amp-list>`, and define how to render inside `<template type="amp-mustache">`.

With `amp-mustache`, you can use variables as follows:

1. Simple variables

`{{variableName}}`

```html
<!-- Using template tag. -->
<template type="amp-mustache">
  Hello {{world}}!
</template>
```

2. Render if variable exists

`{{#section}}{{/section}}`

```html
<!-- Using template tag. -->
<template type="amp-mustache">
    {{#world}}
        Hello {{world}}!
    {{/#world}}
</template>
```

3. Render if variable does not exist

`{{^section}}{{/section}}`

```html
<!-- Using template tag. -->
<template type="amp-mustache">
    {{^world}}
        No World!
    {{/#world}}
</template>
```

### Templates in JSX

Within JSX, these templates can be used like this:

```jsx
<template type="amp-mustache">Hello {"{{world}}"}!</template>;
```

### Implementation Plan

Based on the above, I'll create an endpoint like `/api/otherarticles` that returns something like:

```json
[
  {
    "title": "test post",
    "url": "/posts/test"
  }
]
```

Then the `amp-list` implementation would look like:

```jsx
<amp-list
	width="auto"
	height="200"
	layout="fixed-height"
	src={`/api/otherarticles`}
	items="."
>
	{/* @ts-ignore */}
	<template type="amp-mustache">
		title={"{{title}}"}
		url={"{{url}}"}
	</template>
</amp-list>;
```

## API Implementation

In Next.js, you can create API endpoints by placing `ts` or other files under `pages/api/`.

```js title=pages/api/otherarticles.js
export default function handler(req, res) {
    const articles = {
        title: "test post",
        url: "/posts/test"
    }

    res.status(200).json(articles)
}
```

In the actual implementation, I create a cache similar to [Adding Search Functionality to My Next.js Blog](/posts/frontend/make_blog_5) and then retrieve a specified number of files from a random array referencing that cache. The implementation for this blog can be found on [GitHub](https://github.com/illumination-k/blog/blob/master/src/pages/api/recommend.ts).
