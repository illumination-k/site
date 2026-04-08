---
uuid: b4c996d6-898d-4dff-98b4-4ddb34afea50
title: Rebuilding a JAM Stack Blog with Modern Technologies
description: A comparison article about the technologies used when rebuilding an old blog with recent technologies. It provides a detailed explanation of the previous blog's tech stack, the reasons for choosing the new technologies, and the technologies that were not adopted.
lang: en
tags:
    - development
    - frontend
    - twind
    - nextjs
category: frontend
created_at: 2023-03-27
updated_at: 2023-03-27
---

## TL;DR

I rebuilt a blog I had created in the past using technologies I've been using recently. I want to write articles about the technologies used in creating the new blog, so here I'll write about the comparison and the technologies I considered.

## The Previous Blog

### Tech Stack of the Previous Blog

- Backend
  - Heroku
  - Actix-web
  - lindera (morphological analysis)
  - [Tantivy](https://github.com/tantivy-search/tantivy) (full-text search)
  - Distributed as a single binary

- Frontend
  - Google App Engine
  - yarn
  - mdx
  - Nextjs
  - Material UI
  - AMP

#### Problems with the Previous Blog

- Having three repositories (frontend, backend, blog posts) just for a blog was cumbersome
- Since it was built with Full AMP, it was hard to leverage React's benefits
- AMP Analytics was slow to support GA4 ([Support App + Web properties on Google Analytics (gtag)](https://github.com/ampproject/amphtml/issues/24621))
- Fine-grained adjustments were cumbersome because of Material UI
- The deprecation of Heroku's free tier left us without a backend deployment destination

## The New Blog

The problems with the previous blog were addressed as follows:

- Since maintaining multiple repositories was cumbersome, I consolidated everything into a monorepo structure.
- I used twind, a CSS-in-JS library similar to Tailwind, to enable flexible styling.
- By using Meilisearch, a search engine that doesn't require a server, I eliminated the need for a backend.
- By abandoning AMP support, I avoided AMP-specific constraints and also enabled GA4 support.

### Tech Stack of the New Blog

- Google Cloud Run
- pnpm
- monorepo
- mdx
- Nextjs
- twind
- meilisearch

#### Reasons for Adoption

1. Google Cloud Run

This time, I wanted to SSG the necessary posts using multi-stage builds in Docker and deploy with Next.js standalone mode. That's why I used Google Cloud Run, which allows you to deploy Docker containers directly. Additionally, since I was previously using Google App Engine, migrating the custom domain was straightforward.

2. monorepo

I decided to use a CLI to preprocess blog posts, saving the metadata obtained from frontmatter and the MDX-compiled article data in JSON format, which would then be used during Next.js SSG.

As a result, the structure became:

- `common`: zod schema + types
- `web`: Nextjs
- `cli`: conversion to JSON

In addition, I created the following for implementing custom MDX parsers:

- `md-plugins`: repository for `remark` and `rehype` plugins

By extracting blog posts and metadata into `common` and using `zod` for type-safe parsing, I could convert Markdown to JSON with the CLI using the shared schemas and types from `common`, and then parse the JSON type-safely with `zod` during Next.js SSG. This turned out to be a great experience.

3. Nextjs

It was the framework I had the most experience with. Its rapid evolution also made it worthwhile for keeping up with the latest developments.

4. mdx

I like it because you can do whatever you want by creating custom plugins. I plan to use it in moderation since going overboard makes things hard to understand.

5. twind

twind is a CSS-in-JS library often associated with Deno. You can style things similarly to Tailwind CSS, but with benefits like grouping syntax such as `lg:(text-xl font-bold)` for better readability, no need for `postcss`, and compilation at build time.

1. meilisearch

Meilisearch is an OSS full-text search server written in Rust. You can register articles by sending JSON and retrieve a list of articles by sending a query, making it easy to implement a search service. The cloud plan also allows up to 10,000 free search requests, so implementation is quick and simple.

### Technologies Not Adopted

1. AMP

Google seemed to be losing interest in AMP. Additionally, since sufficiently fast sites could be built without relying on AMP, the benefits of AMP were no longer apparent.

2. Material UI

I wanted to write Tailwind.

3. Custom Backend

It was cumbersome to deploy multiple times.

4. WebAssembly-based search like tinysearch

I initially planned to use this and tried implementing it with `tinysegmenter`. However, I decided against it because it meant giving up the type safety that comes with completing everything in TypeScript, and the preprocessing for stop word removal was extremely tedious. The ease of implementing Meilisearch was also a factor.
