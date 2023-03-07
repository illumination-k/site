---
uuid: 1e25178b-a7d5-499a-b05f-80c0f57c16f2
title: RustでLinkedListを実装してみた
description: RustでLinkedListを実装してみました。
lang: ja
category: techblog
tags:
  - rust
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

最近、[データ構造とアルゴリズム](https://sites.google.com/view/open-data-structures-ja/home)をRustで始めてみようかなと思っていて、双方向連結リスト(`DLList`)を実装していたのですが、難しかったのでメモ。基本的には[公式のLinkedList](https://github.com/rust-lang/rust/blob/master/library/alloc/src/collections/linked_list.rs)を見ながら実装しました。

## 要件

| method名    | 挙動                   |
| ----------- | ---------------------- |
| `get(i)`    | i番目の要素を見る      |
| `set(i, x)` | i番目の要素を`x`にする |
| `add(i, x)` | i番目に`x`を加える     |
| `remove(i)` | i番目の要素を削除する  |

の4つのメソッドを実装します。

## 実装

### 構造体の定義

公式は`NonNull`を使っていたので真似しました。`unsafe`使いまくる必要があるので怖いんですけど、公式がこうしていたので`unsafe`を使うことにしました。`RefCell`, `Rc`, `Weak`を使うのも良いというのを何件か見かけました。`unsafe`使わない実装もやってみたいですね。あと`PhantomData`なにってなってるので勉強します。

```rust
use std::{marker::PhantomData, ptr::NonNull};

#[derive(Debug, Clone)]
pub struct Node<T> {
    x: T,
    next: Option<NonNull<Node<T>>>,
    prev: Option<NonNull<Node<T>>>,
}

#[derive(Debug)]
pub struct DLList<T> {
    head: Option<NonNull<Node<T>>>,
    tail: Option<NonNull<Node<T>>>,
    n: usize,
    marker: PhantomData<Box<Node<T>>>,
}
```

### getとsetの定義

最初に実装したいのは`i`番目の`NonNull<Node<T>>`を持ってくる処理です。公式をよく見ると、`Cursor`的な構造体を定義しています。現在のindexとその時点のポインタを持っていて、`next`と`prev`を移動できる感じのやつです。公式だと`CursorMut`も定義していてそっちのほうがRustっぽい気もしたんですが、なくても今回の要件的には問題なさそうだったので省略しています。

```rust
pub struct Cursor<'a, T: 'a> {
    index: usize,
    current: Option<NonNull<Node<T>>>,
    list: &'a DLList<T>,
}

impl<'a, T> Cursor<'a, T> {
    pub fn move_next(&mut self) {
        match self.current.take() {
            Some(cur) => unsafe {
                self.current = cur.as_ref().next;
                self.index += 1;
            },
            None => {
                self.current = self.list.head;
                self.index = 0;
            }
        }
    }

    pub fn move_prev(&mut self) {
        match self.current.take() {
            Some(cur) => unsafe {
                self.current = cur.as_ref().prev;
                self.index -= 1;
            },
            None => {
                self.current = self.list.tail;
                self.index = self.index.checked_sub(1).unwrap_or_else(|| self.list.n);
            }
        }
    }
}
```

`Cursor`を使って`i`番目のノードのポインタを持ってくる処理を書きます。headとtailの近いほうから見に行きます。`get`と`set`はこのポインタから値を取り出すか変更する処理なんですぐ書けます。

```rust
impl<T> DLList<T> {
    fn get_node(&self, index: usize) -> Option<NonNull<Node<T>>> {
        if index < self.n / 2 {
            let mut cursor = Cursor {
                index: 0,
                current: self.head,
                list: &self,
            };

            for _ in 0..index {
                cursor.move_next();
            }

            cursor.current
        } else {
            let mut cursor = Cursor {
                index: self.n,
                current: self.tail,
                list: &self,
            };

            for _ in index..self.n - 1 {
                cursor.move_prev();
            }

            cursor.current
        }
    }

    pub fn get(&self, index: usize) -> Option<&T> {
        unsafe { self.get_node(index).map(|n| &(*n.as_ptr()).x) }
    }

    pub fn set(&mut self, x: T, index: usize) {
        unsafe {
            self.get_node(index).map(|mut n| n.as_mut().x = x);
        }
    }
}
```

### addの定義

`add`を行うためには、入れたいノード(`e`)の前に新しいノードを入れればいいです。つまり

```
e.prev -> e -> e.next
e.prev -> added -> e -> e.next
```

のような感じです。この処理の公式の実装は`splice_nodes`というメソッドで実装されているようです。この実装はもうちょっと複雑で、他のリストがあったとして、そのheadとtailのポインタを使うことで

```
e.prev -> added_1 -> added_2 -> ... -> added_n -> e -> e.next
```

のような処理ができます。ただ、今回は一個入れればいいので、もう少し簡略化して書きます。引数に`e.prev`と`e`、`added`をとって挿入する`splice_node`を実装しました。`add`に関しては入れたいところのポインタを`get_node`で持ってきて、`splice_node`すればいいです。

```rust
impl<T> DLList<T> {
    fn splice_node(
        &mut self,
        existing_prev: Option<NonNull<Node<T>>>,
        existing_next: Option<NonNull<Node<T>>>,
        mut splice_node: NonNull<Node<T>>,
    ) {
        if let Some(mut existing_prev) = existing_prev {
            unsafe {
                existing_prev.as_mut().next = Some(splice_node);
            }
        } else {
            self.head = Some(splice_node)
        }

        if let Some(mut existing_next) = existing_next {
            unsafe {
                existing_next.as_mut().prev = Some(splice_node);
            }
        } else {
            self.tail = Some(splice_node)
        }

        unsafe {
            splice_node.as_mut().prev = existing_prev;
            splice_node.as_mut().next = existing_next;
        }

        self.n += 1;
    }

    pub fn add(&mut self, x: T, index: usize) {
        let current = self.get_node(index);
        unsafe {
            let spliced_node = Box::leak(Box::new(Node::new(x))).into();
            let node_prev = match current {
                None => self.tail,
                Some(node) => node.as_ref().prev,
            };
            self.splice_node(node_prev, current, spliced_node);
        }
    }
}
```

### removeの実装

消したいノードを`n_i`とすると、以下のようにすればいいことがわかります。

```
n_i.prev -> n_i -> n_i.next
n_i.prev -> n_i.next
```

この処理は`unlink_node`という関数で実装されています。やってる処理は上記そのままです。`remove`は`add`のときと同じく、i番目のノードのポインタを持ってきて、`unlink_node`に渡すだけですね。

```rust
impl<T> DLList<T> {
    fn unlink_node(&mut self, mut node: NonNull<Node<T>>) {
        let node = unsafe { node.as_mut() };

        match node.prev {
            Some(prev) => unsafe { (*prev.as_ptr()).next = node.next },
            None => self.head = node.next,
        };

        match node.next {
            Some(next) => unsafe { (*next.as_ptr()).prev = node.prev },
            None => self.tail = node.prev,
        }

        self.n -= 1;
    }

    pub fn remove(&mut self, index: usize) -> Option<&T> {
        let node = self.get_node(index);

        if let Some(node) = node {
            self.unlink_node(node);
        }

        unsafe { node.map(|n| &(*n.as_ptr()).x) }
    }
}
```

## 感想

公式のコードはやっぱり勉強になります。
