---
name: techblog-writing
description: illumination-k.devの日本語技術ブログ記事の執筆・編集。構成と内容の質を重視し、読者にとって価値のある技術記事を作成する。
allowed-tools: Bash(npx textlint:*), Bash(pnpm cli template:*), Bash(pnpm cli:*)
---

# 技術ブログ執筆スキル

illumination-k.dev の技術ブログ記事を執筆・編集する。
構成と内容の質が最も重要。読者は技術者・研究者を想定する。

## 記事の構成原則

### 構成の考え方

記事を書き始める前に、必ずユーザーと以下を確認する：

1. **読者が得るものは何か** — 記事を読んだ後に何ができるようになるか
2. **どこまで書くか** — スコープを明確にし、広げすぎない

### 標準的な構成

以下の構成をベースに、テーマに応じて調整する。

```
## TL;DR / AI TL;DR
（3-5行で記事の要点。忙しい読者がここだけ読んでも価値がある内容にする）

## 背景・動機
（なぜこの技術を使うのか、何が問題だったのか。読者の共感を得る）

## 本題（複数セクション）
（h2でセクション、h3でサブセクション。各セクションは独立して読めるようにする）

## 終わりに / まとめ
（短く。感想、今後の展望、補足情報へのリンクなど）
```

#### 構成のバリエーション

テーマによって以下のような構成も使う：

- **ライブラリ紹介系**: TL;DR → ライブラリの概要と動機 → インストール → 基本的な使い方 → 発展的な使い方 → まとめ
- **問題解決系**: TL;DR → 問題の説明 → 解決策の検討 → 実装 → まとめ
- **概念解説系**: TL;DR → 概念の説明 → 具体例・コード → 注意点 → まとめ
- **チュートリアル系**: TL;DR → 前提 → ステップごとの実装 → 動作確認 → まとめ

## 内容の質に関するガイドライン

### 絶対に守ること

- **自分の言葉で書く** — ドキュメントのコピペではなく、実際に使ってみた知見や考察を入れる
- **なぜを書く** — 「何をするか」だけでなく「なぜそうするのか」を必ず添える
- **コードは動くものを書く** — 断片ではなく、コピーして動かせるコードにする
- **不正確なことを書かない** — 曖昧な場合は「未確認だが」「おそらく」等を添えるか、書かない

### 心がけること

- 冒頭で読者の期待値を設定する。何を扱い、何を扱わないかを明示する
- セクション間のつながりを意識する。唐突な話題転換を避ける
- 読者が「で、結局どうすればいいの？」とならないよう、結論や推奨を明確にする
- 公式ドキュメントやソースコードへのリンクを適切に入れる
- バージョンや日付を明記して、情報の鮮度がわかるようにする

### 避けること

- 網羅性を追求して薄く広い記事にすること（深く狭くの方が価値がある）
- 前提知識の説明に紙面を割きすぎること（リンクで済ませる）
- 定型的な挨拶や過度な謙遜（「初心者ですが」「間違っていたらすみません」等）

## 執筆手順

### 1. 雛形の生成

```bash
pnpm cli template -o posts/techblog/{category}/{filename}.md --tags ai-generated --tags {proper tags}
```

`ai-generated` タグは必ず入れる。その他のタグは内容に応じて適切に選ぶ。

カテゴリ: algorithm, backend, bioinformatics, biology, development, frontend, misc, python, rust

### 2. Front-matterの編集

title, description, category, tagsを埋める。descriptionは検索結果やOGPに使われるため、記事の要約として機能する内容にする。

### 3. 構成案の作成

本文を書く前に、見出しレベルで構成案を作成してユーザーに提示する。ユーザーの確認後に本文を書く。

### 4. 本文の執筆

- 言語: 日本語（lang: ja）。英語を求められた場合のみ lang: en
- 見出しは h2 でセクション、h3 でサブセクション
- コードブロックには言語を指定する（`python,`bash 等）

### 5. textlint検証（必須）

記事の執筆・編集後は、必ずtextlintを実行する。エラーがあれば修正し、エラーがなくなるまで繰り返す。

```bash
npx textlint posts/techblog/{category}/{filename}.md
```

### 6. cli lint検証（必須）

レンダリングされない強調（`**...**`や`*...*`がテキストのまま残る問題）を検出するため、cli lintを実行する。エラーがあれば修正する。典型的な原因は`**`の前後にスペースが必要なケース。

```bash
pnpm cli:build && pnpm cli lint --src posts
```

### 利用可能なMarkdown機能

- 標準Markdown（見出し、リスト、コードブロック、リンク、画像）
- KaTeX数式（`$inline$` / `$$block$$`）
- GitHub埋め込み: `::gh[https://github.com/...]`
- 図表: `::figure[caption]{src="image.png"}`
- 折りたたみ: `:::details` / `:::`
- コードブロックのタイトル: `` ```lang title=filename ``
- ファイル埋め込み: `::file[./relative/path]` — 記事と同階層の companion ディレクトリ内ファイルを記事本文にコードブロックとして差し込む。詳細は下記「再現性のためのcompanionディレクトリ」を参照

### 7. セルフレビュー

執筆後、`references/writing-checklist.md` のチェックリストで内容を確認する。

## 再現性のためのcompanionディレクトリ（オプトイン）

ハンズオンやチュートリアル系の記事では、**記事と同じ階層に同名のcompanionディレクトリ**を作り、その中に `flake.nix` や実コードを置いて環境を固定できる。読者や将来の自分が `nix develop` で当時の環境を再現できるようにするための仕組み。

### 使うべきケース

- チュートリアル系・ハンズオン系の記事（実際に動かすコードが中心）
- 特定の言語・ライブラリのバージョンに強く依存する記事
- ツールの挙動が時間経過で変わりそうな記事

使わなくていいケース:

- ポエム・考察・比較記事など、動かすコードがない、または再現の必要がない記事
- 既存の安定ライブラリの一般的な使い方だけを説明する記事

### 配置規約

記事 `posts/techblog/<lang>/<category>/<slug>.md` に対して、companionディレクトリは `posts/techblog/<lang>/<category>/<slug>/`（同階層・同名）に置く。

```
posts/techblog/ja/development/
├── my-article.md
└── my-article/
    ├── .gitignore       # result, .direnv/, __pycache__/ など
    ├── flake.nix        # nixpkgs を特定コミットにピン留め
    ├── flake.lock       # 任意。narHashレベルで固定したい場合
    └── src/             # 再現対象のコード
        └── main.py
```

**重要な制約**: companionディレクトリ内には `.md` ファイルを置いてはいけない。dumpパイプラインが `posts/**/*.md` をglobで拾うので、front-matter のない `.md` が混ざると dump が失敗する。READMEが必要なら `README.txt` にする。

### flake.nix の書き方のベースライン

nixpkgs は必ず **コミットSHA** か `flake.lock` で固定する。ブランチ名だけ（`nixos-25.11` など）を指定した場合は時間とともに中身が変わり、再現性を失う。最小例:

```nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/<commit-sha>";
  outputs = { self, nixpkgs }:
    let forAllSystems = f: nixpkgs.lib.genAttrs
      [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ]
      (system: f (import nixpkgs { inherit system; }));
    in {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell { packages = [ /* ... */ ]; };
      });
    };
}
```

最新の安定 nixpkgs コミットは GitHub API (`/repos/NixOS/nixpkgs/branches/nixos-XX.YY`) から取得できる。

### 記事本文との同期: `::file` directive

記事のコード例を companion ディレクトリの実ファイルと常に一致させるため、コードブロックをベタ書きせず `::file` directive で埋め込む。二重管理を避けられる。

```markdown
::file[./my-article/flake.nix]
```

- パスは記事のMarkdownファイルのディレクトリを起点に解決される
- 言語は拡張子から自動検出される（`.nix`→nix, `.py`→python, `.rs`→rust, `.toml`→toml など）
- タイトルは自動的にファイル名になる（`codeTitle` plugin 経由）

属性での上書きも可能:

```markdown
::file[./config.txt]{lang=toml title="custom.toml"}
```

記事内でファイルの一部を解説するときも、原則 `::file` で埋め込んだ上で本文で該当箇所に言及する。コピペしてベタ書きすると、companion ディレクトリと記事本文が時間とともに乖離する。

### 執筆手順への追加ステップ

companion ディレクトリを伴う記事では、通常の執筆手順に加えて以下を行う:

1. 記事 `<slug>.md` と同じ階層に `<slug>/` ディレクトリを作る
2. `flake.nix` を書き、必要なら `flake.lock` を生成する（`nix flake lock`）
3. 再現したいソース（`src/`, `pyproject.toml`, `Cargo.toml` など）を配置
4. `.gitignore` を置いて `result`, `result-*`, `.direnv/`, `__pycache__/`, `target/`, `.venv/` などを除外
5. 記事本文から `::file[./<slug>/...]` で各ファイルを参照する
6. `pnpm cli dump-file --file <slug>.md --imageDist /tmp/img --output /tmp/dumped.json` を走らせ、`/tmp/dumped.json` の `compiledMarkdown` に実ファイルの内容が展開されていることを確認する

### 参考記事

`posts/techblog/ja/development/reproducible-blog-with-nix.md` がこの仕組みのパイロットで、規約・flake.nix例・`::file` directiveの使い方をまとめて示している。新しいcompanionディレクトリを作るときはこれをテンプレートとして参照する。
