---
uuid: 7ff96bd4-843a-4eec-ace7-2f36b32507fe
title: 区間に関するクエリ
description: 区間に関するクエリを行うためのツールやデータ構造に関するメモ
lang: ja
category: techblog
tags:
  - bioinformatics
  - data-structure
updated_at: "2022-06-12T15:55:39+00:00"
---

## TL;DR

Genomicなデータを扱っていると、区間に対するクエリを扱いたいことがよくある。

例えば、遺伝子領域と重複するピークやSNVを探したり、Open Chromatin Regionにあるヒストンマークを探したりするような利用方法が考えられる。

こういったクエリは、ナイーブに投げると $O(N^2)$ になってしまう。
現実問題として、この計算量はあまりよろしくない。

## 解決策

### CLI

CLIである`bedtools`などを使えばこういったクエリをある程度効率的に処理することができる。基本的には $O(Nlog(N))$ くらいになる。速度面で問題なければこういったツールを活用するのが良いと考えられる。

- [bedtools](https://bedtools.readthedocs.io/en/latest/)
- [bedops](https://bedops.readthedocs.io/en/latest/)
- [bedtk](https://github.com/lh3/bedtk)

テスト済みのツールが使えるので定型的な処理をする分には安心感がある。また、`bed`などのパーサーを書かなくていいので嬉しい。
一番メジャーかつできる処理が多いのは`bedtools`、高速なのは`bedtk`かなという感じを受ける。

### 自作

CLIで解決できない問題の場合は自分でコードを書くことになる。その場合に使えるようなデータ構造は当然ながら古くから研究されている。計算量のオーダーとしてはそこまで変化はないっぽいが、ベンチマークとか見るとだいぶ違うので最適化はされていっているらしい。

基本的なアイデアとしては、[Interval Tree](https://en.wikipedia.org/wiki/Interval_tree)や[R-tree](https://en.wikipedia.org/wiki/R-tree)などが使われている。

このあたりの基本的なデータ構造の実装としては、色々あるが[rust-bioのデータ構造](https://github.com/rust-bio/rust-bio/tree/master/src/data_structures/interval_tree)だったり、[python実装](https://github.com/chaimleib/intervaltree)だったりがある。
ALV木として実装されているので、自分で実装するよりこういったものを利用すると苦労は少なそう。

最近開発されているより高速・省メモリなデータ構造としては、以下のような物がある。ctrangesはbedtkで使用されているデータ構造。

| Name                                     | Language  | Github                              |
| ---------------------------------------- | --------- | ----------------------------------- |
| Augmented Interval List (AIList)         | C, Python | https://github.com/databio/AIList   |
| cgranges                                 | C, C++    | https://github.com/lh3/cgranges     |
| Cache Oblivious Interval Trees (COITree) | Rust      | https://github.com/dcjones/coitrees |

Githubで公開されているベンチマーク的にはCOITreeが一番早い。個人的にはCほとんどわからないので普通にCOITree使いそう。
