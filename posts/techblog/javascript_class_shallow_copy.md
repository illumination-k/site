---
uuid: 8eaf357f-043b-4c78-91a3-f2cc6ffa28fe
title: JavascriptのClassをShallow Copyする
description: JavascriptのclassをReactで使いたいときのuseStateなどを扱う際に便利なので、Shallow Copyのやり方をまとめる
lang: ja
category: techblog
tags:
  - javascript
created_at: "2022-08-19T11:42:43+00:00"
updated_at: "2022-08-19T11:42:43+00:00"
---

## TL;DR

Reactの`useState`は`Object.is`を使用して処理の更新を検知している。

`Array`や単純な`Object`を利用する場合はスプレッド構文などを利用することで更新することができる。
スプレッド構文はいわゆるShallow Copyを提供するわけだが、これを`class`で利用したい。

## classの場合

結論としては以下のようなメソッドで解決できる。

```js
clone() {
    const clone = Object.assign({}, this);
    Object.setPrototypeOf(clone, Object.getPrototypeOf(this));
    return clone;
}
```

実際の例は以下

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

// spreadするとObject.isの結果はfalseになるが、メソッドが消える
// 単純にobjectになっているだけなのでそれはそう
const o = { ...entity };
Object.is(o, entity);
// false

o.getA();
// Uncaught TypeError: o.getA is not a function

// cloneを使うとメソッドも保存される

const entity_clone = entity.clone();

Object.is(entity_clone, entity);
// false

entity_clone.getA();
// 1
```

## Reference

- [https://stackoverflow.com/questions/41474986/how-to-clone-a-javascript-es6-class-instance](https://stackoverflow.com/questions/41474986/how-to-clone-a-javascript-es6-class-instance)
