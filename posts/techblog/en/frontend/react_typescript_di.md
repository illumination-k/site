---
uuid: c74c30d5-f98b-45f1-af7d-e7e612184742
title: "Dependency Injection in React with useContext + TypeScript"
description: "How to achieve type-safe dependency injection in React using useContext"
lang: en
tags:
    - javascript
category: "techblog"
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

In `React` and similar frameworks, you sometimes want to do DI-like things.
Specifically, this comes up when mocking `SDK`s or when implementing in a DDD-like fashion.

In most cases, such `Client`, `Repository`, or `Service` objects don't hold state that triggers React re-renders. So sharing them globally with `useContext` is unlikely to cause major issues.

With this mindset, the idea of using `useContext` for DI is fairly common:

- [Using useContext for DI-like Patterns in React](https://qiita.com/kamiaka/items/09bf7d3868e48cb1b61f)
- [Using React Context as a DI Container](https://developer.feedforce.jp/entry/2019/10/30/093320)
- [React Context for Dependency Injection Not State Management](https://blog.testdouble.com/posts/2021-03-19-react-context-for-dependency-injection-not-state/)

## The Initialization Problem

Let's define an arbitrary interface and its implementation.

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

If you initialize it naively, it looks like this. However, this isn't ideal when using `useContext` as a DI container. We want to inject something that implements the `interface` from the outside, but a specific concrete instance is already injected from the start, creating a dependency on a particular implementation.

```typescript
import { createContext } from "react";

export const SomeContext = createContext<SomeInterface>(new SomeEntity());
```

The practical downsides are the dependency on a concrete implementation and the fact that you don't need to provide an initial value to the `Provider`:

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

## Initializing with `undefined`

As mentioned above, since we don't want to hold any concrete instance as the initial value, we initialize with `undefined`.

```typescript
import { createContext } from "react";

export const SomeContext = createContext<SomeInterface | undefined>(undefined);
```

This removes the dependency on a concrete implementation, but introduces two new problems: skipping initialization doesn't cause an error, and the return value of `useContext` becomes `SomeInterface | undefined`, requiring an `undefined` check every time.

To solve this, I referenced the following article:

- [createContext in React Without Default Values or undefined Checks (TypeScript)](https://qiita.com/johnmackay150/items/88654e5064290c24a32a)

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

By using this function, the return value of `useCtx` becomes `T`, and failing to initialize the `Provider` results in an error. Here's how to use it:

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

## Summary

By initializing the `Context` with `undefined`, making it throw an error when DI is not performed, and using a custom hook whose return value doesn't include `undefined`, you can achieve type-safe DI-like behavior.
