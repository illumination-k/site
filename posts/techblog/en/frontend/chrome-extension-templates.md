---
uuid: 81d49268-b6d1-490e-8210-a0a13cff2e88
title: "Developing Chrome Extensions with React + Vite + TypeScript"
description: "I created a template for building Chrome extensions with React + Vite + TypeScript. The dependencies are basically just these, and it's configured so you can start development right away."
category: "techblog"
lang: en
tags: ["chrome extension"]
created_at: 2024-09-23
updated_at: 2024-09-23
---

## TL;DR

I created a template for building Chrome extensions with React + Vite + TypeScript.

There is also the option of using CRXJS vite plugins, but it only supports Vite up to version 3 and is no longer actively maintained. So the dependencies are basically just React, Vite, and TypeScript.

::gh-card[illumination-k/chrome-extension-templates]

## Features and Usage of the Template

### 1. Unified Build for background, content-scripts, and popup

React is used for the UI components. These are managed under the `popup` directory.

Content Scripts for DOM manipulation are managed under `content-script`, and code that uses Service Workers is managed under `background`.

All of these are built together into the `dist` directory with `pnpm build`, and can be used immediately by uploading them in Chrome's developer mode.

![alt text](../../public/chrome-ext.png)

### 2. Formatter and Linter Setup

The following tools are used:

- [biome](https://biomejs.dev) for TypeScript formatting and linting
- [dprint](https://dprint.dev) for formatting and linting configuration files (markdown, json, yaml, toml)
- [sort-package-json](https://github.com/keithamus/sort-package-json) for sorting `package.json` field order

These can be used via commands like `pnpm fmt` and `pnpm lint`.

### 3. Basic GitHub Actions Configuration

CI is set up to run:

- [actionlint](https://github.com/rhysd/actionlint) for linting GitHub Actions
- [biome](https://biomejs.dev), [dprint](https://dprint.dev), and [sort-package-json](https://github.com/keithamus/sort-package-json) for linting the source code

## Internals

### Structure

The project has the following structure.
Basically, background, content-scripts, and popup are implemented in separate directories, and the build process places everything under dist.

```
./
├── background/
│  └── background.ts
├── biome.json
├── content-scripts/
│  ├── content-scripts.ts
│  └── main.ts
├── dprint.json
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── popup/
│  ├── index.html
│  └── src/
│     ├── App.css
│     ├── App.tsx
│     ├── assets/
│     │  └── react.svg
│     ├── index.css
│     ├── main.tsx
│     └── vite-env.d.ts
├── public/
│  ├── manifest.json
│  └── vite.svg
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite-background.config.ts
├── vite-content.config.ts
└── vite.config.ts
```

### `manifests.json`

We use version 3. Also, since React is used, it's managed as `public/manifest.json`.

::gh[https://github.com/illumination-k/chrome-extension-templates/blob/main/public/manifest.json]

### Configuration Files

`vite.config.ts` contains the Popup configuration.
React is only used here.

::gh[https://github.com/illumination-k/chrome-extension-templates/blob/main/vite.config.ts]

`vite-background.config.ts` and `vite-content-scripts.config.ts` are nearly identical -- they just configure the output to the dist directory.

::gh[https://github.com/illumination-k/chrome-extension-templates/blob/main/vite-background.config.ts]

::gh[https://github.com/illumination-k/chrome-extension-templates/blob/main/vite-content-scripts.config.ts]
