---
uuid: 286b23d0-52ae-4acd-af76-12265398b03e
title: 平面上でのダイクトストラ (rust)
description: 二次元平面上でダイクトストラやりたいってときのための覚書
lang: ja
category: techblog
tags:
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

迷路を解くような問題で、障害物の数だったり、なんか特殊な処理するときだけ数える、みたいなやつはダイクトストラを使えば解けるらしい。

## 考え方

プライオリティキュー(BinaryHeap)は、最大値のものから取り出されていくので、数えたい処理のときはマイナスの値にしてプライオリティキューに入れていけば、値が大きいものほど取り出されなくなる。BFSのときと同じようにdistを作っておいて、最初にdistの(x, y)に訪れたときに取り出されたものにマイナスをかけてdistに格納しておけば、distの(x, y)はその時点での最小値になる。なので、何らかの特殊な処理をした値の数を保存することができる。0-1BFSのようなものっぽい(0-1BFSがわかってない)。

それはそうと[docs](https://doc.rust-lang.org/std/primitive.tuple.html)を読んで初めて知ったんですがrustのtupleのOrdは前から順番に大きさを評価していくんですね。

> The sequential nature of the tuple applies to its implementations of various traits. For example, in PartialOrd and Ord, the elements are compared sequentially until the first non-equal set is found.

## 前提

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

## 例1 ARC005 C - 器物損壊！高橋君

[問題ページ](https://atcoder.jp/contests/arc005/tasks/arc005_3)

スタートからゴールまでに"#"にあたる回数を数えて、ゴール時点で回数が2以下ならYES、そうじゃなければNO。

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

## 例2 A - Range Flip Find Route

[問題ページ](https://atcoder.jp/contests/agc043/tasks/agc043_a)

DPのほうが楽らしい。探索するときに、白から黒、もしくは黒から白に切り替わる数を数えたい。つまり、前回の値と違う数になる場合の数の最小値を求めたい。

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

## 例3 D - Wizard in Maze

[問題ページ](https://atcoder.jp/contests/abc176/tasks/abc176_d)

ワープ回数を数える。ワープのときにコスト-1で計算。想定解の0-1BFSとか、通常の移動ができなかったときだけワープさせるとかしたら早くなりそう。ちょっと特殊でワープしたときの値が混入することを防ぐために（その時点では行ってなくても通常の移動で行ける可能性があるので）、whileループのはじめで訪れてないことを確かめておく必要がある。

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

        // 通常の移動
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

        // ワープ
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

## 例4 J - 地ならし

[問題ページ](https://atcoder.jp/contests/past201912-open/tasks/past201912_j)

左下から右下、右下から右上にいくときの最小コストを求めたい。ただし、一回通った道はコスト0で通ることができるので、単純に2回ダイクトストラするだけではだめ。なので、経由点を1点定めて、そこまでの3点（左下、右下、右上）からのコストの合計値が一番小さいものを求める必要がある。

3回ダイクトストラをしたあと、すべての点のコストを求めて、その最小値を求める。ただし、探索する際にその点は3回繰り返されるので、そのコストを1回分にする必要があり、2回分その点のコストを引いている。

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

## 追記欄

見つけたら解答を書いていく。
