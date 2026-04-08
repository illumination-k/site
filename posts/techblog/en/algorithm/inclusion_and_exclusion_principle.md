---
uuid: 403440c7-acf4-4b1c-acd0-0f366044f63f
title: The Inclusion-Exclusion Principle and Euler's Totient Function
description: Notes on the inclusion-exclusion principle, its implementation, and Euler's totient function
lang: en
category: techblog
tags:
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

I wanted to organize my understanding of the inclusion-exclusion principle and Euler's totient function, so I'm writing these notes. For precise information, please refer to the references section.

## References

- [Two Proofs of the Inclusion-Exclusion Principle](https://manabitimes.jp/math/611)
- [Meaning and Proof of the Inclusion-Exclusion Principle](http://www.mathlion.jp/article/ar094.html)
- [Inclusion-Exclusion Principle](https://satanic0258.hatenablog.com/entry/2016/04/10/104524)
- [Combinatorics](https://www.ci.seikei.ac.jp/yamamoto/lecture/combinatorics/text.pdf)

## Inclusion-Exclusion Principle

A formula that converts `intersection` to `union`.

$$
\begin{aligned}
|A_1 \cup A_2 \cup A_3 ... A_{n-1} \cup A_n| &= \sum_{i=1}^n|A_i| \\
&+ (-1)^{1}\sum_{1 \leq i \leq j \leq n}|A_i \cap A_j| \\
&+ (-1)^{2}\sum_{1 \leq i \leq j \leq k \leq n}|A_i \cap A_j \cap A_k| \\
&... \\
&+ (-1)^{n-1}|A_1 \cap A_2...\cap A_n| \\
&= \sum_{i=1}^n(-1)^{i-1}\sum_{1\leq j_1\leq j_2 ...\leq j_i \leq n}|A_{j_1} \cap A_{j_2} \cap ... \cap A_{j_i}|
\end{aligned}
$$

where $|A_i|$ is the number of elements in set $i$.

## Proof

**Honestly, I'm not fully confident about this**

Consider an arbitrary element $x$ belonging to $|A_1 \cup A_2 \cup A_3 ... A_{n-1} \cup A_n|$. On the left side, element $x$ is counted exactly once.

Now, on the right side, considering the plus and minus signs, we count how many times element $x$ is counted in $|A_{j_1} \cap A_{j_2} ... \cap A_{j_i}|$. Let $k$ be the number of sets containing $x$, and let the sets containing $x$ be $A_i (i \in k)$. We ignore sets that don't contain $x$ since they contribute nothing to the count.

The number of times $x$ is counted across single sets $A_i (i\in k)$ is $_kC_1$. The number of times it's counted in pairwise intersections $A_i \cap A_j (i,j \in k)$ is $_kC_2$. Similarly, the number of combinations of $r$ intersections of sets containing $x$ where $x$ is counted is $_kC_r$. Taking the plus and minus signs into account:

$$
\sum_{r=1}^{k}(-1)^{r-1} \space _kC_r
$$

On the other hand, by the binomial theorem:

$$
\begin{aligned}
0 &= (1 - 1)^k \\
&= \sum_{r=0}^{k} \space _kC_r (-1)^r \\
&= 1 - \sum_{r=1}^{k} \space _kC_r (-1)^{r-1}
\end{aligned}
$$

Therefore, the count of any element $x$ is equal on both sides. Hence, the principle holds.

## Implementation

This is what I wanted to write down.
It can be implemented using bit exhaustive search.

Let's consider multiples of `2, 3, 5` that are at most 100.

```rust
fn main() {
    let nums = vec![2, 3, 5];
    let mut counter = 0;

    for bit in 0..1 << nums.len() {
        // Count the number of 1s in binary representation
        let popcount = bit.count_ones();
        let mut mul = 1;

        for i in 0..nums.len() {
            if bit & 1 << nums.len() {
                mul *= nums[i]
            }
        }

        if mul == 1 {
            continue;
        }

        if popcount % 2 == 1 {
            counter += 100 / mul;
        } else {
            counter -= 100 / mul;
        }
    }

    println!("{}", counter)
}
```

Since divisibility can be determined, prime factorization lets us count coprime numbers as well.

## Euler's Totient Function: Count of Natural Numbers up to N that are Coprime to N

For any natural number $n$, the number of natural numbers less than or equal to $n$ that are coprime to $n$ is written as $\phi(n)$.

Given the prime factors $p_i$ of $n$:

$$
\begin{aligned}
\phi(n) = n\prod_{i=1}^{k} \left( 1 - \frac{1}{p_i} \right)
\end{aligned}
$$

### Proof Using the Inclusion-Exclusion Principle

<s>The approach seems correct, but I'm not sure what happened with the final algebraic transformation.</s>

For any $x (1 \leq x \leq k)$, let $|A_i|$ be the set of natural numbers that are multiples of the prime $p_i$ and at most $n$. Then $|A_i| = \frac{n}{p_i}$ (e.g., the number of multiples of 2 that are at most 100 is 100/2).

In general, for any intersection:

$$
\begin{gathered}
|A_{j_1} \cap A_{j_2} \cap ... \cap A_{j_k}| = \frac{n}{p_{j_1}p_{j_2}...p_{j_k}} \\
(1 \leq j_1 < j_2 < ... < j_k \leq k)
\end{gathered}
$$

(e.g., the number of multiples of 10 that are at most 100 is the count of numbers that are multiples of both 2 and 5, so 100/(2*5)).

Here, the union $|A_{j_1} \cup A_{j_2} \cup ... \cup A_{j_k} |$ is the set that counts each multiple of primes $p_{j_1},p_{j_2},...,p_{j_k}$ exactly once, so it suffices to show:

$$
\phi(n) = n - |A_{j_1} \cup A_{j_2} \cup ... \cup A_{j_k}|
$$

Applying the inclusion-exclusion principle:

$$
\begin{aligned}
|A_{j_1} \cup A_{j_2} \cup ... \cup A_{j_k}| &=
\sum_{i=1}^k(-1)^{i-1}\sum_{1\leq j_1\leq j_2 ...\leq j_i \leq k}|A_{j_1} \cap A_{j_2} \cap ... \cap A_{j_i}| \\
&=\sum_{i=1}^k(-1)^{i-1}\sum_{1\leq j_1\leq j_2 ...\leq j_i \leq k}\frac{n}{p_{j_1}p_{j_2}...p_{j_k}} \\
&= n\left( 1 - \left( 1 - \frac{1}{p_1}\right)\left( 1 - \frac{1}{p_2}\right)....\left( 1 - \frac{1}{p_k}\right)\right) \\
&= n - \phi(n) \\
&\therefore \phi(n) = n - |A_{j_1} \cup A_{j_2} \cup ... \cup A_{j_k}|
\end{aligned}
$$

Thus, it is proven.

### Proof Using the Multiplicative Property

This departs from the inclusion-exclusion principle, but personally I found this proof easier to understand.

#### Reference Video

::youtube[oG5z08Hj1NE]
