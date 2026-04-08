---
uuid: 2b7e39bf-10bc-46f3-8cdf-cf9a03d160c8
title: Event Sort
description: My interpretation of event sort
lang: en
category: techblog
tags:
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## Overview

A set of half-open intervals $[S_i, T_i)$ is given. Each interval has an associated value $X_i$. These intervals may overlap.

The following query is given:
Find the minimum (or maximum) of $X_i$ defined at position $D_i$.

## Approach

Let's consider the example from [ABC128-E](https://atcoder.jp/contests/abc128/tasks/abc128_e).

![md={6}:abc128_example](../../public/abc128_img.png)

The diagram looks like this, and we need to find the minimum value for each query.
Now, consider a collection $X$ for the values $X_i$. We treat the left endpoint as an insertion of $X_i$ into $X$, and the right endpoint as a deletion of $X_i$ from $X$. Queries are processed as query events.

This gives us the following events:

1. Insertion event $(S_i, X_i, I)$
2. Deletion event $(T_i, X_i, D)$
3. Query event $(D_i, Index, Q)$

We process these events in order of position. Insertion and deletion events can be in any order, but query events must be processed after all insertions and deletions at the same position have been handled.

Processing the ABC128 example yields the following:

![abc128_event](../../public/abc128_event.png)

With this approach, the values within range at position $D_i$ are exactly those in the collection $X$. So for a query event, the minimum of collection $X$ is the answer at that position. By maintaining an Index, we can directly write the minimum value into the answer array.

In the example above, the same value was never inserted into $X$ multiple times, but in practice, multiple insertions of the same value can occur. Therefore, the data structure used for collection $X$ needs to be a `multiset`.

## Implementation in Rust

[Example](https://atcoder.jp/contests/abc128/submissions/26250585)

### multiset

Rust doesn't have a `multiset`, so we need to implement one ourselves.

Using a `BTreeMap`, we can relatively easily implement an ordered `multiset`-like structure. The key holds the value we want to treat as a set element, and the value holds the count. When the count reaches 0, we remove the key.

```rust
use std::collections::BTreeMap;

/// Ordered MultiSet
#[derive(Debug, Clone)]
pub struct BMultiSet<T> {
    pub inner_map: BTreeMap<T, usize>,
}

impl<T: Ord> BMultiSet<T> {
    pub fn new() -> Self {
        Self {
            inner_map: BTreeMap::new(),
        }
    }

    /// Insert Value
    pub fn insert(&mut self, x: T) {
        *self.inner_map.entry(x).or_insert(0) += 1;
    }

    /// Decrement count of the value.
    /// If count is zero, remove this value.
    pub fn erase_one(&mut self, x: T) -> Option<T> {
        if let Some(count) = self.inner_map.get_mut(&x) {
            *count -= 1;
            if *count == 0 {
                self.inner_map.remove(&x);
            }
            Some(x)
        } else {
            None
        }
    }

    /// Return count of value
    pub fn count(&self, x: &T) -> Option<&usize> {
        self.inner_map.get(x)
    }

    /// Remove value regradless of count
    pub fn erase_all(&mut self, x: T) -> Option<T> {
        self.inner_map.remove(&x);
        Some(x)
    }

    pub fn min(&self) -> Option<&T> {
        self.inner_map.iter().nth(0).map(|x| x.0)
    }

    pub fn max(&self) -> Option<&T> {
        self.inner_map.iter().last().map(|x| x.0)
    }

    pub fn is_empty(&self) -> bool {
        self.inner_map.is_empty()
    }
}
```

### PartialOrd for enums

It would be nice to define `Action` as an `enum`. When you derive `PartialOrd` for a Rust enum, variants are compared in top-to-bottom order.

```rust
#[derive(Debug, PartialEq, PartialOrd)]
enum Action {
    Insert,
    Delete,
    Query,
}

#[test]
fn test_partialeq() {
    assert!(Action::Insert > Action::Query);
    assert!(Action::Delete > Action::Query);
}
```
