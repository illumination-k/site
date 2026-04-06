---
uuid: a8d47ac4-2e5f-4de6-adfd-c82ae90c85d8
title: "もうライブラリ不要? 標準APIで置き換えられるnpmパッケージ総まとめ (2026年版)"
description: "axios, lodash, moment, uuid, dotenv, chalk, nodemon, ts-nodeなど、かつて必須だったnpmパッケージを標準のWeb API・Node.js組み込み機能で置き換える方法を、ブラウザとNode.jsの両面から網羅的に解説します。"
category: techblog
lang: ja
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

この記事では「有名ライブラリはあるが、標準で十分になった」領域を、ブラウザとNode.jsの両面から網羅的に整理する。対象はNode.js 24 LTS (Krypton)以降と、Baseline Widely/Newly availableなWeb APIとする。

## TL;DR

- ブラウザでは`fetch`・`structuredClone`・`crypto.randomUUID()`・`URLSearchParams`・Setメソッド・Iteratorヘルパー等が標準で使える。axiosやlodashの多くのユースケースは不要になった
- Node.jsではグローバル`fetch`・`node:test`・`--watch`・`--env-file`・`fs.glob`・`util.styleText`・`--strip-types`がLTSで安定した。node-fetchやnodemon・dotenv・chalk・ts-nodeを代替できる
- 「標準に寄せる」最大のメリットは依存数の削減によるサプライチェーンリスクの低減とバンドルサイズの削減。ただしインターセプター等、標準では難しい領域も残る

## 背景: Native-firstの潮流

近年、JavaScript/TypeScriptのエコシステムは「標準に機能を取り込む」方向に大きく動いている。

ブラウザ側では、Web Platform Baselineの整備が進み、主要4エンジン(Chrome, Firefox, Safari, Edge)で動作するAPIが増えた。ECMAScript 2025ではSetメソッドやIteratorヘルパーが標準化され、2026年3月にはTemporalがStage 4に到達した。

Node.js側では、v18でグローバル`fetch`と`node:test`、v20で`--env-file`と`--watch`が追加された。v22で`fs.glob`と`util.styleText`、v24でTypeScript型ストリッピングと`URLPattern`のグローバル化が実現した。Node.js 24 LTSの時点で、開発時に必要だった多くのnpmパッケージが組み込み機能で代替できる。

この記事のスタンスは「標準で済むなら標準に寄せる」。依存を減らすことは、サプライチェーン攻撃の対象面を減らし、バンドルサイズを削減し、メンテナンスコストを下げる。2026年3月のLiteLLMサプライチェーン攻撃が示したように、依存は少ないに越したことはない。

## ブラウザ編

### fetch: axiosの代替

`fetch`はBaselineとして全ブラウザで安定しており、Node.js 18以降ではグローバルに利用可能(内部的にはundici)。axiosを使う主な理由だった「ブラウザ/Node両対応」は、もはや標準だけで成立する。

```typescript
// axios
const res = await axios.get("/api/users", { params: { page: 1 } });
const users = res.data;

// fetch (標準)
const res = await fetch("/api/users?" + new URLSearchParams({ page: "1" }));
const users = await res.json();
```

タイムアウトは`AbortSignal.timeout()`で簡潔に書ける(Baseline 2024)。

```typescript
// axios
await axios.get("/api/data", { timeout: 5000 });

// fetch + AbortSignal.timeout
await fetch("/api/data", { signal: AbortSignal.timeout(5000) });
```

複数のシグナルを組み合わせたい場合は`AbortSignal.any()`(Baseline 2024)を使う。

```typescript
const controller = new AbortController();
const signal = AbortSignal.any([
  controller.signal,
  AbortSignal.timeout(5000),
]);
await fetch("/api/data", { signal });
// 手動キャンセルもタイムアウトも両方効く
```

**axiosがまだ勝つ場面**: リクエスト/レスポンスのインターセプター、自動リトライ、進捗イベント。これらが必要な場合はaxiosか、より軽量な[ky](https://github.com/sindresorhus/ky)(~2KB)を検討する。単純なAPI呼び出しならfetchで十分。

### structuredClone: lodash.cloneDeep / deepmergeの代替

`structuredClone()`はBaselineとして全ブラウザ・Node.js 17以降で利用可能。ディープコピーが1行で書ける。

```typescript
// lodash
import cloneDeep from "lodash/cloneDeep";
const copy = cloneDeep(original);

// 標準
const copy = structuredClone(original);
```

**制限**: 関数、DOMノード、`Error`オブジェクト、プロトタイプチェーンはコピーできない。クラスインスタンスのコピーにはlodashが引き続き必要。JSONシリアライズ可能なデータ構造であれば`structuredClone`で十分。

### crypto.randomUUID: uuidパッケージの代替

`crypto.randomUUID()`はv4 UUIDを生成する。ブラウザ(セキュアコンテキスト)とNode.js 19以降で利用可能。

```typescript
// uuid パッケージ
import { v4 as uuidv4 } from "uuid";
const id = uuidv4();

// 標準
const id = crypto.randomUUID();
```

**注意点**: v4 UUID以外(v1, v5, v7等)が必要な場合はuuidパッケージが必要。v4だけなら標準で十分。

### URLSearchParams: query-stringの代替

`URLSearchParams`はBaselineとして全環境で利用可能。

```typescript
// query-string
import queryString from "query-string";
const parsed = queryString.parse("?foo=bar&baz=1");
const str = queryString.stringify({ foo: "bar", baz: 1 });

// 標準
const parsed = Object.fromEntries(new URLSearchParams("?foo=bar&baz=1"));
const str = new URLSearchParams({ foo: "bar", baz: "1" }).toString();
```

**制限**: `URLSearchParams`は配列値の扱いが`query-string`と異なる(`foo=1&foo=2`の場合、`getAll("foo")`を使う必要がある)。複雑なクエリ文字列の解析が必要でなければ標準で十分。

### Object.groupBy / Map.groupBy: lodash.groupByの代替

`Object.groupBy`はES2024で標準化され、Baseline Newly availableとなった。

```typescript
// lodash
import groupBy from "lodash/groupBy";
const grouped = groupBy(users, (u) => u.role);

// 標準
const grouped = Object.groupBy(users, (u) => u.role);
```

キーにオブジェクトを使いたい場合は`Map.groupBy`を使う。

### Setメソッド: 手動実装やlodashの代替

ES2025で`Set`に数学的な集合演算メソッドが追加された(Baseline Newly available)。

```typescript
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);

a.intersection(b); // Set {3, 4}
a.union(b);        // Set {1, 2, 3, 4, 5, 6}
a.difference(b);   // Set {1, 2}
a.symmetricDifference(b); // Set {1, 2, 5, 6}
a.isSubsetOf(b);   // false
a.isSupersetOf(b); // false
a.isDisjointFrom(b); // false
```

以前は`[...a].filter(x => b.has(x))`のような手動実装やlodashの`_.intersection`が必要だったが、ネイティブで高速に動作する。

### Iteratorヘルパー: lodash系チェーンの代替

ES2025のIteratorヘルパー(Baseline Newly available, 2025年3月)で、遅延評価のチェーン処理が標準で書ける。

```typescript
// lodash chain
import _ from "lodash";
const result = _(users)
  .filter((u) => u.active)
  .map((u) => u.name)
  .take(5)
  .value();

// Iterator helpers (遅延評価)
const result = users
  .values()
  .filter((u) => u.active)
  .map((u) => u.name)
  .take(5)
  .toArray();
```

`Iterator.from()`でジェネレータや任意のiterableにも使える。大量データの処理で中間配列を作らないため、メモリ効率がよい。

### Temporal: moment/dayjsの代替

2026年3月にTC39 Stage 4に到達し、Chrome 144+とFirefox 139+でネイティブサポートされた。日付・時刻の不変(immutable)な操作が標準で可能になる。

```typescript
// moment
import moment from "moment";
const now = moment();
const tomorrow = now.clone().add(1, "day");
const formatted = tomorrow.format("YYYY-MM-DD");

// Temporal (標準)
const now = Temporal.Now.plainDateTimeISO();
const tomorrow = now.add({ days: 1 });
const formatted = tomorrow.toPlainDate().toString(); // "2026-04-07"
```

```typescript
// タイムゾーン対応
const tokyo = Temporal.Now.zonedDateTimeISO("Asia/Tokyo");
const ny = tokyo.withTimeZone("America/New_York");

// 期間の計算
const start = Temporal.PlainDate.from("2026-01-01");
const end = Temporal.PlainDate.from("2026-04-06");
const duration = start.until(end); // P3M5D (3ヶ月5日)
```

**現状**: SafariとEdgeではまだフラグ付きのため、プロダクションではpolyfill([temporal-polyfill](https://www.npmjs.com/package/temporal-polyfill))との併用を推奨。ブラウザがネイティブ対応していればpolyfillはスキップされる。完全なBaseline到達は2026年後半の見込み。

### URLPattern: path-to-regexpの代替

URLPatternはBaseline Newly available(2025年9月)。Node.js 24ではグローバルに利用可能。

```typescript
// path-to-regexp
import { match } from "path-to-regexp";
const fn = match("/users/:id");
const result = fn("/users/123"); // { params: { id: "123" } }

// URLPattern (標準)
const pattern = new URLPattern({ pathname: "/users/:id" });
const result = pattern.exec({ pathname: "/users/123" });
const id = result?.pathname.groups.id; // "123"
```

フレームワークなしでルーティングを実装する場合や、Service Worker内でのリクエストマッチングに有用。

## Node.js編

### グローバルfetch: node-fetchの代替

Node.js 18以降、`fetch`はグローバルに利用可能(内部的にundiciベース)。

```typescript
// node-fetch (以前)
import fetch from "node-fetch";
const res = await fetch("https://api.example.com/data");

// Node.js 18+ (インポート不要)
const res = await fetch("https://api.example.com/data");
const data = await res.json();
```

node-fetchパッケージはもう不要。ただし、undici固有の高度な機能(接続プール制御、HTTP/2等)が必要な場合は`import { request } from "undici"`を直接使う。

### node:test: Jest/Mocha/Vitestの代替候補

Node.js 18以降で安定。ゼロ依存のテストランナーが`node:test`で利用可能。

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
# 実行
node --test

# カバレッジ付き
node --test --experimental-test-coverage

# watchモード (Node.js 23+)
node --test --watch
```

**適している場面**: ライブラリ、CLIツール、バックエンドのユニットテスト。依存ゼロのためCI高速化やDockerイメージの軽量化に有効。

**Vitest/Jestが勝る場面**: スナップショットテスト、豊富なマッチャー、UIモード、ブラウザテスト、既存の大規模テストスイート。新規のNode.jsライブラリ開発では`node:test`を第一候補に検討する価値がある。

### --watch: nodemonの代替

Node.js 18.11以降で`--watch`フラグが利用可能(Node.js 22+で安定)。

```bash
# nodemon
npx nodemon server.ts

# Node.js 標準
node --watch server.ts
```

特定のパスだけを監視する場合は`--watch-path`を使う。

```bash
node --watch-path=./src --watch-path=./config server.ts
```

**nodemonが勝る場面**: `.nodemonrc`による細かい設定(ignore, delay, ext指定等)。シンプルな再起動だけなら`--watch`で十分。

### --env-file: dotenvの代替

Node.js 20.6以降で`--env-file`フラグが利用可能。

```bash
# dotenv (コード内でimport)
# import "dotenv/config";
# node server.js

# Node.js 標準 (コード変更不要)
node --env-file=.env server.js

# 複数ファイル対応
node --env-file=.env --env-file=.env.local server.js
```

**利点**: アプリケーションコードに`dotenv`のインポートが不要になる。`package.json`のスクリプトに書くだけでよい。

```json title=package.json
{
  "scripts": {
    "dev": "node --env-file=.env --watch server.ts"
  }
}
```

### fs.glob: globパッケージの代替

`fs.glob`と`fs.promises.glob`はNode.js 22.0で追加され、22.17 LTSで安定した。

```typescript
// glob パッケージ
import { glob } from "glob";
const files = await glob("src/**/*.ts");

// Node.js 標準
import { glob } from "node:fs/promises";
const files = [];
for await (const entry of glob("src/**/*.ts")) {
  files.push(entry);
}
```

標準の`fs.glob`は`AsyncIterable`を返すため、配列で欲しい場合は`for await...of`で収集する必要がある。globパッケージのようなoption(ignore等)のサポートは限定的だが、シンプルなパターンマッチなら標準で十分。

### fs.rm: rimrafの代替

`fs.rm`は`{ recursive: true, force: true }`オプションでディレクトリの再帰削除ができる(Node.js 14.14以降)。

```typescript
// rimraf
import { rimraf } from "rimraf";
await rimraf("dist");

// Node.js 標準
import { rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
```

シェルスクリプトでも同様。

```bash
# rimraf (cross-platform rm -rf)
npx rimraf dist

# Node.js 標準
node -e "require('fs').rmSync('dist', { recursive: true, force: true })"
```

rimrafの存在意義だったWindows互換の再帰削除は、`fs.rm`で解決済み。

### util.styleText: chalkの代替

`util.styleText`はNode.js 20.12で追加され、22.17 LTSで安定した。

```typescript
// chalk
import chalk from "chalk";
console.log(chalk.red.bold("Error:"), chalk.yellow("file not found"));

// Node.js 標準
import { styleText } from "node:util";
console.log(
  styleText(["red", "bold"], "Error:"),
  styleText("yellow", "file not found"),
);
```

**chalkが勝る場面**: テンプレートリテラルでの複雑なスタイリング、カスタムテーマ。単純な色付きログ出力なら`util.styleText`で十分。

### TypeScript型ストリッピング: ts-node/tsxの代替

Node.js 22.6で`--experimental-strip-types`として導入され、Node.js 24 LTSでは`.ts`ファイルに対してデフォルトで有効になった。

```bash
# ts-node
npx ts-node src/main.ts

# tsx
npx tsx src/main.ts

# Node.js 24+ (追加パッケージ不要)
node src/main.ts
```

**仕組み**: 型注釈を除去するだけで、トランスパイルは行わない。`enum`, `namespace`, コンストラクタのパラメータプロパティ(`public x: number`)等、JavaScriptコード生成が必要な構文はランタイムエラーになる。

```typescript
// ✅ 動作する
interface User {
  name: string;
  age: number;
}
const greet = (user: User): string => `Hello, ${user.name}`;

// ❌ ランタイムエラー (コード生成が必要)
enum Direction {
  Up,
  Down,
}
```

**tsxがまだ有用な場面**: `enum`やパスエイリアス(`paths`)を使っている場合、またはNode.js 22以前を対象とする場合。新規プロジェクトでは`enum`を避けて`as const`を使い、Node.js標準の型ストリッピングに対応する設計を推奨する。

## まだライブラリが勝つケース

すべてを標準に置き換えるべきではない。以下の領域ではライブラリの優位性が残る。

| 領域 | 標準の限界 | 推奨ライブラリ |
| --- | --- | --- |
| HTTPインターセプター / リトライ | fetchにはインターセプター機能がない | ky, axios |
| バリデーション | 組み込みのスキーマバリデーションはない | zod, valibot |
| 日付(Safariサポート必須) | TemporalはまだBaseline未到達 | dayjs, temporal-polyfill |
| 高度なglob(ignore, negative pattern) | `fs.glob`のオプションは限定的 | glob, fast-glob |
| 複雑なCLI引数解析 | `util.parseArgs`は基本的な機能のみ | yargs, commander |
| ロギング | `console.log`にはログレベルや構造化出力がない | pino, winston |
| テスト(スナップショット、UI) | `node:test`は基本機能に限定 | vitest, jest |

## まとめ

2026年現在、「標準で十分」な領域は着実に広がっている。以下の表で移行の判断材料を整理する。

| 従来のライブラリ | 標準の代替 | 環境 | 移行推奨度 |
| --- | --- | --- | --- |
| axios (単純なリクエスト) | `fetch` + `AbortSignal.timeout()` | Browser + Node 18+ | A |
| lodash.cloneDeep / deepmerge | `structuredClone` | Browser + Node 17+ | A |
| uuid (v4) | `crypto.randomUUID()` | Browser + Node 19+ | A |
| query-string | `URLSearchParams` | Browser + Node | A |
| lodash.groupBy | `Object.groupBy` | Browser + Node 21+ | A |
| Set手動操作 | `Set.prototype.intersection`等 | Browser + Node 22+ | A |
| lodashチェーン | Iteratorヘルパー | Browser + Node 22+ | B |
| moment / dayjs | `Temporal` | Chrome 144+, Firefox 139+ | B |
| path-to-regexp | `URLPattern` | Browser + Node 24+ | B |
| node-fetch | グローバル`fetch` | Node 18+ | A |
| nodemon | `node --watch` | Node 22+ | A |
| dotenv | `node --env-file` | Node 20.6+ | A |
| glob | `fs.glob` | Node 22+ | B |
| rimraf | `fs.rm` | Node 14.14+ | A |
| chalk | `util.styleText` | Node 22+ | B |
| ts-node / tsx | `node --strip-types` | Node 24+ | A |
| jest / mocha | `node:test` | Node 18+ | B |

Aは「すぐに移行してよい」、Bは「新規プロジェクトでは標準を採用、既存は段階的に」を意味する。

依存を減らすことは、セキュリティ、パフォーマンス、メンテナンスすべてに効く。新規プロジェクトではまず標準APIで書き始め、足りない場合にだけライブラリを足すアプローチを推奨する。
