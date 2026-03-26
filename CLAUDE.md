# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog/portfolio site (illumination-k.dev) built as a **pnpm + Turbo monorepo**. Blog posts are authored in Markdown, processed by a custom CLI into compiled JSON, and rendered by a statically-exported Next.js app deployed to Cloudflare Pages.

## Monorepo Structure

- **web/** — Next.js 16 frontend (App Router, PandaCSS, static export)
- **cli/** — TypeScript CLI (yargs) for post processing, image optimization, OG image generation, RSS generation, Notion export
- **packages/common/** — Shared Zod schemas and types (PostMeta, Post, DumpPost, Headings)
- **packages/md-plugins/** — Custom remark/rehype plugins (image optimization, header extraction, KaTeX, Prism+, GFM, directives)
- **packages/ipynb2md/** — Jupyter notebook to Markdown converter
- **packages/settings/** — Shared configuration files (biome.json, tsconfig.base.json)
- **posts/** — Blog content: `techblog/` (categorized by subdirectory), `paperStream/` (Notion exports), `public/` (images + OG images)

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm web-dev              # Next.js dev server (requires dump first)
pnpm dump                 # Process all markdown posts into JSON (web/dump/)
pnpm cli:build            # Build CLI tool
pnpm cli:dev              # CLI watch mode

# Full build (dump → OG images → RSS → Next.js static export)
pnpm web-build

# Testing & Linting
pnpm test                 # Run vitest via turbo
pnpm test:e2e             # Playwright e2e tests (in web/)
pnpm lint                 # dprint check + sort-package-json check + turbo lint (eslint)
pnpm format               # dprint fmt + sort-package-json + per-package formatters

# RSS & OG images
pnpm cli:rss              # Generate RSS/Atom/JSON feeds
pnpm cli:og               # Generate OG images (satori + sharp)

# Run CLI directly
pnpm cli <command>        # e.g. pnpm cli dump, pnpm cli rss, pnpm cli og, pnpm cli template, pnpm cli paper-stream
```

## Content Pipeline

1. Posts are Markdown files with YAML front-matter (uuid, title, description, category, lang, tags, created_at, updated_at)
2. `pnpm dump` runs the CLI which: parses front-matter → compiles MDX with remark/rehype plugins → optimizes images (downloads remote, converts to AVIF via Sharp) → outputs JSON to `web/dump/`
3. `pnpm cli:og` generates OG images using Satori + Sharp
4. Next.js reads the dump JSON at build time for static page generation
5. Pagefind indexes the built output for client-side search
6. `pnpm cli paper-stream` exports posts from Notion (filtered by status="Done")

## Formatting & Linting

- **dprint** — monorepo-level formatter (JSON, YAML, Markdown, Dockerfile, with Biome and Ruff plugins)
- **Prettier** — web package formatter
- **Biome** — CLI and packages formatter/linter (shared config in `packages/settings/biome.json`)
- **ESLint 9** (flat config) — web package linting
- **textlint** — text linting
- **sort-package-json** — keeps package.json files sorted

## Key Conventions

- TypeScript throughout; Zod schemas in `packages/common/` are the source of truth for data shapes
- Node.js 20, pnpm 10 (managed via mise — see `.mise.toml`)
- Multi-language content support (ja/en) via `lang` field in front-matter
- Images are converted to AVIF and served from `web/public/{category}/`
- Turbo handles task dependency ordering (`build` depends on `^build`)
