---
uuid: 35581b9a-26d4-41c2-9c5f-e00729e8b184
title: Implementing Operators Using Macros
description: When implementing operators for structs, the code gets very long without macros, so I'll summarize how to use macros for this purpose.
lang: en
category: techblog
tags:
  - rust
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

When implementing operators for structs, the code gets very long without macros, so I'll summarize how to use macros for this purpose.

## Macro Basics

Macro arguments are:

|       | Meaning            | Example                         |
| ----- | ------------------ | ------------------------------- |
| block | Block              |                                 |
| expr  | Expression         | `1+1`                           |
| stmt  | Statement          |                                 |
| pat   | Pattern            |                                 |
| ty    | Type               |                                 |
| ident | Identifier         |                                 |
| path  | Qualified name     | T::deafult                      |
| tt    | Single token tree  | Almost anything. Operators too. |
| meta  | Attribute contents | cfg(target_os = "windows")      |

The ones we'll use this time are `ident` and `tt`. The key point is that `tt` can be used for operator arguments. There was some discussion in [RFC#426](https://github.com/rust-lang/rfcs/issues/426) about creating a dedicated `op` argument type, but it doesn't seem to have made progress. For example, you can use operators like this:

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

This time, we'll consider the following simple struct:

```rust
struct Point<T> {
    x: T,
    y: T,
}
```

We'll define arithmetic operations between `Point<T>` and `<T>`.

For example, the Add implementation looks like this:

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

Since the code is essentially the same for other arithmetic operations, we want to consolidate them with a macro. Basically, we just need to specify the required trait, the function name required by the trait, and the operator.

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

I wasn't sure how to use operators in macros, so I wrote this up as a note.
