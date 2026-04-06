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

この記事では「有名ライブラリはあるが、標準で十分になった」領域を、ブラウザとNode.jsの両面から網羅的に整理する。対象はNode.js 24 LTS (Krypton)以降と、主要ブラウザで利用可能になったWeb APIとする。

## TL;DR

- ブラウザでは`fetch`・`structuredClone`・`crypto.randomUUID()`・`URLSearchParams`・Setメソッド・Iteratorヘルパー等が標準で使える。axiosやlodashの多くのユースケースは不要になった
- Node.jsではグローバル`fetch`・`node:test`・`--watch`・`--env-file`・`fs.glob`・`util.styleText`・`--strip-types`がLTSで安定した。node-fetchやnodemon・dotenv・chalk・ts-nodeを代替できる
- 「標準に寄せる」最大のメリットは依存数の削減によるサプライチェーンリスクの低減とバンドルサイズの削減。ただしインターセプター等、標準では難しい領域も残る

## 背景: axiosサプライチェーン攻撃と「標準に寄せる」意義

2026年3月31日、週間1億ダウンロードを超えるHTTPクライアント[axios](https://github.com/axios/axios)がサプライチェーン攻撃を受けた。北朝鮮に関連する脅威アクターがnpmアカウントを侵害し、悪意あるバージョン(1.14.1, 0.30.4)を公開。これらは偽の依存パッケージ`plain-crypto-js`を通じてクロスプラットフォームRAT(遠隔操作ツール)を自動インストールするものだった。axiosはクラウド環境の約80%に存在するとされ、影響範囲は甚大だった。

この事件が象徴するのは「標準で代替できるのにライブラリを使い続けるリスク」だ。`fetch`がブラウザとNode.jsの両方でグローバル利用可能になった今、単純なHTTPリクエストのためにaxiosを依存に含める必要性は薄い。依存が1つ減れば、攻撃対象面が1つ減る。

こうした背景のもと、JavaScript/TypeScriptのエコシステムは「標準に機能を取り込む」方向に動いている。

ブラウザ側では、主要4エンジン(Chrome, Firefox, Safari, Edge)で共通して動作するAPIが増えた。ECMAScript 2025ではSetメソッドやIteratorヘルパーが標準化され、2026年3月にはTemporalがStage 4に到達した。

Node.js側では、v18でグローバル`fetch`と`node:test`、v20で`--env-file`と`--watch`が追加された。v22で`fs.glob`と`util.styleText`、v24でTypeScript型ストリッピングと`URLPattern`のグローバル化が実現した。Node.js 24 LTSの時点で、開発時に必要だった多くのnpmパッケージが組み込み機能で代替できる。

この記事のスタンスは「標準で済むなら標準に寄せる」。依存を減らすことはバンドルサイズの削減やメンテナンスコストの低減だけでなく、サプライチェーン攻撃の対象面を直接的に減らす効果がある。

## ブラウザ編

### fetch: axiosの代替

[MDN: Fetch API](https://developer.mozilla.org/ja/docs/Web/API/Fetch_API) / [Node.js: Global fetch](https://nodejs.org/api/globals.html#fetch)

`fetch`は全ブラウザで標準利用可能であり、Node.js 18以降ではグローバルに利用可能(内部的にはundici)。axiosを使う主な理由だった「ブラウザ/Node両対応」は、もはや標準だけで成立する。

```typescript
// axios
const res = await axios.get("/api/users", { params: { page: 1 } });
const users = res.data;

// fetch (標準)
const res = await fetch("/api/users?" + new URLSearchParams({ page: "1" }));
const users = await res.json();
```

タイムアウトは[`AbortSignal.timeout()` (MDN)](https://developer.mozilla.org/ja/docs/Web/API/AbortSignal/timeout_static)で簡潔に書ける(2024年に主要ブラウザ対応済み)。

```typescript
// axios
await axios.get("/api/data", { timeout: 5000 });

// fetch + AbortSignal.timeout
await fetch("/api/data", { signal: AbortSignal.timeout(5000) });
```

複数のシグナルを組み合わせたい場合は[`AbortSignal.any()`](https://developer.mozilla.org/ja/docs/Web/API/AbortSignal/any_static)(同じく2024年対応済み)を使う。

```typescript
const controller = new AbortController();
const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]);
await fetch("/api/data", { signal });
// 手動キャンセルもタイムアウトも両方効く
```

ただし、リクエスト/レスポンスのインターセプターや自動リトライ、進捗イベントはfetchにない。これらが必要ならaxiosか、より軽量な[ky](https://github.com/sindresorhus/ky)(~2KB)を検討する。単純なAPI呼び出しならfetchで十分。

### structuredClone: lodash.cloneDeep / deepmergeの代替

[MDN: structuredClone()](https://developer.mozilla.org/ja/docs/Web/API/Window/structuredClone) / [Node.js: structuredClone()](https://nodejs.org/api/globals.html#structuredclonevalue-options)

`structuredClone()`は全ブラウザ・Node.js 17以降で標準利用可能。ディープコピーが1行で書ける。

```typescript
// lodash
import cloneDeep from "lodash/cloneDeep";
const copy = cloneDeep(original);

// 標準
const copy = structuredClone(original);
```

ただし、関数やDOMノード、`Error`オブジェクト、プロトタイプチェーンはコピーできない。クラスインスタンスのコピーにはlodashが引き続き必要。JSONシリアライズ可能なデータ構造であれば`structuredClone`で十分。

### crypto.randomUUID: uuidパッケージの代替

[MDN: Crypto.randomUUID()](https://developer.mozilla.org/ja/docs/Web/API/Crypto/randomUUID) / [Node.js: crypto.randomUUID()](https://nodejs.org/api/crypto.html#cryptorandomuuid)

`crypto.randomUUID()`はv4 UUIDを生成する。ブラウザとNode.js 19以降で利用可能。

```typescript
// uuid パッケージ
import { v4 as uuidv4 } from "uuid";
const id = uuidv4();

// 標準
const id = crypto.randomUUID();
```

ただし、v4 UUID以外(v1, v5, v7等)が必要な場合はuuidパッケージが必要。v4だけなら標準で十分。

### URLSearchParams: query-stringの代替

[MDN: URLSearchParams](https://developer.mozilla.org/ja/docs/Web/API/URLSearchParams) / [Node.js: URLSearchParams](https://nodejs.org/api/url.html#class-urlsearchparams)

`URLSearchParams`は全ブラウザ・Node.jsで標準利用可能。

```typescript
// query-string
import queryString from "query-string";
const parsed = queryString.parse("?foo=bar&baz=1");
const str = queryString.stringify({ foo: "bar", baz: 1 });

// 標準
const parsed = Object.fromEntries(new URLSearchParams("?foo=bar&baz=1"));
const str = new URLSearchParams({ foo: "bar", baz: "1" }).toString();
```

ただし、`URLSearchParams`は配列値の扱いが`query-string`と異なる(`foo=1&foo=2`の場合、`getAll("foo")`を使う必要がある)。複雑なクエリ文字列の解析が必要でなければ標準で十分。

### Object.groupBy / Map.groupBy: lodash.groupByの代替

[MDN: Object.groupBy()](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy)

`Object.groupBy`はES2024で標準化され、主要ブラウザで利用可能になった。

```typescript
// lodash
import groupBy from "lodash/groupBy";
const grouped = groupBy(users, (u) => u.role);

// 標準
const grouped = Object.groupBy(users, (u) => u.role);
```

キーにオブジェクトを使いたい場合は`Map.groupBy`を使う。

### Setメソッド: 手動実装やlodashの代替

[MDN: Set](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Set)

ES2025で`Set`に数学的な集合演算メソッドが追加され、主要ブラウザで利用可能になった。

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

以前は`[...a].filter(x => b.has(x))`のような手動実装やlodashの`_.intersection`が必要だったが、ネイティブで高速に動作する。

### Iteratorヘルパー: lodash系チェーンの代替

[MDN: Iterator helpers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator)

ES2025のIteratorヘルパー(2025年3月に主要ブラウザ対応済み)で、遅延評価のチェーン処理が標準で書ける。

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

[MDN: Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) / [TC39: proposal-temporal](https://github.com/tc39/proposal-temporal)

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

ただし、SafariとEdgeではまだフラグ付きのため、プロダクションではpolyfill([temporal-polyfill](https://www.npmjs.com/package/temporal-polyfill))との併用を推奨する。ブラウザがネイティブ対応していればpolyfillはスキップされる。全ブラウザでの安定利用は2026年後半の見込み。

### URLPattern: path-to-regexpの代替

[MDN: URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) / [Node.js: URLPattern](https://nodejs.org/api/url.html#class-urlpattern)

URLPatternは2025年9月に主要ブラウザで対応済み。Node.js 24ではグローバルに利用可能。

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

[Node.js: Global fetch](https://nodejs.org/api/globals.html#fetch)

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

[Node.js: Test runner](https://nodejs.org/api/test.html)

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

ライブラリやCLIツール、バックエンドのユニットテストに向いている。依存ゼロのためCI高速化やDockerイメージの軽量化に有効。ただし、スナップショットテストや豊富なマッチャー、UIモード、ブラウザテストが必要ならVitest/Jestに優位性がある。新規のNode.jsライブラリ開発では`node:test`を第一候補に検討する価値がある。

### --watch: nodemonの代替

[Node.js: --watch](https://nodejs.org/api/cli.html#--watch)

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

ただし、`.nodemonrc`による細かい設定(ignore, delay, ext指定等)が必要ならnodemonに優位性がある。シンプルな再起動だけなら`--watch`で十分。

### --env-file: dotenvの代替

[Node.js: --env-file](https://nodejs.org/api/cli.html#--env-fileconfig)

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

アプリケーションコードに`dotenv`のインポートが不要になり、`package.json`のスクリプトに書くだけでよい。

```json title=package.json
{
  "scripts": {
    "dev": "node --env-file=.env --watch server.ts"
  }
}
```

### fs.glob: globパッケージの代替

[Node.js: fs.promises.glob()](https://nodejs.org/api/fs.html#fspromisesglob)

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

[Node.js: fs.promises.rm()](https://nodejs.org/api/fs.html#fspromisesrmpath-options)

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

[Node.js: util.styleText()](https://nodejs.org/api/util.html#utilstyletextformat-text)

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

ただし、テンプレートリテラルでの複雑なスタイリングやカスタムテーマが必要ならchalkに優位性がある。単純な色付きログ出力なら`util.styleText`で十分。

### TypeScript型ストリッピング: ts-node/tsxの代替

[Node.js: TypeScript support](https://nodejs.org/api/typescript.html)

Node.js 22.6で`--experimental-strip-types`として導入され、Node.js 24 LTSでは`.ts`ファイルに対してデフォルトで有効になった。

```bash
# ts-node
npx ts-node src/main.ts

# tsx
npx tsx src/main.ts

# Node.js 24+ (追加パッケージ不要)
node src/main.ts
```

型注釈を除去するだけで、トランスパイルは行わない。`enum`や`namespace`、コンストラクタのパラメータプロパティ(`public x: number`)等、JavaScriptコード生成が必要な構文はランタイムエラーになる。

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

ただし、`enum`やパスエイリアス(`paths`)を使っている場合、またはNode.js 22以前を対象とする場合はtsxが引き続き必要になる。新規プロジェクトでは`enum`を避けて`as const`を使い、Node.js標準の型ストリッピングに対応する設計を推奨する。

## まとめ

2026年現在、「標準で十分」な領域は着実に広がっている。以下の表で対応関係を整理する。

| 従来のライブラリ             | 標準の代替                        | 環境                      |
| ---------------------------- | --------------------------------- | ------------------------- |
| axios (単純なリクエスト)     | `fetch` + `AbortSignal.timeout()` | Browser + Node 18+        |
| lodash.cloneDeep / deepmerge | `structuredClone`                 | Browser + Node 17+        |
| uuid (v4)                    | `crypto.randomUUID()`             | Browser + Node 19+        |
| query-string                 | `URLSearchParams`                 | Browser + Node            |
| lodash.groupBy               | `Object.groupBy`                  | Browser + Node 21+        |
| Set手動操作                  | `Set.prototype.intersection`等    | Browser + Node 22+        |
| lodashチェーン               | Iteratorヘルパー                  | Browser + Node 22+        |
| moment / dayjs               | `Temporal`                        | Chrome 144+, Firefox 139+ |
| path-to-regexp               | `URLPattern`                      | Browser + Node 24+        |
| node-fetch                   | グローバル`fetch`                 | Node 18+                  |
| nodemon                      | `node --watch`                    | Node 22+                  |
| dotenv                       | `node --env-file`                 | Node 20.6+                |
| glob                         | `fs.glob`                         | Node 22+                  |
| rimraf                       | `fs.rm`                           | Node 14.14+               |
| chalk                        | `util.styleText`                  | Node 22+                  |
| ts-node / tsx                | `node --strip-types`              | Node 24+                  |
| jest / mocha                 | `node:test`                       | Node 18+                  |

各セクションで触れたとおり、標準APIには制約もある。ただし、依存を減らすことはセキュリティ・パフォーマンス・メンテナンスすべてに効く。新規プロジェクトではまず標準APIで書き始め、足りない場合にだけライブラリを足すアプローチを推奨する。
