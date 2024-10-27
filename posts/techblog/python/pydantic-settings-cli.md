---
uuid: c2954724-d9a1-460e-94ee-8fcd92d8ec77
title: ""
description: ""
category: ""
lang: ja
tags: []
created_at: 2024-10-14
updated_at: 2024-10-14
---

## TL;DR


## [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)について

pydantic-settingsは、環境変数やdotenvファイルなどから設定を読み込むためのライブラリとして有名です。

ただそれだけならpydanticの機能で十分だと思っていたのですが、最近CLIの引数から設定を読み込む機能が追加されました。ちなみにAzure Key Vaultもサポートされていますが、AWS Systems Managerのパラメータストアはなぜかサポートされていません (2024/10現在)。[Issue](https://github.com/pydantic/pydantic-settings/issues/399)はあるのでそのうち対応される可能性はあります。


pythonのbuiltinのコマンドライン引数のパーサーである `argparse` は、型の指定が難しく、Namespaceを二重定義する必要があるなど、書き捨てるようなScriptには良いのですが、ある程度大きなCLIアプリケーションを作成するのは少し面倒です。

`pydantic-settings` は、pydanticと同様のクラスを書くだけで、CLI引数のパーサーが完成して、型の指定やデフォルト値の設定が簡単に行え、型ヒントもうまく動くので、補完が効いて快適な開発ができます。

## 使い方

## Subcommand

## Nested subcommand
