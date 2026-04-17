---
uuid: 3ebbaf5d-47c3-42a4-b85e-166b099b5a1f
title: "mise の cargo バックエンドを aqua 経由の cargo-binstall で高速化する"
description: "mise の cargo バックエンドが cargo install でソースビルドを走らせて遅くなる問題を、aqua で cargo-binstall を先に入れて depends で宣言することで解消する。cargo-nextest などで約42倍の高速化を実測した。"
category: development
lang: ja
tags:
  - ai-generated
  - mise
  - aqua
  - cargo
  - rust
created_at: 2026-04-17
updated_at: 2026-04-17
---

miseの [cargo バックエンド](https://mise.jdx.dev/dev-tools/backends/cargo.html) で `cargo:cargo-nextest` のようにRust製CLIを管理している人は多いと思う。ただ、この素の構成だと裏で `cargo install` がフルビルドを走らせるケースがあり、CIおよびローカル開発のどちらでも無視できない時間を食う。本記事では **aqua バックエンドで `cargo-binstall` を先に入れておき、cargo: 側のツールから `depends` でそれを要求する** という構成で、同じ3ツールの導入時間が170秒から4秒に縮んだ実測を示す。

## TL;DR

- miseの `cargo:` バックエンドは `cargo-binstall` がPATHにあれば自動でそれを使う。無ければフォールバックで `cargo install`（ソースからビルド）になる
- `cargo-binstall` 自体を `cargo install cargo-binstall` で入れるとそれも遅い。aquaバックエンド経由なら公式Releaseのprebuiltバイナリが降ってきて1秒弱で終わる
- `mise.toml` で `"aqua:cargo-bins/cargo-binstall"` をツールとして宣言し、cargo: 側の各ツールの `depends` に指定すれば、mise install時に必ずbinstallが先に用意される
- 今回の環境では `cargo-nextest` + `cargo-audit` + `tokei` の並列mise installが **165.8秒 → 3.9秒**（約42倍）になった

## 背景: mise の cargo バックエンドが遅くなる仕組み

miseには [backends](https://mise.jdx.dev/dev-tools/backends/) という概念があり、`cargo:` はcrates.ioのパッケージを管理対象にできる。たとえば `mise use cargo:cargo-nextest@latest` と書けば、以降そのディレクトリで `cargo-nextest` が使えるようになる。

内部実装上、miseのcargoバックエンドは次の順で動く。

1. `cargo-binstall` がPATHにあれば `cargo binstall <pkg>` を実行する
2. 無ければ `cargo install <pkg>` を実行する

`cargo install` はcrates.ioからcrateのソースを取ってきてreleaseビルドする。よくあるRust製CLIだと依存crate込みで数百crateのコンパイルになることもあって、マシンによっては1ツールあたり数分かかる。チームで共通の `mise.toml` を配っていると、新規参入者の初回セットアップやCIの初回キャッシュミス時にこのコストが全員に乗ってくる。

### cargo-binstall の役割

[cargo-binstall](https://github.com/cargo-bins/cargo-binstall) は、crateに対応するGitHub Releasesのprebuiltバイナリ（`.tar.gz` / `.zip`）を直接拾ってきて `~/.cargo/bin/` に置くツールだ。prebuiltが無いcrateは [QuickInstall](https://github.com/cargo-bins/cargo-quickinstall) という二次配布リポジトリにフォールバックする。どちらも無ければ最終的に `cargo install` に落ちる。

有名なRust CLIはほとんどがcargo-binstallでprebuiltを引けるので、実質「コンパイル不要でインストール」に置き換えられる。miseのcargoバックエンドの設定 `cargo.binstall` は現行のmiseで **既定で `true`** になっており、binstallさえPATHにあれば自動で使う。

### 鶏と卵: cargo-binstall をどう入れるか

問題は `cargo-binstall` 自体を何で入れるかで、単純に `cargo install cargo-binstall` するとbinstall自身がソースからビルドされるので意味が薄い。公式が配っている [install 用シェルスクリプト](https://github.com/cargo-bins/cargo-binstall#installation)をcurl実行する方法もあるが、複数マシン・複数CIランナーで使うのに再現性を保ちたいと、別のツール管理層に置きたくなる。

そこで **aqua**（[aquaproj/aqua](https://github.com/aquaproj/aqua)）の出番になる。aquaはGitHub Releaseからprebuiltバイナリを落としてくるインストーラで、registryにすでに `cargo-bins/cargo-binstall` が登録されている。さらにmiseにはaquaのregistryをそのまま読む **aqua バックエンド** が入っているので、aqua CLI自体は入れる必要すらない。つまり `"aqua:cargo-bins/cargo-binstall"` と書くだけでmiseがaqua registryを読んでprebuiltバイナリを落としてくる。

## 検証環境

このサンドボックスでそのまま計測した結果なので、絶対値はそちらで走らせた場合の体感とずれる可能性がある。ただ「`cargo install` ベースはコンパイルに数分、binstallベースは各ツール数秒」というオーダーは一般的に成立するはず。

| 項目              | 値                                     |
| ----------------- | -------------------------------------- |
| OS                | Ubuntu 24.04.4 LTS                     |
| カーネル          | Linux 4.4.0 (gVisor / runsc サンドボックス) |
| CPU               | 16 コア @ 2.1GHz（モデル名: runsc のため不明） |
| RAM               | 21 GiB                                 |
| mise              | 2026.4.10 linux-x64                    |
| cargo / rustc     | 1.94.1                                 |
| 対象ツール          | cargo-nextest 0.9.133, cargo-audit 0.22.1, tokei 14.0.0 |
| cargo-binstall    | 1.18.1（aqua registry から取得）           |

記事末尾のリンクにあるとおり、本記事のcompanionディレクトリにNix flakeとベンチスクリプトを置いてあるので、手元で再現したい場合はそちらから `nix develop` して `./bench.sh` を叩けば同じ手順を踏める。

## 設定: mise.toml の書き方

まず、**改善前（pattern a）** としてcargoバックエンドだけを使う最小の `mise.toml` はこう書ける。

::file[./mise-cargo-aqua-binstall/mise.before.toml]

この設定で `mise install` すると、binstallがPATHに無い場合は各ツールがソースからビルドされる。実測では並列（既定の `--jobs 4`）で166秒、`--jobs 1` で272秒かかった。

次に、**改善後（pattern c）** としてaquaバックエンドでcargo-binstallを先に入れ、cargo: 側の各ツールの `depends` に指定した `mise.toml` がこれ。

::file[./mise-cargo-aqua-binstall/mise.toml]

ポイントは2つある。

1. **aqua バックエンドで `cargo-bins/cargo-binstall` を宣言している**。mise組み込みのaqua registry読み込みを使うので、ローカルにaqua CLIを別途入れる必要はない
2. **各 `cargo:` ツールの `depends` に aqua 側のツールを指定している**。miseは依存順を解決したうえで並列インストールするため、cargo-binstallが確実にcargo: ツールより先に揃う

なお `cargo.binstall` は既定で `true` のため、`binstall = true` の明示は不要。古いmiseを使っているなら `mise settings set cargo.binstall true` で有効化しておく。

## ベンチマーク

両構成それぞれで、3ツールを同時に `mise install` したときのwall clockを計測した。`MISE_DATA_DIR` を毎回別の空ディレクトリに向けて、cratesキャッシュや既存インストールの影響を切っている。pattern (a) についてはbinstallフォールバックを無効化するため `MISE_CARGO_BINSTALL=false` を渡した。

| 構成                                           | wall clock | 内訳                          |
| ---------------------------------------------- | ---------- | ----------------------------- |
| (a) cargo install `--jobs 1`（逐次）              | 272.36 sec | 3ツール逐次コンパイル             |
| (a) cargo install `--jobs 4`（既定、並列）         | 165.82 sec | 並列でも最遅ツールに律速される      |
| (c) aqua + binstall 合計                        | **3.89 sec** | 下記2段階の合計                  |
| └ aqua から cargo-binstall 取得                  | 0.86 sec   | Release tarball をダウンロード+展開 |
| └ 3ツールを並列で binstall                        | 3.05 sec   | 各ツール約2〜3秒                 |

並列実行同士で比較すると **165.8秒 → 3.9秒、約42倍高速**。逐次ケースと比べれば約70倍だが、現実的な利用シーンは並列なので42倍が妥当な比較になる。

なおcargo-binstall経由のインストール時、crateによってダウンロード元が異なる点は知っておくと良い。

- `cargo-nextest` はGitHub Releasesに公式のprebuiltがあるため、そのまま `github.com` から取得（ログに `downloaded from github.com` と出る）
- `cargo-audit` / `tokei` は公式prebuiltが無く、QuickInstallの二次配布から取得（ログに `downloaded from third-party source QuickInstall` と出る）

QuickInstallはcargo-bins orgが回している公式の二次配布なので信頼できるが、気になる場合は `--strategies crate-meta-data` などで許可するソースを絞る運用もできる。

## 落とし穴と注意点

### GITHUB_TOKEN を設定しておく

aquaとcargo-binstallの両方がGitHub API / Releasesにアクセスする。未認証だとIPベースのrate limit（1時間あたり60リクエスト）に引っかかりやすく、特にCIで複数ランナーが同時に走るとtimeoutや403でinstallerが落ちる。`GITHUB_TOKEN` 環境変数を渡せば5000リクエスト/時に上がるので、CIではほぼ必須。

### prebuilt が存在しないクレート

全てのcrateがbinstall対応しているわけではない。対応していないcrateを指定した場合、cargo-binstallは最終的に `cargo install` にフォールバックする（つまり遅くなる）。これを強制的に禁止したければ `--strategies crate-meta-data,quick-install`（`compile` を含めない）を渡すか、miseの `cargo.binstall` を `force` にする運用がある。今回の3ツールはすべてprebuiltまたはQuickInstallが効くので気にしなくてよかった。

### aqua registry の版

`aqua:cargo-bins/cargo-binstall` のバージョンはaquaのstandard registryに依存する。miseは組み込みのregistryスナップショットを持っていて、`mise registry` で現在の解決先を確認できる。新しすぎるバージョンがすぐに取れないケースはあり得るが、実運用では数日〜1週間の遅延程度。

### ソースビルドを意図的に選びたい場合

セキュリティレビューなどで「ソースから自分でビルドしてバイナリを作りたい」要件がある場合、`MISE_CARGO_BINSTALL=false` で従来挙動に戻せる。この記事のpattern (a) 計測もこの方法で再現している。

## まとめ

- miseのcargoバックエンドは **cargo-binstall が PATH にあるかどうか** で体感速度が大きく変わる
- cargo-binstall自体の投入には **aqua バックエンド**（mise組み込み）が最速で、prebuiltバイナリを直接取ってこられる
- `mise.toml` の `depends` で順序を宣言しておけば、初回 `mise install` だけで全部がprebuiltで揃う
- 実測では3ツールの並列mise installが **42倍高速**。CIのキャッシュミス時や新規開発者のセットアップで効いてくる

Rust製CLIをmiseで管理している人はとりあえず1行足すだけで恩恵があるので、試してみる価値はあるはず。

## 参考

- [mise: Cargo backend](https://mise.jdx.dev/dev-tools/backends/cargo.html)
- [mise: Aqua backend](https://mise.jdx.dev/dev-tools/backends/aqua.html)
- ::gh-card[cargo-bins/cargo-binstall]
- ::gh-card[aquaproj/aqua]
- この記事のcompanionディレクトリ: `posts/techblog/ja/development/mise-cargo-aqua-binstall/`（flake.nixとbench.shあり）
