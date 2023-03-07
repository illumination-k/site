---
uuid: a7bc2978-62bd-46da-849b-1296f1224077
title: Rust Tips
description: rustで覚えておきたいことのメモ
lang: ja
category: techblog
tags:
  - rust
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

rustで覚えておきたいことのメモ

## Order

真面目にOrderが見たいときは`std::cmp::Ordering`を使うと見やすい。`String`の辞書順とかでも使える。Floatには使えない。

```rust
let ord: std::cmp::Ordering = 5.cmp(&10);
assert_eq!(ord, std::cmp::Ordering::Less)
```

## min, max of float

Ordが実装されていないので、`std::cmp::max`とかはだめ。

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

## `std::vec`のbinary_search

普通に便利なんだけど、同じ値が含まれていた場合、matchそのものは値全部にできるのだが、返ってくる値は最大のindexを返す。なので、lower_boundがしたいときは[superslice](https://docs.rs/superslice/1.0.0/superslice/)を使ったほうがよさそう。もしくは自分で書くか。

以下docsの引用。

> If the value is found then Result::Ok is returned, containing the index of the matching element. If there are multiple matches, then any one of the matches could be returned. If the value is not found then Result::Err is returned, containing the index where a matching element could be inserted while maintaining sorted order.

```rust
let s = [0, 1, 1, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55];

assert_eq!(s.binary_search(&13),  Ok(9));
assert_eq!(s.binary_search(&4),   Err(7));
assert_eq!(s.binary_search(&100), Err(13));
let r = s.binary_search(&1);
assert!(match r { Ok(1..=4) => true, _ => false, }); // < ここをみるとrangeでmatchさせることはできる。
```

雑にテストしてみると、atcoderのversion(1.42.0)では、`i`は4を返す。これはversionごとにも挙動が違うらしい。rustコミュニティでも[議論](https://github.com/rust-lang/rfcs/issues/2184)はされているようなんだけど、いつ実装されるのかは不明。

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

なので、upper_boundしたければ下記の感じでできるはず。まあおとなしく自分で書いたほうがいい気がします。

```rust
fn upper_bound(x: &usize, s: Vec<usize>) -> usize {
    match s.binary_search(x) {
        Ok(i) => i + 1,
        Err(i) => i,
    }
}
```
