---
uuid: de7a6d47-03d6-430c-a7e5-406aa96e7b7c
title: next.jsで作ってみたブログにamp-sidebarを導入する
description: next.jsで作ってみたブログにtypescriptとmaterial-uiと一緒にamp-sidebarを導入してみた。
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

モバイルページでもサイドバーはやはりほしい。そして最近のはやりはfloating buttonみたいなやつを押すとサイドバーが開く、というものである...気がする。もちろん、`onClick`やらを使えばかんたんに実装できるのだが、ampに対応していると`onClick`は許されていない。

そういうときに使えるのが[amp-sidebar](https://amp.dev/ja/documentation/components/amp-sidebar/)である。しかし、Reactやnext.jsでamp-sidebarを導入している事例は少なく、material-uiやtypescriptと一緒にやっている例は見つからなかった。一応実装できたので、参考になる人がいることを祈って記事に残しておく。

## amp-sidebar

普段は隠れていて、ボタンを押すと表示され、サイドバー以外の部分を押すと閉じる、という機能がデフォルトで実装されている。
とりあえず公式の例を見てみる。

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

基本的には、`amp-sidebar`で`id`を指定し、buttonの`on`に`tap:{id}.toggle`をつければ、そのボタンで開閉ができるようになる。この`toggle`の部分は他にも可能で

| action         | desc                 |
| -------------- | -------------------- |
| open (default) | サイドバーを開く     |
| close          | サイドバーを閉じる   |
| toggle         | サイドバーを開閉する |

の3つが使える。基本的にtoggleでいい気がする。

なので、

```jsx
<amp-sidebar id="sidebar1">{children}</amp-sidebar>
<button on="tap:sidebar1.toggle">toggle</button>
```

のようなjsxを書けばいいことがわかる。

しかし、buttonにon属性はないので、Typescriptを使う場合は`on`を型定義する必要があることに注意が必要（ts-ignoreでもいいかもしれないが...）。

## Float Button

こちらは簡単で[@material-ui/core/Fab](https://material-ui.com/components/floating-action-button/)を使えばOK。ただ、このままだと場所が固定されておらず、onが定義されていないのでそのへんを定義する必要がある。

まず型定義は基本的に同じところからexportされている`xxxProps`というものを使う。今回の場合は`FabProps`を`Fab`と一緒にimportする。このbuttonは`on`を必ず使う用途だと考えているのでdefaultpropsの拡張は行っていない。

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

場所の定義はここでやってしまってもいいが、`amp-sidebar`と`AmpFab`をあわせて`AmpSidebar`コンポーネントを作成したかったので、そこで定義することにした。

## AmpSidebar(amp-sidebar+float button)

画面が大きいときは固定したサイドバーを表示するので、固定したサイドバーが表示されなくなったときに`Fab`が表示されるように設定してある。右下に固定するのに必要な部分は以下のcss部分。

```css
margin: 0;
top: "auto";
right: 20;
bottom: 20;
left: "auto";
position: "fixed";
```

注意が必要なのは、`amp-sidebar`は`<body>`の直下にないとだめなので、`<div>`などで囲ってしまうと、Warningが表示される。なので、Fragmentで囲う必要がある。

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

## Layoutにimportする

デフォルトの`_document.js`は以下である。[このサイト](https://reacttricks.com/building-an-amp-website-with-react-and-next/)では、`_document.js`に`ampsidebar`を直接入れる必要がある、とされている。しかし、このpagesの中身が入る部分である`<Main>`はfragmentで囲われたものなので、この中に`amp-sidebar`を入れてもWarningは表示されない。ただし、material-uiの`Container`やもっと単純に`div`などで囲ってしまうとWarningが表示されるので、できるだけ上の方のコンポーネントに`amp-sidebar`を入れる必要がある。

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

例えば、以下のようにする。これを標準レイアウトにすればWarningは表示されない。

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

## 参考

- [Material-UIで右下に浮いてるボタンを作る](https://k4h4shi.com/2017/11/28/make-material-ui-floatingbutton/)
- [Building an AMP website with React & Next.js](https://reacttricks.com/building-an-amp-website-with-react-and-next/)
