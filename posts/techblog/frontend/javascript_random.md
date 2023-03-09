---
uuid: 9abd32f9-d55f-49d3-96c0-f851080bd301
title: JavaScriptでのrandomに関するまとめ
description: JavaScriptのランダムは非常に使い勝手が悪いので選択肢とか、よく使う関数などのまとめです。
lang: ja
category: techblog
tags:
  - frontend
  - javascript
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

JavaScriptのランダムは非常に使い勝手が悪いので選択肢とか、よく使う関数などのまとめです。

## Randomの基礎

### Math.random

とりあえず一番簡易的なのは[Math.random](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Math/random)を使う手法です。この関数は`[0, 1]`の範囲の乱数を生成します。ただ、これはseed値を指定できないので嬉しくないです。

```js
const rand = Math.random();
console.log(rand);
// 0.5294271038323526
```

#### ちょっと便利にする関数

```js
// [0, max]
function randInt(max) {
  return Math.floor(Math.random() * (max + 1));
}

// [min, max]
function randFromRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

### XorShift

seed値が使え、簡単で比較的良い乱数生成アルゴリズムとして[XorShift](https://ja.wikipedia.org/wiki/Xorshift)があります。

```js
class XorShift {
  constructor(seed = Date.now()) {
    this.x = 123456789;
    this.y = 984328975;
    this.z = 839047104;
    this.seed = seed;
  }

  gen() {
    let t;

    t = this.x ^ (this.x << 11);
    this.x = this.y;
    this.y = this.z;
    this.z = this.seed;
    return (this.seed = this.seed ^ (this.seed >>> 19) ^ (t ^ (t >>> 8)));
  }

  genFromRange(min, max) {
    const r = Math.abs(this.gen());
    return min + (r % (max + 1 - min));
  }
}
```

```js
const random = new XorShift();

console.log(random.gen());
// -638953871
console.log(random.genFromRange(0, 10));
// 7
```

### メルセンヌツイスタ

外部ライブラリの[mt.js](https://magicant.github.io/sjavascript/mt.js)を使えばメルセンヌツイスタも使えます。このような感じです。`setSeed`メソッドでseedの指定もできます。

```js
var mt = new MersenneTwister();
var integer1 = mt.nextInt(0, 5); // 0 以上 5 未満の整数
var decimal1 = mt.next(); // 0 以上 1 未満の実数
```

## 配列のシャッフル

上のアルゴリズムを使えば、ただの乱数生成なら問題ないんですが、重複なく乱数生成したい、みたいなことがあります。その場合は単純に配列をシャッフルすればいいです。シャッフルにはFisher-Yates shuffleやDurstenfeldの手法などが使われるようです。Durstenfeldの手法のほうが高速らしいです。

`random`はmaxだけ指定して持ってくる感じのものなら何でも使えるようにしました。簡易的には

```js
const randomizer = function(max) {
  return Math.floor(Math.random() * (max + 1));
};
```

でいいです。

### Fisher-Yates shuffle

```js
function fisherYatesShuffle(array, randomizer) {
  let newArray = [];
  while (array.length > 0) {
    const n = array.length;
    const k = randomizer(n - 1);

    newArray.push(array[k]);
    array.splice(k, 1);
  }

  return newArray;
}

const randomizer = function(max) {
  const random = new XorShift();
  return random.genFromRange(0, max);
};

let array = [0, 1, 2, 3, 4];
array = fisherYatesShuffle(array, randomizer);

console.log(array);
// [ 3, 1, 2, 4, 0 ]
```

### ダステンフィルドの手法

ほぼ同じですが、

```js
function durstenfeldShuffle(array, randomizer) {
  for (let i = array.length; i > 1; i--) {
    let j = randomizer(max = i - 1);
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

const randomizer = function(max) {
  const random = new XorShift();
  return random.genFromRange(0, max);
};

let array = [0, 1, 2, 3, 4];
array = durstenfeldShuffle(array, randomizer);

console.log(array);

// [ 0, 3, 4, 2, 1 ]
```

## 参考

- [Mersenne Twister in JavaScript](https://magicant.github.io/sjavascript/mt.html)
- [JavaScriptで再現性のある乱数を生成する + 指定した範囲の乱数を生成する](https://sbfl.net/blog/2017/06/01/javascript-reproducible-random/)
- [JavaScript で シャッフルする](https://qiita.com/pure-adachi/items/77fdf665ff6e5ea22128)
- [フィッシャー–イェーツのシャッフル](https://ja.wikipedia.org/wiki/%E3%83%95%E3%82%A3%E3%83%83%E3%82%B7%E3%83%A3%E3%83%BC%E2%80%93%E3%82%A4%E3%82%A7%E3%83%BC%E3%83%84%E3%81%AE%E3%82%B7%E3%83%A3%E3%83%83%E3%83%95%E3%83%AB)
