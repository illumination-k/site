---
uuid: 7ff96bd4-843a-4eec-ace7-2f36b32507fe
title: Queries on Interval Data
description: Notes on tools and data structures for performing queries on interval data
lang: en
category: techblog
tags:
  - bioinformatics
  - data-structure
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

When working with genomic data, you often need to perform queries on intervals.

For example, you might want to find peaks or SNVs that overlap with gene regions, or identify histone marks within open chromatin regions.

Naively performing such queries results in $O(N^2)$ complexity.
In practice, this computational cost is far from ideal.

## Solutions

### CLI

CLI tools like `bedtools` can handle these queries reasonably efficiently. They generally achieve around $O(Nlog(N))$ complexity. If performance is not a concern, using these well-established tools is a good approach.

- [bedtools](https://bedtools.readthedocs.io/en/latest/)
- [bedops](https://bedops.readthedocs.io/en/latest/)
- [bedtk](https://github.com/lh3/bedtk)

Since these tools are well-tested, they provide peace of mind for routine operations. Another advantage is that you don't have to write your own parsers for formats like `bed`.
Among them, `bedtools` is the most popular and feature-rich, while `bedtk` appears to be the fastest.

### Building Your Own

When CLI tools cannot solve the problem, you'll need to write your own code. Data structures suitable for this purpose have naturally been studied for a long time. While the computational complexity in terms of order hasn't changed much, benchmarks show significant differences, suggesting that optimizations have been steadily improving.

The fundamental ideas are based on data structures such as [Interval Tree](https://en.wikipedia.org/wiki/Interval_tree) and [R-tree](https://en.wikipedia.org/wiki/R-tree).

For implementations of these basic data structures, there are various options including the [rust-bio data structures](https://github.com/rust-bio/rust-bio/tree/master/src/data_structures/interval_tree) and a [Python implementation](https://github.com/chaimleib/intervaltree). Since these are implemented as AVL trees, using them is much less effort than implementing your own.

More recently developed data structures that are faster and more memory-efficient include the following. cgranges is the data structure used by bedtk.

| Name                                     | Language  | Github                              |
| ---------------------------------------- | --------- | ----------------------------------- |
| Augmented Interval List (AIList)         | C, Python | https://github.com/databio/AIList   |
| cgranges                                 | C, C++    | https://github.com/lh3/cgranges     |
| Cache Oblivious Interval Trees (COITree) | Rust      | https://github.com/dcjones/coitrees |

Based on the benchmarks published on GitHub, COITree is the fastest. Personally, since I have very little experience with C, I would probably just use COITree.
