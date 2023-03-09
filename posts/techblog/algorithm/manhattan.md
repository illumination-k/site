---
uuid: 64e0a71c-9c2b-433b-8927-c333e1c3253b
title: Manhattan Distance Memo
description: マンハッタン距離に関するメモ
lang: ja
category: techblog
tags:
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

メモ。詳しくは[最近の 45 度回転事情](https://kagamiz.hatenablog.com/entry/2014/12/21/213931)を参照してほしい。

## マンハッタン距離

ある二点$i, j$のマンハッタン距離は以下のように表される。
$$|x_i - x_j| + |y_i - y_j|$$

## マンハッタン距離の最大値

点がm個与えられたとき、その点間のマンハッタン距離の最大値を求めたい。
もし全探索すると、$O(m^2)$かかってしまう。

そこで、45度回転させるという手法を使う。45度回転というのは$(x', y') -> (x - y, x + y)$となる変換のこと。本来は$\sqrt{2}$が大きさとしてかかるが、大きさが本質でない場合は無視できる。つまり、$x+y, x-y$などが見えたら45度回転の可能性を疑うとよい...らしい。

マンハッタン距離はそのままだと見えてこないが、以下のような変換を行うことで$x+y, x-y$が現れる。

まず、絶対値を以下のように考える。

$$|x| = max(x, -x)$$

こうすると、マンハッタン距離は

$$
|x_i - x_j| + |y_i - y_j| = max(x_i - x_j, -x_i + x_j) + max(y_i - y_j, -y_i + y_j) \\
= max((x_i - x_j) + (y_i - y_j), -(x_i - x_j) + (y_i - y_j), (x_i - x_j) - (y_i - y_j), -(x_i - x_j) + (y_i - y_j)) \\
= max((x_i + y_i) - (x_j + y_j), -(x_i - y_i) + (x_j - y_j), (x_i - y_i) - (x_j - y_j), -(x_i + y_i) + (x_j + y_j))
$$

こうすると、1番目と4番目、2番目と3番目に注目すると、そこは絶対値に戻すことができて

$$
max((|x_i + y_i) - (x_j + y_j)|, |(x_i - y_i) - (x_j - y_j)|)
$$

と表すことができるので、$x + y, x - y$が出てくるので、$x' = x + y, y' = x - y$と置くことができるようになってくる。

なので

$$
d_{ij} = max(|x_i' - x_j'|, |y_i' - y_j'|)
$$

と表すことができる。

もともとの目的は下の式が求めたいことであった。

$$
max_{1\leq i\leq n,1\leq j \leq n}(d_{ij})
$$

これを変形すると
$$
max_{1\leq i\leq n,1\leq j \leq n}(max(|x_i' - x_j'|, |y_i' - y_j'|))
$$

になって、最初の$max_{1\leq i\leq n,1\leq j \leq n}$と二回目の$max$は入れ替えても結果が変わらない。

$$
max(max_{1\leq i\leq n,1\leq j \leq n}(|x_i' - x_j'|, |y_i' - y_j'|))
$$

になる。このとき、$x', y'$はそれぞれ独立に計算できるので、一番大きいものから一番小さいものを引けばいい。なので、

$$
max_{1\leq i\leq n,1\leq j \leq n}(|x_i' - x_j'|) = max_{1\leq i \leq n}(x_i') - min_{1\leq j \leq n}(x'_j)
$$

と書くことができて、$y'$側も同様にすると

$$
max(max_{1\leq i \leq n}(x_i') - min_{1\leq j \leq n}(x'_j), max_{1\leq i \leq n}(y_i') - min_{1\leq j \leq n}(y'_j))
$$

こうすると$x+y, x-y$のそれぞれの最大、最小を求めることは$O(m)$なので、解くことができる。

ちなみに高次元空間に拡大すると$R^k$のとき、$(O(k2^km))$らしい。むずかしいね。
