---
uuid: 8ec82480-1a64-410f-b734-a2c82a51ba16
title: Rustで高速にsliceの一部をCloneする
description: "Rustで配列をコピーしたいとき、実際問題何をするのが早いのかという話です。結論だけ書いておくと、`clone_from_slice`を使えばいいはずです。"
lang: ja
category: techblog
tags:
  - rust
  - code-reading
updated_at: "2022-06-04T11:51:17+00:00"
---

## TL;DR

Rustで配列をコピーしたいとき、実際問題何をするのが早いのかという話です。
結論だけ書いておくと、`clone_from_slice`を使えばいいはずです。

## `clone_from_slice`の実装を読む

### `clone_from_slice`

実装は以下です。`spec_clone_from`を読んでいるだけです。

```rust
pub fn clone_from_slice(&mut self, src: &[T])
where
    T: Clone,
{
    self.spec_clone_from(src);
}
```

### `spec_clone_from`

`spec_clone_from`が何者なのかという話ですが、`T`のオーバロード的なことをしている関数です。オーバロードっぽいことは`trait`を使うことで実現できます([参考](https://qiita.com/muumu/items/11e736612939a53699e9))。

`T: Clone`の場合は普通に`clone`して、`T: Copy`の場合は`copy_from_slice`を呼びます。

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

`ptr::copy_nonoverlapping`を呼びます。そのためのsafetyの確認も行われています。`ptr::copy_nonoverlapping`はだいたい`memcpy`なので、`Copy` traitが必要です。

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

## 結論

ということで、`clone_from_slice`を呼べばよしなにやってくれるらしいです。
明示的にやりたい場合は、`ptr::copy_nonoverlapping`でもいいですが、`unsafe`は可能なら呼びたくないので、`copy_from_slice`を呼ぶのがいいと思います。
