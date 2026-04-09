---
uuid: 1d48b512-6f5d-41ff-8437-15554feb70a4
title: "Azure App Service機能まとめ: ティア別機能・デプロイスロット・サイドカー・Azure連携"
description: "Azure App Serviceの料金ティアごとの機能差、デプロイスロットによるゼロダウンタイムデプロイやPRプレビュー、サイドカーコンテナのアーキテクチャ、Key Vault・Storage・VNetなど他Azureサービスとの連携を整理"
category: backend
lang: ja
tags:
  - ai-generated
  - azure
  - cloud
  - backend
created_at: 2026-03-21
updated_at: 2026-03-21
---

## TL;DR

- Azure App Serviceは、Webアプリ・APIをホストするためのフルマネージドPaaS。OSパッチ、ロードバランシング、スケーリングなどのインフラ管理が不要
- デプロイスロットによるゼロダウンタイムデプロイ、カナリアリリース、Easy Authによるコードレス認証など、Webアプリ運用に必要な機能が組み込まれている
- Key Vault、Storage、VNet、Application Insightsなど他Azureサービスとの連携が充実しており、マネージドIDを使えばシークレット管理も最小化できる
- 料金ティア（Free〜Isolated）によって使える機能が大きく異なるため、要件に合わせたティア選択が重要

## 料金ティアと機能の対応

App Serviceの料金ティアによって利用可能な機能が大きく異なる。ティア選択は最初の重要な意思決定になる。

| ティア                  | コンピュート         | 最大スケールアウト | ストレージ | デプロイスロット | 主な追加機能                                                     |
| ----------------------- | -------------------- | ------------------ | ---------- | ---------------- | ---------------------------------------------------------------- |
| Free (F1)               | 共有VM、60 CPU分/日  | 1                  | 1 GB       | 0                | 開発・テスト専用。カスタムドメインSSL不可、Always On不可         |
| Shared (D1)             | 共有VM、240 CPU分/日 | 1                  | 1 GB       | 0                | カスタムドメイン可、SSL不可                                      |
| Basic (B1-B3)           | 専有VM、1-4コア      | 3                  | 10 GB      | 0                | SSL、Always On、Hybrid Connections（5/プラン）、手動スケールのみ |
| Standard (S1-S3)        | 専有VM、1-4コア      | 10                 | 50 GB      | 5                | オートスケール、デプロイスロット、バックアップ、VNet統合         |
| Premium v3 (P0v3-P5mv3) | 最新世代専有VM       | 30                 | 250 GB     | 20               | より高速なプロセッサ、メモリ最適化オプション                     |
| Premium v4 (P0v4-P5mv4) | 最新世代専有VM       | 30                 | 250 GB     | 20               | NVMeストレージ、最速プロセッサ                                   |
| Isolated v2 (I1v2-I6v2) | 専有VNet上の専有VM   | 100                | 1 TB       | 20               | ネットワーク分離（ASE）、最大スケール                            |

**コストモデル**:

- Free: 無料
- Shared: 使用CPU時間に応じた課金
- Dedicated（Basic以上）: VMインスタンス単位の課金。アプリ数に関係なく、プラン内の全アプリが同じインスタンスを共有
- Isolated: ワーカーインスタンス単位。空のASEでもI1v2の1インスタンス分が課金される

Azureセービングプランや予約インスタンスで最大55%のコスト削減が可能。

本番運用であればStandard以上を前提に考えるのが妥当。Standardがデプロイスロット、オートスケール、VNet統合、バックアップなど多くの実用的機能のしきい値になっている。

## Azure App Serviceとは

Azure App Serviceは、Webアプリケーション、REST API、モバイルバックエンドをホストするためのフルマネージドPaaS（Platform as a Service）。OSのパッチ適用、キャパシティプランニング、ロードバランシングといったインフラ管理をAzureが担い、開発者はアプリケーションコードに集中できる。

WindowsとLinuxの両方に対応し、ソースコードからの直接デプロイとDockerコンテナとしてのデプロイの両方に対応している。SLAは99.95%（Basicティア以上）で、ゾーン冗長による災害耐性もサポートしている。

## 対応言語・フレームワーク

App Serviceは主要な言語・フレームワークを幅広くサポートしている。

| ランタイム       | バリエーション                                 |
| ---------------- | ---------------------------------------------- |
| .NET             | .NET Framework（Windows）、.NET Core / .NET 8+ |
| Java             | Java SE、Tomcat、JBoss EAP                     |
| Node.js          | 複数のLTSバージョン                            |
| Python           | 複数バージョン                                 |
| PHP              | 複数バージョン                                 |
| カスタムコンテナ | Docker経由で任意の言語                         |

上記に該当しない言語・ランタイムでも、カスタムコンテナを使えばApp Service上で動かせる。

## デプロイ

### CI/CD連携

App Serviceは複数のソースリポジトリとビルドプロバイダーに対応している。

**対応ソース**:

- GitHub（デフォルトビルドプロバイダー: GitHub Actions）
- Azure Repos（App Service Build Service or Azure Pipelines）
- Bitbucket
- ローカルGit / 外部Git（GitLab等）

**その他のデプロイ方法**:

- ZIP / WARデプロイ
- FTP / FTPS
- Azure CLI / PowerShell
- Visual Studio / VS Codeからの直接パブリッシュ

GitHub Actionsによるデプロイでは、ユーザー割り当てマネージドIDによるOpenID Connect認証が推奨されている。Publish Profileベースの認証も引き続き利用可能だが、シークレットの管理が必要になる。

### デプロイスロット

デプロイスロットは、App Serviceの中でも特に強力な機能。本番環境とは別に独立したホスト名を持つライブアプリを作成でき、コードの検証・段階的リリースが安全に行える。**Standard以上のティアで利用可能**（Free、Shared、Basicでは使えない）。

#### スロット数の上限

| ティア   | 最大スロット数 |
| -------- | -------------- |
| Standard | 5              |
| Premium  | 20             |
| Isolated | 20             |

#### スワップの仕組み

スワップ操作はゼロダウンタイムで行われる。プラットフォームがソーススロットをウォームアップした後、ルーティングルールを切り替える仕組みになっている。

- 通常のスワップ — ソーススロットをウォームアップ → ルーティング切り替え
- プレビュー付きスワップ（多段階スワップ）— スワップ前に変更内容を検証可能。ただし、いずれかのスロットでサイト認証が有効な場合は使用不可
- 自動スワップ — コードのプッシュとウォームアップ完了後に自動でスワップ。Linuxでは非対応

#### トラフィックルーティング（カナリアリリース）

本番トラフィックの一定割合を別のスロットにルーティングできる。たとえば「新バージョンのスロットに5%のトラフィックを流す」といったカナリアリリースが可能。問題が見つかればトラフィック割合を0%に戻すだけでロールバックできる。

#### スロット固有の設定

アプリ設定と接続文字列には「スロットに固定（sticky）」フラグを設定できる。

**スワップで入れ替わる設定**:

- 言語フレームワークバージョン
- アプリ設定（stickyでないもの）
- 接続文字列（stickyでないもの）
- ハンドラーマッピング
- WebJobsコンテンツ
- WebSocket設定
- パブリック証明書

**スワップで入れ替わらない設定**:

- カスタムドメイン
- SSL証明書 / バインディング
- スケール設定
- Always On
- 診断ログ設定
- マネージドID
- CORS

例えば、ステージング環境用のデータベース接続文字列をstickyに設定しておけば、スワップ後も本番スロットの接続文字列は本番DBを指したままになる。

#### デプロイスロットの活用パターン

1. **ステージング環境**: stagingスロットにデプロイ → 検証 → 本番スロットとスワップ
2. **カナリアリリース**: 新バージョンのスロットにトラフィックを段階的に増やす
3. **即時ロールバック**: 問題があれば再度スワップするだけで以前のバージョンに戻る
4. **設定の分離**: stickyフラグにより環境ごとの設定を維持したままスワップ

#### PRプレビュー環境としての利用

Vercel/Netlifyのプレビューデプロイのように、PRごとにスロットを動的に作成してプレビュー環境として使うことも可能。App Service自体に組み込みのPRプレビュー機能はないが、GitHub ActionsやAzure DevOpsで実現できる。

仕組みとしては、`pull_request`イベント（opened / synchronize）をトリガーにAzure CLIでスロットを動的に作成し、PR番号をスロット名に含める。

```bash
APP_NAME="my-app"
RESOURCE_GROUP="my-rg"

# PRオープン時にスロットを作成してデプロイ
az webapp deployment slot create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot pr-${{ github.event.number }}
```

各スロットには`https://<app-name>-pr-<PR番号>.azurewebsites.net`というURLが割り当てられるため、レビュアーはPR単位で動作確認ができる。PRクローズ時にスロットを削除するジョブも合わせて定義する。

ただし、スロット数の上限（Standardで5、Premiumで20）がそのまま同時にプレビューできるPR数の上限になる点に注意。大規模チームで同時に多数のPRが開かれる場合はこの制約がボトルネックになる。

なお、静的サイト/JAMstackアプリであれば**Azure Static Web Apps**にPRプレビューが組み込み機能として用意されている。PRを開くと自動的にプレビュー環境が作成・削除されるため、App Serviceのスロットで自前構築するよりも手軽に使える。

#### 活用事例

- [App ServiceやWeb App for Containersによる色んなリリース方法(Blue-Greenデプロイやカナリアリリース)](https://tech-lab.sios.jp/archives/22822) — SIOS Tech Lab。デプロイスロットを使ったBlue-Greenデプロイとカナリアリリースの実践的な解説
- [Slotを用いたAppServiceのステージング環境とAzureDevOps PipelineのリリースによるBlueGreen Deployment](https://tech.guitarrapc.com/entry/2019/03/27/033450) — Azure DevOps Pipelineで承認フロー付きBlue-Greenデプロイを構築した実例
- [Azure App Service でブルーグリーンデプロイする](https://qiita.com/fsdg-adachi_h/items/d1c18150b77561f5fa8a) — デプロイスロットを使ったブルーグリーンデプロイの手順
- [Azure-Samples/github-actions-deployment-slots](https://github.com/Azure-Samples/github-actions-deployment-slots) — Microsoft公式のPRプレビューデプロイのGitHub Actionsサンプル
- [Automated deployment slots in Azure with GitHub Actions](https://dev.to/florianlenz/automated-deployment-slots-in-azure-with-github-actions-testing-pull-requests-in-live-environments-3k05) — PRごとにスロットを動的に作成・削除するワークフローの解説

## スケーリング

App Serviceは垂直・水平の両方向にスケーリングできる。

### スケールアップ（垂直）

料金ティアやVMサイズを変更する。即座に反映され、設定変更だけで完了する。

### スケールアウト（水平）

VMインスタンスを追加する。同じApp Serviceプランのすべてのアプリが一緒にスケールする点に注意。

| ティア        | 最大インスタンス数 |
| ------------- | ------------------ |
| Free / Shared | 1（共有）          |
| Basic         | 3（専有）          |
| Standard      | 10                 |
| Premium v2-v4 | 30                 |
| Isolated v2   | 100                |

### オートスケール

Standard以上のティアで利用可能。Azure Monitorベースで、CPU、メモリ、HTTPキュー長、またはスケジュールに基づいてルールを定義する。

スケールアウトはルールのいずれかが満たされるとトリガーされるが、スケールインはすべてのルールが満たされた場合のみトリガーされる。この非対称性は意図的な設計で、過度なスケールインを防いでいる。

### 自動スケーリング（HTTPトラフィックベース）

Premium v2/v3/v4で利用可能な新しい機能。HTTPトラフィックパターンに基づいてApp Serviceが自動的にスケールする。ユーザー定義のルールは不要で、「最大バースト」の設定（最大30インスタンス）のみ指定する。事前ウォームアップされたインスタンスをバッファとして保持できる。

### 活用事例

- [AppServiceにスケーリング設定をしたい！](https://zenn.dev/nomhiro/articles/appservice_scaling) — 手動/ルールベース/トラフィックベースの3種類のスケーリング方法の設定手順
- [Azure App Service の新しい自動スケーリング(トラフィックベースの自動スケール)を試してみた](https://onarimon.jp/entry/2024/04/01/213243) — 2024年GAのトラフィックベース自動スケールの体験記。従来のルールベースとの違いを解説

## ネットワーク

App Serviceのネットワーク機能は、インバウンド（外部 → アプリ）とアウトバウンド（アプリ → 外部）に大きく分かれる。

### インバウンド機能

| 機能                   | 用途                                                   | 必要ティア |
| ---------------------- | ------------------------------------------------------ | ---------- |
| アクセス制限           | IPやサブネットベースの許可/拒否ルール（最大512ルール） | 全ティア   |
| サービスエンドポイント | 特定VNetサブネットからのアクセスのみ許可               | 全ティア   |
| Private Endpoints      | VNet内のプライベートIPでアプリを公開                   | Basic以上  |

### アウトバウンド機能

| 機能               | 用途                                               | 必要ティア |
| ------------------ | -------------------------------------------------- | ---------- |
| VNet統合           | アプリからVNet内リソースへのアウトバウンドアクセス | Basic以上  |
| Hybrid Connections | VPN不要でオンプレミスへのTCPトンネル               | Basic以上  |

ポイントは以下の通り。

- **VNet統合はアウトバウンド専用**。アプリがVNet内のリソース（DB、VM等）にアクセスするためのもの
- **Private Endpointsはインバウンド専用**。クライアントがプライベートIPでアプリにアクセスするためのもの
- 両者は同じサブネットを共有できない
- Hybrid ConnectionsはAzure Relay経由のTCPトンネルで、VPNなしでオンプレミスに接続できるが、Hybrid Connection ManagerをWindowsサーバーにインストールする必要がある

### 活用事例

- [Azure App Service の VNet 統合 を試す！！(半閉域化)](https://qiita.com/aktsmm/items/e3867d02202cc10a49e3) — VNet統合の設定手順と半閉域化の実現方法
- [Azure App Service の Private Endpoint を試す！！(半閉域化)](https://qiita.com/aktsmm/items/9ab681f82d81aae504df) — プライベートエンドポイントの設定と受信方向の閉域化を検証
- [【Azure】App ServiceのVNet統合とプライベートリンクを利用した通信閉域化](https://techblog.ap-com.co.jp/entry/2021/03/12/150117) — VNet統合とプライベートリンクを組み合わせた閉域化構成の実践事例

## 認証・認可（Easy Auth）

App Serviceには組み込みの認証ミドルウェアがある。WindowsではIISモジュール、Linuxではサイドカーコンテナとして動作し、アプリケーションコードの変更なしに認証を追加できる。**全ティアで利用可能**。

**対応IDプロバイダー**:

- Microsoft Entra ID（Azure AD）
- GitHub
- Google
- Facebook
- X（Twitter）
- Apple（プレビュー）
- 任意のOpenID Connectプロバイダー

すべてのHTTPリクエストがアプリに到達する前にミドルウェアを通過する。トークンの検証、セッション管理、HTTPヘッダーへのID情報の注入を自動的に処理する。社内アプリをEntra IDで保護するような用途であれば、認証コードを一切書かずに済む。

### 活用事例

- [Azure App Service の Easy Auth で Entra ID 認証する設定のまとめ](https://qiita.com/hoto17296/items/8fed6dc8c007b07a6b09) — Entra IDとEasy Authの連携パターン2種類と設定方法の詳細
- [Azure App Service の Easy Auth で取得したアクセストークンで Microsoft Graph API を叩くまで](https://qiita.com/hoto17296/items/280e4774151e79c7a619) — Easy Authで取得したトークンでGraph APIを呼び出す実装例
- [【Azure】EasyAuthの導入〜「管理者の承認が必要」について](https://zenn.dev/peishim/articles/df96cb7a75532d) — Easy Auth導入時の「管理者の承認が必要」エラーの対処法

## コンテナサポート

### カスタムコンテナ

任意のDockerコンテナイメージをデプロイ可能。Azure Container Registry、Docker Hub、プライベートレジストリからプルできる。

### サイドカーコンテナ

サイドカーコンテナは、メインアプリケーションコンテナと同じ「サイトユニット」内で並行して動作する補助コンテナ。2024年11月にGA（一般提供）となった。**Linux限定**で、メインコンテナ1つに対して最大9つのサイドカーを追加できる。

Kubernetesのサイドカーパターンと同じ発想で、アプリケーションコードを変更せずにテレメトリ収集、キャッシュ、AI推論などの機能を追加できる。

#### アーキテクチャ

サイドカーの動作を理解する上で重要なのは、すべてのコンテナがネットワーク名前空間とファイルシステムを共有している点。

- **ネットワーク共有** — すべてのコンテナが同じネットワーク名前空間で動作する。コンテナ間通信は`localhost:<ポート>`で行える。サービスディスカバリは不要
- **ファイルシステム共有** — デフォルトの`/home`ボリュームがすべてのコンテナにマウントされる。追加のカスタムボリュームも定義でき、コンテナ間で共有可能（ただし非永続）
- **ライフサイクル共有** — サイドカーはメインコンテナと一緒に起動・停止・スケールする。1つのコンテナを停止するとSIGTERMが全コンテナに送信され、ポッド全体が再起動する

外部HTTPトラフィック（ポート80/8080）はメインコンテナ（`isMain=true`）にのみルーティングされる。サイドカーは内部通信専用で、任意のポートで待ち受けできる。

#### 設定方法

Azure Portal、Azure CLI、ARMテンプレートから設定できる。

```bash
APP_NAME="my-app"
RESOURCE_GROUP="my-rg"
ACR_NAME="myacr"

# サイドカー対応アプリの作成
az webapp create --name $APP_NAME --resource-group $RESOURCE_GROUP --sitecontainers-app

# サイドカーコンテナの追加
az webapp sitecontainers create --name $APP_NAME --resource-group $RESOURCE_GROUP \
  --container-name otel-collector --image ${ACR_NAME}.azurecr.io/otel-collector:latest \
  --target-port 4318

# 既存のカスタムコンテナアプリをサイドカーモードに変換
az webapp sitecontainers convert --mode sitecontainers --name $APP_NAME --resource-group $RESOURCE_GROUP
```

ARMテンプレートでは`Microsoft.Web/sites/sitecontainers`リソースとして定義する。`isMain`、`image`、`targetPort`、`environmentVariables`、`volumeMounts`などのプロパティを指定する。

#### プリビルト拡張機能

2025年3月から、Azureポータルで選択するだけで利用可能なプリビルト拡張機能が提供されている。

- **Redis** — `localhost:6379`でインメモリキャッシュを提供。軽量キャッシュ向けで、Azure Cache for Redisの代替ではない
- **Datadog** — APM、ロギングのテレメトリをDatadogに直接送信
- **Phi-3 / Phi-4** — `http://localhost:11434/v1/chat/completions`でOpenAI互換のチャット補完APIを提供。初回起動時のモデル読み込みに時間がかかる。P2mv3以上のティアが推奨される

#### 主なユースケース

| ユースケース       | サイドカー例            | 通信先                           |
| ------------------ | ----------------------- | -------------------------------- |
| テレメトリ収集     | OpenTelemetry Collector | `localhost:4318` → Azure Monitor |
| APM                | Datadog Agent           | プリビルト拡張                   |
| ローカルキャッシュ | Redis                   | `localhost:6379`                 |
| AI推論             | Phi-3 / Phi-4           | `localhost:11434`                |
| ログ転送           | Fluent Bit / Fluentd    | `/home`共有ボリューム経由        |
| リバースプロキシ   | Nginx / Envoy           | `localhost:<port>`               |

#### リソースとコスト

サイドカー自体に追加課金はない。すべてのコンテナがApp Serviceプランのリソース（CPU、メモリ、ストレージ）を共有する。コンテナ単位のリソース制限は設定できないため、サイドカーが重い処理を行う場合はプランのティアを上げる必要がある。

#### 制限事項

- 最大9サイドカー（メインコンテナ除く）
- Linux限定（Windowsは非対応）
- 起動順序の保証なし（`depends_on`非対応）
- サイドカー単体のヘルスチェック不可（ヘルスチェックはメインコンテナのみ）
- ボリュームマウントは非永続（Azure Storageの永続マウントは非対応）
- コンテナ個別のスケーリング・再起動は不可
- ログはすべてのコンテナが同じログファイルに出力される

#### Docker Composeからの移行

Docker Composeによるマルチコンテナサポートは**2027年3月31日で廃止予定**。サイドカーへの移行が必要になる。

Docker Composeの`command`/`entrypoint`は`startUpCommand`に、`environment`は`environmentVariables`に、`ports`は`targetPort`にマッピングされる。`depends_on`、`networks`、`secrets`は非対応のため、依存関係がある場合はアプリ側で起動待ちのリトライロジックを実装する必要がある。

Azure CLIの`az webapp sitecontainers convert`コマンドで既存アプリをサイドカーモードに変換できる。デプロイスロットを使えば安全にテストしてから本番に切り替えられる。

#### 活用事例

- [Azure App ServiceへDockerコンテナをデプロイし、Webアプリを動かしてみる。-Go言語-](https://zenn.dev/akuru_jp/articles/8574be4f03d03f) — Go言語のDockerコンテナをACR経由でApp Serviceにデプロイする手順
- [Azure App Service に Spring Boot Webサービスをデプロイする (Docker Hub カスタムコンテナイメージ)](https://qiita.com/studio_meowtoon/items/29b6d9dadcece2d723e2) — Docker HubからSpring Bootコンテナイメージをデプロイする手順
- [App Service Sidecar Tips](https://qiita.com/georgeOsdDev@github/items/8df014c0fea153659074) — サイドカー構成のTipsとハマりどころ
- [Global Availability: Sidecar Extensibility in Azure App Service](https://azure.github.io/AppService/2024/11/08/Global-Availability-Sidecars.html) — GA発表とアーキテクチャ解説
- [Sidecar Extensions（Redis, Datadog, Phi-3/4）](https://azure.github.io/AppService/2025/03/19/Sidecar-extensions.html) — プリビルト拡張機能の紹介
- [Docker Compose Migration Guide](https://azure.github.io/AppService/2025/04/01/Docker-compose-migration.html) — Docker Composeからサイドカーへの移行ガイド

## バックグラウンドジョブ（WebJobs）

Webアプリと同じインスタンス上でバックグラウンドプログラムを実行できる。追加コストなし。

| タイプ                  | 動作                         | 備考                                       |
| ----------------------- | ---------------------------- | ------------------------------------------ |
| 継続的（Continuous）    | 即座に開始、ループし続ける   | 全インスタンスまたは単一インスタンスで実行 |
| トリガー型（Triggered） | 手動または CRON スケジュール | 単一インスタンスで実行                     |

**注意点**:

- 安定した動作には「Always On」が必要（Basicティア以上）
- WebアプリとCPU・メモリを共有する
- イベント駆動型の処理にはAzure Functionsが推奨されている

### 活用事例

- [AppServiceのWebJobを試してみた](https://qiita.com/momijisan/items/ab3b5c3300d8972ec480) — WebJobの作成からポータルでのデプロイまでの体験記
- [Azure App Service for Linux でパブリックプレビューの WebJobs (Cron) を試してみた](https://qiita.com/mnrst/items/81a107a399b725872269) — Linux版App ServiceでのWebJobs(Cron)を試した記事

## 監視・診断

- Application Insights — APM、分散トレーシング、ライブメトリクス。自動インストルメンテーション対応（後述）
- 診断ログ — アプリケーションログ、Webサーバーログ、詳細エラーメッセージ、失敗リクエストトレーシング
- ログストリーミング — リアルタイムでログを確認
- ヘルスチェック — 指定パスへの定期的なpingでインスタンスの正常性を監視。異常なインスタンスはロードバランサーから除外される
- Kuduコンソール — プロセスエクスプローラー、環境情報、高度な診断ツール

## 他Azureサービスとの連携

App Serviceの強みとして、他のAzureサービスとの連携が充実している点がある。多くの連携でマネージドIDが使えるため、シークレットの直接管理を最小化できる。

### Key Vault連携

アプリ設定や接続文字列からKey Vaultのシークレットを直接参照できる。

```
@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/mysecret)
```

または短縮構文:

```
@Microsoft.KeyVault(VaultName=myvault;SecretName=mysecret)
```

アプリコードからは通常の環境変数として読み取れるため、コード変更は不要。アプリにマネージドIDを付与し、Key Vaultの「Key Vault Secrets User」ロール（RBAC）または「Get」シークレット権限を設定するだけで動作する。

バージョンを指定しない場合、新しいシークレットバージョンは24時間以内に自動取得される（キャッシュ）。即座に反映させたい場合は設定変更またはAPIコールで強制リフレッシュが可能。**全ティアで利用可能**だが、ネットワーク制限されたKey VaultにはVNet統合（Basic以上）が必要。

#### 活用事例

- [Azure App Service から Azure Key Vault を安全に利用する（ASP.NET Core編）](https://zenn.dev/zead/articles/appservice-keyvault) — マネージドIDを使ったKey Vaultへのセキュアな接続方法
- [Key Vault のパスワードを Web App から使ってみた](https://zenn.dev/sabainfra/articles/37d19562de08b2) — Key VaultのシークレットをWeb Appのアプリ設定から参照する手順
- [Azure App Service: Key Vault参照がSystem AssignedからUser Assignedに切り替わらない問題](https://qiita.com/rikuto125/items/2f58dbe06b2276bc0777) — マネージドIDの種別切り替え時の問題と解決策

### Azure Storage連携

Azure Storageをアプリのファイルシステム上のローカルパスとしてマウントできる（最大5マウントポイント）。

| ストレージ種別     | 対応OS          | 読み書き     |
| ------------------ | --------------- | ------------ |
| Azure Files        | Linux / Windows | 読み書き可   |
| Azure Blob Storage | Linux限定       | 読み取り専用 |

スケールアウトした全インスタンスで同じファイルを共有できるため、アップロードファイルやメディアアセットの共有に便利。ただし、認証はストレージアカウントの共有アクセスキーのみ対応で、Entra IDによるRBACはマウントに対しては非対応。**Basic以上で利用可能**（OS・デプロイ方式により異なる）。

#### 活用事例

- [Azure App Service on Windows での Azureストレージマウント機能を設定してみる](https://dev.classmethod.jp/articles/azure-app-serivice-for-windows-azure-storage-mount/) — Windows版App ServiceでのStorageマウント設定を検証
- [Azure WebAppsにAzure Storageをセキュアにマウントする](https://zenn.dev/ibaraki/articles/c14da092012c2d) — プライベートエンドポイント経由でStorageをセキュアにマウントする構成
- [Azure FilesをAzure App Serviceのドライブとしてマウントする](https://tech.kentem.jp/entry/2023/12/21/090000) — Azure Filesをファイル共有として利用する実践事例

### Azure Database連携（SQL / Cosmos DB）

Azure SQL DatabaseやCosmos DBへの接続にマネージドIDを使ったパスワードレス認証がサポートされている。

```csharp
// DefaultAzureCredentialを使用（.NET例）
var credential = new DefaultAzureCredential();
```

手順は以下の通り。

1. App ServiceでマネージドIDを有効化
2. データベース側でマネージドIDをユーザーとして作成し、必要なロールを付与
3. パスワードなしの接続文字列を使用

Azure PortalのService Connectorを使えば、この設定を自動化できる。**全ティアで利用可能**。

#### 活用事例

- [マネージド ID を使用した Azure SQL Database への接続と接続元アプリの特定](https://qiita.com/endori/items/805a2f0542521977c9a5) — マネージドIDでSQL Databaseに接続し、接続元アプリを特定する方法
- [Azure Cosmos DBにAzure App Serviceから読み書きするための設定](https://qiita.com/yakigac/items/1b74f3c74e47b0045705) — App ServiceからCosmos DBへの読み書き設定の実践手順
- [Azure WebAppsとAzure SQL Databaseをセキュアに接続する](https://zenn.dev/ibaraki/articles/2dca271069c851) — VNet統合やプライベートエンドポイントを活用したセキュアな接続構成

### Azure Front Door / Application Gateway

App Serviceの前段にリバースプロキシ / WAF / CDNとして配置する構成。

- Azure Front Door — グローバルL7ロードバランサー + CDN + WAF。Front Door PremiumではPrivate Linkを使ってApp Serviceとプライベート接続が可能
- Application Gateway — リージョナルL7ロードバランサー + WAF。Private EndpointsまたはService Endpointsと組み合わせてApp Serviceを公開制限できる

Front Door経由でEasy Authを使う場合は、`forwardProxy.convention`を`Standard`に設定して`X-Forwarded-Host`ヘッダーを認識させる必要がある。

#### 活用事例

- [Azure でリバースプロキシを使うときに覚えておきたいこと](https://zenn.dev/acompany/articles/f97ac16bbdf0ae) — Front Doorを数ヶ月使った実務経験に基づく備忘録
- [Azure Front Doorを使って複数のAzure App Serviceへパスベースルーティングさせる](https://dev.classmethod.jp/articles/azure-front-door-multi-path-routing/) — Front Doorで複数App Serviceへのパスベースルーティングを構築した実例
- [Azure WebAppsの手前にApplication Gatewayを設置する](https://zenn.dev/ibaraki/articles/f1d971cd0c7d35) — Application GatewayをApp Serviceの前段に配置する構成の構築手順

### Application Insights（自動インストルメンテーション）

Azureポータルからトグル1つで有効化でき、コード変更なしでAPMデータを収集できる。

| ランタイム | Windows（コード） | Linux（コード）  | コンテナ |
| ---------- | ----------------- | ---------------- | -------- |
| .NET       | 対応              | 対応             | 対応     |
| Java       | 対応              | 対応             | 対応     |
| Node.js    | 対応              | 対応             | 対応     |
| Python     | 非対応            | 対応（3.9-3.13） | 非対応   |

リクエスト、依存関係、例外、パフォーマンスカウンター（CPU、メモリ）が自動収集される。テレメトリはLog Analyticsワークスペースに流れ、KQLでクエリ・アラート設定ができる。**全ティアで利用可能**（Application Insights自体はGB単位の従量課金）。

#### 活用事例

- [Azure Monitor Application Insights を App Service Web アプリに設定する](https://qiita.com/studio_meowtoon/items/f757541f140e91b04516) — Azure CLIを使ったApplication Insightsの設定手順
- [Application Insightsの可用性テストで外形監視やってみた](https://qiita.com/hiro10149084/items/c88174082509409633cc) — 可用性テストを使った外形監視の設定体験記

### Azure Container Registry (ACR)

カスタムコンテナイメージのプル元としてACRを使える。マネージドIDに`AcrPull`ロールを付与する方式が推奨されている（Service Principal認証はWindowsコンテナでは非対応）。

ACRのWebhookを設定すれば、`docker push`をトリガーにApp Serviceが自動で新しいイメージをプルして再起動する。ネットワーク制限されたACR（Private Endpoint）からプルする場合は、VNet統合と`vnetImagePullEnabled = true`の設定が必要。

#### 活用事例

- [Container Registryにプッシュしたら自動でApp Serviceのコンテナを最新化する](https://qiita.com/Shoma0210/items/d30c1788617d2668e3bb) — ACRへのpush時にWebhookでApp Serviceコンテナを自動更新する設定
- [Azure App Service におけるコードとコンテナのデプロイ方法の比較](https://qiita.com/mshdtksk/items/a26c75378f2748769c39) — コードデプロイとACRコンテナデプロイの比較

### Service Bus / Event Grid

App Service自体がEvent Gridにイベントを発行する（アプリの作成・更新・削除、デプロイ、スケーリングなど）。これをFunctionsやLogic Appsで受けて通知・後処理ができる。

アプリからService Busのキュー / トピックにメッセージを発行する場合は、SDKでマネージドID認証を使えばシークレット不要。イベント駆動でService Busトリガーを使いたい場合は、Azure Functionsのネイティブバインディングが適している。

### 連携まとめ

| 連携先                   | 認証方式         | 必要ティア                            |
| ------------------------ | ---------------- | ------------------------------------- |
| Key Vault                | マネージドID     | 全ティア（Private Vault: Basic+）     |
| Azure Storage            | 共有アクセスキー | Basic以上                             |
| Azure SQL / Cosmos DB    | マネージドID     | 全ティア                              |
| Front Door / App Gateway | -                | Basic+（Private Endpoints）           |
| Application Insights     | 接続文字列       | 全ティア                              |
| ACR                      | マネージドID     | Basic+（Windowsコンテナ: Premium V3） |
| Service Bus / Event Grid | マネージドID     | 全ティア                              |

## App Service Environment (ASE)

ASE v3はApp Serviceのシングルテナントデプロイメント。ユーザーのVNet内にデプロイされる。

**使うべきケース**:

- 30以上のApp Serviceプランインスタンスが必要
- コンプライアンス上、シングルテナントが求められる
- ネットワーク分離されたホスティングが必要
- 多層アプリケーションアーキテクチャの構築

ASEは`/24`サブネットにデプロイされ、内部VIP（プライベート）または外部VIP（パブリック）を選択できる。最大200インスタンス（全プラン合計）をホストでき、ゾーン冗長やDedicated Host（物理ハードウェア分離）もサポートしている。

通常のApp Serviceよりもコストが高いため、上記の要件に該当しない場合はマルチテナント（通常のApp Service + Private Endpoints + VNet統合）で十分な場合が多い。

## 注意点・制限事項

### ティアによる機能制限

把握しておくべき主な制限。

- デプロイスロット — Standard以上でないと使えない
- オートスケール — Standard以上
- Always On — Basic以上（Free/Sharedではアプリが20分後にアイドル化）
- VNet統合 — Basic以上
- カスタムドメインSSL — Shared以上（FreeではSSL不可）

### プラットフォーム制約

- 同じApp Serviceプランの全アプリがコンピュートリソースを共有し、一緒にスケールする。重いアプリと軽いアプリを同じプランに入れると、リソース競合が起きる可能性がある
- ティア変更時（例: StandardからPremiumV2へのVMファミリー変更）に送信IPアドレスが変わる。IP制限のある外部サービスとの連携時は注意が必要
- WebJobsはWebアプリとCPU・メモリを共有する。重い処理はFunctionsや別のコンピュートに分離した方がよい
- Docker Composeのマルチコンテナサポートは2027年3月31日で廃止予定。サイドカーコンテナへの移行が必要
- 自動スワップはLinuxでは非対応
- Free/Sharedティアには日次のCPUクォータがある（それぞれ60分 / 240分）。超過するとHTTP 403が返る

### 運用上の注意

- デプロイスロットのスワップ時にワーカーがリサイクルされるため、長時間実行中のオペレーションは中断される
- システムプロセスがベースラインのCPU/メモリを消費するため、キャパシティプランニングにはその分を見込む必要がある
- ASEでのスケーリングはマルチテナントより遅い。急なスパイクには対応しづらいため、事前にスケールしておく必要がある

## まとめ

Azure App Serviceは、Webアプリ・APIホスティングのためのPaaSとして非常に多機能で、デプロイスロット、Easy Auth、VNet統合、Key Vault連携など、運用に必要な機能が組み込まれている。一方で、料金ティアによって使える機能が大きく異なるため、要件を整理した上でティアを選択することが重要になる。

コンテナベースのマイクロサービスやイベント駆動型の処理には、それぞれContainer AppsやFunctionsの方が適しているケースもあるため、ワークロードの性質に応じて使い分けるとよい。

## 参考リンク

- [Azure App Service 概要](https://learn.microsoft.com/ja-jp/azure/app-service/overview)
- [App Service プラン](https://learn.microsoft.com/ja-jp/azure/app-service/overview-hosting-plans)
- [デプロイスロット](https://learn.microsoft.com/ja-jp/azure/app-service/deploy-staging-slots)
- [ネットワーク機能](https://learn.microsoft.com/ja-jp/azure/app-service/networking-features)
- [認証と承認](https://learn.microsoft.com/ja-jp/azure/app-service/overview-authentication-authorization)
- [Key Vault 参照](https://learn.microsoft.com/ja-jp/azure/app-service/app-service-key-vault-references)
- [VNet 統合](https://learn.microsoft.com/ja-jp/azure/app-service/overview-vnet-integration)
- [Application Insights の自動インストルメンテーション](https://learn.microsoft.com/ja-jp/azure/azure-monitor/app/codeless-overview)
- [Azure コンテナーサービスの選択](https://learn.microsoft.com/ja-jp/azure/architecture/guide/choose-azure-container-service)
