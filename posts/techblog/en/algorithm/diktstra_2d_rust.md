---
uuid: 286b23d0-52ae-4acd-af76-12265398b03e
title: Dijkstra on a 2D Plane (Rust)
description: Notes on running Dijkstra's algorithm on a two-dimensional plane
lang: en
category: techblog
tags:
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

For maze-solving problems where you need to count the number of obstacles or only count when performing special operations, Dijkstra's algorithm can apparently be used to solve them.

## Approach

A priority queue (BinaryHeap) pops the maximum value first, so when we want to count certain operations, we push negative values into the priority queue. This way, entries with larger counts are popped later. Just like in BFS, we prepare a `dist` array, and when we first visit `(x, y)`, we negate the popped value and store it in `dist`. This makes `dist[y][x]` the minimum value at that point. Thus, we can keep track of the count of special operations performed. It's something like 0-1 BFS (though I don't fully understand 0-1 BFS).

On a separate note, I learned for the first time from the [docs](https://doc.rust-lang.org/std/primitive.tuple.html) that Rust's tuple `Ord` evaluates elements sequentially from the front.

> The sequential nature of the tuple applies to its implementations of various traits. For example, in PartialOrd and Ord, the elements are compared sequentially until the first non-equal set is found.

## Prerequisites

```rust
#![allow(non_snake_case)]
#![allow(unused_imports)]
#![allow(dead_code)]

use num::*;
use num_traits::*;
use proconio::marker::*;
use proconio::{fastout, input};
use std::collections::*;
use std::ops::*;
use superslice::*;
use whiteread::parse_line;

use itertools::Itertools;
use itertools_num::ItertoolsNum;
```

## Example 1: ARC005 C - Property Destruction! Takahashi

[Problem page](https://atcoder.jp/contests/arc005/tasks/arc005_3)

Count the number of times we hit "#" from start to goal. If the count is 2 or less at the goal, output YES; otherwise, NO.

```rust
#[fastout]
fn main() {
    input! {
        h: usize, w: usize,
        graph: [Chars; h],
    }

    let mut start = (0, 0);
    let mut goal = (0, 0);

    for x in 0..w {
        for y in 0..h {
            if graph[y][x] == 's' {
                start = (x, y)
            } else if graph[y][x] == 'g' {
                goal = (x, y)
            }
        }
    }

    let mut dist = vec![vec![-1; w]; h];
    let mut pq = BinaryHeap::new();

    pq.push((0, start));

    let directions = vec![(0, 1), (1, 0), (-1, 0), (0, -1)];
    while let Some((dep, (x, y))) = pq.pop() {
        let dep = -dep;

        for &(dx, dy) in directions.iter() {
            let cx = x as isize + dx;
            let cy = y as isize + dy;

            if cx < 0 || cy < 0 || cx >= w as isize || cy >= h as isize {
                continue;
            }
            let cxu = cx as usize;
            let cyu = cy as usize;
            if dist[cyu][cxu] >= 0 {
                continue;
            }
            if graph[cyu][cxu] == '#' {
                dist[cyu][cxu] = dep + 1;
                pq.push((-(dep + 1), (cxu, cyu)))
            } else {
                dist[cyu][cxu] = dep;
                pq.push((-dep, (cxu, cyu)))
            }
        }
    }

    if dist[goal.1][goal.0] <= 2 {
        println!("YES")
    } else {
        println!("NO")
    }
}
```

## Example 2: A - Range Flip Find Route

[Problem page](https://atcoder.jp/contests/agc043/tasks/agc043_a)

DP is apparently easier for this one. During the search, we want to count the number of transitions from white to black, or black to white. In other words, we want to find the minimum number of times the value changes from the previous one.

```rust
#[fastout]
fn main() {
    input! {
        h: usize, w: usize,
        s: [Chars; h]
    }
    let vect = vec![(0, 1), (1, 0)];
    let mut pq = BinaryHeap::new();
    if s[0][0] == '.' {
        pq.push((0, (0, 0)))
    } else {
        pq.push((-1, (0, 0)))
    };
    let mut d = vec![vec![-1; w]; h];

    while let Some((dep, (x, y))) = pq.pop() {
        let dep = -dep;

        for &(dx, dy) in vect.iter() {
            let cx = x as i64 + dx;
            let cy = y as i64 + dy;
            if cx >= 0 && cx < w as i64 && cy >= 0 && cy < h as i64 {
                let (cyu, cxu) = (cy as usize, cx as usize);
                if d[cyu][cxu] < 0 {
                    if s[cyu][cxu] == s[y][x] {
                        d[cyu][cxu] = dep;
                        pq.push((-dep, (cxu, cyu)))
                    } else {
                        d[cyu][cxu] = dep + 1;
                        pq.push((-(dep + 1), (cxu, cyu)))
                    }
                }
            }
        }
    }

    println!("{}", (d[h - 1][w - 1] + 1) / 2)
}
```

## Example 3: D - Wizard in Maze

[Problem page](https://atcoder.jp/contests/abc176/tasks/abc176_d)

Count the number of warps. Warps cost -1. The intended solution using 0-1 BFS, or only warping when normal movement fails, would likely be faster. This one is a bit special: to prevent warp values from contaminating the results (since a cell might be reachable via normal movement even if we haven't visited it yet), we need to verify at the beginning of the while loop that the cell hasn't been visited.

```rust
#[fastout]
fn main() {
    input! {
        h: usize, w: usize,
        sy: usize, sx: usize,
        gy: usize, gx: usize,
        graph: [Chars; h]
    }

    let mut dist = vec![vec![-1; w]; h];
    let directions = vec![(0, 1), (1, 0), (-1, 0), (0, -1)];
    let mut pq = BinaryHeap::new();
    pq.push((0, (sx - 1, sy - 1)));

    while let Some((dep, (x, y))) = pq.pop() {
        let dep = -dep;
        if dist[y][x] >= 0 {
            continue;
        }

        dist[y][x] = dep;

        // Normal movement
        for &(dx, dy) in directions.iter() {
            let (cx, cy) = (x as isize + dx, y as isize + dy);
            if cx < 0 || cy < 0 || cx >= w as isize || cy >= h as isize {
                continue;
            }

            let (cxu, cyu) = (cx as usize, cy as usize);
            if dist[cyu][cxu] >= 0 {
                continue;
            }
            if graph[cyu][cxu] == '#' {
                continue;
            }

            pq.push((-dep, (cxu, cyu)));
        }

        // Warp
        let left_bound = if x < 2 { 0 } else { x - 2 };
        let right_bound = if x + 3 >= w { w } else { x + 3 };
        let up_bound = if y < 2 { 0 } else { y - 2 };
        let down_bound = if y + 3 >= h { h } else { y + 3 };

        for wx in left_bound..right_bound {
            for wy in up_bound..down_bound {
                if dist[wy][wx] >= 0 {
                    continue;
                }
                if graph[wy][wx] == '#' {
                    continue;
                }
                pq.push((-(dep + 1), (wx, wy)))
            }
        }
    }

    println!("{}", dist[gy - 1][gx - 1]);
}
```

## Example 4: J - Land Leveling

[Problem page](https://atcoder.jp/contests/past201912-open/tasks/past201912_j)

We want to find the minimum cost of traveling from the bottom-left to the bottom-right, and then from the bottom-right to the top-right. However, since a path that has already been traversed can be used at zero cost, simply running Dijkstra twice won't work. Instead, we need to fix an intermediate point and find the minimum total cost from all three points (bottom-left, bottom-right, top-right) to that point.

After running Dijkstra three times, we compute the cost at every point and find the minimum. However, since the intermediate point is counted three times during the search, we need to reduce its cost to a single occurrence by subtracting the point's cost twice.

```rust
#[fastout]
fn main() {
    input! {
        h: usize, w: usize,
        graph: [[isize; w]; h]
    }

    let directions = vec![(0, 1), (1, 0), (-1, 0), (0, -1)];
    let mut pq = BinaryHeap::new();

    let starts = vec![(0, h - 1), (w - 1, 0), (w - 1, h - 1)];
    let mut dist = vec![vec![vec![-1; w]; h]; 3];

    for (i, r) in starts.iter().enumerate() {
        let (rx, ry) = *r;
        pq.push((0, (rx, ry)));

        while let Some((dep, (x, y))) = pq.pop() {
            let dep = -dep;

            for &(dx, dy) in directions.iter() {
                let (cx, cy) = (x as isize + dx, y as isize + dy);
                if cx < 0 || cy < 0 || cx >= w as isize || cy >= h as isize {
                    continue;
                }
                let (cxu, cyu) = (cx as usize, cy as usize);

                if dist[i][cyu][cxu] >= 0 {
                    continue;
                }
                dist[i][cyu][cxu] = dep + graph[cyu][cxu];
                pq.push((-(dep + graph[cyu][cxu]), (cxu, cyu)))
            }
        }
    }

    let mut ans = INF;

    for x in 0..w {
        for y in 0..h {
            let sum = (0..3).fold(0, |acc, idx| acc + dist[idx][y][x]) - graph[y][x] * 2;
            ans = std::cmp::min(ans, sum);
        }
    }

    println!("{}", ans)
}
```

## Addendum

I'll add solutions as I find them.
