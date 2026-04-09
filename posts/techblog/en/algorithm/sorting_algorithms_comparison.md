---
uuid: e8a7e7dc-b6c4-4d22-a62e-7c58d529b619
title: "Comparing Standard Sorting Algorithms in Python, JavaScript, Rust, Go, and R"
description: "A comparison of sorting algorithms used in the standard libraries of 5 major programming languages. Covers recent major updates including Timsort, Powersort, driftsort, and pdqsort."
category: algorithm
lang: en
tags:
  - ai-generated
  - algorithm
  - sort
  - python
  - javascript
  - rust
  - go
  - r
created_at: 2026-03-21
updated_at: 2026-03-21
---

## TL;DR

Here is a summary of the standard sorting algorithms in 5 major languages:

| Language        | Stable sort                      | Unstable sort | Base algorithm                        | Introduced in    |
| --------------- | -------------------------------- | ------------- | ------------------------------------- | ---------------- |
| Python          | Timsort (Powersort merge policy) | -             | Merge Sort + Insertion Sort           | 3.11 (2022)      |
| JavaScript (V8) | Timsort                          | -             | Merge Sort + Insertion Sort           | Chrome 70 (2018) |
| Rust            | driftsort                        | ipnsort       | Merge Sort-based / Quicksort-based    | 1.81 (2024)      |
| Go              | -                                | pdqsort       | Quicksort + Heapsort + Insertion Sort | 1.19 (2022)      |
| R               | Radix Sort / Shell Sort          | -             | Auto-selected based on type           | R 3.x            |

A common trend in recent years is the rise of adaptive sorting that leverages existing order (pre-sorted runs) and hybrid strategies that combine multiple algorithms.

## Background

Sorting is one of the most fundamental algorithms in computer science. Yet surprisingly few people know exactly what their language's `sort()` does internally.

In fact, between 2022 and 2024, several major languages underwent significant updates to their standard sorting algorithms:

- Python 3.11 (2022): Timsort's merge policy was replaced with Powersort
- Go 1.19 (2022): Switched from introsort-based to pdqsort
- Rust 1.81 (2024): Stable sort replaced with driftsort, unstable sort with ipnsort

This article compares the sorting algorithms adopted in the standard libraries of 5 languages: Python, JavaScript, Rust, Go, and R, examining their mechanisms and design philosophies.

## Python -- Timsort + Powersort Merge Policy

### Timsort Basics

Python's `list.sort()` and `sorted()` use [Timsort](https://en.wikipedia.org/wiki/Timsort). Timsort was designed by Tim Peters in 2002 specifically for Python. It is a hybrid stable sort combining Merge Sort and Insertion Sort.

The basic operation of Timsort is as follows:

1. Scan the array to find already-sorted subsequences (runs). If a run is in descending order, reverse it to ascending
2. If a run is shorter than the minimum run length (typically 32-64), extend it using Insertion Sort
3. Push detected runs onto a stack and merge them based on certain conditions

Timsort's strength lies in its excellent performance on "partially sorted sequences," which are common in real-world data. It runs in $O(n)$ on already-sorted input and $O(n \log n)$ in the worst case.

### Powersort Merge Policy in Python 3.11

In Python 3.11 (2022), Timsort's merge policy was replaced with [Powersort](https://www.wild-inter.net/posts/powersort-in-python-3.11) by J. Ian Munro and Sebastian Wild.

Timsort's original merge policy had two known issues:

1. A potential stack overflow discovered through formal verification, affecting both CPython and Java
2. The merge order of runs was determined heuristically, leading to unnecessary overhead in some cases

Powersort assigns an integer value called "power" to each pair of adjacent runs, and when a new run is added, merges with higher power are executed first. This approach achieves provably near-optimal approximation with respect to the entropy of the run-length distribution.

Performance improvements of up to 30% have been reported for specific input patterns. However, for general use cases, the difference from Timsort is barely noticeable.

```python
# Python's sort is a stable sort
data = [(3, "a"), (1, "b"), (3, "c"), (1, "d")]
data.sort(key=lambda x: x[0])
# [(1, 'b'), (1, 'd'), (3, 'a'), (3, 'c')]
# Elements with the same key preserve their original order
```

## JavaScript -- Engine-Dependent Sort Implementations

JavaScript's sorting algorithm is not specified in the ECMAScript specification, and each engine adopts a different implementation. Since ES2019, stable sorting has been required by the specification.

### V8 (Chrome / Node.js) -- Timsort

The V8 engine [switched from QuickSort to Timsort](https://v8.dev/blog/array-sort) in Chrome 70 (2018).

Key characteristics of V8's Timsort implementation:

- Uses Insertion Sort for arrays of 22 elements or fewer
- Applies Timsort for larger arrays
- The implementation is written in V8's proprietary Torque language

### SpiderMonkey (Firefox) -- Merge Sort

Mozilla's [SpiderMonkey](https://bugzilla.mozilla.org/show_bug.cgi?id=224128) engine uses Merge Sort. It previously used QuickSort but switched to Merge Sort for stability. Adoption of TimSort was considered but rejected due to license incompatibility (GPL v2 vs. MPL 2).

### JavaScriptCore (Safari) -- Timsort Variant

Apple's JavaScriptCore engine also uses a variant of Timsort.

```javascript
// Since ES2019, Array.prototype.sort() is guaranteed to be a stable sort by spec
const data = [
	{ name: "Alice", age: 30 },
	{ name: "Bob", age: 25 },
	{ name: "Charlie", age: 30 },
];
data.sort((a, b) => a.age - b.age);
// Alice(30) is guaranteed to come before Charlie(30)
```

### Comparison Across Engines

| Engine         | Browser               | Algorithm       |
| -------------- | --------------------- | --------------- |
| V8             | Chrome, Edge, Node.js | Timsort         |
| SpiderMonkey   | Firefox               | Merge Sort      |
| JavaScriptCore | Safari                | Timsort variant |

## Rust -- driftsort (stable) / ipnsort (unstable)

Rust overhauled both its stable and unstable sorts in [Rust 1.81](https://releases.rs/docs/1.81.0/) (August 2024). This was the largest update to sorting algorithms in Rust's standard library.

### Previous Implementation

Before Rust 1.81, the following algorithms were used:

- `slice::sort()`: Modified Timsort (stable sort)
- `slice::sort_unstable()`: pdqsort (unstable sort)

### driftsort -- The New Stable Sort

[driftsort](https://github.com/Voultapher/driftsort) is a stable sort designed by Orson Peters and Lukas Bergdoll, derived from glidesort.

Key features of driftsort:

- Switches between two small-sort implementations at compile time based on type characteristics
- Ancestor pivot tracking enables detection and handling of common elements, achieving $O(n \log K)$ comparisons when there are only $K$ distinct element values
- Leverages ILP (Instruction-Level Parallelism) instead of SIMD for architecture-independent performance optimization

In terms of performance, over 2x speedup on random input compared to the old implementation and up to 17x speedup on low-cardinality patterns (such as `random_d20`) have been reported.

### ipnsort -- The New Unstable Sort

[ipnsort](https://github.com/Voultapher/sort-research-rs/blob/main/writeup/ipnsort_introduction/text.md) is an unstable sort designed starting from pdqsort.

- `no_std` compatible (no `alloc` crate required)
- Guarantees $O(n \log n)$ comparisons in the worst case
- $O(n)$ for already-sorted ascending or descending input

It achieves 2.4x speedup on random input compared to the old pdqsort.

```rust
// Stable sort (driftsort)
let mut v = vec![3, 1, 4, 1, 5, 9, 2, 6];
v.sort();

// Unstable sort (ipnsort) -- faster when stability is not needed
v.sort_unstable();
```

### Design Considerations

The new sort implementations in Rust 1.81 may panic if the comparison function does not satisfy total ordering. The old implementation would silently return incorrect results, but the new implementation is designed to detect inconsistencies.

## Go -- pdqsort

In Go 1.19 (August 2022), the `sort` package's internal algorithm was [switched to pdqsort](https://github.com/golang/go/issues/50154) (Pattern-Defeating Quicksort). This proposal came from ByteDance's programming language team.

### How pdqsort Works

[pdqsort](https://github.com/orlp/pdqsort) is an algorithm designed by Orson Peters that extends and improves David Musser's introsort. It dynamically switches between QuickSort, HeapSort, and Insertion Sort depending on the situation.

The basic operation is as follows:

1. Use Quicksort as the base, selecting a pivot and performing partition
2. If no swaps occurred after partitioning, try Insertion Sort (detecting already-sorted sequences)
3. If the smaller partition is less than 1/8 of the total, consider it a skewed partition
4. If skewed partitions persist, fall back to HeapSort to guarantee $O(n \log n)$

This achieves the following complexities:

- Sorted, reverse-sorted, or all-identical input: $O(n)$
- Average: $O(n \log n)$
- Worst case: $O(n \log n)$ (guaranteed by HeapSort fallback)

### Go-Specific Modifications

The Go version disables BlockQuicksort optimizations because BlockQuicksort doesn't perform well in Go's runtime environment.

### Regarding Stable Sort

Go's `sort.Sort()` and `slices.Sort()` are unstable sorts. If a stable sort is needed, use `sort.Stable()` or `slices.SortStableFunc()`.

```go
import "slices"

// Unstable sort (pdqsort)
s := []int{3, 1, 4, 1, 5, 9, 2, 6}
slices.Sort(s)

// When stable sort is needed
slices.SortStableFunc(s, func(a, b int) int {
    return a - b
})
```

### Future Developments

A [proposal](https://github.com/golang/go/issues/61027) to replace pdqsort with Dual-Pivot Quicksort in Go's standard library has also been made.

## R -- Radix Sort / Shell Sort

R's [`sort()`](https://stat.ethz.ch/R-manual/R-patched/library/base/html/sort.html) is notable for allowing explicit selection of multiple sorting algorithms via the `method` argument.

### method = "auto" (Default)

The default `"auto"` automatically selects the algorithm based on the data type:

- Radix Sort is chosen for numeric, integer, logical, and factor types
- Shell Sort is chosen for character types and others

### Radix Sort

R's Radix Sort implementation originates from Matt Dowle and Arun Srinivasan's [data.table package](https://github.com/Rdatatable/data.table).

- Complexity is $O(n)$ (hash-based, not comparison-based)
- Stable sort
- Falls back to Insertion Sort for small inputs under 200 elements
- Orders of magnitude faster than Shell Sort for character vectors
- Limitation: does not support elements exceeding $2^{31}$ (long vectors) or complex types

### Shell Sort

Shell Sort is the most versatile option, supporting all data types. The implementation is based on Sedgewick's (1986) gap sequence.

- Worst-case complexity is $O(n^{4/3})$ (depends on the gap sequence used)
- Unstable sort

### Quick Sort

Selectable via `method = "quick"`, but only supports numeric types. Faster than Shell Sort (about 1.5x for 1 million elements, about 2x for 1 billion elements), but has poor worst-case performance.

```r
# Default (auto): Radix Sort is chosen since input is numeric
x <- c(3, 1, 4, 1, 5, 9, 2, 6)
sort(x)

# Explicitly specify the algorithm
sort(x, method = "shell")
sort(x, method = "quick")
sort(x, method = "radix")
```

## Comparison Summary

### Algorithm Characteristics Comparison

| Language        | Algorithm           | Stability | Best          | Average       | Worst         | Introduced       |
| --------------- | ------------------- | --------- | ------------- | ------------- | ------------- | ---------------- |
| Python          | Timsort + Powersort | Stable    | $O(n)$        | $O(n \log n)$ | $O(n \log n)$ | 3.11 (2022)      |
| JS (V8)         | Timsort             | Stable    | $O(n)$        | $O(n \log n)$ | $O(n \log n)$ | Chrome 70 (2018) |
| Rust (stable)   | driftsort           | Stable    | $O(n)$        | $O(n \log n)$ | $O(n \log n)$ | 1.81 (2024)      |
| Rust (unstable) | ipnsort             | Unstable  | $O(n)$        | $O(n \log n)$ | $O(n \log n)$ | 1.81 (2024)      |
| Go              | pdqsort             | Unstable  | $O(n)$        | $O(n \log n)$ | $O(n \log n)$ | 1.19 (2022)      |
| R (numeric)     | Radix Sort          | Stable    | $O(n)$        | $O(n)$        | $O(n)$        | R 3.x            |
| R (general)     | Shell Sort          | Unstable  | $O(n \log n)$ | $O(n^{4/3})$  | $O(n^{4/3})$  | R 1.x            |

### Common Trends

Two common trends have emerged in sorting algorithm updates since 2022.

The first is adaptive sorting. All languages have adopted algorithms that leverage existing order in the input data. Many operate in $O(n)$ on already-sorted input, and since real-world data is often partially sorted, this property has significant practical value.

The second is hybrid strategies. Rather than a single sorting algorithm, the standard approach is to dynamically switch between multiple algorithms based on element count and data characteristics. A typical combination uses Insertion Sort for small arrays, Merge Sort or Quicksort variants for large arrays, and HeapSort as a worst-case fallback.

## Conclusion

Although sorting algorithm research is often considered a mature field, the implementations in major languages were successively overhauled in the short period from 2022 to 2024. In particular, Rust's driftsort/ipnsort achieved dramatic performance improvements of up to 17x, demonstrating that there is still room for improvement.

While we rarely think about it in daily work, understanding the characteristics of your language's sort implementation can be helpful for performance tuning and algorithm selection decisions.

## References

- [Timsort - Wikipedia](https://en.wikipedia.org/wiki/Timsort)
- [Powersort in official Python 3.11 release](https://www.wild-inter.net/posts/powersort-in-python-3.11)
- [Getting things sorted in V8](https://v8.dev/blog/array-sort)
- [driftsort introduction](https://github.com/Voultapher/sort-research-rs/blob/main/writeup/driftsort_introduction/text.md)
- [ipnsort introduction](https://github.com/Voultapher/sort-research-rs/blob/main/writeup/ipnsort_introduction/text.md)
- [Go: sort: use pdqsort (Issue #50154)](https://github.com/golang/go/issues/50154)
- [R sort documentation](https://stat.ethz.ch/R-manual/R-patched/library/base/html/sort.html)
- [pdqsort by Orson Peters](https://github.com/orlp/pdqsort)
