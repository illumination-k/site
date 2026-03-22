---
uuid: 3099116e-7460-47b8-8ce2-1d68a4c46661
title: "Azure Application Insights実例サーベイ: 監視設計・KQL活用・コスト最適化の実践パターン"
description: "Azure Application Insightsの実際の活用パターンを調査・整理。OpenTelemetryベースのセットアップ、KQLクエリによる障害分析、分散トレーシング、サンプリングによるコスト最適化まで、実例ベースで解説"
category: backend
lang: ja
tags:
  - ai-generated
  - azure
  - monitoring
  - observability
  - backend
created_at: 2026-03-21
updated_at: 2026-03-21
---

## TL;DR

- Azure Application Insights（以下App Insights）はAzure MonitorのAPM機能。Azureでアプリを運用するなら、まず検討すべき監視ツール
- テレメトリ収集にはAzure Monitor Distro・素のOTel + Collector・ネイティブOTLPの3パターンがあり、ロックイン許容度に応じて選択する
- KQLクエリによる柔軟な分析が最大の強みで、障害調査からパフォーマンス分析、ビジネスメトリクスまで対応可能
- 一方、テレメトリ量に応じた従量課金のため、サンプリングやフィルタリングによるコスト管理が運用上の最重要課題になる

この記事では、App Insightsの各機能について公式ドキュメントや事例をサーベイし、導入・運用時に知っておくべきポイントを整理した。セットアップ手順の詳細や各機能の網羅的なリファレンスは扱わない。

## 背景: なぜApplication Insightsか

Webアプリケーションを本番運用するとき、「いまアプリが正常に動いているか」「どこがボトルネックか」「ユーザーにどんなエラーが出ているか」を把握する仕組みが必要になる。APM（Application Performance Monitoring）ツールがこの役割を担う。

APMの選択肢としては、Datadog、New Relic、Grafana Cloud（+Tempo/Loki）などがある。App Insightsを選ぶ理由は主に以下の点にある。

- Azureとのネイティブ統合が強い。App Service、Azure Functions、AKSなどからワンクリックで有効化できる。Managed Identityによる認証も使える
- KQLの分析力が高い。単なるダッシュボードだけでなく、KQLで自由にクエリを書ける柔軟さがDatadogのログ検索やNew RelicのNRQLに匹敵する
- 初期コストが低い。月5GBまでの無料枠があり、小規模なアプリなら無料で運用できる
- Azure Monitorのエコシステムと連携する。Log Analytics、Azure Alerts、Workbooksなどとシームレスに統合できる

逆に、マルチクラウド環境やAWS中心のインフラではDatadogやGrafana Cloudの方が適している場合もある。App Insightsは「Azureを主軸にしているチーム」にとって最もコストパフォーマンスが高い選択肢と言える。

## Application Insightsの概要

Application InsightsはAzure Monitorの一機能で、Webアプリケーションのパフォーマンス監視（APM: Application Performance Monitoring）を担う。主要な機能は以下の通り。

| 機能            | 概要                                                        |
| --------------- | ----------------------------------------------------------- |
| リクエスト追跡  | HTTP リクエストの応答時間、成功/失敗率を自動収集            |
| 依存関係追跡    | DB呼び出し、外部API呼び出しなどの応答時間・失敗を自動記録   |
| 例外追跡        | ハンドルされた/されていない例外をスタックトレース付きで記録 |
| Live Metrics    | リアルタイムでCPU使用率、リクエスト数、エラー率を確認       |
| Application Map | サービス間の依存関係をトポロジ図で可視化                    |
| スマート検出    | AIがエラー率の異常上昇などを自動検知しアラート              |
| 可用性テスト    | 複数リージョンから定期的にアプリの応答を監視                |
| KQLクエリ       | Log Analyticsでテレメトリデータを柔軟にクエリ               |

### Classic SDKからOpenTelemetryへ

2025年以降、MicrosoftはOpenTelemetryベースのSDKを新規プロジェクトの公式推奨としている。従来のApplication Insights SDK（Classic SDK）は引き続き動作するが、今後の機能追加はOpenTelemetry側に集中する方針。Classic SDKの一部機能（マルチステップ可用性テストなど）はまだ移植されていないものがあるため、移行時は[公式の移行ガイド](https://learn.microsoft.com/en-us/azure/azure-monitor/app/migrate-to-opentelemetry)で差分を確認する必要がある。

## Azureサービスとの連携

App Insightsの大きな強みは、Azureの主要サービスとネイティブに統合できる点にある。ここではApp Service、Azure Functions、API Managementとの連携パターンを整理する。

### App Service: 自動インストルメンテーション

App Serviceとの連携は最もシンプルで、**コード変更なし**で有効化できる（自動インストルメンテーション、旧称codeless attach）。

Azureポータルで App Service → Application Insights → 「有効にする」を選択するだけで、リクエスト追跡・依存関係追跡・例外追跡が自動的に始まる。内部的にはApp Serviceのランタイムにエージェントが注入され、テレメトリを収集する仕組み。

対応する言語とランタイムは以下の通り。

| ランタイム     | 自動収集される内容                                              |
| -------------- | --------------------------------------------------------------- |
| ASP.NET / Core | リクエスト、依存関係、例外、パフォーマンスカウンター            |
| Java           | Application Insights Java 3.xが自動注入。追加設定でカスタム可能 |
| Node.js        | リクエスト、依存関係。環境変数で追加設定可能                    |
| Python         | Django, FastAPI, Flask, psycopg2, requestsなどを自動計装        |

**注意点として、自動インストルメンテーションとSDKベースの手動計装を同時に有効にすると、手動計装側のみが有効になる。** 重複データ送信を防ぐ仕組みだが、意図せず自動計装が無効になっていないか確認しておきたい。

接続文字列はアプリ設定 `APPLICATIONINSIGHTS_CONNECTION_STRING` に自動設定される。インストルメンテーションキーは2025年3月にサポート終了しているため、接続文字列を使うこと。

### Azure Functions: host.jsonによるサンプリング制御

Azure Functionsでは、関数アプリ作成時にApp Insightsとの統合が自動的に有効化される。関数の実行ごとにリクエスト・依存関係・ログが収集される。

Functions固有の重要な設定が `host.json` でのサンプリング制御になる。

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  }
}
```

`excludedTypes: "Request"` は、リクエストテレメトリをサンプリング対象から除外し全数収集する設定。関数の実行回数を正確に把握したい場合に有用。一方、ログやトレースはサンプリングされるためコストを抑えられる。

**Functionsでよくあるトラブルが「ログが一部出力されない」問題で、原因はほぼサンプリング。** デフォルトでサンプリングが有効なため、開発中やデバッグ時に `isEnabled: false` に設定しないとログが欠落して混乱する。環境変数でのオーバーライドも可能。

```bash
# local.settings.jsonやアプリ設定で、サンプリングを無効化
AzureFunctionsJobHost__logging__applicationInsights__samplingSettings__isEnabled=false
```

.NET Isolatedモデルでは、ログの送信パイプラインが2系統ある点にも注意が必要。`Language Worker → Functions Host → App Insights`（host.jsonで制御）と `Language Worker → App Insights`（Program.csで制御）の2つがあり、後者を使う場合はhost.jsonのサンプリング設定が効かない。

### API Management: APIレベルのテレメトリ

API Management（APIM）との統合では、APIゲートウェイを通過するすべてのリクエストのテレメトリをApp Insightsに送信できる。設定はAzureポータルの APIM → Application Insights でインスタンスを追加し、各APIで送信先を選択する。

APIMならではの特徴は以下の通り。

- **APIレベルの粒度**: API単位、オペレーション単位でテレメトリの有効/無効を制御できる
- **カスタムメトリクスの出力**: `emit-metric` ポリシーでカスタムメトリクスをApp Insightsに送信可能。たとえば `azure-openai-emit-token-metric` ポリシーでAzure OpenAIのトークン使用量を記録できる
- **診断設定（リソースログ）**: テレメトリとは別に、APIMのリソースログ（ゲートウェイログなど）をLog Analyticsにエクスポートする診断設定も併用すべき。デフォルトではリソースログは記録されないため、明示的に設定しないと後からのトラブルシュートで困る

**パフォーマンスへの影響には注意が必要。** Microsoftの負荷テストによると、全イベントを記録した場合、リクエストが毎秒1,000件を超えるとスループットが40〜50%低下する。本番環境ではサンプリングや記録レベルの調整が不可欠になる。

### 連携のまとめ

| サービス       | 有効化方法                   | 主な設定箇所                | 注意点                                  |
| -------------- | ---------------------------- | --------------------------- | --------------------------------------- |
| App Service    | ポータルでワンクリック       | アプリ設定（環境変数）      | 手動SDK計装との競合                     |
| Azure Functions | 関数アプリ作成時に自動有効化 | host.json                   | サンプリングによるログ欠落              |
| API Management | ポータルでAPI単位に設定      | APIMポリシー + 診断設定     | 高負荷時のスループット低下              |

いずれのサービスでも、**自動インストルメンテーションで基本的なテレメトリは取得できるが、カスタムメトリクスやビジネスイベントの記録にはSDKベースの計装が必要になる。** この先の章で解説するOpenTelemetry導入パターンは、この手動計装をどう設計するかの話になる。

## OpenTelemetryの導入パターン: Distroか、素のOTelか

App Insightsにテレメトリを送る方法は複数あり、ベンダーロックインの許容度によって選択が変わる。ここが設計上の重要な分岐点になる。

### パターン1: Azure Monitor Distro（Microsoftの推奨）

MicrosoftはAzure Monitor OpenTelemetry Distroを公式推奨している。「Distro」はOpenTelemetryの用語で、ベンダーがOTelコンポーネントをバンドルしてカスタマイズしたパッケージを指す。

```csharp
// .NET の場合（1行で有効化）
builder.Services.AddOpenTelemetry().UseAzureMonitor(options =>
{
    options.ConnectionString = "<your-connection-string>";
});
```

```typescript
// Node.js の場合
import { useAzureMonitor } from "@azure/monitor-opentelemetry";

useAzureMonitor({
	azureMonitorExporterOptions: {
		connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
	},
});
```

```python
# Python の場合
from azure.monitor.opentelemetry import configure_azure_monitor

configure_azure_monitor(
    connection_string="<your-connection-string>",
)
```

Distroが素のOTelに対して追加する機能は以下の通り。

- オフラインストレージとリトライ（ネットワーク障害時にテレメトリをローカルに保存）
- Live Metricsのサポート
- Azure Resource Detectors（App Service、AKSなどの環境情報を自動付与）
- 頻出の計装ライブラリ（HTTP、SQL、ASP.NET Core等）のバンドル
- Microsoft独自のレートリミットサンプラー

手軽に導入でき、Microsoftのサポートも受けられるのが最大の利点。

**ただし、ベンダーロックインの回避にはならない。** Distroを使うということは、アプリケーションコードに`@azure/monitor-opentelemetry`や`Azure.Monitor.OpenTelemetry.AspNetCore`への依存が入ることを意味する。将来DatadogやGrafana Cloudに乗り換える場合、これらのパッケージの差し替えとコード変更が必要になる。Microsoftは「Our goal is ease-of-use; not vendor-lock」と[主張している](https://devblogs.microsoft.com/dotnet/azure-monitor-opentelemetry-distro/)が、実態として依存は存在する。

### パターン2: 素のOpenTelemetry + OTel Collector

ベンダーロックインを本気で避けたいなら、アプリケーション側は素のOpenTelemetry SDKで計装し、テレメトリの送信先はOTel Collectorに任せるのが正攻法になる。

```
アプリ (素のOTel SDK) → OTLP → OTel Collector → Azure Monitor Exporter → App Insights
                                               → Jaeger Exporter → Jaeger（開発環境）
                                               → OTLP Exporter → Grafana Cloud（将来）
```

このパターンの特徴は以下の通り。

- アプリケーションコードにAzure固有の依存が一切入らない。計装コードはOTelの標準APIのみ
- 送信先の変更はCollectorの設定（YAML）を変えるだけ。アプリの再デプロイが不要
- Collectorでバッチ処理、リトライ、サンプリング、機密データの除去などをアプリ外で制御できる
- マイクロサービスが多い場合にCollectorを集約点として使える

.NETでの素のOTel計装の例を示す。

```csharp
// Program.cs — Azure固有の依存なし
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OpenTelemetry.Metrics;
using OpenTelemetry.Logs;
using OpenTelemetry.Exporter;

var builder = WebApplication.CreateBuilder(args);

var serviceName = "my-service";
var otlpEndpoint = Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT")
    ?? "http://localhost:4317";

builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService(serviceName))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint)))
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint)));

builder.Logging.AddOpenTelemetry(o =>
{
    o.AddOtlpExporter(e => e.Endpoint = new Uri(otlpEndpoint));
});
```

OTel Collectorの設定例。

```yaml title=otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 10s

exporters:
  azuremonitor:
    connection_string: ${APPLICATIONINSIGHTS_CONNECTION_STRING}

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [azuremonitor]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [azuremonitor]
```

**注意点として、OTel CollectorのAzure Monitor Exporterはコミュニティメンテナンスであり、Microsoftの公式サポート対象外。** 本番環境で問題が起きた場合に公式サポートを受けられないリスクがある。この点は導入前にチームで合意しておく必要がある。

### パターン3: ネイティブOTLPエンドポイント（プレビュー）

2026年時点で、App InsightsへのネイティブOTLPインジェストがLimited Public Previewとして提供されている。これが正式リリースされれば、素のOTel SDKからCollectorを介さず直接App Insightsにデータを送れるようになる。

```bash
# プレビュー機能の有効化
az feature register --name OtlpApplicationInsights --namespace Microsoft.Insights
```

このパターンでは、Microsoft Entra ID認証でOTLP/HTTPエンドポイントに直接送信する。Collectorが不要になるため、インフラの簡素化につながる。ただし、プレビュー段階のため本番利用にはリスクがある。

### どのパターンを選ぶべきか

| 判断軸               | Azure Monitor Distro | 素のOTel + Collector    | ネイティブOTLP     |
| -------------------- | -------------------- | ----------------------- | ------------------ |
| ベンダーロックイン   | あり（SDK依存）      | なし                    | なし               |
| セットアップの手軽さ | 非常に簡単           | Collector構築が必要     | 簡単（プレビュー） |
| 公式サポート         | あり                 | Collectorはコミュニティ | プレビュー         |
| Live Metrics         | 対応                 | 非対応                  | 未確認             |
| オフラインリトライ   | 内蔵                 | Collector側で対応       | 不明               |
| マルチバックエンド   | 追加設定で可能       | Collectorで容易         | 不可               |

実用的な判断基準としては以下のようになる。

- Azureに当面コミットしていて、サポートと手軽さを優先するならDistroが合理的
- マルチクラウドの可能性があるか、バックエンドの乗り換えを想定するなら素のOTel + Collector
- サービス数が少なく、将来のOTLP GAを見据えて早期検証したいならネイティブOTLP

いずれのパターンでも、接続文字列は環境変数 `APPLICATIONINSIGHTS_CONNECTION_STRING` に設定し、コード中にはハードコードしない。

テレメトリの収集方法を決めたら、次はそのデータをどう分析するかが重要になる。

## KQLクエリの実例パターン

App Insightsの最大の強みの1つが、KQL（Kusto Query Language）による柔軟なテレメトリ分析にある。Azureポータルの「ログ」ブレードから直接クエリを実行でき、SQLに似た構文でありながらパイプ演算子（`|`）でデータ変換を連鎖させるスタイルが特徴的。以下に、障害調査やパフォーマンス分析でよく使うクエリパターンを整理する。

### 遅いリクエストの特定

```kql
requests
| where duration > 1000  // 1秒以上のリクエスト
| project timestamp, name, url, duration, resultCode, operation_Id
| order by duration desc
| take 50
```

### エラー率の時系列推移

```kql
requests
| summarize
    totalCount = count(),
    failedCount = countif(success == false)
    by bin(timestamp, 1h)
| extend failureRate = round(100.0 * failedCount / totalCount, 2)
| project timestamp, totalCount, failedCount, failureRate
| order by timestamp asc
```

### 特定の例外の分析

```kql
exceptions
| where timestamp > ago(24h)
| where type contains "NullReference"
| summarize count() by type, outerMessage, problemId
| order by count_ desc
```

### 依存関係（外部API・DB）のパフォーマンス分析

```kql
dependencies
| where timestamp > ago(24h)
| summarize
    avgDuration = avg(duration),
    p95Duration = percentile(duration, 95),
    failureRate = round(100.0 * countif(success == false) / count(), 2),
    callCount = count()
    by target, type, name
| order by p95Duration desc
```

### エンドツーエンドトランザクションの追跡

```kql
// 特定のoperation_Idでリクエスト→依存関係→例外を横断的に追跡
union requests, dependencies, exceptions
| where operation_Id == "<target-operation-id>"
| project timestamp, itemType, name, duration, success, type
| order by timestamp asc
```

### ユーザー行動分析（カスタムイベント）

```kql
customEvents
| where timestamp > ago(7d)
| where name == "PurchaseCompleted"
| summarize purchaseCount = count() by bin(timestamp, 1d)
| render timechart
```

KQLの習熟には時間がかかるが、上記のパターンをベースにカスタマイズしていくことで、ほとんどの障害調査やパフォーマンス分析に対応できる。Azureポータルには「クエリ例」が用意されているので、そこから始めるのもよい。

## 分散トレーシングの実例

モノリスであればスタックトレースを追えば原因にたどり着けるが、マイクロサービスアーキテクチャでは1つのリクエストが複数のサービスを横断するため、どのサービスで遅延やエラーが発生しているか特定するのが難しい。App Insightsの分散トレーシングはこの課題を解決する。

### W3C Trace-Contextによる相関

App InsightsはW3C Trace-Contextプロトコルをサポートしており、`traceparent`ヘッダーでサービス間のリクエストを自動相関する。OpenTelemetry SDKを使えば、追加設定なしでこの相関が有効になる。

### Application Mapによる可視化

Application Mapは、サービス間の依存関係をトポロジ図として表示する。各ノードには以下の情報が表示される。

- 平均応答時間
- エラー率
- リクエスト数
- サービス名（cloud role name）

cloud role nameはSDK設定でカスタマイズ可能で、マイクロサービスごとに意味のある名前を付けることが推奨されている。

### 実例: ECサイトでのボトルネック特定

ある事例では、ECサイトの注文処理が断続的に遅延する問題があった。App Insightsのエンドツーエンドトランザクション詳細を使い、以下のフローを可視化した。

```
フロントエンド → API Gateway → 注文サービス → 在庫サービス → DB
                                            → 決済サービス → 外部決済API
```

分析の結果、在庫サービスからDBへのクエリが商品カタログの増大とともにP95レイテンシが悪化していることが判明。インデックス追加とクエリ最適化で解決した。

テレメトリの収集と分析ができたら、次に重要なのは「問題が起きたときに気づける仕組み」——アラートの設計になる。

## スマートアラートの設計パターン

アラート設計は「少なすぎず多すぎず」のバランスが最も難しい。アラートが多すぎるとチームがアラート疲れを起こし、本当に重要なアラートを見逃すリスクがある。以下の階層構造が実践的と言われている。

| レベル        | 条件例                             | 通知先             |
| ------------- | ---------------------------------- | ------------------ |
| Critical      | アプリダウン、エラー率 > 5%        | PagerDuty / 電話   |
| Warning       | エラー率 > 1%、P95レイテンシ > 3秒 | Slack / Teams      |
| Informational | 異常なトラフィックパターン         | メール / Dashboard |

### スマート検出（AIベース）

App Insightsのスマート検出は設定不要で動作し、以下を自動検知する。

- エラー率の異常上昇
- 応答時間の異常な劣化
- 依存関係の障害率の変化

検知時には自動でメール通知が送られる。これはベースラインとして有用だが、ビジネス要件に合わせたカスタムアラートも併用したい。

## コスト最適化の実践

App Insightsを運用する上で、避けて通れないのがコストの問題になる。課金は主に「インジェスト（取り込み）」と「リテンション（保持）」の2軸で発生する。2026年3月時点の料金体系は以下の通り。

| 項目                           | 料金              | 備考                                               |
| ------------------------------ | ----------------- | -------------------------------------------------- |
| インジェスト（従量課金）       | 約$2.30/GB        | 月5GBまで無料                                      |
| インジェスト（コミットメント） | 約$1.50〜$1.96/GB | 100GB/日〜。最大30%割引                            |
| インタラクティブ保持           | 約$0.10/GB/月     | 最初31日間は無料（App Insightsテーブルは90日無料） |
| アーカイブ保持                 | 約$0.02/GB/月     | インタラクティブの1/5のコスト                      |

何も考えずにすべてのログを送り、長期間保持すると予想外の請求が来ることがある。実際に、テレメトリを大量に取得しているあるパートナー企業では、Data Collection Rulesやサンプリングを設定しない状態で、大規模顧客1社あたり月額$178に達したケースが[報告されている](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/telemetry-control-cost)。

コスト最適化は「サンプリング」「保持期間」「フィルタリング」「日次上限」の4つのレバーで行う。

### サンプリング: テレメトリ量の最大のコントロール手段

サンプリングはデータ量を削減しつつ統計的な正確性を保つ仕組みで、適切に設定すれば**75%以上のコスト削減**が可能になる。ただし、メトリクスはサンプリング対象外で、常に全数収集される点に注意。

OpenTelemetry Distroでは2つのサンプリング戦略を選択できる。

#### 固定レート（Fixed-rate）サンプリング

トレースの一定割合を送信する。0.1なら約10%のトレースがApp Insightsに送られる。

```csharp
// .NET — 固定レートサンプリング（10%）
builder.Services.AddOpenTelemetry().UseAzureMonitor(options =>
{
    options.ConnectionString = connectionString;
    options.SamplingRatio = 0.1F;
});
```

```python
# Python — 固定レートサンプリング（10%）
configure_azure_monitor(
    connection_string="<connection-string>",
    sampling_ratio=0.1,
)
```

環境変数でも設定できる。コードの変更なしにサンプリング率を変更可能なので、こちらの方が運用しやすい。

```bash
export OTEL_TRACES_SAMPLER="microsoft.fixed_percentage"
export OTEL_TRACES_SAMPLER_ARG="0.1"
```

固定レートはコスト予測がしやすいのが利点。たとえば10%に設定すれば、インジェスト量は約1/10になる。複数サービスでサンプリング率を揃えやすいため、マイクロサービス環境での相関分析にも向いている。

#### レートリミット（Rate-limited）サンプリング

1秒あたりの最大トレース数を指定する。トラフィックが少ないときは全数送信し、急増したときだけ間引く。

```bash
export OTEL_TRACES_SAMPLER="microsoft.rate_limited"
export OTEL_TRACES_SAMPLER_ARG="5.0"  # 毎秒最大5トレース
```

Java（3.4.0以降）とNode.js（1.16.0以降）ではレートリミットがデフォルトで有効化されている。それ以前のバージョンやPython/.NETではデフォルトでサンプリングが無効（全数送信）のため、明示的な設定が必要になる。

#### どちらを選ぶか

| 判断軸               | 固定レート         | レートリミット           |
| -------------------- | ------------------ | ------------------------ |
| トラフィックパターン | 安定・予測可能     | バースト的・変動が大きい |
| コスト予測           | しやすい           | しにくい                 |
| 低トラフィック時     | 間引きすぎるリスク | 全数送信で取りこぼさない |
| マルチサービス相関   | 率を揃えやすい     | サービスごとにばらつく   |

実用的なアプローチとしては、まずレートリミットで運用し、安定してきたらそのときのサンプリング率を確認して固定レートに切り替える方法がある。

#### Classic SDKのアダプティブサンプリング

Classic SDK（.NET）ではアダプティブサンプリングがデフォルトで有効。トラフィック量に応じてサンプリング率を自動調整する。`MaxTelemetryItemsPerSecond`（デフォルト5）を基準に、サンプリング率が動的に上下する。OpenTelemetry Distroにはアダプティブサンプリングはなく、固定レートまたはレートリミットの2択になる。

#### インジェストサンプリング（最終手段）

SDK側でサンプリングを設定できない場合に、App Insights側（サーバー側）でデータを間引く方式。ネットワーク転送量は削減されないため、SDKベースのサンプリングに比べて効率が悪い。あくまで最終手段として位置づけられる。

#### サンプリングが正しく動いているか確認する

サンプリング設定後は、KQLで`itemCount`フィールドを確認する。`itemCount`が1より大きければ、そのレコードは複数のテレメトリを代表しており、サンプリングが機能している。

```kql
requests
| where timestamp > ago(1h)
| summarize count(), avg(itemCount) by bin(timestamp, 5m)
```

### 保持期間（リテンション）: インタラクティブとアーカイブの使い分け

保持期間の設定はコストに直結する。App InsightsのデータはバックエンドのLog Analyticsワークスペースに格納されるため、Log Analyticsのリテンション設定が適用される。

#### インタラクティブ保持とアーカイブ保持

2つのティアがあり、コストが5倍異なる。

- インタラクティブ保持（約$0.10/GB/月）: 通常のKQLでクエリ可能。App Insightsテーブルは90日間無料
- アーカイブ保持（約$0.02/GB/月）: 検索ジョブまたはリストア経由でのみアクセス可能。最大12年まで

たとえばインタラクティブ保持を90日→30日に短縮し、残りをアーカイブに回すだけで、保持コストを**40〜60%削減**できる。

#### テーブル別の保持期間設定

すべてのテーブルに同じ保持期間を適用する必要はない。テーブルごとに異なる設定が可能で、データの価値に応じて使い分ける。

| テーブル            | 推奨インタラクティブ保持 | 推奨アーカイブ | 理由                                       |
| ------------------- | ------------------------ | -------------- | ------------------------------------------ |
| requests            | 90日                     | 必要に応じて   | 障害分析・パフォーマンス分析で頻繁に参照   |
| dependencies        | 30〜60日                 | 不要           | 直近の依存関係パフォーマンスが分かれば十分 |
| exceptions          | 90日                     | 必要に応じて   | バグ調査で過去の例外パターンを参照         |
| traces              | 14〜30日                 | 不要           | 詳細ログは短期間で価値が下がる             |
| performanceCounters | 30日                     | 不要           | トレンド分析には集計済みメトリクスを使う   |
| customEvents        | 90〜180日                | 長期保存       | ビジネスメトリクスは長期トレンドが重要     |

#### アーカイブデータへのアクセス方法

アーカイブされたデータは通常のKQLでは検索できない。アクセスには2つの方法がある。

1. 検索ジョブ: KQLクエリをアーカイブに対して実行し、結果を新しいテーブルに出力する。スキャンしたデータ量に応じた課金が発生する
2. リストア: アーカイブデータを一時的にインタラクティブ保持に復元する。復元中は通常のKQLでクエリ可能。最低12時間・2TBの課金が発生するため、少量のデータには割高

コンプライアンス要件で長期保持が必要だが頻繁にはアクセスしないデータは、アーカイブが最適解になる。

### フィルタリング: そもそも不要なデータを送らない

サンプリングが「全体を均等に間引く」のに対し、フィルタリングは「特定の不要なデータを除外する」アプローチになる。

#### テレメトリプロセッサによる除外

コード内でテレメトリプロセッサを使い、不要なリクエストを除外する。

```csharp
// .NET — ヘルスチェックを除外するプロセッサ
public class HealthCheckFilter : BaseProcessor<Activity>
{
    public override void OnEnd(Activity activity)
    {
        if (activity.DisplayName == "GET /health" ||
            activity.DisplayName == "GET /ready")
        {
            activity.ActivityTraceFlags &= ~ActivityTraceFlags.Recorded;
        }
    }
}

// 登録
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddProcessor<HealthCheckFilter>());
```

#### Data Collection Rules（DCR）による除外

Azure側でData Collection Rulesを設定し、インジェスト前にデータをフィルタリングする方法もある。コード変更不要で、Azure Portal上で設定できる。ワークスペースベースのApp Insightsリソース（最近作成されたものはデフォルトでワークスペースベース）で利用可能。

#### よくある除外対象

- ヘルスチェックエンドポイント（`/health`、`/ready`、`/liveness`）
- 静的ファイルのリクエスト（CSS、JS、画像）
- ロードバランサーのヘルスプローブ
- 成功したdependency呼び出しのうち、頻度が高く問題のないもの

### 日次上限: 最後の安全ネット

日次上限（Daily Cap）は、1日あたりのインジェスト量に上限を設定する機能。上限に達するとその日のデータ収集が停止する。

日次上限はコスト管理の主手段ではなく、あくまで安全ネットとして使うべきもの。上限に達するとテレメトリ収集が止まり、その間はアラートも発火しなくなる。障害が起きているのにデータが来ないという最悪のシナリオを招く可能性がある。

日次上限を設定する場合は、通常のインジェスト量の2〜3倍程度に設定し、上限の70〜80%に達したらメール通知を送る設定にしておくのが実践的。

### コスト把握のためのKQLクエリ

コスト管理の第一歩は、現状のインジェスト量と内訳を把握すること。

```kql
// テーブル別のデータインジェスト量（過去30日）
Usage
| where TimeGenerated > ago(30d)
| summarize DataIngested_GB = round(sum(Quantity) / 1024, 2) by DataType
| order by DataIngested_GB desc
```

```kql
// 直近7日間の日別インジェスト量推移
Usage
| where TimeGenerated > ago(7d)
| summarize DailyIngested_GB = round(sum(Quantity) / 1024, 2) by bin(TimeGenerated, 1d)
| order by TimeGenerated asc
```

```kql
// どのテレメトリソースがコストを押し上げているか特定
union requests, dependencies, exceptions, traces, customEvents
| where timestamp > ago(7d)
| summarize count() by itemType
| order by count_ desc
```

これらのクエリで「何がコストを食っているか」を把握した上で、サンプリング率の調整・フィルタリング対象の選定・保持期間の最適化を順に進めるのが効果的になる。

## まとめ

App Insightsは、Azureを主軸にしたアプリケーション運用において、コストパフォーマンスの高いAPMソリューションと言える。KQLによる柔軟な分析・分散トレーシング・AIベースの異常検知が統合的に提供されており、小規模なアプリから大規模なマイクロサービスまで対応できる。

テレメトリ収集の設計が最初の重要な分岐点になる。Azure Monitor Distroは手軽な反面ベンダー依存が入り、素のOTel + Collectorはロックインフリーな反面運用コストが上がる。チームのマルチクラウド戦略やサポート要件に応じて判断したい。

導入にあたっては以下の順序で段階的に進めるのが実践的と考える。

1. テレメトリ収集パターンを決める（Distro / 素のOTel + Collector / ネイティブOTLP）
2. 基本メトリクス（リクエスト数、エラー率、応答時間）のダッシュボードを作成
3. サンプリング・日次上限を早い段階で設定し、想定外の課金を防ぐ
4. 障害調査・パフォーマンス分析用のKQLクエリを事前に用意
5. 階層的なアラート戦略を設計し、段階的に設定

## 参考リンク

- [Application Insights OpenTelemetry の可観測性の概要 - Microsoft Learn](https://learn.microsoft.com/ja-jp/azure/azure-monitor/app/app-insights-overview)
- [Application Insights SDK の有効化 - Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable)
- [OpenTelemetry on Azure - Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry)
- [Announcing Azure Monitor OpenTelemetry Distro - .NET Blog](https://devblogs.microsoft.com/dotnet/azure-monitor-opentelemetry-distro/)
- [Azure Monitor Exporter - opentelemetry-collector-contrib](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/exporter/azuremonitorexporter/README.md)
- [OpenTelemetry vs Azure Monitor - SigNoz](https://signoz.io/comparisons/opentelemetry-vs-azure-monitor/)
- [Classic SDK からの移行ガイド - Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/app/migrate-to-opentelemetry)
- [OpenTelemetryでのサンプリング - Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-sampling)
- [テレメトリサンプリング（Classic API） - Microsoft Learn](https://learn.microsoft.com/ja-jp/azure/azure-monitor/app/sampling-classic-api)
- [Application Insights コスト最適化 - Azure Well-Architected Framework](https://learn.microsoft.com/ja-jp/azure/well-architected/service-guides/application-insights/cost-optimization)
- [Azure Monitor Logs コスト計算 - Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/cost-logs)
- [Log Analyticsワークスペースのデータ保持管理 - Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/data-retention-configure)
- [Application Insights のアーキテクチャベストプラクティス - Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/service-guides/application-insights)
- [高データインジェストのトラブルシュート - Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/azure/azure-monitor/app-insights/telemetry/troubleshoot-high-data-ingestion)
- [App Serviceでのアプリケーション監視を有効にする - Microsoft Learn](https://learn.microsoft.com/ja-jp/azure/azure-monitor/app/codeless-app-service)
- [Azure Functionsの監視を構成する - Microsoft Learn](https://learn.microsoft.com/ja-jp/azure/azure-functions/configure-monitoring)
- [Azure API ManagementとApplication Insightsを統合する - Microsoft Learn](https://learn.microsoft.com/ja-jp/azure/api-management/api-management-howto-app-insights)
- [Azure API Managementのログや監視にまつわるアレコレ - ayuina CSA Blog](https://ayuina.github.io/ainaba-csa-blog/monitoring-api-management/)
