# site

[illumination-k.dev](https://www.illumination-k.dev) — 個人ブログ兼ポートフォリオサイトのソースコードです。

## Concept

このリポジトリは、**コンテンツとコードを同じ場所で管理する** ことを目的としたモノレポです。Markdown で書かれた記事をカスタム CLI でコンパイルし、Next.js の静的エクスポートとして配信することで、執筆から公開までを一貫したワークフローに統合しています。

### 設計上の指針

- **Markdown is source of truth** — すべての記事はフロントマター付きの Markdown として `posts/` 配下で版管理されます。CMS には依存しません。
- **Build-time compilation** — 記事は `pnpm dump` 時に remark/rehype プラグインで処理され、画像の最適化・見出し抽出・シンタックスハイライト・数式レンダリングなどが済んだ JSON として `web/dump/` に出力されます。ランタイムでの Markdown 解析は行いません。
- **Static-first delivery** — Next.js の静的エクスポートを Cloudflare Pages に配信し、クライアントサイド検索は Pagefind で行います。サーバーランタイムを持たない構成です。
- **Typed schemas as contract** — `packages/common/` の Zod スキーマが記事データの唯一の型定義であり、CLI と Web の境界を型で保証します。
- **Multi-source, single pipeline** — 技術記事 (`techblog/`) と論文ノート (`paperStream/`, Notion からエクスポート) を同じパイプラインで扱い、統一された UI で配信します。

## Monorepo Structure

pnpm workspace + Turborepo による構成です。

| Path                   | 役割                                                                       |
| ---------------------- | -------------------------------------------------------------------------- |
| `web/`                 | Next.js 16 (App Router) フロントエンド。PandaCSS、静的エクスポート         |
| `cli/`                 | 記事ダンプ・OG 画像生成・RSS 生成・Notion エクスポートを行う CLI (yargs)   |
| `packages/common/`     | 記事データの Zod スキーマと型定義                                          |
| `packages/md-plugins/` | 画像最適化・見出し抽出・KaTeX・Prism+・GFM などの remark/rehype プラグイン |
| `packages/ipynb2md/`   | Jupyter Notebook → Markdown コンバータ                                     |
| `packages/settings/`   | Biome / tsconfig の共有設定                                                |
| `posts/techblog/`      | 技術記事 (Markdown, カテゴリ別サブディレクトリ)                            |
| `posts/paperStream/`   | Notion から書き出した論文ノート                                            |
| `posts/public/`        | 記事に紐づく画像・OG 画像                                                  |

## Content Pipeline

```
posts/*.md ──▶ cli dump ──▶ web/dump/*.json ──▶ next build ──▶ Cloudflare Pages
                  │
                  ├─ frontmatter parse (zod validation)
                  ├─ remark/rehype transform (@packages/md-plugins)
                  ├─ image optimize (Sharp, AVIF)
                  └─ heading / token extraction
```

後続で `cli og` が Satori + Sharp で OG 画像を、`cli rss` が RSS/Atom/JSON フィードを生成します。

## Requirements

- Node.js 20 (`.mise.toml` で管理)
- pnpm 10

## Commands

```bash
# 依存インストール
pnpm install

# 開発 (事前に dump が必要)
pnpm dump          # Markdown → JSON へダンプ
pnpm web-dev       # Next.js dev server

# フルビルド (dump → OG → RSS → Next.js static export)
pnpm web-build

# CLI 単体
pnpm cli:build
pnpm cli <command>           # dump / og / rss / template / paper-stream

# 品質チェック
pnpm lint
pnpm format
pnpm test
pnpm test:coverage
pnpm test:mutation           # Stryker によるミューテーションテスト
```

## Authoring

新しい記事の雛形を作成するには:

```bash
pnpm cli template -o <filename>
```

フロントマターには `uuid` / `title` / `description` / `category` / `lang` (`ja` | `en`) / `tags` / `created_at` / `updated_at` を指定します。詳細なスキーマは `packages/common/` を参照してください。

## License

個人サイトのソースコードです。記事コンテンツ (`posts/`) と、それを構築するコードは同一リポジトリで管理されていますが、ライセンスは別扱いとなる場合があります。
