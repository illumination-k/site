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

| 判断軸 | Azure Monitor Distro | 素のOTel + Collector | ネイティブOTLP |
| --- | --- | --- | --- |
| ベンダーロックイン | あり（SDK依存） | なし | なし |
| セットアップの手軽さ | 非常に簡単 | Collector構築が必要 | 簡単（プレビュー） |
| 公式サポート | あり | Collectorはコミュニティ | プレビュー |
| Live Metrics | 対応 | 非対応 | 未確認 |
| オフラインリトライ | 内蔵 | Collector側で対応 | 不明 |
| マルチバックエンド | 追加設定で可能 | Collectorで容易 | 不可 |

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

App Insightsを運用する上で、避けて通れないのがコストの問題になる。テレメトリデータの量に応じた従量課金（2026年3月時点でインジェスト5GB/月まで無料、超過分は約$2.30/GB）のため、何も考えずにすべてのログを送ると予想外の請求が来ることがある。

### サンプリングの活用

サンプリングはデータ量を削減しつつ統計的な正確性を保つ仕組み。3種類のサンプリングがある。

| 種類                     | 動作場所              | 特徴                                                              |
| ------------------------ | --------------------- | ----------------------------------------------------------------- |
| アダプティブサンプリング | SDK（クライアント側） | トラフィック量に応じて自動でサンプリング率を調整。推奨            |
| 固定レートサンプリング   | SDK（クライアント側） | 指定した割合でサンプリング。予測可能性が高い                      |
| インジェストサンプリング | サーバー側            | SDKを変更できない場合の最終手段。ネットワーク転送量は削減されない |

### サンプリング以外のコスト削減策

- 日次上限を設定し、想定外のテレメトリ急増による課金を防ぐ
- ログレベルを調整する。Debug/Traceレベルのログは本番環境では抑制する
- 不要なテレメトリモジュールを無効化し、使わないデータ収集はオフにする
- テレメトリフィルターを活用する。ヘルスチェックエンドポイントなど、分析不要なリクエストを除外する
- 保持期間を最適化する。デフォルト90日の保持期間を必要最小限に調整する
- コミットメントレベルを活用する。一定のデータ量を事前コミットすることで最大30%割引になる

### コスト見積もりの目安

コスト管理の第一歩は、Log Analyticsワークスペースのインジェスト量を把握すること。以下のKQLでデータ量を確認できる。

```kql
// テーブル別のデータインジェスト量（過去30日）
Usage
| where TimeGenerated > ago(30d)
| summarize DataIngested_MB = sum(Quantity) by DataType
| order by DataIngested_MB desc
```

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
- [テレメトリサンプリング - Microsoft Learn](https://learn.microsoft.com/ja-jp/azure/azure-monitor/app/sampling-classic-api)
- [Application Insights コスト最適化 - Azure Well-Architected Framework](https://learn.microsoft.com/ja-jp/azure/well-architected/service-guides/application-insights/cost-optimization)
- [Application Insights のアーキテクチャベストプラクティス - Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/service-guides/application-insights)
