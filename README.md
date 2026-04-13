# site

Source for [illumination-k.dev](https://www.illumination-k.dev) — a personal
tech blog and paper-stream site built as a pnpm + Turbo monorepo.

Posts are authored in Markdown/MDX, compiled to JSON by a custom CLI
(`post-utils`), and rendered by a statically-exported Next.js 16 app deployed
to Cloudflare Pages. Content is multilingual (`ja` / `en` / `es`) and searched
client-side via Pagefind.

For a deeper architectural tour (conventions, tooling, testing, Claude Code
integration), see [CLAUDE.md](./CLAUDE.md).

## Stack

- **Frontend**: Next.js 16 (App Router, React 19, `output: "export"`), PandaCSS
- **Content**: Markdown / MDX with remark + rehype plugins (`packages/md-plugins`)
- **CLI**: TypeScript (`cli/`, yargs + tsup) — dump, RSS/Atom/JSON feeds, OG images
- **Schemas**: Zod (`packages/common`) as the source of truth for post data
- **Search**: Pagefind (client-side, indexes the static export)
- **Tooling**: pnpm 10, Turbo, Biome, Prettier, ESLint 9, dprint, Vitest 4,
  Playwright, Stryker, textlint
- **Hosting**: Cloudflare Pages

## Layout

```
.
├── web/           Next.js 16 app (App Router, static export)
├── cli/           post-utils CLI (dump, og, rss, template, lint, …)
├── packages/
│   ├── common/    Shared Zod schemas & types (postSchema, Lang, …)
│   ├── md-plugins/ remark / rehype plugins + embed transformers
│   ├── ipynb2md/  Jupyter notebook → Markdown
│   └── settings/  Shared biome.json / tsconfig.base.json
├── posts/
│   ├── techblog/{ja,en,es}/{category}/*.md
│   ├── paperStream/   Notion exports
│   └── public/        Image / OG source assets
├── scripts/       Metrics collection helpers
├── etc/cloudflare/bulk_redirects.csv
└── .github/workflows/
```

## Prerequisites

Tool versions are pinned in [`.mise.toml`](./.mise.toml); the easiest way to
get them is via [`mise`](https://mise.jdx.dev):

```bash
mise install
```

This provisions Node 22, pnpm 10, dprint, actionlint, ghalint, zizmor, prek,
and the Playwright CLI. `packageManager` is also pinned to `pnpm@10.33.0` in
the root `package.json`.

## Quick start

```bash
# 1. Install dependencies (frozen lockfile)
pnpm install

# 2. Compile posts → web/dump/{techblog,paperStream,profile}.json
pnpm dump

# 3. Start the Next.js dev server (+ pagefind)
pnpm web-dev
```

A full production build runs dump → OG images → RSS → Next.js static export →
Pagefind:

```bash
pnpm web-build
```

## Common commands

| Command                      | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| `pnpm web-dev`               | Next.js dev server (run `pnpm dump` first)                    |
| `pnpm web-build`             | Full production build pipeline                                |
| `pnpm dump`                  | Compile all Markdown posts to `web/dump/*.json`               |
| `pnpm cli:build`             | Build the CLI (tsup)                                          |
| `pnpm cli:rss`               | Generate RSS / Atom / JSON feeds                              |
| `pnpm cli:og`                | Generate per-post OG images (Satori + Sharp)                  |
| `pnpm cli <cmd>`             | Invoke the CLI directly (see below)                           |
| `pnpm test`                  | Vitest across all workspaces via Turbo                        |
| `pnpm test:coverage`         | Vitest + v8 coverage                                          |
| `pnpm test:mutation`         | Stryker mutation tests                                        |
| `pnpm --filter web test:e2e` | Playwright e2e tests                                          |
| `pnpm lint`                  | dprint + sort-package-json + Biome / ESLint / `tsc --noEmit`  |
| `pnpm format`                | Auto-format the whole repo                                    |
| `mise run lint`              | Aggregate: dprint + actionlint + ghalint + zizmor + pnpm lint |
| `mise run fmt`               | Aggregate: dprint fmt + mise fmt + pnpm format                |

### CLI (`post-utils`)

The CLI is a thin yargs wrapper around the content pipeline. After
`pnpm cli:build`, invoke it via `pnpm cli <command>`:

| Command        | Purpose                                                       |
| -------------- | ------------------------------------------------------------- |
| `dump`         | Compile a directory of Markdown posts into a JSON dump        |
| `dump-file`    | Compile a single Markdown file (debugging)                    |
| `rss`          | Generate RSS / Atom / JSON feeds from a dump                  |
| `og`           | Generate OG images from a dump                                |
| `template`     | Scaffold a new blog post with the required front-matter       |
| `orcid`        | Fetch an ORCID profile into JSON                              |
| `lint`         | Custom Markdown lint rules (unrendered emphasis, SEO meta, …) |
| `migration`    | Migration / redirect helpers                                  |
| `paper-stream` | Export the Notion paper-stream database                       |

## Authoring posts

1. Scaffold a post:

   ```bash
   pnpm cli template -o posts/techblog/ja/development/my-post.md
   ```

2. Fill in the YAML front-matter (validated by `postMetaSchema` in
   `packages/common`):

   - `uuid`, `title`, `description`, `category`, `tags`
   - `lang`: `ja` | `en` | `es`
   - `created_at`, `updated_at`

3. Write Markdown / MDX. Directive-based embeds (`github`, `github-card`,
   `github-meta`, `youtube`, `doi`, `book`) and the `:::details` / `:::figure`
   containers are provided by `packages/md-plugins`.

4. Run `pnpm dump` to compile, and `pnpm web-dev` to preview.

See [CLAUDE.md](./CLAUDE.md) for the full content pipeline, the reproducible
article companion-directory convention, and the tooling details.

## Deployment

The static export (`web/out/`) is deployed to Cloudflare Pages. URL redirects
are managed via [`etc/cloudflare/bulk_redirects.csv`](./etc/cloudflare/bulk_redirects.csv).

## License

Code is released under the ISC license (see `package.json`). Blog content
under `posts/` is authored by the site owner and is not covered by that
license.
