---
uuid: c74c30d5-f98b-45f1-af7d-e7e612184742
title: "React + useContext + TypescriptでDI"
description: "ReactでDIみたいなことをuseContextを使ってやるときに、型安全にできるようにするための方法"
lang: ja
tags:
    - javascript
category: "techblog"
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

`React`などで、DI的なことをしたくなることがあります。
具体的には、`SDK`とかをMockしたりするときや、単純にDDD的な感じで実装を勧めている場合です。

大抵の場合、こういった`Client`、`Repository`、`Service`のようなものは、`React`の再描画を発生させるような状態を持たないことが多いと思います。なので、`useContext`で全体で共有してしまっても大きな問題は起こりづらいです。

こういった思想のもと、`useContext`を使ってDIする、的な発想は比較的よく見かけます。

- [ReactでuseContextを利用してDIっぽくする](https://qiita.com/kamiaka/items/09bf7d3868e48cb1b61f)
- [ReactのContextをDI Containerとして使う](https://developer.feedforce.jp/entry/2019/10/30/093320)
- [React Context for Dependency Injection Not State Management](https://blog.testdouble.com/posts/2021-03-19-react-context-for-dependency-injection-not-state/)

## 初期化で困る

適当なInterfaceとその実装を定義します。

```typescript
interface SomeInterface {
	test: () => string;
}

class SomeEntity {
	constructor() {}

	test() {
		return "test";
	}
}
```

これを単純に初期化すると以下のようになります。しかし、これは`useContext`をDIコンテナとして扱うには嬉しくないです。外から`interface`を定義したものを入れたいのに、最初から特定の実体を持つものが注入されていますし、この時点で何らかの実体に依存しています。

```typescript
import { createContext } from "react";

export const SomeContext = createContext<SomeInterface>(new SomeEntity());
```

実用上で嫌な部分としては、実体に依存しているという点と、以下のように`Provider`に初期値を与える必要がない部分です。

```typescript
import { useContext } from "react"

import { SomeContext } from "/path/to/context"

const Test = ({}) => {
    const entity = useContext(SomeContext)

    return <>{entity.test()}</>
}

const App = ({}) => {
    return <SomeContext.Provier><Test /></SomeContext.Provider>
}

export default App;
```

## `undefined`で初期化

上で述べたように、初期値として何らかの実体を持ちたくないので、`undefined`で初期化します。

```typescript
import { createContext } from "react";

export const SomeContext = createContext<SomeInterface | undefined>(undefined);
```

これで実体への依存はなくなりましたが、初期化をSkipしてもエラーにならないという問題と、`useContext`の帰り値が`SomeInterface | undefined`になって、毎回`undefined`のチェックが必要になる、という点が嬉しくありません。

これを解決するため、以下の記事を参考にしました。

- [【React】デフォルト値もundefinedチェックもいらないcreateContext【Typescript】](https://qiita.com/johnmackay150/items/88654e5064290c24a32a)

```typescript
function createCtx<T>() {
	const ctx = React.createContext<T | undefined>(undefined);
	function useCtx() {
		const c = React.useContext(ctx);
		if (!c) throw new Error("useCtx must be inside a Provider with a value");
		return c;
	}
	return [useCtx, ctx.Provider] as const;
}
```

この関数を介することで、`useCtx`の返り値は`T`になり、`Provider`を初期化しない場合にはエラーにすることができます。使い方としては以下のような感じです。

```typescript
const [useSomeContext, SomeContextProvider] = createCtx<SomeInterface>()

const Test = ({}) => {
    const entity = useSomeContext()

    return <>{entity.test()}</>
}

const App = ({}) => {
    return <SomeContextProvier value={new SomeEntity()}><Test /></SomeContextProvider>
}

export default App;
```

## まとめ

`Context`を`undefined`で初期化して、DIしないとエラーにする、かつ返り値に`undefined`を含まないカスタムフックを使うことで、型安全にDIっぽいことができるようになります。
