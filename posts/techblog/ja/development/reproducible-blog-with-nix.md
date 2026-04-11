---
uuid: f017dc98-1077-444b-8010-5bf95cf0b0c3
title: "技術ブログ記事の再現性を Nix flake で固定する"
description: "年月が経つとコード例が動かなくなる技術記事の腐敗問題に対して、記事と同じ階層に Nix flake 入りの companion ディレクトリを置いて環境をピン留めする運用を紹介する。"
category: techblog
lang: ja
tags:
  - ai-generated
  - nix
  - reproducibility
  - flake
  - blog
created_at: 2026-04-11
updated_at: 2026-04-11
---

技術ブログ記事は時間経過とともに動かなくなる。依存ライブラリがメジャーバージョンを上げ、CLIのサブコマンドが消え、Dockerベースイメージがpull不能になる、という現象は誰しも経験がある。このブログでも同じ問題を抱えていたので、**記事と同じ階層に Nix flake を持った companion ディレクトリを任意で置ける運用** を導入した。この記事では、その規約の内容と、実際にこの記事自身に付属しているflakeを例に、再現の仕方を説明する。大規模な事例やCI連携までは扱わない。

## TL;DR

- 技術記事の「腐敗」の多くは、読者と著者の実行環境が時間とともにずれていくことに起因する
- 対策として、記事 `foo.md` の隣に `foo/` ディレクトリを置き、その中に `flake.nix` を入れて `nix develop` で再現できるようにする規約を導入した
- 合わせて、記事本文からcompanionディレクトリ内のファイルをコード片として直接埋め込める `::file[./path]` というremark directiveを追加し、記事とコードの二重管理を避けた
- companionディレクトリはオプトイン、`.md` ファイルは置かない、dumpパイプラインは非mdファイルを無視するため既存ビルドには影響しない
- この記事自身の隣にもcompanionディレクトリが置かれており、`nix develop -c python --version` でPython 3.12系の固定バージョンが立ち上がる

## 背景: 技術記事はなぜ腐るか

過去記事を読み返したり、読者から「このコード動かないんですが」と指摘されたりすると、腐敗の原因はだいたい次のどれかに行き着く。

- **言語/ランタイムのバージョン差** — 記事執筆時のPython 3.10と現在のPython 3.13で挙動が変わる、`asyncio` のAPIがdeprecatedになった、といったパターン
- **サードパーティライブラリの破壊的変更** — `pip install foo` が最新版をつかんできて、記事中のimport構造やシグネチャがもう存在しない
- **CLI ツールのオプション変更/廃止** — ツールが別ツールに置き換えられ、元コマンドはリポジトリから消えた、みたいなやつ
- **OS/システムライブラリの暗黙依存** — Ubuntuの特定バージョンでしかビルド通らない、特定の `libfoo-dev` が必要、など記事には書かれていない依存

記事本文に `Python 3.10.5 を使っています` と書いておくだけではまったく足りない。読者が再現できる形で **環境そのものをピン留めしたアーティファクト** が一緒についていないと、いくら丁寧に書いてもいずれ動かなくなる。

この問題に対する選択肢はいくつかあるが、本質的には「どの層まで固定するか」の違いでしかない。

| アプローチ                               | 固定できる層                                      | デメリット                                                                      |
| ---------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| バージョン指定のみ記載                   | 言語/ライブラリのバージョン（表記上）             | 読者が環境を作る必要がある。OS 依存は固定できない                               |
| `requirements.txt` / `Cargo.lock` を同梱 | ライブラリのバージョン                            | 言語本体と OS 依存は固定できない                                                |
| Docker イメージ                          | OS + 依存 + 言語                                  | ベースイメージや apt リポジトリが消えると pull 不能になる。環境に Docker が必要 |
| Nix flake                                | nixpkgs スナップショット経由で OS〜言語〜依存まで | 初見の学習コスト、Nix を入れる必要がある                                        |

私の用途ではNix flakeが一番釣り合う。理由は2つある。

1. **記事の寿命を延ばすのが目的** で、CIもデプロイも絡まない。ローカルで `nix develop` が通るだけで十分。
2. **Docker に比べてレイヤーを覚える必要がない**。Dockerイメージを保つにはDockerfileとbase imageのバージョンの両方を気にしないといけないが、flakeはnixpkgsのcommit 1点を固定すれば全部連動して固まる。

## 規約: 記事と同階層に companion ディレクトリを置く

このブログでは以下のルールでゆるく運用している。

- 記事のパス: `posts/techblog/<lang>/<category>/<slug>.md`
- companionディレクトリ: `posts/techblog/<lang>/<category>/<slug>/`（同じ階層・同じslug）
- オプトイン。必要な記事にだけ付ける。再現しようがないポエム記事は付けない
- companionディレクトリには `.md` ファイルを置かない。置きたくなったら `README.txt` かpost本文に書く
- 必須最小構成は `flake.nix` / `flake.lock` / `.gitignore`。題材のコードは `src/` などに置く

最後の「`.md` を置かない」制約は、dumpパイプラインがpostの収集に `posts/**/*.md` globを使っている都合によるもの。companion配下に `.md` があるとfront-matterなしのpostとして拾われて検証エラーになる。globから外す実装もできるが、規約でよけるほうがpipelineをいじらなくて済むので、現時点では規約で回避している。

言い換えると、companionディレクトリは **ビルドパイプラインから見て無視されるフォルダ** になっている。画像などの静的アセットは別口で `posts/public/` に置く仕組みが既にあるので、companionディレクトリは純粋に「記事の再現に必要なコード一式」だけを抱える場所として機能する。

### なぜ同階層にするか

代替案として `examples/<slug>/` のようにトップレベルに集約する案もあった。集約の利点は「企画を横断して一覧できる」「記事をまたいで共有できる」の2点だが、以下の理由で却下した。

- 記事1本に対して1個だけ対応する、という最も多いケースでは集約の恩恵は薄い
- 記事を移動したり削除したときにcompanionを見失いやすい
- `git log posts/techblog/ja/development/foo*` で記事と環境をまとめて追えない

`foo.md` と `foo/` が常にセットで見えているほうが、コードレビュー時にも著者本人にとっても迷いが少ない。

## パイロット: この記事の companion ディレクトリ

ここから具体例に入る。この記事自身の隣 (`posts/techblog/ja/development/reproducible-blog-with-nix/`) にcompanionディレクトリが置いてある。中身はわざと最小構成にしていて、以下の3ファイルだけから成る。

```text
reproducible-blog-with-nix/
├── .gitignore
├── flake.nix
└── src/
    └── hello.py
```

`flake.nix` はPython 3.12系と [uv](https://docs.astral.sh/uv/) を提供するdevShellを定義している。以下はリポジトリ内の実ファイルをそのまま埋め込んだものなので、記事本文とcompanionディレクトリの中身は常に一致する（後述の `::file` directiveによってdump時に差し込まれる）。

::file[./reproducible-blog-with-nix/flake.nix]

デモ用のPythonスクリプトも同じ要領で埋め込める。

::file[./reproducible-blog-with-nix/src/hello.py]

記事の再現は以下の1コマンドで済む。

```bash
cd posts/techblog/ja/development/reproducible-blog-with-nix
nix develop -c python src/hello.py
```

nixpkgsをgithub URLのコミットSHAでピン留めしているため、**何年後に実行しても同じ nixpkgs スナップショットから Python が降ってくる**。nixpkgs自体がどこかのタイミングでGitHub上から消えない限りは、だが、NixOSコミュニティ規模では現実的なリスクは低いと判断している。

### flake.lock は必須か

厳密な再現性を求めるなら `flake.lock` も一緒にコミットするのが正しい。`nix flake lock` を1回走らせると、入力それぞれのnarHash（tarball内容のハッシュ）がlockに書き出され、`nix develop` はlockがあればそちらを優先してfetchする。

ただし上述のとおり、**入力 URL の時点でコミット SHA を直書きしている** 場合、lockがなくても事実上同じスナップショットに解決される。このパイロットでは試しに `flake.nix` のコミットSHA固定だけで運用し、必要なら後から `nix flake lock` を手元で走らせてlockを追加する、という段階的な運用にしている。

本番の技術記事で重要な検証結果を再現させたいなら、lockも合わせてコミットするほうが無難。

### `.gitignore` の中身

companionディレクトリ内は `nix build` の `result` シンボリックリンクやdirenvのキャッシュで汚れるので、一通りignoreしておく。これもディレクトリ内の実ファイルを埋め込んでいる。

::file[./reproducible-blog-with-nix/.gitignore]{lang=gitignore}

これらはリポジトリに入れるべきではないが、companionディレクトリの中身はトップレベルの `.gitignore` だけでは足りないことが多いので、ディレクトリ単位でもう1枚持たせている。

### 記事本文と companion ディレクトリを `::file` directive で同期する

上の埋め込みは、このブログに新しく追加した `::file` というremark leaf directiveで実現している。構文はleaf directive 1行だけ。

```markdown
::file[./relative/path/to/file.ext]
```

`cli/src/embedFile.ts` で実装していて、dump時に以下のように展開される。

1. 記事のMarkdownファイルが置かれているディレクトリを起点に、text部分をパスとして解決する（`optimizeImage` が画像パスを解決するのと同じやり方）
2. そのファイルを `fs.readFile` で読み、末尾の改行だけを落とした文字列を得る
3. レンダリング時に使う言語は拡張子から自動検出（`.nix` → `nix`、`.py` → `python`、`.gitignore` → `text` など）
4. 同ディレクトリ内の `codeTitle` remark pluginが拾える形で `code` ノードに置き換える。`meta` に `title=<basename>` を差し込んでおくので、タイトル付きコードブロックとしてレンダリングされる

langとtitleは必要ならdirectiveの属性で上書きできる。

```markdown
::file[./config.txt]{lang=toml title="custom.toml"}
```

これで記事本文のコードブロックとcompanionディレクトリ内のコードの二重管理が解消された。著者（= 自分）はcompanionディレクトリ内のファイルだけをメンテすればよく、記事は自動的に追随する。`::file` directiveそのものはCLI側 (`cli/src/embedFile.ts`) のremark pluginとして実装したので、`md-plugins` パッケージは純粋なAST変換に留めている。

## 制約と将来拡張

今回入れたのは **規約だけ** で、front-matter拡張・記事ページからのUIリンク・CI検証は意図的に後回しにしている。優先度の高い順に並べると次のとおり。

1. `postMetaSchema` に `reproducible: { dir: "./<slug>" }` 相当のフィールドを足し、記事ページ下部に「この記事の環境を再現する」というGitHubリンクを出す
2. 月1回くらいの頻度でGitHub Actionsが `nix flake check` をcompanionディレクトリ全部に対して回し、腐ったフレークを可視化する
3. 既存の再現性の必要な記事（FastAPI系、SQLAlchemy系、Rust系など）に遡ってcompanionディレクトリを付与していく
4. `::file[...]` に行番号レンジ（たとえば `::file[./foo.py#L10-L20]`）を足して長いファイルから一部だけ抜粋できるようにする

## まとめ

- 記事の腐敗は **環境をピン留めできる成果物が記事と一緒に配られていない** ことが主因
- `posts/techblog/<lang>/<category>/<slug>/` に `flake.nix` を置くだけの最小規約でも、Nixがある環境ではかなりの範囲を再現できる
- dumpパイプラインを触らずに済むよう、companionディレクトリには `.md` を置かない、というゆるい約束事だけで運用している
- まずは本記事を1本目のパイロットとして置いておき、実運用の中で必要な箇所から拡張していく
