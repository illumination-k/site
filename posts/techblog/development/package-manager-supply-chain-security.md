---
uuid: 0b64ccc8-009a-4413-b51c-70a9565c37fa
title: "パッケージマネージャーのサプライチェーン攻撃対策 — uv, pnpm, bun, cargo, go の比較"
description: "LiteLLMサプライチェーン攻撃を背景に、uv・pnpm・bun・cargo・goのminimumReleaseAge/exclude-newer等の防御機能を比較し、パッケージマネージャーが提供するサプライチェーンセキュリティ対策を解説します。"
category: techblog
lang: ja
tags:
  - ai-generated
  - security
  - supply-chain
  - package-manager
  - uv
  - pnpm
  - bun
  - cargo
  - go
created_at: 2026-03-26
updated_at: 2026-03-26
---

## TL;DR

- 2026年3月のLiteLLMサプライチェーン攻撃では、侵害されたTrivy経由でPyPI公開トークンが窃取され、悪意あるバージョンが約3時間公開された。パッケージマネージャーのリリース直後のバージョンを自動取得する動作が攻撃を容易にしている
- **最小リリース経過時間（minimum release age）** は、公開直後のバージョンをインストールしない防御機能。uv (`--exclude-newer`)、pnpm (`minimumReleaseAge`)、bun (`minimumReleaseAge`) が対応済み。Cargo は nightly で `--publish-time` が実験中、Go は MVS（最小バージョン選択）で構造的に緩和
- ビルドスクリプトの制限、lockfile の厳密な固定、provenance attestation、依存関係の監査ツールなど、パッケージマネージャーごとに多層的な防御策が提供されている

## 機能比較サマリー

| 機能                     | uv                        | pnpm                           | bun                            | Cargo                      | Go                 |
| ------------------------ | ------------------------- | ------------------------------ | ------------------------------ | -------------------------- | ------------------ |
| **最小リリース経過時間** | `--exclude-newer`         | `minimumReleaseAge`            | `minimumReleaseAge`            | `--publish-time` (nightly) | — (MVS で緩和)     |
| **パッケージ単位の除外** | `exclude-newer-package`   | `minimumReleaseAgeExclude`     | `minimumReleaseAgeExcludes`    | —                          | —                  |
| **lockfile 固定モード**  | `--locked` / `--frozen`   | `--frozen-lockfile`            | `--frozen-lockfile` / `bun ci` | `--frozen` / `--locked`    | `go.sum` + proxy   |
| **ハッシュ検証**         | ○                         | ○                              | ○                              | ○                          | ○ (sum.golang.org) |
| **ビルドスクリプト制限** | — (wheel ベース)          | `allowBuilds` (v10 デフォルト) | `trustedDependencies`          | —                          | —                  |
| **provenance**           | —                         | `trustPolicy`                  | —                              | —                          | —                  |
| **脆弱性スキャン**       | `uv-secure` / `pip-audit` | `pnpm audit`                   | `bun audit`                    | `cargo-audit`              | `govulncheck`      |
| **コード監査**           | —                         | —                              | —                              | `cargo-vet` / `cargo-crev` | —                  |

## 背景: LiteLLM サプライチェーン攻撃（2026年3月）

### 事件の概要

2026年3月24日、Pythonパッケージ [litellm](https://github.com/BerriAI/litellm)（月間約9,500万ダウンロード）の悪意あるバージョン **1.82.7** と **1.82.8** がPyPIに公開された。攻撃者は **TeamPCP**（PCPcat, ShellForce とも）と呼ばれるグループで、多段階のサプライチェーン攻撃を実行した。

### 攻撃チェーン

```
Trivy (セキュリティスキャナ) 侵害
  ↓ GitHub Action の Git タグを書き換え
LiteLLM の CI/CD パイプラインが侵害された Trivy を実行
  ↓ PyPI 公開トークンを窃取
悪意ある litellm v1.82.7/v1.82.8 を PyPI に公開
  ↓ 約3時間の公開
PyPI がパッケージを検疫・削除
```

この攻撃の特徴は、**GitHubリポジトリのソースコードは改変されていない**点にある。悪意あるコードはホイールビルド時に注入され、PyPIに直接公開された。つまりソースコードのレビューだけでは防げない。

### 悪意あるコードの動作

マルウェアは3段階のペイロードで構成されていた。

| 段階    | 動作                                                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stage 1 | Base64デコード・AES-256-CBC暗号化で収集データを `models.litellm[.]cloud` に送信                                                                              |
| Stage 2 | 環境変数、SSH鍵、AWS/GCP/Azure認証情報、Kubernetesシークレット、暗号通貨ウォレット、Slack/Discordトークン等を網羅的に収集                                    |
| Stage 3 | systemdサービスとして永続化し、50分ごとにC2サーバーからペイロードを取得。Kubernetes環境では全ノードに特権Podを作成しホストファイルシステムにバックドアを設置 |

注目すべきは2つのバージョンで**異なる注入手法**が使われた点。v1.82.7は`litellm/proxy/proxy_server.py`にBase64ペイロードを埋め込み、proxyモジュールのimport時に実行された。v1.82.8ではより危険な手法に切り替わり、`litellm_init.pth`を`site-packages/`に配置した。`.pth`ファイルはPythonインタプリタ起動時に**importなしで自動実行**されるため、litellmを明示的にインポートしなくても、同じ環境内で任意のPythonスクリプトを実行するだけでペイロードが発火する。

### 発見の経緯

- **Sonatype**の自動マルウェア検出ツールが公開後「数秒以内」にパッケージをブロックしたが、PyPIの検疫完了まで約3時間を要した
- **FutureSearch**のリサーチャーは、AIコードエディタ**Cursor**内で動作するMCPプラグインが**推移的依存関係**としてlitellmを取得した際に侵害を発見した。被害者は直接`pip install litellm`を実行していない
- コミュニティがGitHub issue #24512で警鐘を鳴らすと、攻撃者は侵害したメンテナアカウントを使い**102秒間に73アカウントから88件のボットコメント**を投稿して問題を隠蔽しようとし、issueを「not planned」としてクローズした

### 影響と教訓

- 悪意あるバージョンの公開から検疫まで**約3時間**。この間にインストールしたユーザーが影響を受けた
- v1.82.6が最後の安全なバージョン
- TeamPCPの一連のキャンペーンでは、Trivy、Checkmarx KICS、45以上のnpmパッケージも侵害され、5日間でGitHub Actions、Docker Hub、npm、Open VSX、PyPIにまたがる攻撃が展開された
- LiteLLMの公式Dockerイメージは`requirements.txt`で依存関係を固定していたため影響を受けなかった — **lockfileの固定が有効に機能した実例**

この事件は、**公開直後のパッケージバージョンを無条件にインストールするパッケージマネージャーの動作**がサプライチェーン攻撃を容易にしていることを明確に示した。

## 最小リリース経過時間（Minimum Release Age）

最小リリース経過時間は、公開から一定時間が経過していないバージョンをインストール対象から除外する機能である。多くの悪意あるパッケージは公開後24時間以内に検出・削除されるため、この「クールダウン期間」を設けることで攻撃のウィンドウを大幅に狭められる。

### uv: `--exclude-newer`

uvは最も早くこの機能を実装したパッケージマネージャーの一つで、`--exclude-newer`オプションで指定した日時以降に公開されたバージョンを除外できる。

```toml title=pyproject.toml
[tool.uv]
exclude-newer = "2026-03-20T00:00:00Z"
```

絶対的なタイムスタンプだけでなく、期間ベースの指定も可能。フレンドリーな形式（`"24 hours"`, `"1 week"`, `"30 days"`）またはISO 8601形式（`"PT24H"`, `"P7D"`, `"P30D"`）が使える。環境変数`UV_EXCLUDE_NEWER`でも設定できる。

```bash
# 3日以内に公開されたバージョンを除外
uv lock --exclude-newer "3 days"

# 特定パッケージのみ除外設定を上書き
uv lock --exclude-newer "3 days" --exclude-newer-package "fastapi="
```

`pyproject.toml`の`[tool.uv]`セクションで恒久的に設定でき、パッケージ単位の除外（`exclude-newer-package`）もサポートしている。

なお、`--exclude-newer`はレジストリがPEP 700の`upload-time`フィールドをサポートしている必要がある。PyPIは全パッケージでサポート済み。`upload-time`がないディストリビューションは利用不可として扱われる。

uvのlockfileは全パッケージの**暗号学的ハッシュ**を記録しており、`--locked`フラグで`uv.lock`と`pyproject.toml`の整合性チェック、`--frozen`フラグでlockfileの変更を完全に禁止できる。さらに、lockfileを**CycloneDX SBOM**としてエクスポートする機能や、**PEP 751**標準lockfile形式へのエクスポートもサポートしている。

### pnpm: `minimumReleaseAge`

pnpmは**v10.16**（2025年9月）でこの機能を導入した。`pnpm-workspace.yaml`で分単位の設定が可能。

```yaml title=pnpm-workspace.yaml
minimumReleaseAge: 1440          # 1日 = 1440分
minimumReleaseAgeExclude:
  - webpack
  - react
```

この設定により、公開から1440分（24時間）未満のバージョンは解決対象から除外される。レジストリから`time`フィールドを含むフルメタデータを取得する必要があるため、通常のインストールよりやや遅くなる場合がある。レジストリが短縮メタデータで`time`フィールドをサポートしている場合は、`registrySupportsTimeField: true`を設定することで高速化できる。

**制限事項:**

- 既にlockfileに記録されている依存関係には適用されない（lockfileが優先）
- 完全一致で指定されたバージョンには適用されない

### bun: `minimumReleaseAge`

bunは**v1.3**（2025年10月）で同等の機能を追加した。`bunfig.toml`で**秒単位**の設定が可能。

```toml title=bunfig.toml
[install]
minimumReleaseAge = 259200       # 3日 = 259200秒
minimumReleaseAgeExcludes = ["@types/node", "typescript"]
```

CLIオプションとしても利用できる。

```bash
bun add @types/bun --minimum-release-age 259200
```

bunは独自の「安定性検出」ヒューリスティックを持っている。age gateのすぐ外側で複数バージョンが短期間に公開された場合、それらも不安定とみなしてスキップし、より古い安定バージョンを選択する。

### Cargo: `--publish-time`（nightly / 実験的）

Cargoには安定版での最小リリース経過時間機能は存在しない。nightlyツールチェーンで`--publish-time`フラグが実験的に利用可能。

```bash
cargo +nightly generate-lockfile -Zunstable-options --publish-time "2026-03-20T00:00:00Z"
```

ただし、crates.ioのレジストリインデックスにはまだ`pubtime`フィールドが含まれていないため、実用的ではない。安定化の時期は未定。

### Go: MVS（最小バージョン選択）による構造的緩和

Goには最小リリース経過時間に相当する機能はないが、Go Modulesの**Minimum Version Selection（MVS）**が構造的にこの問題を緩和している。

MVSは他のパッケージマネージャーとは逆のアプローチを取る。**要件を満たす最も古いバージョン**を選択する。

```
他のパッケージマネージャー: require >= 1.5.0 → 最新の 1.9.2 をインストール
Go MVS:                     require >= 1.5.0 → 1.5.0 をインストール
```

この設計により、攻撃者が新しい悪意あるバージョンを公開しても、既存のプロジェクトは自動的にそのバージョンを取得しない。バージョンが上がるのは、開発者が明示的に`go get`で更新するか、依存関係のいずれかが新バージョンを要求した場合のみ。

依存ツリーが深いほど、新しいバージョンが伝播するには多くの明示的なアップグレードが必要になる。これがサプライチェーン攻撃に対する**構造的なダンパー**として機能する。また、Go文化として「a little copying is better than a little dependency」（少しのコピーは少しの依存より良い）という哲学があり、豊富な標準ライブラリと`golang.org/x/`エコシステムにより、依存ツリーが小さくなる傾向がある。

加えて、Goのモジュールエコシステムには以下の追加的な保護がある。

- **proxy.golang.org**: モジュールのキャッシングプロキシ。一度キャッシュされたバージョンは改変できない。レジストリアカウントが不要で、importパスがVCS情報を直接埋め込む
- **sum.golang.org**: グローバルなチェックサムデータベース（Merkle tree、Trillianベース）。`go.sum`のハッシュがこの透明性ログと照合され、パッケージの改ざんを検出できる。侵害されたプロキシやモジュール作者が異なるユーザーに異なるコードを配信することは検出される
- **フェッチ・ビルド時のコード実行禁止**: Goツールチェーンの明示的な設計目標として、依存関係の取得やビルドの過程で任意コードが実行されないことが保証されている

## その他のパッケージマネージャーセキュリティ機能

### ビルドスクリプトの制限

npmエコシステムでは`postinstall`等のライフサイクルスクリプトがサプライチェーン攻撃の主要な攻撃ベクタとなっている。

**pnpm v10** はデフォルトでビルドスクリプトをブロックし、`allowBuilds`で明示的にホワイトリスト登録されたパッケージのみ実行を許可する。これは2024年のRspackサプライチェーン攻撃を受けて導入された。

```yaml title=pnpm-workspace.yaml
allowBuilds:
  - esbuild
  - sharp
```

**bun** も同様に、デフォルトでライフサイクルスクリプトをブロックし、`trustedDependencies`で明示的に許可する。

**uv** はwheelベースのインストールを使用するため、`setup.py`の任意コード実行のリスクが構造的に低い。

**Cargo** にはnpmのようなpostinstallフックは存在しないが、ビルドスクリプト（`build.rs`）は存在する。ただしこれはビルド時に実行されるため、インストール時の自動実行とは性質が異なる。

### Provenance と署名

npm は [provenance attestation](https://docs.npmjs.com/generating-provenance-statements/) をサポートしており、パッケージがどのリポジトリ・ワークフローからビルドされたかを**Sigstoreで暗号署名**し、透明性ログ（Rekor）に記録する。**SLSA Build Level 2** を達成している。

pnpmは **`trustPolicy: no-downgrade`**（v10.21）を提供しており、以前のバージョンで署名されていたパッケージが署名なしで公開された場合にインストールを拒否する。

```yaml title=pnpm-workspace.yaml
trustPolicy: no-downgrade
trustPolicyExclude:
  - legacy-package
```

PyPIは **Trusted Publishers**（OIDC）と **PEP 740 attestation** を導入しており、Python 3.14からはSigstoreがCPythonリリースの**唯一**の署名方法となる。

### 依存関係の監査ツール

| ツール        | エコシステム | 特徴                                                |
| ------------- | ------------ | --------------------------------------------------- |
| `pnpm audit`  | npm          | npmアドバイザリデータベースに基づく脆弱性スキャン   |
| `bun audit`   | npm          | 同上                                                |
| `cargo-audit` | Rust         | RustSecアドバイザリDB。yankedクレートの検出も可能   |
| `cargo-vet`   | Rust         | Mozillaが開発。依存関係のコード監査を体系的に管理   |
| `cargo-crev`  | Rust         | 分散型のコードレビューシステム                      |
| `govulncheck` | Go           | Go脆弱性データベース（vuln.go.dev）に基づくスキャン |
| `uv-secure`   | Python       | `uv.lock`をPyPI脆弱性データに照合                   |
| `pip-audit`   | Python       | Pythonパッケージの脆弱性スキャン                    |

特筆すべきは**cargo-vet**で、全サードパーティ依存関係が信頼できるエンティティによってレビュー済みであることを保証する。`cargo vet init`で既存の依存関係を自動的に免除リストに追加できるため、導入時の負荷が低い。差分監査（バージョン間の差分のみレビュー）をサポートし、Mozilla、Google、Meta等の企業が[監査結果を公開共有](https://opensource.googleblog.com/2023/05/open-sourcing-our-rust-crate-audits.html)している。信頼は分散型で、中央データベースではなく信頼する組織のリポジトリから監査データを直接取得する。

**cargo-crev**はcargo-vetとは異なるアプローチを取り、暗号学的に検証可能な**Web of Trust**モデルを採用している。レビュアーが署名付きのコードレビュー「proof」を公開gitリポジトリに公開し、信頼が推移的に伝播する。既存のレビューは[web.crev.dev](https://web.crev.dev/rust-reviews/)で閲覧できる。

### pnpm の追加セキュリティ機能

pnpmはJavaScriptエコシステムで最も包括的なサプライチェーン防御を提供している。

- **`blockExoticSubdeps: true`**: 推移的依存関係がgitリポジトリやtarball URLから解決されることを防ぎ、レジストリソースのみを許可する
- **`trustPolicy: no-downgrade`**: パッケージの信頼レベル（provenance有無）が前バージョンより低下した場合にインストールを拒否する
- **`trustPolicyIgnoreAfter`**（v10.27）: 指定日以前のパッケージに対してtrust policyチェックをスキップ

### 再現可能ビルド

ICSE 2025の研究によると、パッケージの再現可能性はエコシステムによって大きく異なる。

| エコシステム | 再現可能率 | 主な要因                                   |
| ------------ | ---------- | ------------------------------------------ |
| Cargo        | 100%       | アーカイブメタデータに固定値を使用         |
| npm          | 100%       | 同上                                       |
| PyPI         | 12.2%      | flit/hatchバックエンドのみメタデータを固定 |
| Maven        | 2.1%       | アーカイブ内のタイムスタンプ               |
| RubyGems     | 0%         | 同上                                       |

GoogleのOSS Rebuild（2025年7月開始）プロジェクトは、PyPI・npm・crates.ioのパッケージをソースから再ビルドし、セマンティック比較を行った上でSLSA L3のprovenance attestationを発行している。

### レジストリ側の保護: Trusted Publishers

パッケージマネージャーのクライアント側だけでなく、レジストリ側でもセキュリティ強化が進んでいる。**Trusted Publishers**はOIDCを使い、CI/CDプラットフォーム（GitHub Actions、GitLab CI/CD等）から直接パッケージを公開する仕組みで、長期間有効なAPIトークンを不要にする。

| レジストリ | Trusted Publishers | その他の対策 |
| --- | --- | --- |
| PyPI | ~50,000プロジェクトが有効化、全アップロードの~25%が利用 | タイポスクワッティング自動検出、Sigstore attestation |
| npm | 2025年7月開始。ローカル公開に2FA必須化、トークン有効期限を7日に短縮 | SHAIワーム事件後にFIDO/WebAuthn推奨 |
| crates.io | 2025年7月開始（GitHub Actions対応） | `typomania`によるタイポ検出 |

LiteLLM事件では、CI/CDパイプラインから窃取されたPyPIトークンが悪用された。Trusted Publishersを使っていれば、トークンは短命のOIDCトークンに置き換わり、特定のリポジトリ・ワークフローからの公開のみが許可されるため、窃取されたトークンによる別環境からの公開を防止できた可能性がある。

### 新たな脅威: slopsquatting

従来のタイポスクワッティング（`reqeusts`→`requests`等）に加え、**slopsquatting**という新しい攻撃ベクタが出現している。LLMがコード生成時に存在しないパッケージ名を「幻覚」する傾向を悪用し、攻撃者がそのパッケージ名を先に登録する手法である。AIコードエディタの普及に伴い、この脅威は拡大している。

## 推奨対策

LiteLLM事件のような攻撃を防ぐために、以下の多層防御を推奨する。

### 1. 最小リリース経過時間を設定する

```toml title="uv: pyproject.toml"
[tool.uv]
exclude-newer = "3 days"
```

```yaml title="pnpm: pnpm-workspace.yaml"
minimumReleaseAge: 4320  # 3日
```

```toml title="bun: bunfig.toml"
[install]
minimumReleaseAge = 259200  # 3日
```

### 2. CI では lockfile を厳密に固定する

```bash
# uv
uv sync --locked

# pnpm
pnpm install --frozen-lockfile

# bun
bun ci

# Cargo
cargo build --locked

# Go (go.sum が自動的に検証)
go build ./...
```

### 3. ビルドスクリプトを制限する

```yaml title="pnpm: pnpm-workspace.yaml"
allowBuilds:
  - esbuild
  - sharp
  - @biomejs/biome
```

### 4. 定期的に脆弱性スキャンを実行する

```bash
# 各エコシステム
pnpm audit
cargo audit
govulncheck ./...
pip-audit
```

### 5. Provenance を確認する

npmパッケージを公開する場合は`--provenance`フラグを使用し、消費する側はprovenanceの有無を確認する。pnpmの`trustPolicy: no-downgrade`は自動化された確認手段として有効。

## まとめ

LiteLLMへのサプライチェーン攻撃は、パッケージマネージャーが「最新バージョンを即座にインストールする」というデフォルト動作のリスクを明確にした。この攻撃では約3時間の公開で済んだが、その間にインストールした全ユーザーが影響を受けた。

最小リリース経過時間は完璧な防御ではないが、攻撃者が成功する時間的ウィンドウを大幅に狭める。lockfileの厳密な固定、ビルドスクリプトの制限、provenanceの活用と組み合わせることで、多層的な防御を構築できる。

特にGoのMVSやCargoのcargo-vetのように、言語やエコシステムの設計レベルでサプライチェーンセキュリティを考慮するアプローチは、今後他のパッケージマネージャーにも影響を与えていくだろう。

## 参考リンク

- [LiteLLM Official Security Update (March 2026)](https://docs.litellm.ai/blog/security-update-march-2026)
- [Sonatype: Compromised litellm PyPI Package](https://www.sonatype.com/blog/compromised-litellm-pypi-package-delivers-multi-stage-credential-stealer)
- [Datadog Security Labs: LiteLLM compromised on PyPI](https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-teampcp-supply-chain-campaign/)
- [Package Managers Need to Cool Down (Andrew Nesbitt)](https://nesbitt.io/2026/03/04/package-managers-need-to-cool-down.html)
- [pnpm Supply Chain Security](https://pnpm.io/supply-chain-security)
- [pnpm 10.16: minimumReleaseAge](https://socket.dev/blog/pnpm-10-16-adds-new-setting-for-delayed-dependency-updates)
- [uv Resolution Concepts](https://docs.astral.sh/uv/concepts/resolution/)
- [Bun v1.3 Blog](https://bun.com/blog/bun-v1.3)
- [cargo-vet (Mozilla)](https://github.com/mozilla/cargo-vet)
- [How Go Mitigates Supply Chain Attacks](https://go.dev/blog/supply-chain)
- [SLSA Framework](https://slsa.dev/)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements/)
