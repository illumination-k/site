# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog/portfolio site (illumination-k.dev) built as a **pnpm + Turbo monorepo**. Blog posts are authored in Markdown, processed by a custom CLI (`post-utils`) into compiled JSON, and rendered by a statically-exported **Next.js 16** app deployed to Cloudflare Pages. Multi-language support (ja/en/es) and client-side search via Pagefind.

## Monorepo Structure

Workspaces are declared in `pnpm-workspace.yaml` (`packages/**`, `web`, `cli`).

- **web/** — Next.js 16 frontend (App Router, React 19, PandaCSS, static export via `output: "export"`, `typedRoutes: true`, `transpilePackages: ["md-plugins"]`). Routes live under `web/src/app/[locale]/(articles)/{techblog,paperstream,search}`, plus `disclaimer`, `privacy-policy`, and `metrics`. Feature logic is organized under `web/src/features/{articles,techblog,paperStream}`. Styles are generated under `web/src/styled-system/` via `panda codegen` (runs in `prepare`).
- **cli/** — TypeScript CLI (`post-utils`, yargs) built with tsup. Entry point: `cli/src/index.ts`. Commands: `dump`, `dump-file`, `rss`, `og`, `template`, `migration`, `lint`, `paper-stream`. Uses pino for structured logging.
- **packages/common/** — Shared Zod schemas and types. Exports `postMetaSchema`, `postSchema`, `dumpPostSchema`, `dumpSchema`, `headingsSchema`, and the `Lang` enum (`ja` | `en` | `es`). This package is the source of truth for post data shapes.
- **packages/md-plugins/** — Custom remark/rehype plugins plus shared `REMARK_PLUGINS` / `REHYPE_PLUGINS` / `REMARK_LINT_PLUGINS` arrays.
  - remark: `attachIdToHeadings`, `codeTitle`, `DetailsDirective`, `FigureDirective`, `lintUnrenderedEmphasis`, plus a directive-based embed generator with transformers for `github`, `github-card`, `github-meta`, `youtube`, `doi`, `book`.
  - rehype: `rehypePrism` (custom wrapper), re-exports `rehypeKatex` and `rehypeMermaid`.
  - Also ships `fetchWithRetry`, `cachedFetch`, and a simple on-disk cache (`cache.ts`) used by embed transformers.
- **packages/ipynb2md/** — Jupyter notebook → Markdown converter (used by the CLI dump pipeline).
- **packages/settings/** — Shared configuration files: `biome.json` and `tsconfig.base.json` consumed by non-web packages.
- **posts/** — Blog content. `techblog/{lang}/{category}/*.md` (ja/en/es, categories like `development`, `rust`, `python`, `bioinformatics`, …), `paperStream/` (Notion exports), `public/` (images + OG images source assets). A post may optionally have a same-named sibling directory (e.g. `techblog/ja/development/reproducible-blog-with-nix/`) holding a Nix flake that reproduces its environment — see "Reproducible article companion directory" under Key Conventions.
- **scripts/** — `collect-metrics.ts`, `format-metrics-comment.ts` (used by the quality metrics workflow).
- **etc/cloudflare/bulk_redirects.csv** — Cloudflare bulk redirect list.
- **.github/workflows/** — `ci.yaml`, `web-build.yaml`, `codeql.yaml`, `dependency-audit.yaml`, `quality-metrics.yaml`, `workflow-lint.yaml`.

## Commands

All commands run from the repo root unless noted.

```bash
# Install
pnpm install                     # frozen lockfile install is done automatically by the SessionStart hook

# Development
pnpm web-dev                     # Next.js dev server + pagefind (run `pnpm dump` first)
pnpm dump                        # Process all posts → web/dump/{techblog,paperStream}.json
pnpm cli:build                   # Build the CLI (tsup)
pnpm cli:dev                     # CLI watch mode

# Full production build (dump → OG images → RSS → Next.js static export → Pagefind)
pnpm web-build

# Testing
pnpm test                        # vitest run across workspaces via turbo
pnpm test:coverage               # vitest + v8 coverage
pnpm test:mutation               # Stryker (mutates packages/md-plugins, packages/ipynb2md, cli)
pnpm --filter web test:e2e       # Playwright e2e tests (web/e2e)

# Linting / formatting
pnpm lint                        # dprint check + sort-package-json check + turbo lint (biome / eslint / tsc)
pnpm format                      # dprint fmt + sort-package-json + per-package format

# Feeds & OG images
pnpm cli:rss                     # Generate RSS/Atom/JSON feeds into web/public/rss
pnpm cli:og                      # Download fonts + generate OG images for techblog and paperStream

# CLI direct invocation
pnpm cli <command>               # e.g. pnpm cli dump, pnpm cli rss, pnpm cli og, pnpm cli template, pnpm cli paper-stream, pnpm cli lint

# Aggregate mise tasks (defined in .mise.toml)
mise run fmt                     # dprint fmt + mise fmt + pnpm format
mise run lint                    # dprint check + actionlint + ghalint + zizmor + pnpm lint
```

The granular dump/og scripts (`cli:dump:techblog`, `cli:dump:paper-stream`, `cli:og:techblog`, …) exist in the root `package.json` if you need to run just one content type.

## Content Pipeline

1. Posts are Markdown (+ MDX) with YAML front-matter validated by `postMetaSchema` — required fields: `uuid`, `title`, `description`, `category`, `tags`, `lang` (`ja`|`en`|`es`), `created_at`, `updated_at`.
2. `pnpm dump` runs `pnpm cli dump` for techblog and paperStream. It parses front-matter, compiles MDX using `REMARK_PLUGINS` + `REHYPE_PLUGINS` from `md-plugins`, extracts headings, downloads and optimizes images to AVIF via Sharp, and writes `web/dump/{techblog,paperStream}.json` validated by `dumpSchema`.
3. `pnpm cli:og` (Satori + Sharp) generates per-post OG images under `web/public/og/{techblog,paperstream}`. It downloads fonts first via `cli/download-fonts.sh`.
4. `pnpm cli:rss` builds RSS, Atom, and JSON feeds from the techblog dump into `web/public/rss`.
5. Next.js consumes `web/dump/*.json` at build time for static page generation (`output: "export"`).
6. Pagefind indexes the built `out/` directory for client-side search (`build:pagefind`).
7. `pnpm cli paper-stream` exports posts from Notion (filtered by Status=`Done`) into `posts/paperStream` + `posts/public/paperStream`.
8. `pnpm cli lint` runs custom lint rules on markdown posts (e.g. unrendered emphasis, SEO meta checks) — separate from textlint.

## Formatting, Linting & Type Checking

- **dprint** — monorepo-level formatter for JSON, YAML, Markdown, and Dockerfiles, plus Biome and Ruff plugins. Config: `dprint.json`. Excludes `web/src/**` (handled by Prettier) and generated dirs.
- **Biome 1.9** — formatter + linter for `cli/` and `packages/*`. Shared config in `packages/settings/biome.json`.
- **Prettier 3** — formats `web/src` and top-level web configs.
- **ESLint 9** (flat config, `web/eslint.config.mjs`) — lints `web/src` with `eslint-config-next`, `typescript-eslint`, `eslint-plugin-import`, `eslint-plugin-react`, `eslint-plugin-react-hooks`.
- **TypeScript** — each package runs `tsc --noEmit` as part of its `lint` script.
- **textlint** — prose linting with `preset-ai-writing`, `preset-ja-spacing`, `preset-ja-technical-writing` (config in `.textlintrc.json`).
- **sort-package-json** — keeps root / web / packages `package.json` sorted.
- **actionlint + ghalint + zizmor** — GitHub Actions linting (wired into `mise run lint`).
- **pre-commit** (`prek`) — managed via mise post-install hook (`.pre-commit-config.yaml`).

## Testing

- **Vitest 4** across all packages. Web uses `@vitejs/plugin-react` + jsdom for React component tests. Coverage uses `@vitest/coverage-v8`.
- **Playwright** for web e2e (`web/e2e/`, config `web/playwright.config.ts`). Run with `pnpm --filter web test:e2e`.
- **Stryker 9** mutation testing configured to mutate `packages/md-plugins/**`, `packages/ipynb2md/src/**`, and `cli/**` (see `stryker.config.json`).

## Turbo Pipeline

`turbo.json` defines: `build` (dependsOn `^build`), `dev` (dependsOn `^build`, persistent, not cached), `lint` / `test` / `test:coverage` (all dependsOn `^build`). Web and CLI builds cache `dist/`, `.next/`, `build/` outputs.

## Key Conventions

- **TypeScript throughout.** Zod schemas in `packages/common/` are the source of truth for post/data shapes — update them there, not ad-hoc elsewhere.
- **Tool versions** (`.mise.toml`): Node 22, pnpm 10, dprint 0.50, plus actionlint / ghalint / zizmor / prek / playwright CLI. `packageManager` is pinned to `pnpm@10.33.0` in the root `package.json`.
- **pnpm workspace hardening**: `pnpm-workspace.yaml` enables `blockExoticSubdeps`, `minimumReleaseAge: 1440` (1 day), `trustPolicy: no-downgrade`, and an explicit `onlyBuiltDependencies` allowlist (biome, swc, esbuild, sharp, unrs-resolver, workerd). Be aware when adding dependencies.
- **Multi-language content** via the `lang` front-matter field; posts live at `posts/techblog/{lang}/{category}/…` and are routed under `/[locale]/…`.
- **Images** are downloaded (if remote) and converted to AVIF by the CLI during `dump`, landing in `web/public/{category}/`.
- **Routing**: Next.js App Router with `[locale]` segment and a `(articles)` route group. `typedRoutes` is enabled, so internal links are type-checked.
- **Styling**: PandaCSS. Do not hand-edit `web/src/styled-system/` — it is regenerated by `panda codegen` (runs in web's `prepare` script).
- **Logging in the CLI**: use the shared `logger` from `cli/src/logger.ts` (pino) rather than `console.*`.
- **Commit / PR convention**: Recent history uses short imperative titles, often with a PR number suffix (e.g. `Add comprehensive test coverage for mutation guards (#149)`). Japanese titles are also acceptable for content-only changes.
- **Reproducible article companion directory (opt-in)**: A post at `posts/techblog/<lang>/<category>/<slug>.md` MAY be paired with a sibling directory `posts/techblog/<lang>/<category>/<slug>/` that pins the environment needed to reproduce the article (typically `flake.nix`, optional `flake.lock`, and a local `.gitignore` for `result` / `.direnv/` / etc.). Rules: (1) do **not** place any `.md` files inside the companion directory — `cli/src/io.ts` `getDumpPosts()` globs `**/*.md` and would pick them up as posts; put notes in `README.txt` or in the post body instead. (2) The dump / RSS / OG pipelines intentionally ignore non-md files, so nothing needs to change in the build pipeline. (3) `postMetaSchema` is not (yet) extended with a reproducibility field — linking to the companion directory from the rendered article is future work. See `posts/techblog/ja/development/reproducible-blog-with-nix/` for the pilot.

## Claude Code Integration

- **`.claude/settings.json`** — allowlist for common bash commands, mise tasks, and `pnpm cli:*` / `pnpm lint:*` / `pnpm test:*`. Hooks run `.claude/hooks/session-start.sh` on SessionStart and `.claude/hooks/stop.sh` on Stop.
- **SessionStart hook** installs mise tools and runs `pnpm install --frozen-lockfile` (skipping if `pnpm-lock.yaml` hash is unchanged since the last install — sentinel at `node_modules/.claude-pnpm-lock-hash`). You normally do not need to run `pnpm install` manually.
- **Skills** available under `.claude/skills/`: `techblog-writing` (authoring/editing Japanese tech posts) and `playwright-cli` (browser automation). Prefer the `techblog-writing` skill when asked to write or edit blog content.
- **GitHub access** is via MCP tools (`mcp__github__*`), restricted to `illumination-k/site`. The `gh` CLI is not available.
