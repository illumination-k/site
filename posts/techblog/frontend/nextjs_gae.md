---
uuid: 59907b94-6fbc-4f69-ad82-09140f30edb1
title: Next.jsをCloudbuildでGAEにデプロイ
description: Next.jsをGoogle App Engine上にCloudBuild経由でデプロイするまで
lang: ja
category: techblog
tags:
  - frontend
  - development
  - next.js
  - gae
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Next.jsをGoogle App Engine (GAE) で動かすまでの記録。CloudflareはAMPページがなんかエラーしたので一旦やめておいた。

要件として、以下が欲しかった。

- Github連携で、push/prなどでデプロイ
- Webhookでcurlなどでデプロイ

ということで、Cloudbuildにトリガーを作ってGAEにデプロイすることが目標。

## GAEにデプロイ

とりあえず動くようにしたいので、まず設定ファイルを書いてデプロイする。
個人ブログを載せるだけなのでできるだけ無料枠で収まってほしい。一応予算アラートも設定しておく([【クラウド破産の回避術】Google Cloud (GCP)の予算アラートで安全なクラウド運用を実現！](https://www.topgate.co.jp/gcp-budget-alert#google-cloud-gcp-6))。

設定については以下のサイトを参考にした。

- [Google App Engineを無料で運用する方法（2018年版）](https://koni.hateblo.jp/entry/2016/01/06/130613)
- [Google App Engineを出来るだけ無料枠で収めるためのオートスケール設定](https://blog.longkey1.net/2020/04/05/google-app-engine-auto-scaling-setting-for-free/)
- [Next.jsをGAEで動かす（CloudBuildから自動デプロイ）](https://zenn.dev/catnose99/articles/353664a9fe1f0f)

```yaml title=app.yaml
env: standard

runtime: nodejs14
instance_class: F1

service: default

handlers:
  - url: /_next/static
    static_dir: .next/static
  - url: /(.*\.(gif|png|jpg|ico|txt|svg|webp))$
    static_files: public/\1
    upload: public/.*\.(gif|png|jpg|ico|txt|svg|webp)$
  - url: /.*
    script: auto
    secure: always

default_expiration: "12h" # 静的ファイルのキャッシュ期間

env_variables:
  NODE_ENV: "production"

automatic_scaling:
  target_cpu_utilization: 0.95
  target_throughput_utilization: 0.95
  min_idle_instances: 0
  max_idle_instances: 1
  min_instances: 0
  max_instances: 1
  min_pending_latency: 5000ms
  max_pending_latency: automatic
  max_concurrent_requests: 80
```

gcloud経由でとりあえずdeployしてテストしておく。`.gcloudignore`はnode用のファイルが自動で生成される。`coverage`などの不必要なファイルを書き込んで置きたい。

```bash
gcloud app deploy app.yaml --project $PROJECT_ID
```

この時点で、権限を設定する必要があった。以下の権限を最終的に有効にした。

- AppEngine (GAEにデプロイするときにそもそも必要)
- SecretManager (Webhookのシークレット作るときに必要)
- Service Accounts (CloudBuild経由でデプロイするときに必要)

## CloudBuildの設定

### 設定ファイル

```yaml title=cloudbuild.yaml
steps:
  - id: install packages
    name: node:14
    entrypoint: yarn
    args: ["install"]
  - id: build
    name: node:14
    entrypoint: yarn
    args: ["build"]
  - name: gcr.io/cloud-builders/gcloud
    args: ["app", "deploy", "app.yaml", "--project=$PROJECT_ID", "--quiet"]
```

cloudbuildでは、変数を書いておくとよしなに置換してくれる機能がある。今回はデプロイ先を自動で置換してもらえるように`$PROJECT_ID`を使用した。
詳細は、[変数値の置換](https://cloud.google.com/build/docs/configuring-builds/substitute-variable-values?_ga=2.127573001.-505764453.1652467842)を参照。

また、nodeのバージョンなども、`node:${version}`という形式で指定できるので、一応指定した。

### Cloud BuildとGithubを連携

[Google Cloud Build](https://github.com/marketplace/google-cloud-build)というGithub Appを連携させる。

そのあと、プロジェクトのRegionと関係なく

**"global" region**でトリガーを作成し、Githubの該当レポジトリと連携させる。

同一リージョンなら行けると思っていたが、`FAILED_PRECONDITION: generic::failed_precondition: no concurrent builds quota available to create builds.`というエラーが出てしまった ([参考](https://superuser.com/questions/1716674/error-by-trying-to-build-instance-via-ova-gc-sdk-genericfailed-precondition))。

あとはpushするなり、手動でトリガーを起動するなりして動くかチェックする。あと、Service Accountsの権限がないとここでエラーした。

### Webhookでのトリガー作成

webhookを選ぶだけ。シークレットキー作成する必要があるので、SecretManagerの権限がいる。`-d`でボディを明示しないとエラーになる。

```bash
curl -X POST -d '{}' $preview_url
```
