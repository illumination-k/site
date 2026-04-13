# illumination-k.dev

> Personal tech blog and paper-stream by [@illumination-k](https://github.com/illumination-k).
> Live at **<https://www.illumination-k.dev>**.

A handcrafted publishing system: Markdown + MDX in, a statically-exported
Next.js site out, with a tiny custom CLI (`post-utils`) tying everything
together. Trilingual (日本語 / English / Español), searchable, syndicated,
reproducible.

## Highlights

- **Trilingual techblog.** Posts live under `posts/techblog/{ja,en,es}/…` and
  are routed through a single `[locale]` segment — the same site, three
  languages, one pipeline.
- **paperStream.** A research reading-log synced from a Notion database
  (filtered by `Status=Done`) via `pnpm cli paper-stream`, then rendered
  alongside the techblog.
- **Rich Markdown, not plain Markdown.** A small collection of directive-based
  embeds — `:::github`, `:::github-card`, `:::youtube`, `:::doi`, `:::book`,
  `:::file`, plus `:::details` and `:::figure` containers — makes posts feel
  alive without leaving MDX. Code blocks get titles, headings get anchor IDs,
  math renders with KaTeX, diagrams with Mermaid, code with Prism.
- **Automatic OG images.** Every post gets a per-title social card generated
  at build time with Satori + Sharp.
- **Feeds.** RSS, Atom, and JSON feeds are produced from the compiled dump —
  one command, three formats.
- **Client-side search.** Pagefind indexes the static export after the build,
  so search stays instant without any server.
- **AVIF everywhere.** Images referenced in posts are fetched (if remote),
  resized, and converted to AVIF during the dump step, so pages stay light.
- **Reproducible articles.** A post can ship a sibling directory with a
  `flake.nix` that pins the exact environment used to write it — so "it
  worked on my machine" becomes `nix develop`.
- **Statically exported and edge-hosted.** `output: "export"` → Cloudflare
  Pages. Typed routes keep internal links honest; redirects live in
  `etc/cloudflare/bulk_redirects.csv`.
- **Taken seriously.** Biome, ESLint, Prettier, dprint, textlint, actionlint,
  ghalint, zizmor, Vitest, Playwright, and Stryker mutation testing all run
  in CI. The pnpm workspace is hardened with `blockExoticSubdeps`, a 1-day
  `minimumReleaseAge`, and an explicit `onlyBuiltDependencies` allowlist.

## Under the hood

| Area      | Choice                                                   |
| --------- | -------------------------------------------------------- |
| Framework | Next.js 16 (App Router, React 19, static export)         |
| Styling   | PandaCSS                                                 |
| Content   | Markdown / MDX → remark + rehype (`packages/md-plugins`) |
| Schemas   | Zod (`packages/common`) as the single source of truth    |
| CLI       | TypeScript + yargs + tsup (`cli/`), pino for logs        |
| Images    | Sharp (AVIF), Satori for OG cards                        |
| Search    | Pagefind                                                 |
| Notebooks | In-house `ipynb2md` converter (`packages/ipynb2md`)      |
| Monorepo  | pnpm 10 workspaces + Turbo                               |
| Hosting   | Cloudflare Pages                                         |

## Repository layout

```
web/        Next.js 16 app (App Router, static export)
cli/        post-utils CLI (dump, og, rss, template, lint, orcid, …)
packages/
  common/       Shared Zod schemas & types
  md-plugins/   remark / rehype plugins + embed transformers
  ipynb2md/     Jupyter notebook → Markdown
  settings/     Shared biome.json / tsconfig.base.json
posts/
  techblog/{ja,en,es}/{category}/*.md
  paperStream/                           Notion exports
  public/                                Image / OG source assets
etc/cloudflare/bulk_redirects.csv
```

## Development

The full command reference, content pipeline, and repo conventions live in
**[CLAUDE.md](./CLAUDE.md)** — it's the canonical guide for working on this
codebase (whether you're a human or an LLM).

Tool versions are pinned in [`.mise.toml`](./.mise.toml); with
[`mise`](https://mise.jdx.dev) installed, `mise install` provisions Node,
pnpm, dprint, and the Actions linters. The usual loop is then:

```bash
pnpm install   # frozen lockfile
pnpm dump      # compile posts → web/dump/*.json
pnpm web-dev   # Next.js dev server + pagefind
```

## License

Code is released under the ISC license (see `package.json`). Blog content
under `posts/` is authored by the site owner and is not covered by that
license.
