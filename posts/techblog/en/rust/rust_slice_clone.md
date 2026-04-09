---
uuid: 8ec82480-1a64-410f-b734-a2c82a51ba16
title: Fast Cloning of Partial Slices in Rust
description: "When you want to copy an array in Rust, what is actually the fastest approach? The short answer is: just use `clone_from_slice`."
lang: en
category: techblog
tags:
  - rust
  - code-reading
created_at: "2022-06-04T11:51:17+00:00"
updated_at: "2022-06-04T11:51:17+00:00"
---

## TL;DR

When you want to copy an array in Rust, what is actually the fastest approach?
The short answer is: just use `clone_from_slice`.

## Reading the Implementation of `clone_from_slice`

### `clone_from_slice`

The implementation is shown below. It simply delegates to `spec_clone_from`.

```rust
pub fn clone_from_slice(&mut self, src: &[T])
where
    T: Clone,
{
    self.spec_clone_from(src);
}
```

### `spec_clone_from`

So what exactly is `spec_clone_from`? It is a function that performs something like overloading based on `T`. This kind of overloading-like behavior can be achieved using traits ([reference](https://qiita.com/muumu/items/11e736612939a53699e9)).

When `T: Clone`, it simply calls `clone` on each element. When `T: Copy`, it calls `copy_from_slice` instead.

[source](https://doc.rust-lang.org/src/core/slice/mod.rs.html#3996-4026)

```rust
trait CloneFromSpec<T> {
    fn spec_clone_from(&mut self, src: &[T]);
}

impl<T> CloneFromSpec<T> for [T]
where
    T: Clone,
{
    #[track_caller]
    default fn spec_clone_from(&mut self, src: &[T]) {
        assert!(
            self.len() == src.len(),
            "destination and source slices have different lengths"
        );
        // NOTE: We need to explicitly slice them to the same length
        // to make it easier for the optimizer to elide bounds checking.
        // But since it can't be relied on we also have an explicit specialization for T: Copy.
        let len = self.len();
        let src = &src[..len];
        for i in 0..len {
            self[i].clone_from(&src[i]);
        }
    }
}

impl<T> CloneFromSpec<T> for [T]
where
    T: Copy,
{
    #[track_caller]
    fn spec_clone_from(&mut self, src: &[T]) {
        self.copy_from_slice(src);
    }
}
```

### `copy_from_slice`

This calls `ptr::copy_nonoverlapping`. The necessary safety checks are also performed. Since `ptr::copy_nonoverlapping` is essentially `memcpy`, the `Copy` trait is required.

[source](https://doc.rust-lang.org/src/core/slice/mod.rs.html#3199-3225)

```rust
pub fn copy_from_slice(&mut self, src: &[T])
where
    T: Copy,
{
    // The panic code path was put into a cold function to not bloat the
    // call site.
    #[inline(never)]
    #[cold]
    #[track_caller]
    fn len_mismatch_fail(dst_len: usize, src_len: usize) -> ! {
        panic!(
            "source slice length ({}) does not match destination slice length ({})",
            src_len, dst_len,
        );
    }

    if self.len() != src.len() {
        len_mismatch_fail(self.len(), src.len());
    }

    // SAFETY: `self` is valid for `self.len()` elements by definition, and `src` was
    // checked to have the same length. The slices cannot overlap because
    // mutable references are exclusive.
    unsafe {
        ptr::copy_nonoverlapping(src.as_ptr(), self.as_mut_ptr(), self.len());
    }
}
```

## Conclusion

So, calling `clone_from_slice` will handle everything appropriately for you.
If you want to be explicit, you could use `ptr::copy_nonoverlapping` directly, but since it is best to avoid `unsafe` when possible, calling `copy_from_slice` is the recommended approach.
