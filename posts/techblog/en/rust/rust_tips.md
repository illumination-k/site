---
uuid: a7bc2978-62bd-46da-849b-1296f1224077
title: Rust Tips
description: A collection of notes on things worth remembering in Rust
lang: en
category: techblog
tags:
  - rust
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

A collection of notes on things worth remembering in Rust.

## Order

When you need to inspect ordering properly, using `std::cmp::Ordering` makes it easy to read. It also works for lexicographic ordering of `String`. It cannot be used with floats.

```rust
let ord: std::cmp::Ordering = 5.cmp(&10);
assert_eq!(ord, std::cmp::Ordering::Less)
```

## min, max of float

Since `Ord` is not implemented for floats, `std::cmp::max` and similar functions cannot be used.

```rust
let min: f64 = 1.0.max(0.0)
```

## cumsum

```rust
use itertools_num::ItertoolsNum as _;

let x = vec![1, 2, 3];
let cumsum = std::iter::once(&0).chain(&x).cumsum().collect::<Vec<usize>>();

assert_eq!(cumsum, vec![0, 1, 3, 6])
```

## `std::vec` binary_search

This is quite useful on its own, but when the slice contains duplicate values, although you can match against all of them, the returned index corresponds to any one of the matches. So if you want a lower_bound, it is better to use [superslice](https://docs.rs/superslice/1.0.0/superslice/). Alternatively, you can implement it yourself.

The following is quoted from the docs:

> If the value is found then Result::Ok is returned, containing the index of the matching element. If there are multiple matches, then any one of the matches could be returned. If the value is not found then Result::Err is returned, containing the index where a matching element could be inserted while maintaining sorted order.

```rust
let s = [0, 1, 1, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55];

assert_eq!(s.binary_search(&13),  Ok(9));
assert_eq!(s.binary_search(&4),   Err(7));
assert_eq!(s.binary_search(&100), Err(13));
let r = s.binary_search(&1);
assert!(match r { Ok(1..=4) => true, _ => false, }); // < As you can see here, you can match against a range.
```

After some quick testing, on the AtCoder version (1.42.0), `i` returns 4. Apparently, the behavior differs across versions. There has been [discussion](https://github.com/rust-lang/rfcs/issues/2184) in the Rust community about this, but it is unclear when it will be addressed.

```rust
fn main() {
    let s = [0, 1, 1, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55];

    match s.binary_search(&1) {
        Ok(i) => {
            dbg!(i);
        }
        Err(i) => {
            dbg!(i);
        }
    };
}
```

So if you want an upper_bound, you could do something like the following. That said, it is probably better to just implement it yourself.

```rust
fn upper_bound(x: &usize, s: Vec<usize>) -> usize {
    match s.binary_search(x) {
        Ok(i) => i + 1,
        Err(i) => i,
    }
}
```
