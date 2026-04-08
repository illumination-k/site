---
uuid: 8eaf357f-043b-4c78-91a3-f2cc6ffa28fe
title: Shallow Copying JavaScript Classes
description: A summary of how to shallow copy JavaScript classes, which is useful when using classes with React's useState and similar hooks.
lang: en
category: techblog
tags:
  - javascript
created_at: "2022-08-19T11:42:43+00:00"
updated_at: "2022-08-19T11:42:43+00:00"
---

## TL;DR

React's `useState` uses `Object.is` to detect state updates.

When using `Array` or plain `Object`, you can trigger updates using the spread syntax.
The spread syntax provides a so-called shallow copy, and we want to use this with `class` instances.

## The Case of Classes

The solution is the following method:

```js
clone() {
    const clone = Object.assign({}, this);
    Object.setPrototypeOf(clone, Object.getPrototypeOf(this));
    return clone;
}
```

Here is a practical example:

```js
class Entity {
	constructor(a) {
		this.a = a;
	}

	getA() {
		return this.a;
	}

	clone() {
		const clone = Object.assign({}, this);
		Object.setPrototypeOf(clone, Object.getPrototypeOf(this));
		return clone;
	}
}

const entity = new Entity(1);

// Spreading makes Object.is return false, but methods are lost
// It's just a plain object, so that's expected
const o = { ...entity };
Object.is(o, entity);
// false

o.getA();
// Uncaught TypeError: o.getA is not a function

// Using clone preserves the methods
const entity_clone = entity.clone();

Object.is(entity_clone, entity);
// false

entity_clone.getA();
// 1
```

## Reference

- [https://stackoverflow.com/questions/41474986/how-to-clone-a-javascript-es6-class-instance](https://stackoverflow.com/questions/41474986/how-to-clone-a-javascript-es6-class-instance)
