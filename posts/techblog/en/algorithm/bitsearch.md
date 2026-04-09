---
uuid: e0b5ed90-0b5e-406b-9b13-d7bb0185a74f
title: Understanding Bit Exhaustive Search
description: I found it difficult to understand what bit exhaustive search actually does, so I summarized what's going on
lang: en
category: techblog
tags:
  - algorithm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Bit exhaustive search is an important algorithm for exhaustive enumeration. By using bit exhaustive search, you can enumerate all subsets of a given set.

However, I found it difficult to intuitively understand what the actual code is doing, so I summarized it in a way that makes sense to me.

## Bit Exhaustive Search Algorithm

The bit operations used in bit exhaustive search are as follows. `0b` indicates binary notation.

| Operation      | Operator | Description                              | Example                    |
| -------------- | -------- | ---------------------------------------- | -------------------------- |
| Bitwise AND    | `&`      | Only positions where both are 1 become 1 | `0b0101 & 0b0011 = 0b0001` |
| Bit left shift | `<<`     | Multiply by 2                            | `0b01011 << 1 = 0b10110`   |

1. Left-shift a bit n times (2^n) and loop that many times
2. Inside the loop, iterate n times (for each subset element)
3. The values at positions where the bit matches form the subset for that iteration

When we organize the values at matching bit positions, we store each `i` where `(bit & (1 << i))` is not 0 into a sequence, resulting in the following (0b denotes binary notation).

When written out, the subsets are neatly enumerated. In other words, `(bit & (1 << i))` returns a non-zero value at positions where the bits match.

| bit | bit(0b) | i=0(0b) | bit&i | i=1(0b) | bit&i(0b) | i=2(0b) | bit&2 | array   |
| --- | ------- | ------- | ----- | ------- | --------- | ------- | ----- | ------- |
| 0   | 0000    | 0001    | 0     | 0010    | 0         | 0100    | 0     | ()      |
| 1   | 0001    | 0001    | 1     | 0010    | 0         | 0100    | 0     | (0)     |
| 2   | 0010    | 0001    | 0     | 0010    | 2         | 0100    | 0     | (1)     |
| 3   | 0011    | 0001    | 1     | 0010    | 2         | 0100    | 0     | (0,1)   |
| 4   | 0100    | 0001    | 0     | 0010    | 0         | 0100    | 4     | (2)     |
| 5   | 0101    | 0001    | 1     | 0010    | 0         | 0100    | 4     | (0,2)   |
| 6   | 0110    | 0001    | 0     | 0010    | 2         | 0100    | 4     | (1,2)   |
| 7   | 0111    | 0001    | 1     | 0010    | 2         | 0100    | 4     | (0,1,2) |

## Implementation

### nim

```nim
import sequtils

let n = 3

# Enumerate all subsets of {0, 1, ..., n-1}
for bit in 0..<(1 shl n):
  var vec = newSeq[int]()
    for i in 0..<n:
      if (bit and (1 shl i)) != 0:
        vec.add(i)
  echo bit, " : ", vec
```
