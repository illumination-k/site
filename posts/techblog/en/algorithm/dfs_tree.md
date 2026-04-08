---
uuid: 695d0509-0a21-48a9-86c3-720acc0a21a4
title: DFS and DFS Trees in Rust
description: DFS on trees and DFS tree construction in Rust
lang: en
category: techblog
tags:
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

I got crushed in the recent ABC187 contest. For Problem E, one approach I thought might work was using a DFS tree. I couldn't implement it during the contest, but I managed to get AC afterward. However, the implementation was trickier than expected, so I'm writing it up here. I need more implementation skills.

## DFS Tree

A DFS tree is formed by relabeling tree node indices according to the DFS traversal order. It's apparently a useful technique even when dealing with plain undirected graphs. I don't fully understand that yet, so I'll write about it when I do. Since we're working on trees this time, no back edges will appear.

This time, we'll use it for Range Add Queries on subtrees. In practice, you could combine it with a segment tree for even more operations. I mostly referred to [this slide](https://www.slideshare.net/Proktmr/ss-138534092).

## DFS on Trees

There's no particular reason to restrict this to trees, but let's start with DFS on a tree. We'll assume the graph is stored in adjacency list format.

```rust
use proconio::{fastout, input};

fn dfs(start: usize, graph: &Vec<Vec<usize>>, seen: &mut Vec<bool>) {
    if seen[start] {
        return;
    }
    seen[start] = true;

    println!("{}", start);

    for i in 0..graph[start].len() {
        dfs(graph[start][i], graph, seen)
    }
}

#[fastout]
fn main() {
    input! {
        n: usize,
        ab: [(usize, usize); n-1]
    }

    let mut graph = vec![vec![]; n];

    for &(a, b) in ab.iter() {
        graph[a - 1].push(b - 1);
        graph[b - 1].push(a - 1);
    }
    let mut seen = vec![false; n];
    dfs(0, &graph, &mut seen);
}
```

The input/output is as follows. It's just a straightforward DFS.

```
#input
7
2 1
2 3
4 2
4 5
6 1
3 7

#output
0
1
2
6
3
4
5
```

Looks like it works correctly.

## Constructing the DFS Tree

To build the DFS tree, we just need to record the DFS traversal order. We construct the DFS tree rooted at the DFS starting point.
Additionally, for later use, we record the mapping from original indices to DFS tree indices and vice versa. It's easier to handle this with a struct, so let's use one.

```rust
#[derive(Debug, Clone)]
struct DfsTree {
    graph: Vec<Vec<usize>>,
    tree_index_to_dfs_index: Vec<usize>,
    dfs_index_to_tree_index: Vec<usize>,
    cnt: usize,
}

impl DfsTree {
    fn new(graph: Vec<Vec<usize>>) -> Self {
        let n = graph.len();
        Self {
            graph,
            tree_index_to_dfs_index: vec![0; n],
            dfs_index_to_tree_index: vec![0; n],
            cnt: 0,
        }
    }

    pub fn build(&mut self, root: usize) {
        let mut seen = vec![false; self.graph.len()];
        self.dfs(root, &self.graph.clone(), &mut seen);
    }

    fn dfs(&mut self, v: usize, graph: &Vec<Vec<usize>>, seen: &mut Vec<bool>) {
        if seen[v] {
            return;
        }

        seen[v] = true;
        let dfs_ord = self.cnt;
        self.tree_index_to_dfs_index[v] = dfs_ord;
        self.dfs_index_to_tree_index[dfs_ord] = v;
        self.cnt += 1;

        for i in 0..graph[v].len() {
            self.dfs(graph[v][i], graph, seen);
        }
    }
}

#[fastout]
fn main() {
    input! {
        n: usize,
        ab: [(usize, usize); n-1]
    }

    let mut graph = vec![vec![]; n];

    for &(a, b) in ab.iter() {
        graph[a - 1].push(b - 1);
        graph[b - 1].push(a - 1);
    }
    let mut seen = vec![false; n];
    let mut dfs_tree = DfsTree::new(graph);
    dfs_tree.build(0);

    println!("{:?}", dfs_tree.tree_index_to_dfs_index)
}
```

Since the input is the same, I'll only show the output. `tree_index_to_dfs_index[i]` indicates what position the original index occupies in the DFS tree.

```
[0, 1, 2, 4, 5, 6, 3]
```

## Retrieving Subtrees

To retrieve subtrees, for a given node v (where v is a DFS tree index), we need to record the time when the DFS of its descendants completes as `pos[v]`. The subtree rooted at v can be represented as the half-open interval `[v, pos[v])`. The point at which a node v's traversal ends is right after exiting the `for` loop in the recursive function.

```rust
use proconio::{fastout, input};

#[derive(Debug, Clone)]
struct DfsTree {
    graph: Vec<Vec<usize>>,
    tree_index_to_dfs_index: Vec<usize>,
    dfs_index_to_tree_index: Vec<usize>,
    pos: Vec<usize>,
    cnt: usize,
}

impl DfsTree {
    fn new(graph: Vec<Vec<usize>>) -> Self {
        let n = graph.len();
        Self {
            graph,
            tree_index_to_dfs_index: vec![0; n],
            dfs_index_to_tree_index: vec![0; n],
            pos: vec![0; n],
            cnt: 0,
        }
    }

    pub fn build(&mut self, root: usize) {
        let mut seen = vec![false; self.graph.len()];
        self.dfs(root, &self.graph.clone(), &mut seen);
    }

    fn dfs(&mut self, v: usize, graph: &Vec<Vec<usize>>, seen: &mut Vec<bool>) {
        if seen[v] {
            return;
        }

        seen[v] = true;
        let dfs_ord = self.cnt;
        self.tree_index_to_dfs_index[v] = dfs_ord;
        self.dfs_index_to_tree_index[dfs_ord] = v;
        self.cnt += 1;

        for i in 0..graph[v].len() {
            self.dfs(graph[v][i], graph, seen);
        }

        // Reached the bottom
        self.pos[dfs_ord] = self.cnt;
    }

    pub fn dfs_index(&self, tree_index: usize) -> usize {
        self.tree_index_to_dfs_index[tree_index]
    }

    pub fn tree_index(&self, dfs_index: usize) -> usize {
        self.dfs_index_to_tree_index[dfs_index]
    }

    pub fn pos(&self, dfs_index: usize) -> usize {
        self.pos[dfs_index]
    }

    pub fn subtree_range(&self, dfs_index: usize) -> (usize, usize) {
        (dfs_index, self.pos[dfs_index])
    }
}
#[fastout]
fn main() {
    input! {
        n: usize,
        ab: [(usize, usize); n-1]
    }

    let mut graph = vec![vec![]; n];

    for &(a, b) in ab.iter() {
        graph[a - 1].push(b - 1);
        graph[b - 1].push(a - 1);
    }
    let mut seen = vec![false; n];
    let mut dfs_tree = DfsTree::new(graph);
    dfs_tree.build(0);

    println!("{:?}", dfs_tree.pos)
}
```

The output is:

```
[7, 6, 4, 4, 6, 6, 7]
```

It looks like it's recording correctly.
Using this struct, we can easily get the subtree range.

## Practical Examples

## ABC187-E

This problem can be reduced to either adding x to a subtree, or adding x to the entire tree and then subtracting x from the subtree. The reduction part is fairly straightforward; the real challenge was probably the implementation.

Using the DFS tree, the indices of a subtree are contiguous, so we can apply the imos method on a one-dimensional array. By accumulating the values and then mapping back to the original indices, we achieve the result.

> [Submission](https://atcoder.jp/contests/abc187/submissions/19171880)

Initially, I was going down the wrong path looking into Euler tours, but it seems like that approach could also work, so I'd like to look into it again. I also want to understand the imos-DFS technique on trees that was demonstrated in the official broadcast.

### ABC138-D

This can also be solved the same way by thinking of it as addition to subtrees. However, the intended solution seems easier.

> [Submission](https://atcoder.jp/contests/abc138/submissions/19228859)

## References

- [Introduction to Tree Structures with Diagrams and Implementations](https://www.slideshare.net/Proktmr/ss-138534092)
