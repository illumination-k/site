---
uuid: 2e78a536-3dc2-4a4f-81aa-5f20e1db76a1
title: Markdownの中のコードをフォーマットするツールを作った
description: Markdown内のコードをフォーマットしたいので、作りました。
lang: ja
category: techblog
tags:
  - rust
  - archive
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## dprintを使おう

`dprint`はMarkdown中のコードを整形してくれる上、Vscodeに対応しています。こちらを使いましょう。

::gh-card[dprint/dprint]

## TL;DR

技術記事を書いていると当然ながらコードを書く必要があります。\
コードをVScodeなどを用いて書くときは、`rustfmt`や`black`、`prettier`などのコードフォーマッターを使っています。記事内のコードを書くときも実際のコードが動くか確かめることが多いので、VScodeで書いてコピペすることが多いです。

しかし、記事内でなんとなく書いているコードや、ちょっと修正しただけならコピペじゃなくて記事のコードを書き換えることもあります。そういったときにフォーマッターを通していないので、普段自分が書くコーディングからずれていたり、括弧の数などのフォーマッターレベルでわかるミスが出たりすることがあります。

そこで、今回はMarkdown内のコードを任意のフォーマッターを使って整形して出力するツール**cmfmt**を作ったので宣伝します。

::gh-card[illumination-k/cmfmt]

## 使い方

binaryをおいてあるので、ダウンロードしてパスを通したあと`cmfmt example.md`の用な感じで使えます。デフォルトではファイルを置き換えてしまうので、それが嫌な場合は`--stdout`フラグをつければ置き換える代わりに標準出力に出力されます。

```bash
USAGE:
    cmfmt [FLAGS] [OPTIONS] <markdown>

FLAGS:
    -h, --help       Prints help information
        --stdout     Output formatted markdown to stdout instead of overwrite the input markdown
    -V, --version    Prints version information

OPTIONS:
        --config <config>    Path of the config file. default: ${home}/.config/cmfmt.toml

ARGS:
    <markdown>    Path of the input markdown you would like to format
```

## 設定ファイルについて

設定ファイルは以下のような形式です。これが`~/.config/cmfmt.toml`に勝手に出力されます。中身をいじれば、自分の好きな言語・フォーマッターを使ってMarkdown内のコードをフォーマットできるはず。

```toml
[fmt.python]
command = "black"
name = ["py", "python", "python3"]
extention = "py"

[fmt.rust]
command = "rustfmt"
name = ["rs", "rust"]
extention = "rs"

[fmt.js]
command = "prettier"
args = ["--write"]
name = ["js", "javascript"]
extention = "js"
```

`fmt.langname`は特に意味はなく、人間が読みやすいからつけています。`fmt.xxxxx`みたいな形式ならなんでもいいです。そのうち`lint`もつけてみたいので`fmt`を接頭語としてつけてます。

どの言語名を認識するかを`name`で配列形式で指定します。その後、指定した言語をどのコマンドでフォーマットするかを`command`で指定しています。引数が必要な場合は`args`で必要な引数を配列形式で指定できます。

また、`prettier`などは特定の拡張子がファイルにないとフォーマットしてくれないので、一時ファイル作成時に拡張子を指定できます。

## 使用技術

| type             |                |
| ---------------- | -------------- |
| 言語             | rust           |
| 設定ファイル     | toml           |
| Markdownのパース | pulldown-cmark |

## 原理

やっていることは滅茶苦茶単純で、

1. Markdownをパースする
2. code blockから言語名を検出
3. code本体を一時ファイルとして保存
4. 一時ファイルを対象として、設定ファイルに書かれたコマンドを実行
5. 一時ファイルを読み込んで、フォーマットされたコードをもとのコードとおきかえ
6. Markdownに戻す

という処理をしています。

## 終わりに

`cmfmt`でブログ記事内のコードにも統一感を出したい
