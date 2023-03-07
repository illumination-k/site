---
uuid: 0406d898-77e7-493d-98ae-71b33b326a9a
title: CSSでコードブロックの右上に言語名を表示する
description: コードを書くときに書いてる言語が何なのか表示すると、見るときに便利です。CSSだけで実現できます。
lang: ja
category: techblog
tags:
  - frontend
  - css
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

技術ブログを書いているとコードを書く必要があるわけですが、その言語が何なのかをいい感じに表示したいと思っていました。CSSの`content`を使えば結構簡単に表示することができます。

## 前提

```html
<pre>
    <code class="language-*">
        hello
    </code>
</pre>
```

というふうな感じでコードブロックが定義されているとします。`*`の部分に言語名が入ります。

## 実装

`content`は要素の前後に`::before`や`::after`を使うことでテキストや画像などを挿入することができます。`content`で挿入したテキストなどは選択・コピーができませんが、言語名はむしろコピーされると邪魔なので、結構適している方法な気がします。

実装は以下になります。このコードブロックのような感じのデザインが得られます。

```css
/* preの右上に表示するために必要 */
pre {
  position: relative;
  -webkit-overflow-scrolling: touch;
}

/* 言語全体で共通 */
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

/* 言語別に設定 */
pre > code[class="language-rust"]::before {
  content: "Rust";
  opacity: 0.8;
}
```

まず、言語名を右上に表示したいので、`position: absolute;`である必要があります。`pre`コード内での絶対位置がほしいので、最初の部分で`pre`タグのpositionを`relative`にしています。

次にlanguageがclassの名前に入っているものの後ろに表示するcontentのスタイルを定義しています。

最後に、言語別になんと表示するかを書いていきます。以上です。scssとかを使うと多分楽です。
