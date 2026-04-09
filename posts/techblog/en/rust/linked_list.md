---
uuid: 1e25178b-a7d5-499a-b05f-80c0f57c16f2
title: Implementing a LinkedList in Rust
description: I implemented a LinkedList in Rust.
lang: en
category: techblog
tags:
  - rust
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Recently, I've been thinking about working through [Data Structures and Algorithms](https://sites.google.com/view/open-data-structures-ja/home) in Rust, and I was implementing a doubly-linked list (`DLList`), which turned out to be quite difficult, so here are my notes. I basically implemented it while referencing the [official LinkedList](https://github.com/rust-lang/rust/blob/master/library/alloc/src/collections/linked_list.rs).

## Requirements

| Method Name | Behavior                     |
| ----------- | ---------------------------- |
| `get(i)`    | View the i-th element        |
| `set(i, x)` | Set the i-th element to `x`  |
| `add(i, x)` | Add `x` at the i-th position |
| `remove(i)` | Remove the i-th element      |

We'll implement these four methods.

## Implementation

### Struct Definition

The official implementation uses `NonNull`, so I followed suit. It requires heavy use of `unsafe`, which is scary, but since the official code does it this way, I decided to use `unsafe`. I've seen some mentions that using `RefCell`, `Rc`, and `Weak` is also a good approach. I'd like to try an implementation without `unsafe` sometime. Also, I need to study `PhantomData` because I don't fully understand it yet.

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

### Defining get and set

The first thing we want to implement is a function that retrieves the `NonNull<Node<T>>` at the i-th position. Looking at the official code closely, it defines a `Cursor`-like struct. It holds the current index and the pointer at that point, and can move via `next` and `prev`. The official code also defines a `CursorMut`, which feels more Rust-like, but it wasn't necessary for our requirements, so I omitted it.

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

Using the `Cursor`, we write the logic to retrieve the pointer to the i-th node. It traverses from whichever end (head or tail) is closer. `get` and `set` simply extract or modify the value from this pointer, so they're straightforward.

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

### Defining add

To perform `add`, we need to insert a new node before the node at the desired position (`e`). In other words:

```
e.prev -> e -> e.next
e.prev -> added -> e -> e.next
```

The official implementation of this logic is in a method called `splice_nodes`. The official implementation is a bit more complex -- given the head and tail pointers of another list, it can do:

```
e.prev -> added_1 -> added_2 -> ... -> added_n -> e -> e.next
```

However, since we only need to insert one node, I wrote a simplified version. I implemented `splice_node` which takes `e.prev`, `e`, and the node to be added as arguments. For `add`, we just get the pointer at the desired position with `get_node` and call `splice_node`.

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

### Implementing remove

If we call the node we want to remove `n_i`, we can see that we need to do the following:

```
n_i.prev -> n_i -> n_i.next
n_i.prev -> n_i.next
```

This logic is implemented in a function called `unlink_node`. The processing is exactly as described above. `remove`, just like `add`, gets the pointer to the i-th node and passes it to `unlink_node`.

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

## Thoughts

Reading the official code is really educational.
