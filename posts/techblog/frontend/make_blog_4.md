---
uuid: ac895f1e-9e84-4d68-aa1c-229d69fa4db8
title: Next.jsでカスタムローダーを使ってmdxをAMP対応させる
description: Wordpressでブログを作っていたが、パフォーマンスが遅いのでNext.jsで作り直した。mdxをレンダリングするときに使うカスタムローダーを自作してAMP対応させる話。
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

markdownファイルやmdxファイルはそのままだと`<img>`タグなどを使う。さらにAMP下での数式のレンダリングやコードシンタクスに対応させることも出ない。なので、mdxのカスタムローダーを自作することでAMPに対応する。

カスタムローダーに関しては[mdxの公式](https://mdxjs.com/guides/custom-loader)などが詳しい。

## JSXを使ってamp対応

mdxフォーマットはjsxに対応している。そして、jsxにはamp-componentsが存在する。なので、amp対応するには、それぞれのdefaultのタグ(`img`など)をamp-components(`<amp-img ... />`)に変換してしまえば良い。

### 基本

astの中でjsx記法は以下のように表される。

```yaml
type: "jsx"
value: "<button>push!!!!</button>"
position: ...
```

なので、あるタグを含むnodeを見つけたら、そのタグが対応するamp-componentsをvalueの中に埋め込んだJSXノードに変換してしまえばいい。

### 数式

数式をレンダリングするAMPタグは`<amp-mathml>`を使う。また、インラインの数式では`<amp-mathml inline>`すればインライン数式になる。

`remark-math`を使えば、`$$`で囲まれた部分が`math`に`$`で囲まれた部分が`inlineMath`に変換されるので、`math`を`<amp-mathml>`に、`inlineMath`を`<amp-mathml inline>`に変換する。

```js:toAmpMathml.js
const visit = require("unist-util-visit");

module.exports = toMathml;

function toMathml() {
  return transformer;

  function transformToJsxNode(parent, index, value, position) {
    const newNode = {
      type: "jsx",
      value: value,
      position: position,
    };

    parent.children[index] = newNode;
  }

  function transformer(ast) {
    visit(ast, "math", mathVisitor);
    function mathVisitor(node, index, parent) {
      const value = `<amp-mathml layout="container" data-formula="\\[${node.value}\\]" />`;
      transformToJsxNode(parent, index, value, node.position);
    }

    visit(ast, "inlineMath", inlineMathVistor);
    function inlineMathVistor(node, index, parent) {
      const value = `<amp-mathml
                            layout="container"
                            inline
                            data-formula="\\[${node.value}\\]"
                            />`;
      transformToJsxNode(parent, index, value, node.position);
    }
  }
}
```

- [amp-mathml](https://amp.dev/documentation/components/amp-mathml/)

### img

数式に関しては単純に変換するだけなので単純で良かった。しかし、`img`タグに対応するのamp-componentsは`<amp-img />`なのだが、このタグは`width`と`height`が必須という特徴がある。一つの対応策としてはCSSなどでうまくresizeしてしまうことらしいのだが([参考](https://qiita.com/narikei/items/50c0c805846c0bd69423))、widthかheightのどちらかは固定する必要があり、固定された側の大きさに引っ張られる。なので、スマホとかを見ると画像の上下に不自然な空白が生まれてしまうことがある。

今回は、どうせmdxをパースする作業はサーバーサイドでやるので、nodeモジュールで対応するイメージのsizeをとってきてちゃんとサイズを入れることにした。

`image-size`というパッケージで簡単にサイズを取得できる。また、urlからサイズを取ってくるときが少しめんどうで、非同期処理を使えない。使ってしまうとparseが終わった後にやっとwidthとheightがわかる、みたいなことになるっぽい。このあたりしっかり理解しきれていないのだが、`sync-request`という同期処理でrequestするモジュールを使って強引に解決した。

** 注意 **
ただ`sync-request`は非推奨らしいので([参考](https://designetwork.daichi703n.com/entry/2017/02/21/node-then-request))、使用する場合は自己責任で...。問題になってるのはクライアント側がクラッシュしやすくなるとかなので、buildするときに走るだけだから問題ないと思いたいのだが。`dynamic import`とか始めると問題になるかもしれない。

```js
const visit = require("unist-util-visit");
const p = require("path");
const sizeOf = require("image-size");

// sync-requestを使わないと整形が終わったあとにリクエストされる。
const sr = require("sync-request");

module.exports = toAmpImg;

function toAmpImg() {
  return transformer;

  function makeValue(url, alt, dimensions) {
    const width = dimensions.width;
    const height = dimensions.height;
    const value =
      `<amp-img layout="responsive" src="${url}" alt="${alt}" height="${height}" width="${width}" />`;
    return value;
  }

  function transformToJsxNode(parent, index, value, position) {
    const newNode = {
      type: "jsx",
      value: value,
      postion: position,
    };

    parent.children[index] = newNode;
  }

  function transformer(ast) {
    visit(ast, "image", visitor);
    function visitor(node, index, parent) {
      const url = node.url;
      const alt = node.alt;
      const position = node.position;
      let path = url;

      if (url.startsWith("/")) {
        path = p.join(process.cwd(), "public", url);
        const dimensions = sizeOf(path);
        const value = makeValue(url, alt, dimensions);

        transformToJsxNode(parent, index, value, position);
      } else if (url.startsWith("http") || url.startsWith("ftp")) {
        const res = sr("GET", url);
        const buf = Buffer.from(res.getBody());
        const dimensions = sizeOf(buf);
        const value = makeValue(url, alt, dimensions);

        transformToJsxNode(parent, index, value, position);
      }
    }
  }
}
```

- [amp-img](https://amp.dev/ja/documentation/components/amp-img/)
- [image-size](https://www.npmjs.com/package/image-size)
- [sync-request](https://www.npmjs.com/package/sync-request)

### syntax highlight

prismjs側でやる処理であるTokenizeをカスタムローダー側でやるだけ。refactor.registerのところで使いたい言語をロードすればよい。これに関しては[amdx](https://github.com/mizchi/amdx)のコードをそのまま使用させていただいた。というかこのレポジトリは熟読させていただいています。ありがとうございます。

```js
const visit = require("unist-util-visit");

module.exports = highlighter;

// @ts-ignore
const refractor = require("refractor/core.js");

refractor.register(require("refractor/lang/javascript.js"));

function highlighter() {
  return (tree) => {
    visit(tree, "code", (node) => {
      const [lang] = (node.lang || "").split(":");
      if (lang) {
        node.lang = lang;
        if (!refractor.registered(lang)) {
          return;
        }
        if (node.data == null) {
          node.data = {};
        }
        node.data.hChildren = refractor.highlight(node.value, lang);
      }
    });
  };
}
```

- [amdx](https://github.com/mizchi/amdx)
