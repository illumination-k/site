---
uuid: e8a7e7dc-b6c4-4d22-a62e-7c58d529b619
title: "Python・JavaScript・Rust・Go・Rの標準ソートアルゴリズム比較"
description: "主要プログラミング言語5つの標準ライブラリで採用されているソートアルゴリズムを比較。Timsort、Powersort、driftsort、pdqsortなど、近年の大きなアップデートも含めて解説します。"
category: algorithm
lang: ja
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

主要5言語の標準ソートアルゴリズムをまとめると以下のようになります。

| 言語            | 安定ソート                        | 不安定ソート | ベースアルゴリズム                    | 導入バージョン   |
| --------------- | --------------------------------- | ------------ | ------------------------------------- | ---------------- |
| Python          | Timsort (Powersortマージポリシー) | -            | Merge Sort + Insertion Sort           | 3.11 (2022)      |
| JavaScript (V8) | Timsort                           | -            | Merge Sort + Insertion Sort           | Chrome 70 (2018) |
| Rust            | driftsort                         | ipnsort      | Merge Sort系 / Quicksort系            | 1.81 (2024)      |
| Go              | -                                 | pdqsort      | Quicksort + Heapsort + Insertion Sort | 1.19 (2022)      |
| R               | Radix Sort / Shell Sort           | -            | 型に応じて自動選択                    | R 3.x            |

近年の共通トレンドとして、既存の秩序（プリソート列）を活用する適応型ソートと、複数アルゴリズムを組み合わせるハイブリッド戦略が主流になっています。

## 背景

ソートは計算機科学で最も基礎的なアルゴリズムの1つです。しかし、「自分が使っている言語の`sort()`が内部で何をしているか」を正確に把握している人も意外と少ないのではないでしょうか。

実は2022年から2024年にかけて、複数の主要言語で標準ソートアルゴリズムの大規模なアップデートが行われました。

- Python 3.11 (2022): TimsortのマージポリシーがPowersortに置き換わった
- Go 1.19 (2022): イントロソート系からpdqsortに切り替わった
- Rust 1.81 (2024): 安定ソートがdriftsort、不安定ソートがipnsortに刷新された

本記事では、Python・JavaScript・Rust・Go・Rの5言語について、標準ライブラリで採用されているソートアルゴリズムの仕組みと設計思想を比較します。

## Python — Timsort + Powersortマージポリシー

### Timsortの基本

Pythonの`list.sort()`および`sorted()`は、[Timsort](https://en.wikipedia.org/wiki/Timsort)を使用しています。TimsortはTim Petersによって2002年にPython向けに設計されたアルゴリズムで、Merge SortとInsertion Sortを組み合わせたハイブリッドな安定ソートです。

Timsortの基本的な動作は以下の通りです。

1. 配列を走査し、既にソートされている部分列（run）を見つける。降順の場合は反転して昇順にする
2. runが最小run長（通常32〜64）より短い場合、Insertion Sortで拡張する
3. 検出したrunをスタックに積み、条件に基づいてマージしていく

Timsortの強みは、実世界のデータに多く見られる「部分的にソートされた列」に対して非常に高速に動作する点にあります。ソート済みの入力に対しては$O(n)$、最悪でも$O(n \log n)$で動作します。

### Python 3.11でのPowersortマージポリシー導入

Python 3.11（2022年）で、TimsortのマージポリシーがJ. Ian MunroとSebastian Wildによる[Powersort](https://www.wild-inter.net/posts/powersort-in-python-3.11)に置き換えられました。

Timsortのオリジナルのマージポリシーには2つの問題が知られていました。

1. 形式検証によって発見されたスタックオーバーフローの可能性。CPythonとJava両方に影響していました
2. runのマージ順序がヒューリスティックに決められており、不要なオーバーヘッドが生じるケースがありました

Powersortは、隣接するrunのペアに「power」と呼ばれる整数値を割り当て、新しいrunが追加される際により高いpowerを持つマージを先に実行します。この方式により、run長の分布のエントロピーに対して証明可能な近似最適性を達成しています。

特定の入力パターンでは最大30%の性能向上が報告されています。ただし、一般的な用途ではTimsortとの差はほとんど感じられないでしょう。

```python
# Python の sort は安定ソート
data = [(3, "a"), (1, "b"), (3, "c"), (1, "d")]
data.sort(key=lambda x: x[0])
# [(1, 'b'), (1, 'd'), (3, 'a'), (3, 'c')]
# 同じキーの要素は元の順序が保持される
```

## JavaScript — エンジン依存のソート実装

JavaScriptのソートアルゴリズムはECMAScript仕様では具体的なアルゴリズムを規定しておらず、エンジンごとに異なる実装を採用しています。ES2019からは安定ソートであることが仕様上要求されるようになりました。

### V8（Chrome / Node.js）— Timsort

V8エンジンはChrome 70（2018年）で、それまで使っていたQuickSortから[Timsortに切り替えました](https://v8.dev/blog/array-sort)。

V8のTimsort実装の特徴は以下の通りです。

- 22要素以下の配列にはInsertion Sortを使用
- それ以上の配列にはTimsortを適用
- 実装はV8独自のTorque言語で記述されている

### SpiderMonkey（Firefox）— Merge Sort

Mozillaの[SpiderMonkey](https://bugzilla.mozilla.org/show_bug.cgi?id=224128)エンジンはMerge Sortを採用しています。以前はQuickSortを使用していましたが、安定性の観点からMerge Sortに切り替えられました。TimSortの導入も検討されましたが、ライセンスの互換性の問題（GPL v2とMPL 2の非互換）から見送られています。

### JavaScriptCore（Safari）— Timsort変種

AppleのJavaScriptCoreエンジンもTimsortの変種を採用しています。

```javascript
// ES2019以降、Array.prototype.sort() は安定ソートが仕様上保証される
const data = [
	{ name: "Alice", age: 30 },
	{ name: "Bob", age: 25 },
	{ name: "Charlie", age: 30 },
];
data.sort((a, b) => a.age - b.age);
// Alice(30) は Charlie(30) より前に来ることが保証される
```

### エンジン間の比較

| エンジン       | ブラウザ              | アルゴリズム |
| -------------- | --------------------- | ------------ |
| V8             | Chrome, Edge, Node.js | Timsort      |
| SpiderMonkey   | Firefox               | Merge Sort   |
| JavaScriptCore | Safari                | Timsort変種  |

## Rust — driftsort（安定）/ ipnsort（不安定）

Rustは[Rust 1.81](https://releases.rs/docs/1.81.0/)（2024年8月）で、安定ソートと不安定ソートの両方を刷新しました。Rustの標準ライブラリにおけるソートアルゴリズムの最大のアップデートです。

### 以前の実装

Rust 1.81以前は以下のアルゴリズムを使用していました。

- `slice::sort()`: 修正版Timsort（安定ソート）
- `slice::sort_unstable()`: pdqsort（不安定ソート）

### driftsort — 新しい安定ソート

[driftsort](https://github.com/Voultapher/driftsort)はOrson PetersとLukas Bergdollによって設計された安定ソートで、glidesortから派生しています。

driftsortの主な特徴は以下の通りです。

- 型の特性に基づいて、2種類の小ソート実装をコンパイル時に切り替える
- 祖先ピボット追跡により共通要素の検出と処理が可能で、$K$種類の異なる要素しかない場合に$O(n \log K)$の比較回数を達成する
- SIMDではなくILP（命令レベル並列性）を活用することで、アーキテクチャ非依存の高速化を実現している

性能面では、ランダム入力で旧実装比2倍以上、低カーディナリティパターン（`random_d20`など）では最大17倍の高速化が報告されています。

### ipnsort — 新しい不安定ソート

[ipnsort](https://github.com/Voultapher/sort-research-rs/blob/main/writeup/ipnsort_introduction/text.md)はpdqsortを出発点として設計された不安定ソートです。

- `no_std`対応（`alloc`クレートも不要）
- 最悪でも$O(n \log n)$の比較回数を保証
- 昇順・降順にソート済みの入力に対して$O(n)$

ランダム入力で旧pdqsort比2.4倍の高速化を達成しています。

```rust
// 安定ソート（driftsort）
let mut v = vec![3, 1, 4, 1, 5, 9, 2, 6];
v.sort();

// 不安定ソート（ipnsort） — 安定性不要なら高速
v.sort_unstable();
```

### 設計上の注意点

Rust 1.81の新しいソート実装は、比較関数が全順序を満たさない場合にパニックする可能性があります。旧実装では黙って不正な結果を返していましたが、新実装では不整合を検出するように設計されています。

## Go — pdqsort

Go 1.19（2022年8月）で、`sort`パッケージの内部アルゴリズムが[pdqsort](https://github.com/golang/go/issues/50154)（Pattern-Defeating Quicksort）に切り替わりました。この提案はByteDanceのプログラミング言語チームによるものです。

### pdqsortの仕組み

[pdqsort](https://github.com/orlp/pdqsort)はOrson Petersが設計したアルゴリズムで、David Musserのイントロソートを拡張・改良したものです。QuickSort・HeapSort・Insertion Sortを状況に応じて動的に切り替えます。

基本的な動作は以下の通りです。

1. Quicksortをベースにピボットを選んでパーティション分割する
2. パーティション後にスワップが発生しなかった場合、Insertion Sortを試行する（既ソート列の検出）
3. 小さい側のパーティションが全体の1/8未満の場合、偏ったパーティションとみなす
4. 偏ったパーティションが続く場合、HeapSortにフォールバックして$O(n \log n)$を保証する

これにより以下の計算量を実現しています。

- ソート済み・逆順・全要素同一の入力: $O(n)$
- 平均: $O(n \log n)$
- 最悪: $O(n \log n)$（HeapSortへのフォールバックによる保証）

### Go固有の変更点

Go版ではBlockQuicksortの最適化が無効化されています。これはGoの実行環境ではBlockQuicksortの性能が出にくいためです。

### 安定ソートについて

Goの`sort.Sort()`や`slices.Sort()`は不安定ソートです。安定ソートが必要な場合は`sort.Stable()`や`slices.SortStableFunc()`を使用してください。

```go
import "slices"

// 不安定ソート（pdqsort）
s := []int{3, 1, 4, 1, 5, 9, 2, 6}
slices.Sort(s)

// 安定ソートが必要な場合
slices.SortStableFunc(s, func(a, b int) int {
    return a - b
})
```

### 今後の動向

Go標準ライブラリでは、pdqsortからDual-Pivot Quicksortへの置き換えも[提案](https://github.com/golang/go/issues/61027)されています。

## R — Radix Sort / Shell Sort

Rの[`sort()`](https://stat.ethz.ch/R-manual/R-patched/library/base/html/sort.html)は`method`引数で複数のソートアルゴリズムを明示的に選択できる点が特徴的です。

### method = "auto"（デフォルト）

デフォルトの`"auto"`では、データ型に応じてアルゴリズムが自動選択されます。

- 数値型・整数型・論理型・ファクタ型にはRadix Sortが選ばれる
- 文字型・その他にはShell Sortが選ばれる

### Radix Sort

RのRadix Sort実装は[data.tableパッケージ](https://github.com/Rdatatable/data.table)のMatt DowleとArun Srinivasanに由来します。

- 計算量は$O(n)$（比較ベースではなくハッシュベース）
- 安定ソート
- 200要素未満の小さい入力ではInsertion Sortにフォールバック
- 文字型ベクトルではShell Sortより桁違いに高速
- 制約として、$2^{31}$以上の要素数（long vector）や複素数型には非対応

### Shell Sort

Shell Sortは最も汎用的な選択肢であり、すべてのデータ型に対応しています。Sedgewick (1986)のギャップ列に基づく実装です。

- 計算量は最悪$O(n^{4/3})$（使用するギャップ列に依存）
- 不安定ソート

### Quick Sort

`method = "quick"`で選択可能ですが、数値型にのみ対応します。Shell Sortより高速ですが（100万要素で約1.5倍、10億要素で約2倍）、最悪ケースの性能が悪いという欠点があります。

```r
# デフォルト（auto）: 数値なので Radix Sort が選ばれる
x <- c(3, 1, 4, 1, 5, 9, 2, 6)
sort(x)

# 明示的にアルゴリズムを指定
sort(x, method = "shell")
sort(x, method = "quick")
sort(x, method = "radix")
```

## 比較まとめ

### アルゴリズム特性の比較

| 言語            | アルゴリズム        | 安定性 | 最良          | 平均          | 最悪          | 導入             |
| --------------- | ------------------- | ------ | ------------- | ------------- | ------------- | ---------------- |
| Python          | Timsort + Powersort | 安定   | $O(n)$        | $O(n \log n)$ | $O(n \log n)$ | 3.11 (2022)      |
| JS (V8)         | Timsort             | 安定   | $O(n)$        | $O(n \log n)$ | $O(n \log n)$ | Chrome 70 (2018) |
| Rust (stable)   | driftsort           | 安定   | $O(n)$        | $O(n \log n)$ | $O(n \log n)$ | 1.81 (2024)      |
| Rust (unstable) | ipnsort             | 不安定 | $O(n)$        | $O(n \log n)$ | $O(n \log n)$ | 1.81 (2024)      |
| Go              | pdqsort             | 不安定 | $O(n)$        | $O(n \log n)$ | $O(n \log n)$ | 1.19 (2022)      |
| R (数値)        | Radix Sort          | 安定   | $O(n)$        | $O(n)$        | $O(n)$        | R 3.x            |
| R (汎用)        | Shell Sort          | 不安定 | $O(n \log n)$ | $O(n^{4/3})$  | $O(n^{4/3})$  | R 1.x            |

### 共通トレンド

2022年以降のソートアルゴリズムのアップデートに共通するトレンドが2つあります。

1つ目は適応型ソート（Adaptive Sort）です。すべての言語で、入力データの既存の秩序を活用するアルゴリズムが採用されています。ソート済みの入力に対しては$O(n)$で動作するものが多く、実世界のデータは部分的にソートされていることが多いため、この特性は実用上大きな意味を持ちます。

2つ目はハイブリッド戦略です。単一のソートアルゴリズムではなく、要素数やデータの特性に応じて複数のアルゴリズムを切り替える戦略が標準になっています。小さい配列にはInsertion Sort、大きい配列にはMerge SortやQuickSort系、最悪ケースにはHeapSortへフォールバックするといった組み合わせが典型的です。

## 終わりに

ソートアルゴリズムの研究は成熟した分野と思われがちですが、実際には2022年〜2024年の短期間で主要言語の実装が次々と刷新されています。特にRustのdriftsort/ipnsortは最大17倍という大幅な性能向上を実現しており、まだ改善の余地があることを示しています。

普段意識することは少ないですが、自分が使う言語のソート実装の特性を知っておくことで、パフォーマンスチューニングやアルゴリズム選択の判断に役立つ場面もあるでしょう。

## 参考文献

- [Timsort - Wikipedia](https://en.wikipedia.org/wiki/Timsort)
- [Powersort in official Python 3.11 release](https://www.wild-inter.net/posts/powersort-in-python-3.11)
- [Getting things sorted in V8](https://v8.dev/blog/array-sort)
- [driftsort introduction](https://github.com/Voultapher/sort-research-rs/blob/main/writeup/driftsort_introduction/text.md)
- [ipnsort introduction](https://github.com/Voultapher/sort-research-rs/blob/main/writeup/ipnsort_introduction/text.md)
- [Go: sort: use pdqsort (Issue #50154)](https://github.com/golang/go/issues/50154)
- [R sort documentation](https://stat.ethz.ch/R-manual/R-patched/library/base/html/sort.html)
- [pdqsort by Orson Peters](https://github.com/orlp/pdqsort)
