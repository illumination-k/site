---
uuid: de7a6d47-03d6-430c-a7e5-406aa96e7b7c
title: Adding amp-sidebar to a Next.js Blog
description: Adding amp-sidebar to a Next.js blog along with TypeScript and Material-UI.
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

I still want a sidebar on mobile pages. And the current trend seems to be pressing a floating button to open a sidebar. Of course, using `onClick` would make the implementation easy, but `onClick` is not allowed under AMP.

This is where [amp-sidebar](https://amp.dev/ja/documentation/components/amp-sidebar/) comes in. However, there are few examples of using amp-sidebar with React or Next.js, and I couldn't find any examples combining it with Material-UI and TypeScript. I managed to implement it, so I'm leaving this article in hopes it helps someone.

## amp-sidebar

It's hidden by default, appears when a button is pressed, and closes when you click outside the sidebar -- these features are built-in by default.
Let's look at the official example:

```html
<amp-sidebar id="sidebar1" layout="nodisplay" side="right">
  <ul>
    <li>Nav item 1</li>
    <li><a href="#idTwo" on="tap:idTwo.scrollTo">Nav item 2</a></li>
    <li>Nav item 3</li>
    <li><a href="#idFour" on="tap:idFour.scrollTo">Nav item 4</a></li>
    <li>Nav item 5</li>
    <li>Nav item 6</li>
  </ul>
</amp-sidebar>

<button class="hamburger" on='tap:sidebar1.toggle'></button>
```

Basically, you specify an `id` on the `amp-sidebar`, then set `tap:{id}.toggle` on the button's `on` attribute to enable opening and closing with that button. Besides `toggle`, the following actions are available:

| action         | desc                       |
| -------------- | -------------------------- |
| open (default) | Opens the sidebar          |
| close          | Closes the sidebar         |
| toggle         | Toggles the sidebar        |

Using toggle is generally sufficient.

So we know we need to write JSX like this:

```jsx
<amp-sidebar id="sidebar1">{children}</amp-sidebar>
<button on="tap:sidebar1.toggle">toggle</button>
```

However, note that the button element doesn't have an `on` attribute, so when using TypeScript, you need to define the `on` type (or you could use ts-ignore...).

## Float Button

This part is easy -- just use [@material-ui/core/Fab](https://material-ui.com/components/floating-action-button/). However, the position isn't fixed by default, and `on` isn't defined, so those need to be configured.

For type definitions, we use `xxxProps` which is exported from the same module. In this case, import `FabProps` along with `Fab`. Since this button is intended to always use `on`, I haven't extended the default props.

```tsx title=AmpFab.tsx
import React from "react";

import Fab, { FabProps } from "@material-ui/core/Fab";

interface AmpOnProps {
  on: string;
}

type Props = FabProps & AmpOnProps;

const AmpFab: React.FC<Props> = (props) => {
  return <Fab {...props} />;
};

export default AmpFab;
```

Positioning could be defined here, but since I wanted to create an `AmpSidebar` component that combines `amp-sidebar` and `AmpFab`, I decided to define it there.

## AmpSidebar (amp-sidebar + float button)

When the screen is large, a fixed sidebar is displayed, so the `Fab` is configured to appear only when the fixed sidebar is not shown. The CSS needed to fix it to the bottom-right is:

```css
margin: 0;
top: "auto";
right: 20;
bottom: 20;
left: "auto";
position: "fixed";
```

An important note is that `amp-sidebar` must be a direct child of `<body>`, so wrapping it in a `<div>` or similar will cause a warning. Therefore, it needs to be wrapped in a Fragment.

```tsx title=AmpSidebar.tsx
import React from "react";

import AmpFab from "./AmpFab";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import NavigationIcon from "@material-ui/icons/Navigation";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      display: "block",
      [theme.breakpoints.up("sm")]: {
        display: "none",
      },
      margin: 0,
      top: "auto",
      right: 20,
      bottom: 20,
      left: "auto",
      position: "fixed",
    },
  })
);

const AmpSidebar = ({ children }) => {
  const classes = useStyles();
  return (
    <>
      <AmpFab
        on="tap:ampsidebar.toggle"
        variant="extended"
        aria-label="amp-fab"
        className={classes.fab}
      >
        <NavigationIcon>Navigation</NavigationIcon>
      </AmpFab>
      <amp-sidebar id="ampsidebar" className="ampsidebar" layout="nodisplay">
        {children}
      </amp-sidebar>
    </>
  );
};

AmpSidebar.defaultProps = {
  children: <></>,
};

export default AmpSidebar;
```

## Importing into Layout

The default `_document.js` looks like this. [This site](https://reacttricks.com/building-an-amp-website-with-react-and-next/) states that `ampsidebar` needs to be placed directly in `_document.js`. However, `<Main>`, which is where page content goes, is wrapped in a Fragment, so placing `amp-sidebar` inside it won't trigger a warning. That said, wrapping it in Material-UI's `Container` or a simple `div` will trigger a warning, so `amp-sidebar` needs to be placed as high up in the component tree as possible.

```jsx title=_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
```

For example, you can do the following. Using this as the standard layout will prevent warnings.

```tsx title=Layout.tsx
import Header from "./Header";
import Footer from "./Footer";
import AmpSidebar from "./AmpSidebar"

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      {children}
      <AmpSidebar />
      <Footer />
    </>
  );
};

export default Layout;
```

## References

- [Creating a Floating Button at the Bottom-Right with Material-UI](https://k4h4shi.com/2017/11/28/make-material-ui-floatingbutton/)
- [Building an AMP website with React & Next.js](https://reacttricks.com/building-an-amp-website-with-react-and-next/)
