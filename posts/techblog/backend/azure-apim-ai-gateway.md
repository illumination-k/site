---
uuid: 632c38f7-31fa-4441-94b8-dcddae6b863b
title: "Azure API ManagementによるAI Gateway設計: Azure AI Foundry × IaC × 監視の構成調査"
description: "Azure API Management（APIM）をAI Gatewayとして活用し、Azure AI Foundryの複数モデルを統合管理する構成を調査。Terraform + azapiによるIaC化、トークンベースのコスト管理、負荷分散、Application Insightsによるプロジェクト別監視まで設計方針を整理"
category: backend
lang: ja
tags:
  - ai-generated
  - azure
  - ai
  - cloud
  - backend
  - apim
  - terraform
created_at: 2026-04-01
updated_at: 2026-04-01
---

## TL;DR

- Azure API Management（APIM）はAI Gateway機能を組み込みで持っており、`llm-token-limit` や `llm-emit-token-metric` などのLLM専用ポリシーで、トークン単位のレート制限やメトリクス収集が可能
- Azure AI Foundryの複数モデルをバックエンドプールとして束ね、priority/weightベースの負荷分散とサーキットブレーカーによるフェイルオーバーを実現できる
- APIMのポリシーXMLを含むすべてのリソースをTerraform（azurerm + azapi）で管理でき、`templatefile()` でXMLを外部ファイルとして扱える
- カスタムヘッダー（`x-project-id`）とApplication Insightsを組み合わせることで、プロジェクトごとのトークン使用量と接続元IPを追跡できる
- APIMは管理下のREST APIをMCPサーバーとしてネイティブに公開する機能も持っており、既存APIをコード変更なしにMCPツールとして公開できる

この記事は実装に先立つ設計調査をまとめたもので、実際の構築手順やハンズオンは扱わない。

## 背景

Azure AI Foundryで複数のLLMモデルやツール（Azure AI Search、MCPサーバーなど）を組み合わせたAIサービスを構築する場面が増えている。しかし、各モデルエンドポイントに直接アクセスする構成には以下の課題がある。

- コスト可視化が難しい。プロジェクトやチームごとのトークン使用量を把握できない
- 負荷分散・フェイルオーバーがない。単一エンドポイントへの依存でリージョン障害時に停止する
- アクセス制御が分散する。各エンドポイントのAPIキーを個別に管理する必要がある
- 監視が断片化する。モデルごとにログやメトリクスを別々に確認する必要がある

これらを解決するため、APIMをAI Gatewayとして間に挟み、認証・レート制限・負荷分散・監視を一元化する構成を検討した。

## APIMのAI Gateway機能

APIMは2024年以降、AI/LLMワークロード向けの組み込みポリシーを追加している。ポリシーには2つのファミリーがある。

### `azure-openai-*` と `llm-*` の違い

| ファミリー       | 対象                                                | 用途                                         |
| ---------------- | --------------------------------------------------- | -------------------------------------------- |
| `azure-openai-*` | Azure OpenAI Serviceのエンドポイント専用            | Azure OpenAI固有のレスポンス形式をパースする |
| `llm-*`          | OpenAI互換APIすべて（AI Foundryモデルカタログ含む） | 汎用的にトークン情報を扱う                   |

Azure AI Foundryのモデルカタログ（Mistral、Llama、Cohereなど）を使う場合は `llm-*` ファミリーを選択する。Azure OpenAI Serviceのみを使う場合はどちらでも動作するが、将来の拡張性を考えると `llm-*` に統一するのが妥当。

### 主要なAI Gateway専用ポリシー

| ポリシー                    | セクション | 機能                                              |
| --------------------------- | ---------- | ------------------------------------------------- |
| `llm-token-limit`           | inbound    | トークンベースのレート制限（TPM単位）             |
| `llm-emit-token-metric`     | outbound   | トークン使用量メトリクスをAzure Monitorに送信     |
| `llm-semantic-cache-lookup` | inbound    | セマンティック類似度によるキャッシュ検索          |
| `llm-semantic-cache-store`  | outbound   | レスポンスをセマンティックキャッシュに保存        |
| `llm-content-safety`        | inbound    | Azure AI Content Safetyによる入出力フィルタリング |

## アーキテクチャ設計

全体構成は以下のようになる。

```text
クライアント
    │
    │ x-project-id ヘッダー付きリクエスト
    ▼
┌──────────────────────────────────────────────┐
│              Azure API Management             │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ Inbound Policy                          │ │
│  │  - 認証 (subscription-key)              │ │
│  │  - llm-token-limit (プロジェクト別TPM)  │ │
│  │  - set-backend-service (バックエンドプール) │ │
│  │  - モデルルーティング (choose)          │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ Outbound Policy                         │ │
│  │  - llm-emit-token-metric (カスタム次元) │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ Diagnostics → Application Insights      │ │
│  └─────────────────────────────────────────┘ │
└──────────────────┬───────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌────────┐  ┌────────┐  ┌────────────────┐
│ GPT-4o │  │Mistral │  │ Azure AI Search│
│(East US)│  │(West US)│  │  (Grounding)  │
└────────┘  └────────┘  └────────────────┘
       Azure AI Foundry
```

### バックエンドプールによる負荷分散

APIMのバックエンドプールは、複数のバックエンドを1つの論理的なエンドポイントとして束ねる。

- Priority — 数値が小さいグループに優先的にルーティング。グループ内の全バックエンドが利用不可になると次のグループにフェイルオーバー
- Weight — 同一priorityグループ内でのトラフィック分配比率

| バックエンド    | Priority | Weight | 役割              |
| --------------- | -------- | ------ | ----------------- |
| aoai-eastus     | 1        | 3      | プライマリ（75%） |
| aoai-westus     | 1        | 1      | プライマリ（25%） |
| aoai-westeurope | 2        | 1      | フェイルオーバー  |

### サーキットブレーカー

各バックエンドにサーキットブレーカーを設定できる。429（レート制限超過）や5xxエラーが閾値を超えるとバックエンドを一時的にプールから外し、指定期間後にリトライする。`acceptRetryAfter: true` を設定すると、Azure OpenAIの `Retry-After` ヘッダーを尊重する。

### 複数モデルのルーティング

リクエストボディの `model` フィールドに基づいてバックエンドを振り分ける。

```xml
<inbound>
    <base />
    <choose>
        <when condition="@(context.Request.Body.As<JObject>(preserveContent:true)["model"]?.ToString() == "gpt-4o")">
            <set-backend-service backend-id="gpt4o-pool" />
        </when>
        <when condition="@(context.Request.Body.As<JObject>(preserveContent:true)["model"]?.ToString().StartsWith("mistral"))">
            <set-backend-service backend-id="mistral-pool" />
        </when>
        <otherwise>
            <set-backend-service backend-id="default-pool" />
        </otherwise>
    </choose>
</inbound>
```

### ツール統合の接続パターン

Azure AI Foundryにおけるツール統合は、ツールの種類によってAPIM層とアプリケーション層で役割が分かれる。

#### APIMのMCPサーバー機能

APIMは管理下のREST APIをMCPサーバーとしてネイティブに公開する機能を持っている。APIの操作（エンドポイント）をMCPツールとして公開し、GitHub Copilot、Semantic Kernel、Copilot StudioなどのMCPクライアントから呼び出せる。

この機能の意義は、既存のREST APIをコード変更なしにMCP対応できる点にある。APIMの設定だけでAPI操作をツールとして公開でき、MCPクライアント側からは `https://<apim-name>.azure-api.net/<api-name>-mcp/mcp` のようなエンドポイントで接続する。

MCPサーバーのポリシーも個別に設定でき、`Mcp-Session-Id` ヘッダーによるセッション単位のレート制限なども可能。

```xml
<!-- MCPサーバーポリシーの例: セッションごとに60秒あたり1回のツール呼び出し制限 -->
<set-variable name="body"
    value="@(context.Request.Body.As&lt;string&gt;(preserveContent: true))" />
<choose>
    <when condition="@(
        Newtonsoft.Json.Linq.JObject.Parse((string)context.Variables["body"])["method"] != null
        &amp;&amp; Newtonsoft.Json.Linq.JObject.Parse((string)context.Variables["body"])["method"].ToString() == "tools/call"
    )">
        <rate-limit-by-key
            calls="1"
            renewal-period="60"
            counter-key="@(
                context.Request.Headers.GetValueOrDefault("Mcp-Session-Id", "unknown")
            )" />
    </when>
</choose>
```

現時点の制約として、MCPツールのみサポートしており、MCPリソースやプロンプトは未対応。また、APIMのワークスペース機能との併用もまだできない。

参考: [API ManagementでREST APIをMCPサーバーとして公開する](https://learn.microsoft.com/ja-jp/azure/api-management/export-rest-mcp-server)

#### その他のツール統合

- Azure AI Search（Grounding）はAzure OpenAIの "On Your Data" 機能としてAI Foundry側で設定する。APIMはリクエストを透過的にプロキシする
- 外部MCPサーバー（APIM外でホストされるもの）もAPIM経由で公開でき、認証やレート制限を一元管理できる

すべてのAI FoundryへのトラフィックがAPIMを通る構成にすることで、ツール利用時のトークン消費も含めて監視できる点が重要。

## IaC化

APIMの全リソースをTerraformで管理する。ポリシーXMLは外部ファイルとして管理し、コードレビュー可能にする。

### azurermとazapiの使い分け

`azurerm` プロバイダーで基本的なAPIMリソースは管理できるが、バックエンドプール（`type: 'Pool'`）やサーキットブレーカーなどの新しいAI Gateway機能はサポートが遅れる場合がある。その場合は `azapi` プロバイダーでAzure REST APIを直接呼ぶ。AI Gateway機能を使うにはAPIバージョン `2024-06-01-preview` 以降が必要。

| リソース           | azurermリソース                           | azapi必要性 |
| ------------------ | ----------------------------------------- | ----------- |
| APIMサービス       | `azurerm_api_management`                  | 不要        |
| API                | `azurerm_api_management_api`              | 不要        |
| APIポリシー        | `azurerm_api_management_api_policy`       | 不要        |
| バックエンド       | `azurerm_api_management_backend`          | サーキットブレーカーを使う場合は必要 |
| バックエンドプール | なし                                      | 必要        |
| ロガー             | `azurerm_api_management_logger`           | 不要        |
| 診断設定           | `azurerm_api_management_diagnostic`       | 不要        |
| Named Value        | `azurerm_api_management_named_value`      | 不要        |

### APIMサービスとAPIの定義

```hcl title=modules/apim/main.tf
resource "azurerm_api_management" "this" {
  name                = var.apim_name
  location            = var.location
  resource_group_name = var.resource_group_name
  publisher_name      = var.publisher_name
  publisher_email     = var.publisher_email
  sku_name            = "StandardV2_1"
}

resource "azurerm_api_management_api" "ai" {
  name                = "ai-foundry-api"
  resource_group_name = var.resource_group_name
  api_management_name = azurerm_api_management.this.name
  revision            = "1"
  display_name        = "AI Foundry API"
  path                = "ai"
  protocols           = ["https"]

  import {
    content_format = "openapi+json"
    content_value  = file("${path.module}/specs/openai-api.json")
  }
}
```

### バックエンドとプールの定義

個別バックエンドはサーキットブレーカーの設定を含むため `azapi` を使う。バックエンドプールも `azurerm` では未サポートのため `azapi` で定義する。

```hcl title=modules/apim-backend/main.tf
# 個別バックエンドの定義（サーキットブレーカー付き）
resource "azapi_resource" "backend_eastus" {
  type      = "Microsoft.ApiManagement/service/backends@2024-06-01-preview"
  name      = "aoai-eastus"
  parent_id = var.apim_id

  body = {
    properties = {
      url      = "https://my-ai-eastus.openai.azure.com/openai"
      protocol = "http"
      circuitBreaker = {
        rules = [
          {
            name = "aiCircuitBreaker"
            failureCondition = {
              count = 5
              interval = "PT10S"
              statusCodeRanges = [
                { min = 429, max = 429 },
                { min = 500, max = 599 }
              ]
            }
            tripDuration     = "PT1M"
            acceptRetryAfter = true
          }
        ]
      }
    }
  }
}

resource "azapi_resource" "backend_westus" {
  type      = "Microsoft.ApiManagement/service/backends@2024-06-01-preview"
  name      = "aoai-westus"
  parent_id = var.apim_id

  body = {
    properties = {
      url      = "https://my-ai-westus.openai.azure.com/openai"
      protocol = "http"
      circuitBreaker = {
        rules = [
          {
            name = "aiCircuitBreaker"
            failureCondition = {
              count = 5
              interval = "PT10S"
              statusCodeRanges = [
                { min = 429, max = 429 },
                { min = 500, max = 599 }
              ]
            }
            tripDuration     = "PT1M"
            acceptRetryAfter = true
          }
        ]
      }
    }
  }
}

# バックエンドプールの定義
resource "azapi_resource" "backend_pool" {
  type      = "Microsoft.ApiManagement/service/backends@2024-06-01-preview"
  name      = "ai-backend-pool"
  parent_id = var.apim_id

  body = {
    properties = {
      description = "Load balanced pool of AI endpoints"
      type        = "Pool"
      pool = {
        services = [
          { id = "/backends/${azapi_resource.backend_eastus.name}", priority = 1, weight = 3 },
          { id = "/backends/${azapi_resource.backend_westus.name}", priority = 1, weight = 1 },
        ]
      }
    }
  }

  depends_on = [
    azapi_resource.backend_eastus,
    azapi_resource.backend_westus,
  ]
}
```

### ポリシーXMLの外部ファイル管理

`templatefile()` でXMLを外部ファイルから読み込み、変数を埋め込む。環境（dev/staging/prod）ごとにTPM上限やバックエンド構成を切り替えられる。

```hcl title=modules/apim-policy/main.tf
resource "azurerm_api_management_api_policy" "ai" {
  api_name            = var.api_name
  api_management_name = var.apim_name
  resource_group_name = var.resource_group_name

  xml_content = templatefile("${path.module}/policies/ai-gateway-policy.xml", {
    backend_pool_id   = var.backend_pool_id
    tokens_per_minute = var.tokens_per_minute
  })
}
```

XMLテンプレート内では `${backend_pool_id}` のようにTerraform変数を参照できる。ポリシーXMLを独立ファイルにすることで、XMLのシンタックスハイライトやバリデーションが効くエディタ設定と組み合わせてレビューしやすくなる。

### ポリシーXMLの構成例

```xml title=policies/ai-gateway-policy.xml
<policies>
    <inbound>
        <base />
        <!-- バックエンドプールの設定 -->
        <set-backend-service backend-id="ai-backend-pool" />
        <!-- トークンベースのレート制限（プロジェクト単位） -->
        <llm-token-limit
            tokens-per-minute="10000"
            counter-key="@(context.Request.Headers.GetValueOrDefault("x-project-id", "default"))"
            estimate-prompt-tokens="true"
            remaining-tokens-header-name="x-ratelimit-remaining-tokens" />
    </inbound>
    <backend>
        <base />
    </backend>
    <outbound>
        <base />
        <!-- トークンメトリクスの送信 -->
        <llm-emit-token-metric>
            <dimension name="API ID" />
            <dimension name="Subscription ID" />
            <dimension name="Project ID"
                value="@(context.Request.Headers.GetValueOrDefault("x-project-id", "unknown"))" />
            <dimension name="Client IP"
                value="@(context.Request.IpAddress)" />
            <dimension name="Model"
                value="@(context.Request.Body.As&lt;JObject&gt;(preserveContent: true)?["model"]?.ToString() ?? "unknown")" />
        </llm-emit-token-metric>
    </outbound>
    <on-error>
        <base />
    </on-error>
</policies>
```

## コスト管理・負荷分散

### トークンベースのレート制限

通常の `rate-limit` ポリシーはリクエスト数ベースだが、LLMのコストはトークン数に比例するため、トークンベースの制限が必要になる。

| 観点         | `rate-limit-by-key` | `llm-token-limit`                                                           |
| ------------ | ------------------- | --------------------------------------------------------------------------- |
| 制限単位     | リクエスト数/時間   | トークン数/分（TPM）                                                        |
| カウント方法 | リクエストごとに+1  | レスポンスのtoken countで加算                                               |
| 事前チェック | リクエスト数のみ    | `estimate-prompt-tokens` でプロンプトトークンを推定し、残予算を事前チェック |
| 適用シーン   | 一般的なAPI         | LLMのコスト制御                                                             |

`counter-key` にプロジェクトIDを指定することで、プロジェクトごとに独立したTPM枠を持たせられる。

```xml
<llm-token-limit
    tokens-per-minute="50000"
    counter-key="@(context.Request.Headers.GetValueOrDefault("x-project-id", "default"))"
    estimate-prompt-tokens="true"
    remaining-tokens-header-name="x-ratelimit-remaining-tokens"
    tokens-consumed-header-name="x-ratelimit-tokens-consumed" />
```

### 月次クォータの課題

現状、トークンベースの月次クォータポリシーは存在しない。月次のトークン使用量制限を実現するには、以下のようなアプローチが考えられる。

1. `llm-emit-token-metric` でトークン使用量をAzure Monitorに送信
2. Azure Monitorのアラートルールで閾値を設定
3. アラート発火時にAzure Functions経由でAPIMサブスクリプションを無効化

TPMのレート制限で日常的な使いすぎを防ぎつつ、月次の使用量は監視ベースで管理する二段構えが現実的。

## 監視・ログ

### Application Insights連携

APIMのDiagnostics設定でApplication Insightsロガーを接続する。

```hcl title=modules/apim-monitoring/main.tf
resource "azurerm_api_management_logger" "app_insights" {
  name                = "app-insights-logger"
  api_management_name = var.apim_name
  resource_group_name = var.resource_group_name

  application_insights {
    connection_string = var.app_insights_connection_string
  }
}

resource "azurerm_api_management_diagnostic" "app_insights" {
  identifier               = "applicationinsights"
  api_management_name      = var.apim_name
  resource_group_name      = var.resource_group_name
  api_management_logger_id = azurerm_api_management_logger.app_insights.id

  sampling_percentage = 100

  always_log_errors         = true
  log_client_ip             = true
  http_correlation_protocol = "W3C"
}
```

### カスタムヘッダーによるプロジェクト別追跡

`llm-emit-token-metric` のカスタム次元を活用する。

```xml
<llm-emit-token-metric>
    <dimension name="API ID" />
    <dimension name="Subscription ID" />
    <dimension name="Project ID"
        value="@(context.Request.Headers.GetValueOrDefault("x-project-id", "unknown"))" />
    <dimension name="Client IP"
        value="@(context.Request.IpAddress)" />
    <dimension name="Model"
        value="@(context.Request.Body.As&lt;JObject&gt;(preserveContent: true)?["model"]?.ToString() ?? "unknown")" />
</llm-emit-token-metric>
```

これにより、Application Insights（Azure Monitor）上で以下の分析が可能になる。

- プロジェクト別トークン消費量 — `Project ID` 次元でグループ化
- モデル別使用量 — `Model` 次元でグループ化
- 接続元の追跡 — `Client IP` 次元で不正アクセスの検出
- サブスクリプション別 — `Subscription ID` 次元でチーム/サービス単位の集計

Azure Workbooksでダッシュボードを構築し、プロジェクトオーナーに自分のプロジェクトの使用状況を共有する運用が考えられる。

### サンプリングの注意点

Application Insightsは従量課金のため、高トラフィックなAI Gatewayではテレメトリコストが問題になりうる。ただし、トークンメトリクスはAzure Monitorのカスタムメトリクスとして送信されるため、ログのサンプリングとは独立している。ログ（リクエスト/レスポンスボディ）のサンプリングは積極的に行いつつ、メトリクスは100%収集する設計が望ましい。

## まとめ

APIMのAI Gateway機能を使うことで、Azure AI Foundryの複数モデルを一元的に管理できる。調査の結果、以下の設計方針が固まった。

- ポリシーは `llm-*` ファミリーを採用し、AI Foundryのモデルカタログに対応する
- 負荷分散はバックエンドプール + サーキットブレーカーでリージョン障害に対応する
- IaCはTerraform（azurerm + azapi）でポリシーXMLを含む全リソースを管理する
- コスト管理は `llm-token-limit` でプロジェクト別TPM制限を設定し、月次クォータは監視ベースで補完する
- 監視は `llm-emit-token-metric` のカスタム次元で、プロジェクトID・接続元IP・モデル名をApplication Insightsに送信する

次のステップとして、この設計に基づく実装（Terraformモジュールの作成、ポリシーXMLの実装、CI/CDパイプラインの構築）に進む予定。
