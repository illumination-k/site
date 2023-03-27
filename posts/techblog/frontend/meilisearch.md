---
uuid: b4c996d6-898d-4dff-98b4-4ddb34afea50
title: JAM StackなBlogをモダン技術で再作成した話
description: 古いブログを最近の技術で再構築した際に使用した技術についての比較記事です。過去のブログの技術構成と、新しいブログで使用した技術の選択理由と採用しなかった技術について詳しく説明しています。
lang: ja
tags:
    - development
    - frontend
    - twind
    - nextjs
category: frontend
created_at: 2023-03-27
updated_at: 2023-03-27
---

## TL;DR

昔作っていたBlogを最近使い続けている技術で再作成しました。新しいブログを作成する際に使った技術について記事にしていきたいので、比較記事、検討した技術について書きます。

## 過去のブログ

### 過去のブログの構成技術

- Backend
  - Heroku
  - Actix-web
  - lindera (形態素解析)
  - [Tantivy](https://github.com/tantivy-search/tantivy) (全文検索)
  - シングルバイナリで配布

- Frontend
  - Google App Engine
  - yarn
  - mdx
  - Nextjs
  - Material UI
  - AMP

#### 過去のブログの問題点

- ブログのためだけにレポジトリが3つ (frontend, backend, blog posts) あってめんどくさい
- Full AMPで作っていたため、Reactの恩恵が受けにくい
- AMP AnalyticsがGA4に中々対応されない ([Support App + Web properties on Google Analytics (gtag)](https://github.com/ampproject/amphtml/issues/24621))。
- Material UIを使っているので細かい調整をしようとするとめんどくさい
- Herokuの無料枠廃止によってBackendのデプロイ先に困る

## 新しいブログ

過去のブログの問題点は以下のように解決したつもりになっています。

- 複数のリポジトリを持つことが面倒だったため、単一のリポジトリにまとめるmonorepo構成にしました。
- tailwindに似たCSS in JSのライブラリであるtwindを使用して、柔軟なスタイリングを可能にしました。
- サーバーを必要としない検索エンジンであるmeilisearchを使用することで、バックエンドを廃止しました。
- AMP対応を放棄することで、AMP固有の制約を回避し、更にGA4に対応しました。

### 新しいブログの技術構成

- Google Cloud Run
- pnpm
- monorepo
- mdx
- Nextjs
- twind
- meilisearch

#### 採用理由

1. Google Cloud Run

今回は、Docker内のマルチステージビルドを利用して必要な記事をSSGして、Nextjsのstandaloneモードでデプロイをしたいと考えていました。そのため、DockerをそのままデプロイできるGoogle Cloud Runを利用しました。また、もともとGoogle App Engineを利用していたことから、カスタムドメインの移行が簡単なのも良かったです。

2. monorepo

ブログ記事の前処理をCLIを使って、Frontmatterから取得したメタデータと、記事自体のMDXへコンパイルしたデータをJSON形式で保存し、そのファイルをNextjsのSSGの際に利用することにしました。

そのため、今回の構成は以下のようになりました。

- `common` : zod schema + type
- `web` : Nextjs
- `cli` : jsonへの変換

これに加えて、MDXのオレオレパーサーを実装するため以下を作成しました。

- `md-plugins` : `remark`, `rehype`のプラグイン置き場

そのため、ブログ記事+Metadataを`common`として切り出し`zod`を使って型安全にパースできるようにしました。`common`のスキーマと型を使ってCLIでMarkdownをJSONに変換し、JSONを`zod`で型安全にパースしながらNextjsのSSGで扱えたので、体験として良かったです。

3. Nextjs

一番使ったことがあるフレームワークだったからです。進化も著しく、キャッチアップする意味でも有意義でした。

4. mdx

Pluginを自作するとやりたい放題できるので好きです。やりすぎると何やってるかわからなくなるので、程々に利用しようと考えています。

5. twind

denoで使われているイメージが強いCSS in JSです。`tailwind CSS`と同じような感じでスタイリングできるのですが、`lg:(text-xl font-bold)`みたいなグルーピングができて見通しが良い、`postcss`などがいらず、ビルド時にコンパイルされるなどのメリットが大きいと感じています。

1. meilisearch

Rustで書かれたOSSの全文検索サーバーです。JSONを投げたら記事の登録ができ、クエリを投げれば記事の一覧が返ってくるので、簡単に検索サービスが実装できます。クラウドも無料で10000リクエストまで検索できるので、実装が簡単に終わります。

### 採用しなかった技術

1. AMP

AMPはGoogleもやる気を失っている感じがしました。また、AMPに頼らなくても十分高速なサイトが実装できたので、あまりAMPの恩恵が感じられなくなったのもあります。

2. Material UI

Tailwindが書きたかったからです。

3. Custom Backend

デプロイを複数回に分けるのが面倒でした。

4. tinysearchなどのWebassembly baseの検索

最初はこれにしようと思っていて、`tinysegmenter`を使って実装しようとしていました。しかし、せっかくTypescriptで完結できているが故の型安全などを捨てるのも微妙 + stop wordの除去などの前処理が非常にめんどくさいなどの理由から却下しました。Meilisearchが手軽に実装できすぎたのもあります。
