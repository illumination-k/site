---
uuid: baf93694-7e66-45bf-83a1-1e77e56c9228
title: Competitive Programming Notes
description: Personal notes on competitive programming
lang: en
category: techblog
tags:
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## Complexity Guidelines

| order                    | Common constraints | Common algorithms                  |
| ------------------------ | ------------------ | ---------------------------------- |
| $O(N)$                   | $10^9$             | Exhaustive search                  |
| $O(NlogN), O(N(logN)^2)$ | $10^5$             | Binary search, sorting             |
| $O(N^2)$                 | $3000$             | Exhaustive search                  |
| $O(N^2logN)$             | $1000$             | Meet in the middle + binary search |
| $O(N^4)$                 | $50$               | Exhaustive search                  |
| $O(2^{N/2})$             | $40$               | Meet in the middle                 |
| $O(2^N)$                 | $20$               | Bit exhaustive search, bit DP      |
| $O(N!)$                  | $8$                | Permutations, combinations         |

## Array Size Limits

Approximately $10^9$ is the limit. $9 \times 10^8$ does not cause an error (in Rust). If the size is too large, consider coordinate compression.

## Set Operation Complexity

| Operation | Average complexity      |
| --------- | ----------------------- |
| s \| l    | $O(len(s) + len(l))$    |
| s & l     | $O(min(len(s), len(l))$ |
| s - l     | $O(len(s))$             |

## Harmonic Series Complexity

$$
\sum_{k=1}^n 1/k = O(log(n))
$$

This complexity appears when incrementing multiples for primality testing, among other cases.

- ABC170-D
- ABC172-D
- ABC177-E

The complexity of enumerating all pairs where $A \times B \le K$ is $O(KlogK)$.

```rust
for a in 1..=k {
    for b in 1..=k/a {
        println!("{} {}", a, b)
    }
}
```

## floor mod

$$
\lfloor\frac{10^N}{M}\rfloor \equiv \lfloor\frac{10^N}{M}\rfloor - kM \equiv \lfloor{\frac{10^N}{M}} - kM\rfloor \equiv \lfloor\frac{10^N - kM^2}{M}\rfloor (mod M)
$$

Therefore, we can subtract using an arbitrary integer k from $10^N$. This is equal to $10^N \% M^2$.
So,

```python
ans = pow(10, n, m ** 2) // m % m
```

can compute the result in $O(log(N))$.

- ARC111-A

## Tree Conditions

When the number of vertices is $N$, the number of edges is $N-1$.

## Floating Point Errors

```python
>>> 0.07 * 100
7.000000000000001
>>> 0.29 * 100
28.999999999999996
```

This kind of thing can happen, so add 0.5 for rounding.

## Bit Operations

Bit operations (`&`, `|`, `!`, `^`) often become clearer when considered digit by digit.

### Determining Whether the x-th Digit is 0 or 1

```python
>>> a = 10
>>> print(bin(a))
0b1010
>>> x = 2 - 1 # Check the 2nd digit
>>> right_shifted_a = a >> x # Bring the (x+1)-th digit to the 1st bit position
>>> print(bin(right_shifted_a))
0b101
>>> print(right_shifted_a & 1) # 1 means the x-th digit is 1, otherwise it's 0
1
```

## Expected Value

The expected number of trials (including the final successful one) until success, when each trial succeeds with probability $p(p\neq0)$, is $1/p$.

### Coupon Collector's Problem

- [Expected Number of Draws for Complete Gacha](https://mathtrain.jp/completegacha)

## Conditions for Valid Parentheses

```
()(())
(())()
()()()
((()))
```

These are examples of valid parentheses. The condition is: scanning from left to right, if we let `left` be the count of '(' and `right` be the count of ')', then $left >= right$ must always hold, and ultimately $left == right$.

```python
s = "()(())"

def is_correct_bracket(s: str) -> bool:
    left = 0
    right = 0
    for c in s:
        if c == '(':
            left += 1
        else:
            right += 1

        if not (left >= right):
            return False
    return left == right
```

## Miscellaneous Tips

- When there are 3 points, fix the middle one.
- When the answer is small, think from the answer's perspective.
- When `x + y && x - y` appears, consider a 45-degree rotation.
- `|x| = max(x, -x)`
- When numbers are large, take the modulus.
- For `gcd(m, 10)`, for example `"123"` can be expressed as `1*10**2 % m + 2*10**1 % m + 3*10**0 % m`.
- If there is periodicity, consider modular arithmetic. If there is a modulus, consider periodicity.
- A linear Diophantine equation $ax + by = c$ can be solved using the extended Euclidean algorithm.
- When considering the modulus of large numbers, try expressing the n-th digit as $10^n$ (when $gcd(10, mod) == 1$).
- Digit DP can often be used when counting numbers with certain properties that are at most N.
- For lexicographically smallest, use a greedy approach from the front!
- In counting problems, reversing the counting order sometimes works well.
