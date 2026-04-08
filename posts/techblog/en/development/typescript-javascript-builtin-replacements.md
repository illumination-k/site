---
uuid: a8d47ac4-2e5f-4de6-adfd-c82ae90c85d8
title: "No More Libraries? A Comprehensive Guide to npm Packages You Can Replace with Built-in APIs (2026 Edition)"
description: "Learn how to replace once-essential npm packages like axios, lodash, moment, uuid, dotenv, chalk, nodemon, and ts-node with standard Web APIs and built-in Node.js features -- covering both browser and Node.js."
category: techblog
lang: en
tags:
  - ai-generated
  - javascript
  - typescript
  - nodejs
  - browser
  - web-api
created_at: 2026-04-06
updated_at: 2026-04-06
---

This article comprehensively covers areas where "a popular library exists, but the standard is now good enough," from both the browser and Node.js perspectives. The target environment is Node.js 24 LTS (Krypton) and later, along with Web APIs available in all major browsers.

## TL;DR

- In browsers, `fetch`, `structuredClone`, `crypto.randomUUID()`, `URLSearchParams`, Set methods, and Iterator helpers are all available as standard. Many use cases for axios and lodash are no longer necessary
- In Node.js, global `fetch`, `node:test`, `--watch`, `--env-file`, `fs.glob`, `util.styleText`, and `--strip-types` are stable in LTS. They can replace node-fetch, nodemon, dotenv, chalk, and ts-node
- The biggest benefit of "sticking with the standard" is reducing supply chain risk and bundle size by cutting dependencies. However, some areas like interceptors remain difficult to cover with standard APIs alone

## Background: The axios Supply Chain Attack and Why "Sticking with the Standard" Matters

On March 31, 2026, [axios](https://github.com/axios/axios), an HTTP client with over 100 million weekly downloads, was hit by a supply chain attack. A threat actor linked to North Korea compromised an npm account and published malicious versions (1.14.1, 0.30.4). These automatically installed a cross-platform RAT (Remote Access Tool) through a fake dependency package called `plain-crypto-js`. axios is estimated to be present in about 80% of cloud environments, making the impact enormous.

What this incident symbolizes is "the risk of continuing to use a library when the standard can do the job." Now that `fetch` is globally available in both browsers and Node.js, there is little reason to include axios as a dependency for simple HTTP requests. One fewer dependency means one fewer attack surface.

Against this backdrop, the JavaScript/TypeScript ecosystem has been moving toward "incorporating features into the standard."

On the browser side, the number of APIs that work consistently across the four major engines (Chrome, Firefox, Safari, Edge) has grown. ECMAScript 2025 standardized Set methods and Iterator helpers, and in March 2026, Temporal reached Stage 4.

On the Node.js side, v18 added global `fetch` and `node:test`, v20 added `--env-file` and `--watch`, v22 added `fs.glob` and `util.styleText`, and v24 brought TypeScript type stripping and global `URLPattern`. As of Node.js 24 LTS, many npm packages that were once needed during development can be replaced with built-in features.

The stance of this article is "if the standard can do it, stick with the standard." Reducing dependencies not only cuts bundle size and maintenance costs but also directly reduces the attack surface for supply chain attacks.

## Browser

### fetch: Replacing axios

[MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) / [Node.js: Global fetch](https://nodejs.org/api/globals.html#fetch)

`fetch` is available as standard in all browsers, and has been globally available in Node.js 18+ (internally based on undici). The main reason for using axios -- "working in both browser and Node" -- is now achievable with the standard alone.

```typescript
// axios
const res = await axios.get("/api/users", { params: { page: 1 } });
const users = res.data;

// fetch (standard)
const res = await fetch("/api/users?" + new URLSearchParams({ page: "1" }));
const users = await res.json();
```

Timeouts can be written concisely with [`AbortSignal.timeout()` (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) (supported in major browsers since 2024).

```typescript
// axios
await axios.get("/api/data", { timeout: 5000 });

// fetch + AbortSignal.timeout
await fetch("/api/data", { signal: AbortSignal.timeout(5000) });
```

To combine multiple signals, use [`AbortSignal.any()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static) (also supported since 2024).

```typescript
const controller = new AbortController();
const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]);
await fetch("/api/data", { signal });
// Both manual cancellation and timeout work
```

However, fetch lacks request/response interceptors, automatic retries, and progress events. If you need these, consider axios or the lighter [ky](https://github.com/sindresorhus/ky) (~2KB). For simple API calls, fetch is sufficient.

### structuredClone: Replacing lodash.cloneDeep / deepmerge

[MDN: structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) / [Node.js: structuredClone()](https://nodejs.org/api/globals.html#structuredclonevalue-options)

`structuredClone()` is available as standard in all browsers and Node.js 17+. Deep copying in a single line.

```typescript
// lodash
import cloneDeep from "lodash/cloneDeep";
const copy = cloneDeep(original);

// standard
const copy = structuredClone(original);
```

However, it cannot copy functions, DOM nodes, `Error` objects, or prototype chains. lodash is still needed for copying class instances. For JSON-serializable data structures, `structuredClone` is sufficient.

### crypto.randomUUID: Replacing the uuid Package

[MDN: Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) / [Node.js: crypto.randomUUID()](https://nodejs.org/api/crypto.html#cryptorandomuuid)

`crypto.randomUUID()` generates v4 UUIDs. Available in browsers and Node.js 19+.

```typescript
// uuid package
import { v4 as uuidv4 } from "uuid";
const id = uuidv4();

// standard
const id = crypto.randomUUID();
```

However, if you need UUID versions other than v4 (v1, v5, v7, etc.), the uuid package is still required. For v4 only, the standard is sufficient.

### URLSearchParams: Replacing query-string

[MDN: URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) / [Node.js: URLSearchParams](https://nodejs.org/api/url.html#class-urlsearchparams)

`URLSearchParams` is available as standard in all browsers and Node.js.

```typescript
// query-string
import queryString from "query-string";
const parsed = queryString.parse("?foo=bar&baz=1");
const str = queryString.stringify({ foo: "bar", baz: 1 });

// standard
const parsed = Object.fromEntries(new URLSearchParams("?foo=bar&baz=1"));
const str = new URLSearchParams({ foo: "bar", baz: "1" }).toString();
```

Note that `URLSearchParams` handles array values differently from `query-string` (for `foo=1&foo=2`, you need to use `getAll("foo")`). Unless you need complex query string parsing, the standard is sufficient.

### Object.groupBy / Map.groupBy: Replacing lodash.groupBy

[MDN: Object.groupBy()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy)

`Object.groupBy` was standardized in ES2024 and is available in all major browsers.

```typescript
// lodash
import groupBy from "lodash/groupBy";
const grouped = groupBy(users, (u) => u.role);

// standard
const grouped = Object.groupBy(users, (u) => u.role);
```

Use `Map.groupBy` when you want to use objects as keys.

### Set Methods: Replacing Manual Implementations and lodash

[MDN: Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

ES2025 added mathematical set operation methods to `Set`, now available in all major browsers.

```typescript
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);

a.intersection(b); // Set {3, 4}
a.union(b); // Set {1, 2, 3, 4, 5, 6}
a.difference(b); // Set {1, 2}
a.symmetricDifference(b); // Set {1, 2, 5, 6}
a.isSubsetOf(b); // false
a.isSupersetOf(b); // false
a.isDisjointFrom(b); // false
```

Previously, manual implementations like `[...a].filter(x => b.has(x))` or lodash's `_.intersection` were needed, but now these run natively and efficiently.

### Iterator Helpers: Replacing lodash-style Chaining

[MDN: Iterator helpers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator)

ES2025 Iterator helpers (supported in major browsers since March 2025) enable lazy evaluation chaining as a standard feature.

```typescript
// lodash chain
import _ from "lodash";
const result = _(users)
	.filter((u) => u.active)
	.map((u) => u.name)
	.take(5)
	.value();

// Iterator helpers (lazy evaluation)
const result = users
	.values()
	.filter((u) => u.active)
	.map((u) => u.name)
	.take(5)
	.toArray();
```

`Iterator.from()` also works with generators and any iterable. Since no intermediate arrays are created when processing large datasets, memory efficiency is improved.

### Temporal: Replacing moment/dayjs

[MDN: Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) / [TC39: proposal-temporal](https://github.com/tc39/proposal-temporal)

Reached TC39 Stage 4 in March 2026, with native support in Chrome 144+ and Firefox 139+. Immutable date/time operations are now possible as a standard feature.

```typescript
// moment
import moment from "moment";
const now = moment();
const tomorrow = now.clone().add(1, "day");
const formatted = tomorrow.format("YYYY-MM-DD");

// Temporal (standard)
const now = Temporal.Now.plainDateTimeISO();
const tomorrow = now.add({ days: 1 });
const formatted = tomorrow.toPlainDate().toString(); // "2026-04-07"
```

```typescript
// Time zone support
const tokyo = Temporal.Now.zonedDateTimeISO("Asia/Tokyo");
const ny = tokyo.withTimeZone("America/New_York");

// Duration calculation
const start = Temporal.PlainDate.from("2026-01-01");
const end = Temporal.PlainDate.from("2026-04-06");
const duration = start.until(end); // P3M5D (3 months and 5 days)
```

However, Safari and Edge still require a flag, so using a polyfill ([temporal-polyfill](https://www.npmjs.com/package/temporal-polyfill)) in production is recommended. The polyfill is skipped when the browser has native support. Stable availability across all browsers is expected in late 2026.

### URLPattern: Replacing path-to-regexp

[MDN: URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) / [Node.js: URLPattern](https://nodejs.org/api/url.html#class-urlpattern)

URLPattern has been supported in major browsers since September 2025. In Node.js 24, it is available globally.

```typescript
// path-to-regexp
import { match } from "path-to-regexp";
const fn = match("/users/:id");
const result = fn("/users/123"); // { params: { id: "123" } }

// URLPattern (standard)
const pattern = new URLPattern({ pathname: "/users/:id" });
const result = pattern.exec({ pathname: "/users/123" });
const id = result?.pathname.groups.id; // "123"
```

Useful for implementing routing without a framework or for request matching within Service Workers.

## Node.js

### Global fetch: Replacing node-fetch

[Node.js: Global fetch](https://nodejs.org/api/globals.html#fetch)

Since Node.js 18, `fetch` is globally available (internally based on undici).

```typescript
// node-fetch (before)
import fetch from "node-fetch";
const res = await fetch("https://api.example.com/data");

// Node.js 18+ (no import needed)
const res = await fetch("https://api.example.com/data");
const data = await res.json();
```

The node-fetch package is no longer needed. However, if you need advanced undici-specific features (connection pool control, HTTP/2, etc.), use `import { request } from "undici"` directly.

### node:test: A Candidate to Replace Jest/Mocha/Vitest

[Node.js: Test runner](https://nodejs.org/api/test.html)

Stable since Node.js 18. A zero-dependency test runner available via `node:test`.

```typescript
import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

describe("Calculator", () => {
	it("adds two numbers", () => {
		assert.strictEqual(1 + 2, 3);
	});

	it("supports mocking", () => {
		const fn = mock.fn((x: number) => x * 2);
		assert.strictEqual(fn(3), 6);
		assert.strictEqual(fn.mock.callCount(), 1);
	});
});
```

```bash
# Run
node --test

# With coverage
node --test --experimental-test-coverage

# Watch mode (Node.js 23+)
node --test --watch
```

Well suited for unit testing libraries, CLI tools, and backends. The zero-dependency nature is effective for speeding up CI and reducing Docker image size. However, if you need snapshot testing, rich matchers, UI mode, or browser testing, Vitest/Jest still have the advantage. For new Node.js library development, `node:test` is worth considering as the first choice.

### --watch: Replacing nodemon

[Node.js: --watch](https://nodejs.org/api/cli.html#--watch)

The `--watch` flag has been available since Node.js 18.11 (stable in Node.js 22+).

```bash
# nodemon
npx nodemon server.ts

# Node.js standard
node --watch server.ts
```

To watch only specific paths, use `--watch-path`.

```bash
node --watch-path=./src --watch-path=./config server.ts
```

However, if you need fine-grained configuration via `.nodemonrc` (ignore, delay, ext specification, etc.), nodemon still has the advantage. For simple restarts, `--watch` is sufficient.

### --env-file: Replacing dotenv

[Node.js: --env-file](https://nodejs.org/api/cli.html#--env-fileconfig)

The `--env-file` flag has been available since Node.js 20.6.

```bash
# dotenv (import in code)
# import "dotenv/config";
# node server.js

# Node.js standard (no code changes needed)
node --env-file=.env server.js

# Multiple files
node --env-file=.env --env-file=.env.local server.js
```

No need to import `dotenv` in your application code -- just add it to your `package.json` scripts.

```json title=package.json
{
  "scripts": {
    "dev": "node --env-file=.env --watch server.ts"
  }
}
```

### fs.glob: Replacing the glob Package

[Node.js: fs.promises.glob()](https://nodejs.org/api/fs.html#fspromisesglob)

`fs.glob` and `fs.promises.glob` were added in Node.js 22.0 and stabilized in 22.17 LTS.

```typescript
// glob package
import { glob } from "glob";
const files = await glob("src/**/*.ts");

// Node.js standard
import { glob } from "node:fs/promises";
const files = [];
for await (const entry of glob("src/**/*.ts")) {
	files.push(entry);
}
```

The standard `fs.glob` returns an `AsyncIterable`, so if you want an array, you need to collect entries with `for await...of`. Option support (like ignore) is limited compared to the glob package, but for simple pattern matching, the standard is sufficient.

### fs.rm: Replacing rimraf

[Node.js: fs.promises.rm()](https://nodejs.org/api/fs.html#fspromisesrmpath-options)

`fs.rm` can recursively delete directories with the `{ recursive: true, force: true }` option (available since Node.js 14.14).

```typescript
// rimraf
import { rimraf } from "rimraf";
await rimraf("dist");

// Node.js standard
import { rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
```

Same applies in shell scripts.

```bash
# rimraf (cross-platform rm -rf)
npx rimraf dist

# Node.js standard
node -e "require('fs').rmSync('dist', { recursive: true, force: true })"
```

The original purpose of rimraf -- Windows-compatible recursive deletion -- is now solved by `fs.rm`.

### util.styleText: Replacing chalk

[Node.js: util.styleText()](https://nodejs.org/api/util.html#utilstyletextformat-text)

`util.styleText` was added in Node.js 20.12 and stabilized in 22.17 LTS.

```typescript
// chalk
import chalk from "chalk";
console.log(chalk.red.bold("Error:"), chalk.yellow("file not found"));

// Node.js standard
import { styleText } from "node:util";
console.log(
	styleText(["red", "bold"], "Error:"),
	styleText("yellow", "file not found"),
);
```

However, if you need complex styling with template literals or custom themes, chalk still has the advantage. For simple colored log output, `util.styleText` is sufficient.

### TypeScript Type Stripping: Replacing ts-node/tsx

[Node.js: TypeScript support](https://nodejs.org/api/typescript.html)

Introduced as `--experimental-strip-types` in Node.js 22.6, and enabled by default for `.ts` files in Node.js 24 LTS.

```bash
# ts-node
npx ts-node src/main.ts

# tsx
npx tsx src/main.ts

# Node.js 24+ (no additional packages needed)
node src/main.ts
```

It only strips type annotations without performing transpilation. Syntax that requires JavaScript code generation -- such as `enum`, `namespace`, and constructor parameter properties (`public x: number`) -- will cause runtime errors.

```typescript
// ✅ Works
interface User {
	name: string;
	age: number;
}
const greet = (user: User): string => `Hello, ${user.name}`;

// ❌ Runtime error (requires code generation)
enum Direction {
	Up,
	Down,
}
```

However, if you use `enum`, path aliases (`paths`), or need to target Node.js 22 or earlier, tsx is still needed. For new projects, it is recommended to avoid `enum` in favor of `as const` and design for compatibility with Node.js's built-in type stripping.

## Summary

As of 2026, the areas where "the standard is sufficient" are steadily expanding. The following table summarizes the correspondences.

| Legacy Library               | Standard Replacement              | Environment               |
| ---------------------------- | --------------------------------- | ------------------------- |
| axios (simple requests)      | `fetch` + `AbortSignal.timeout()` | Browser + Node 18+        |
| lodash.cloneDeep / deepmerge | `structuredClone`                 | Browser + Node 17+        |
| uuid (v4)                    | `crypto.randomUUID()`             | Browser + Node 19+        |
| query-string                 | `URLSearchParams`                 | Browser + Node            |
| lodash.groupBy               | `Object.groupBy`                  | Browser + Node 21+        |
| Manual Set operations        | `Set.prototype.intersection` etc. | Browser + Node 22+        |
| lodash chaining              | Iterator helpers                  | Browser + Node 22+        |
| moment / dayjs               | `Temporal`                        | Chrome 144+, Firefox 139+ |
| path-to-regexp               | `URLPattern`                      | Browser + Node 24+        |
| node-fetch                   | Global `fetch`                    | Node 18+                  |
| nodemon                      | `node --watch`                    | Node 22+                  |
| dotenv                       | `node --env-file`                 | Node 20.6+                |
| glob                         | `fs.glob`                         | Node 22+                  |
| rimraf                       | `fs.rm`                           | Node 14.14+               |
| chalk                        | `util.styleText`                  | Node 22+                  |
| ts-node / tsx                | `node --strip-types`              | Node 24+                  |
| jest / mocha                 | `node:test`                       | Node 18+                  |

As noted in each section, standard APIs do have limitations. However, reducing dependencies benefits security, performance, and maintenance across the board. For new projects, we recommend starting with standard APIs and adding libraries only when they fall short.
