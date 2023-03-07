---
uuid: 35581b9a-26d4-41c2-9c5f-e00729e8b184
title: macroを使ってopを実装する
description: 構造体に対して演算子を実装するときに、マクロを使わないとすごく長くなるのでマクロの使い方についてまとめておく。
lang: ja
category: techblog
tags:
  - rust
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

構造体に対して演算子を実装するときに、マクロを使わないとすごく長くなるのでマクロの使い方についてまとめておく。

## macroの基本

マクロの引数は

|       | 意味                   | 例                               |
| ----- | ---------------------- | -------------------------------- |
| block | ブロック               |                                  |
| expr  | 式                     | `1+1`                            |
| stmt  | 文                     |                                  |
| pat   | パターン               |                                  |
| ty    | 型                     |                                  |
| ident | 識別子                 |                                  |
| path  | 修飾された名前。       | T::deafult                       |
| tt    | 単一のトークン木       | だいたいなんでも。演算子もここ。 |
| meta  | アトリビュートの中身。 | cfg(target_os = "windows")       |

で、今回使うのは`ident`と`tt`。ポイントは演算子を入れる引数は`tt`が使えるということ。[RFC#426](https://github.com/rust-lang/rfcs/issues/426)とかで`op`用の引数を作ろうみたいな話もあるらしいが、特に進んでなさそう。例えば以下のような感じで演算子を使える。

```rust
macro_rules! test_op {
    ($op: tt) => {
        1 $op 2
    };
}

#[test]
fn test_op() {
    assert_eq!(3, test_op!(+));
    assert_eq!(-1, test_op!(-));
    assert_eq!(2, test_op!(*));
    assert_eq!(0, test_op!(/));
    assert_eq!(false, test_op!(==));
}
```

今回は以下のような単純な構造体を考える。

```rust
struct Point<T> {
    x: T,
    y: T,
}
```

これに対して、`Point<T>`と`<T>`に関する四則演算を定義する。

例えば、Addの場合は以下のようになる。

```rust
use std::ops::*;

impl<T> Add<Point<T>> for Add<T>
    where T: Add<Output = T>
{
    type Output = Self;
    fn add(self, rhs: Self) -> Self {
        Self {
            x: self.x + rhs.x,
            y: self.y + rhs.y,
        }
    }
}
impl<T> Add<T> for Point<T>
    where T: Add<Output = T> + Copy
{
    type Output = Self;
    fn add(self, rhs: T) -> Self {
        Self {
            x: self.x + rhs.
            y: self.y + rhs,
        }
    }
}
```

これらの処理は他の四則演算においてもだいたい同じコードなのでマクロでまとめたい。基本的には必要なtraitと、traitに必要な関数名、演算子を指定すればいい。

```rust
macro_rules! impl_point_op {
    ($trait: ident, $function: ident, $op: tt) => {
        impl<T> $trait<Point<T>> for Point<T>
        where
            T: $trait<Output = T>,
        {
            type Output = Self;
            fn $function(self, rhs: Self) -> Self {
                Self {
                    x: self.x $op rhs.x,
                    y: self.y $op rhs.y,
                }
            }
        }

        impl<T> $trait<T> for Point<T>
        where
            T: $trait<Output = T> + Copy,
        {
            type Output = Self;
            fn $function(self, rhs: T) -> Self {
                Self {
                    x: self.x $op rhs,
                    y: self.y $op rhs,
                }
            }
        }
    };
}

impl_point_op!(Add, add, +);
impl_point_op!(Sub, sub, -);
impl_point_op!(Mul, mul, *);
impl_point_op!(Div, div, /);
```

演算子をどう使えばいいのかわからなかったのでメモがてらまとめておいた。
