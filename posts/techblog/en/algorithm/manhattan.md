---
uuid: 64e0a71c-9c2b-433b-8927-c333e1c3253b
title: Manhattan Distance Memo
description: Notes on Manhattan distance
lang: en
category: techblog
tags:
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Notes. For details, please refer to [Recent 45-Degree Rotation Developments](https://kagamiz.hatenablog.com/entry/2014/12/21/213931).

## Manhattan Distance

The Manhattan distance between two points $i$ and $j$ is expressed as:
$$|x_i - x_j| + |y_i - y_j|$$

## Maximum Manhattan Distance

Given m points, we want to find the maximum Manhattan distance between any pair of points.
A brute-force approach would take $O(m^2)$.

Instead, we use a technique called 45-degree rotation. A 45-degree rotation is the transformation $(x', y') -> (x - y, x + y)$. Originally, a factor of $\sqrt{2}$ is applied to the magnitude, but when magnitude is not essential, it can be ignored. In other words, when you see $x+y$ or $x-y$, you should suspect a 45-degree rotation might be applicable.

The Manhattan distance doesn't reveal this directly, but by applying the following transformation, $x+y$ and $x-y$ emerge.

First, consider the absolute value as follows:

$$|x| = max(x, -x)$$

Then the Manhattan distance becomes:

$$
\begin{aligned}
|x_i - x_j| + |y_i - y_j| &= max(x_i - x_j, -x_i + x_j) + max(y_i - y_j, -y_i + y_j) \\
&= max((x_i - x_j) + (y_i - y_j), -(x_i - x_j) + (y_i - y_j), (x_i - x_j) - (y_i - y_j), -(x_i - x_j) + (y_i - y_j)) \\
&= max((x_i + y_i) - (x_j + y_j), -(x_i - y_i) + (x_j - y_j), (x_i - y_i) - (x_j - y_j), -(x_i + y_i) + (x_j + y_j))
\end{aligned}
$$

Looking at the 1st and 4th terms, and the 2nd and 3rd terms, they can be converted back to absolute values:

$$
max((|x_i + y_i) - (x_j + y_j)|, |(x_i - y_i) - (x_j - y_j)|)
$$

This reveals $x + y$ and $x - y$, so we can substitute $x' = x + y$ and $y' = x - y$.

Therefore:

$$
d_{ij} = max(|x_i' - x_j'|, |y_i' - y_j'|)
$$

Our original goal was to find:

$$
max_{1\leq i\leq n,1\leq j \leq n}(d_{ij})
$$

Transforming this gives:
$$
max_{1\leq i\leq n,1\leq j \leq n}(max(|x_i' - x_j'|, |y_i' - y_j'|))
$$

The outer $max_{1\leq i\leq n,1\leq j \leq n}$ and the inner $max$ can be swapped without changing the result:

$$
max(max_{1\leq i\leq n,1\leq j \leq n}(|x_i' - x_j'|, |y_i' - y_j'|))
$$

Now, $x'$ and $y'$ can be computed independently, so we just need to subtract the smallest from the largest. Therefore:

$$
max_{1\leq i\leq n,1\leq j \leq n}(|x_i' - x_j'|) = max_{1\leq i \leq n}(x_i') - min_{1\leq j \leq n}(x'_j)
$$

Applying the same to the $y'$ side:

$$
max(max_{1\leq i \leq n}(x_i') - min_{1\leq j \leq n}(x'_j), max_{1\leq i \leq n}(y_i') - min_{1\leq j \leq n}(y'_j))
$$

Since finding the maximum and minimum of $x+y$ and $x-y$ respectively is $O(m)$, the problem can be solved.

Incidentally, when extended to higher-dimensional spaces, for $R^k$ the complexity is $(O(k2^km))$. Quite challenging, indeed.
