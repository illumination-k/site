---
uuid: 0406d898-77e7-493d-98ae-71b33b326a9a
title: Displaying Language Names in the Top-Right Corner of Code Blocks with CSS
description: When writing code, displaying the language name makes it easier to read. This can be achieved with CSS alone.
lang: en
category: techblog
tags:
  - frontend
  - css
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

When writing a technical blog, you inevitably need to include code, and I wanted to display the language name in a nice way. This can be achieved quite easily using CSS `content`.

## Prerequisites

Assume that code blocks are defined like this:

```html
<pre>
    <code class="language-*">
        hello
    </code>
</pre>
```

The `*` part contains the language name.

## Implementation

`content` allows you to insert text, images, etc. using `::before` or `::after` pseudo-elements. Text inserted via `content` cannot be selected or copied, but since you wouldn't want the language name to be copied anyway, this is actually a well-suited approach.

Here is the implementation. It produces a design similar to the code blocks you see here.

```css
/* Required to position the label in the top-right of pre */
pre {
  position: relative;
  -webkit-overflow-scrolling: touch;
}

/* Common styles for all languages */
pre > code[class*="language"]::before {
  background: #808080;
  border-radius: 0 0 0.25rem 0.25rem;
  color: white;
  font-size: 14px;
  letter-spacing: 0.025rem;
  padding: 0.1rem 0.5rem;
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  opacity: 0.4;
}

/* Per-language settings */
pre > code[class="language-rust"]::before {
  content: "Rust";
  opacity: 0.8;
}
```

First, since we want to display the language name in the top-right corner, we need `position: absolute;`. To get the absolute position within the `pre` element, we set the `pre` tag's position to `relative` in the first block.

Next, we define the styles for the content that appears after elements with "language" in their class name.

Finally, we specify what to display for each language. That's it. Using SCSS or similar would probably make this easier.
