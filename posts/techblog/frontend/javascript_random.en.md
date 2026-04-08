---
uuid: 9abd32f9-d55f-49d3-96c0-f851080bd301
title: A Summary of Random Number Generation in JavaScript
description: JavaScript's random functionality is quite inconvenient, so here's a summary of options and commonly used functions.
lang: en
category: techblog
tags:
  - frontend
  - javascript
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

JavaScript's random functionality is quite inconvenient, so here's a summary of options and commonly used functions.

## Random Basics

### Math.random

The simplest approach is to use [Math.random](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random). This function generates a random number in the range `[0, 1]`. However, it doesn't allow specifying a seed value, which is a drawback.

```js
const rand = Math.random();
console.log(rand);
// 0.5294271038323526
```

#### Slightly More Useful Functions

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

[XorShift](https://en.wikipedia.org/wiki/Xorshift) is a simple algorithm that supports seed values and produces relatively good random numbers.

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

### Mersenne Twister

You can use the Mersenne Twister by using the external library [mt.js](https://magicant.github.io/sjavascript/mt.js). Here's how it looks. You can also specify a seed using the `setSeed` method.

```js
var mt = new MersenneTwister();
var integer1 = mt.nextInt(0, 5); // Integer from 0 (inclusive) to 5 (exclusive)
var decimal1 = mt.next(); // Real number from 0 (inclusive) to 1 (exclusive)
```

## Shuffling Arrays

The algorithms above work fine for basic random number generation, but sometimes you need to generate random numbers without duplicates. In that case, you can simply shuffle an array. Shuffling can be done using the Fisher-Yates shuffle or Durstenfeld's algorithm. Durstenfeld's approach is said to be faster.

The `random` parameter is designed to accept any function that takes a max value and returns a random number. A simple implementation would be:

```js
const randomizer = function (max) {
	return Math.floor(Math.random() * (max + 1));
};
```

### Fisher-Yates Shuffle

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

const randomizer = function (max) {
	const random = new XorShift();
	return random.genFromRange(0, max);
};

let array = [0, 1, 2, 3, 4];
array = fisherYatesShuffle(array, randomizer);

console.log(array);
// [ 3, 1, 2, 4, 0 ]
```

### Durstenfeld's Algorithm

Almost the same, but:

```js
function durstenfeldShuffle(array, randomizer) {
	for (let i = array.length; i > 1; i--) {
		let j = randomizer((max = i - 1));
		[array[i], array[j]] = [array[j], array[i]];
	}

	return array;
}

const randomizer = function (max) {
	const random = new XorShift();
	return random.genFromRange(0, max);
};

let array = [0, 1, 2, 3, 4];
array = durstenfeldShuffle(array, randomizer);

console.log(array);

// [ 0, 3, 4, 2, 1 ]
```

## References

- [Mersenne Twister in JavaScript](https://magicant.github.io/sjavascript/mt.html)
- [Generating reproducible random numbers in JavaScript + Generating random numbers within a specified range](https://sbfl.net/blog/2017/06/01/javascript-reproducible-random/)
- [Shuffling in JavaScript](https://qiita.com/pure-adachi/items/77fdf665ff6e5ea22128)
- [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
