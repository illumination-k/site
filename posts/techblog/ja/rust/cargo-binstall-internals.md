---
uuid: 36eea43f-5a0a-453a-924f-89b91164f3f6
title: cargo-binstall はどこからバイナリを取得しているのか
description: cargo-binstall の内部実装を実際のソースコードを参照しながら解説する。3段階のフォールバック戦略、QuickInstall の固定署名鍵とテレメトリ、minisign による署名検証の仕組みなど、サプライチェーンの観点から知っておくべきポイントをまとめる。
category: techblog
lang: ja
tags:
  - ai-generated
  - rust
  - supply-chain
  - cargo
created_at: 2026-04-16
updated_at: 2026-04-16
---

## TL;DR

- cargo-binstallはバイナリの取得先を **GhCrateMeta → QuickInstall → Compile** の3段階で解決する
- QuickInstall戦略ではサードパーティがビルドしたバイナリを取得し、ハードコードされたminisign公開鍵で署名検証する
- QuickInstall経由のインストールでは `record-install` エンドポイントにテレメトリが送信される
- 署名ポリシーは `Ignore` / `IfPresent` / `Require` の3段階で、`--only-signed` や `--skip-signatures` フラグで制御できる
- CIでサプライチェーンを意識するなら、戦略の選択と署名ポリシーの設定を明示的に行うべき

## 背景

CIでRust製のCLIツールをインストールする場面は多い。[sccache](https://github.com/mozilla/sccache)、[cargo-nextest](https://github.com/nextest-rs/nextest)、[typos-cli](https://github.com/crate-ci/typos) など、ビルドやテストのパイプラインで活躍するツールは `cargo install` で導入できる。しかし `cargo install` はソースからコンパイルするため、依存クレートの規模によっては数分かかる。CIの実行時間に直結する問題だ。

[cargo-binstall](https://github.com/cargo-bins/cargo-binstall) はこの問題を解決する。ビルド済みバイナリをダウンロードしてインストールするため、秒単位で完了する。便利なツールだが、「どこからバイナリを取ってきているのか」「取得したバイナリは検証されているのか」を把握しないままCIに組み込むのはサプライチェーンの観点からリスクがある。

この記事では、cargo-binstall v1.18.1のソースコード（[commit dc19f1e](https://github.com/cargo-bins/cargo-binstall/tree/dc19f1e48450eefe5a29b8da6c6b00a87d730b37)）を参照しながら、バイナリ取得の仕組みと署名検証のメカニズムを解説する。

## インストール戦略の全体像

cargo-binstallはバイナリの取得先として3つの **fetcher** を持つ。上から順に試行し、成功した時点でインストールが完了する。

1. **GhCrateMeta** — クレートのGitHub Releasesからバイナリを取得する
2. **QuickInstall** — サードパーティ（cargo-quickinstall）が事前ビルドしたバイナリを取得する
3. **Compile** — `cargo install` でソースからコンパイルする（最終フォールバック）

fetcherの実装は [`crates/binstalk-fetchers/src/`](https://github.com/cargo-bins/cargo-binstall/tree/dc19f1e48450eefe5a29b8da6c6b00a87d730b37/crates/binstalk-fetchers/src) 以下にモジュールとして分かれている。

`--strategies` フラグで使用する戦略を明示的に指定したり、`--disable-strategies` で特定の戦略を除外できる。何も指定しなければ上記の順番ですべて試行される。

## GhCrateMeta: クレート公式リリースからの取得

最初に試行されるのがGhCrateMeta戦略だ。crates.ioからクレートのメタデータを取得し、`Cargo.toml` の `repository` フィールドに記載されたリポジトリのGitHub Releasesから対応するバイナリを探す。

### pkg-url テンプレート

クレートのメンテナは `Cargo.toml` の `[package.metadata.binstall]` セクションで、バイナリの配置場所をテンプレートとして宣言できる。

```toml
[package.metadata.binstall]
pkg-url = "{ repo }/releases/download/v{ version }/{ name }-{ target }-v{ version }{ archive-suffix }"
bin-dir = "{ name }-{ target }-v{ version }/{ bin }{ binary-ext }"
pkg-fmt = "tgz"
```

テンプレート内で使える主な変数は以下の通りだ。

| 変数                 | 説明                                                      |
| -------------------- | --------------------------------------------------------- |
| `{ name }`           | クレート名                                                |
| `{ version }`        | バージョン                                                |
| `{ repo }`           | `Cargo.toml` の `repository` フィールド                   |
| `{ target }`         | Rust ターゲットトリプル（例: `x86_64-unknown-linux-gnu`） |
| `{ archive-suffix }` | アーカイブ形式に応じた拡張子（`.tar.gz`、`.zip` など）    |
| `{ binary-ext }`     | Windows では `.exe`、それ以外は空文字                     |

### ターゲット別の override

ターゲットごとに設定を上書きできる。直接的なターゲット指定に加え、`cfg()` 式による柔軟な指定もサポートしている。

```toml
[package.metadata.binstall.overrides.x86_64-pc-windows-msvc]
pkg-fmt = "zip"

[package.metadata.binstall.overrides.'cfg(target_os = "linux")']
pkg-fmt = "tgz"
```

メタデータが未設定のクレートでも、cargo-binstallはデフォルトのテンプレートでリリースアセットのURLを推測して取得を試みる。多くのクレートがこのデフォルトの命名規則に沿ったリリースアセットを公開しているため、明示的な設定がなくてもインストールに成功するケースが多い。

## QuickInstall: サードパーティビルドの取得

GhCrateMetaで取得できなかった場合のフォールバックがQuickInstall戦略だ。[cargo-quickinstall](https://github.com/cargo-bins/cargo-quickinstall) プロジェクトが事前にビルドしたバイナリをGitHub Releasesから取得する。

### 取得元とURL構造

QuickInstallのベースURLは `quickinstall.rs` にハードコードされている。

::gh[https://github.com/cargo-bins/cargo-binstall/blob/dc19f1e48450eefe5a29b8da6c6b00a87d730b37/crates/binstalk-fetchers/src/quickinstall.rs#L9]

パッケージのURLは `{BASE_URL}/{crate_name}-{version}/{crate_name}-{version}-{target}.tar.gz` の形式で組み立てられる。つまり取得先は `github.com/cargo-bins/cargo-quickinstall` のGitHub Releasesだ。

### supported-targets によるサポート確認

QuickInstallは全ターゲットをサポートしているわけではない。取得を試みる前に、サポート対象のターゲット一覧を確認する。

::gh[https://github.com/cargo-bins/cargo-binstall/blob/dc19f1e48450eefe5a29b8da6c6b00a87d730b37/crates/binstalk-fetchers/src/quickinstall.rs#L15]

`supported-targets` はホワイトスペース区切りのプレーンテキストで、ソート・重複排除してキャッシュされる。自分のターゲットがリストに含まれていなければ、QuickInstall戦略はスキップされる。

### テレメトリの送信

QuickInstall経由でインストールが行われると、統計情報がテレメトリサーバに送信される。

::gh[https://github.com/cargo-bins/cargo-binstall/blob/dc19f1e48450eefe5a29b8da6c6b00a87d730b37/crates/binstalk-fetchers/src/quickinstall.rs#L10-L11]

送信されるクエリパラメータは以下の通りだ。

| パラメータ | 内容               |
| ---------- | ------------------ |
| `crate`    | クレート名         |
| `version`  | バージョン         |
| `target`   | ターゲットトリプル |
| `agent`    | クライアント情報   |
| `status`   | インストールの成否 |

テレメトリの送信を避けたい場合は `--disable-strategies quick-install` でQuickInstall戦略自体を無効にする。クレートのメンテナ側でも `disabled-strategies = ["quick-install"]` を `[package.metadata.binstall]` に指定することで、そのクレートについてQuickInstallを無効化できる。

## 署名検証とサプライチェーン

cargo-binstallでバイナリを取得するということは、ネットワーク越しに取ってきた実行ファイルをそのまま使うということだ。ここからは、その安全性をどう担保しているかを見ていく。

### SignaturePolicy: 3段階の署名ポリシー

cargo-binstallは署名検証の厳格さを `SignaturePolicy` enumで制御している。

::gh[https://github.com/cargo-bins/cargo-binstall/blob/dc19f1e48450eefe5a29b8da6c6b00a87d730b37/crates/binstalk-fetchers/src/lib.rs#L115-L127]

| ポリシー    | 動作                                                       | CLI フラグ          |
| ----------- | ---------------------------------------------------------- | ------------------- |
| `Ignore`    | 署名を一切検証しない。署名ファイルのダウンロードも行わない | `--skip-signatures` |
| `IfPresent` | 署名が存在すれば検証し、無署名パッケージはそのまま許可する | （デフォルト）      |
| `Require`   | 署名の存在と有効性を必須とする。無署名パッケージは拒否する | `--only-signed`     |

`--only-signed` と `--skip-signatures` は排他的なフラグで、同時に指定するとエラーになる。

### 署名アルゴリズム: minisign

現時点でcargo-binstallがサポートする署名アルゴリズムは [minisign](https://jedisct1.github.io/minisign/) のみだ。`SigningAlgorithm` enumは `#[non_exhaustive]` で定義されており、将来的なアルゴリズム追加が予定されている。

```rust
#[non_exhaustive]
pub enum SigningAlgorithm {
    Minisign,
}
```

minisignはEd25519ベースの署名ツールで、GPGと比べて鍵管理がシンプルな点が特徴だ。署名ファイルはデフォルトでは `{ url }.sig`（ダウンロードURLに `.sig` を付加）から取得される。

### クレート側の署名設定

クレートのメンテナは `Cargo.toml` で署名の公開鍵を宣言できる。

```toml
[package.metadata.binstall.signing]
algorithm = "minisign"
pubkey = "RWRnmBcLmQbXVcEPWo2OOKMI36kki4GiI7gcBgIaPLwvxe14Wtxm9acX"
```

`PkgSigning` 構造体のフィールドは以下の通りだ。

| フィールド  | 型                  | 説明                                                      |
| ----------- | ------------------- | --------------------------------------------------------- |
| `algorithm` | `SigningAlgorithm`  | 署名アルゴリズム（現状は `minisign` のみ）                |
| `pubkey`    | `Cow<'static, str>` | minisign 公開鍵                                           |
| `file`      | `Option<String>`    | 署名ファイルの URL テンプレート（省略時は `{ url }.sig`） |

メンテナ側の署名手順は以下のようになる。

```bash
# 鍵ペアの生成（-W でパスワードなし）
minisign -G -W -p signing.pub -s signing.key

# リリースアセットへの署名
minisign -S -W -s signing.key -x my-tool-v1.0.0.tar.gz.sig -m my-tool-v1.0.0.tar.gz
```

`-W` オプションでパスワード入力を無効化できるが、CI以外では [age/rage](https://github.com/str4d/rage) による鍵の暗号化が推奨されている。

### QuickInstall の固定公開鍵

QuickInstall戦略には独自の署名検証がある。`quickinstall.rs` にminisign公開鍵がハードコードされている。

::gh[https://github.com/cargo-bins/cargo-binstall/blob/dc19f1e48450eefe5a29b8da6c6b00a87d730b37/crates/binstalk-fetchers/src/quickinstall.rs#L13-L14]

これは個々のクレートメンテナが署名しているわけではなく、cargo-quickinstallプロジェクトがビルドしたバイナリに対してcargo-quickinstall自身の鍵で署名したものだ。つまり、信頼のルートは以下のように異なる。

- GhCrateMeta + クレート署名の場合、クレートのメンテナが署名しており、メンテナを信頼することになる
- QuickInstallの場合、cargo-quickinstallプロジェクトが署名しており、cargo-quickinstallを信頼することになる

QuickInstall経由の場合、クレートのメンテナとは無関係なサードパーティがビルドしたバイナリを使うことになる。cargo-quickinstall自体はcargo-binstallと同じ [cargo-bins](https://github.com/cargo-bins) Organizationが管理しているが、攻撃面はクレート直接取得より広い。

### 署名検証の実装

署名検証は `SignatureVerifier` enumで実装されている。

```rust
pub(crate) enum SignatureVerifier {
    Noop,
    Minisign(Box<MinisignVerifier>),
}
```

`Noop` はポリシーが `Ignore` のときに使われ、何も検証しない。`Minisign` は公開鍵を受け取り、ダウンロードしたバイナリと署名ファイルを検証する。

ポリシーが `IfPresent`（デフォルト）の場合、署名ファイルが存在すれば検証し、署名が不正なら失敗する。署名ファイルが存在しなければそのまま通過する。`Require` の場合は署名ファイルが存在しなければその時点で失敗となる。

## サプライチェーンの観点での整理

ここまでの内容を、サプライチェーンのリスクと対策として整理する。

### デフォルト動作のリスク

cargo-binstallをフラグなしで実行すると、以下の動作になる。

1. GhCrateMetaでGitHub Releasesからバイナリを探す
2. 見つからなければQuickInstall（サードパーティビルド）にフォールバックする
3. 署名があれば検証するが、無署名でも許可する（`IfPresent`）
4. QuickInstall使用時にテレメトリが送信される

つまりデフォルトでは、署名がなくてもインストールが成功し、意図せずサードパーティビルドのバイナリが使われる可能性がある。

### 取りうる対策

用途に応じて以下のフラグを組み合わせるとよい。

**クレート公式リリースのみ許可する場合:**

```bash
cargo binstall --strategies crate-meta-per-version <crate>
```

QuickInstallとソースコンパイルの両方を無効化し、クレート自身のGitHub Releasesからのみ取得する。サードパーティビルドを排除できるが、メタデータ未設定のクレートではインストールが失敗する。

**署名済みパッケージのみ許可する場合:**

```bash
cargo binstall --only-signed <crate>
```

署名ポリシーを `Require` にする。署名未対応のクレートではインストールが失敗するため、事前に対応状況を確認しておく必要がある。

**テレメトリ送信を避ける場合:**

```bash
cargo binstall --disable-strategies quick-install <crate>
```

QuickInstall戦略を無効化することで、テレメトリ送信をなくせる。GhCrateMetaで取得できなければソースコンパイルにフォールバックする。

## まとめ

cargo-binstallは「バイナリを速くインストールする」ツールだが、その内部はfetcherの優先順位制御と署名検証のポリシー管理で構成されている。

特に意識しておくべきポイントは以下の3点だ。

- **QuickInstall はサードパーティビルドである** — クレートメンテナではなくcargo-quickinstallプロジェクトがビルド・署名したバイナリを使う。固定公開鍵がソースコードにハードコードされている
- **デフォルトでは無署名を許可する** — `IfPresent` ポリシーにより、署名がなければ検証なしでインストールされる。`--only-signed` で厳格にできる
- **テレメトリが存在する** — QuickInstall経由のインストールでは統計情報がサードパーティサーバに送信される。`--disable-strategies quick-install` で回避できる

cargo-binstallをCIに組み込む際は、これらの挙動を理解した上で `--strategies` や `--only-signed` を明示的に設定することを推奨する。

この記事のソースコード参照はcargo-binstall v1.18.1（[commit dc19f1e](https://github.com/cargo-bins/cargo-binstall/tree/dc19f1e48450eefe5a29b8da6c6b00a87d730b37)）に基づく。
