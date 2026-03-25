---
uuid: ba9eb27a-e56c-4e44-924f-4b921ef3e222
title: "Mutation Testing サーベイ — Go, Rust, Python, TypeScript の主要ツール比較"
description: "Go, Rust, Python, TypeScriptにおけるmutation testingツールを比較し、各言語での導入方法・テストフレームワーク連携・差分ベースの最適化手法を解説します。"
category: techblog
lang: ja
tags:
  - ai-generated
  - testing
  - mutation-testing
  - go
  - rust
  - python
  - typescript
created_at: 2026-03-23
updated_at: 2026-03-23
---

## TL;DR

- Mutation testingはコードに小さな変異（mutant）を注入し、テストがそれを検出できるかを検証する手法。コードカバレッジでは測れない「テストの質」を定量化できる
- 各言語の推奨ツール: Python → mutmut, TypeScript → StrykerJS, Rust → cargo-mutants, Go → Gremlins
- すべてのツールが差分ベースの実行量の削減に対応している（またはワークアラウンドがある）。CIに組み込む際は差分ベースの実行が実質必須
- 言語の型システムの強さがmutation testingの効率に直結する。Rustのような強い型システムでは無効なmutantが型チェックで自動排除され、実行時間が短くなる

## ツール一覧と差分実行・並列実行の対応状況

| ツール                               | 言語       | 差分実行                                                   | 並列実行       |
| ------------------------------------ | ---------- | ---------------------------------------------------------- | -------------- |
| :gh-meta[boxed/mutmut]               | Python     | ○ 組み込みインクリメンタル + `--paths-to-mutate`で対象指定 | × 逐次実行のみ |
| :gh-meta[stryker-mutator/stryker-js] | TypeScript | ○ `--incremental`でJSON差分管理                            | ○              |
| :gh-meta[sourcefrog/cargo-mutants]   | Rust       | ○ `--in-diff`でdiffファイル指定                            | ○ `-j`フラグ   |
| :gh-meta[go-gremlins/gremlins]       | Go         | △ git diffとの組み合わせでワークアラウンド                 | ○              |

## Mutation Testing とは

コードカバレッジは「テストがどの行を実行したか」を示す指標ですが、テストが実際にバグを検出できるかは別問題です。カバレッジ100%でも、assertionが1つもなければバグは見つかりません。

Mutation testingはこの問題に対するアプローチで、以下のように動作します。

1. ソースコードに小さな変異（mutation）を加えたmutantを生成する
2. 各mutantに対してテストスイートを実行する
3. テストが失敗すればkilled（検出成功）、全テストが通ればsurvived（検出失敗）

最終的に、killed mutantの割合であるMutation Scoreがテストスイートの品質指標となります。

$$\text{Mutation Score} = \frac{\text{Killed Mutants}}{\text{Total Mutants} - \text{Equivalent Mutants}} \times 100$$

### 代表的なMutation Operator

| 種類       | 変異前          | 変異後                    |
| ---------- | --------------- | ------------------------- |
| 算術演算子 | `a + b`         | `a - b`                   |
| 比較演算子 | `a > b`         | `a >= b`, `a < b`         |
| 論理演算子 | `a && b`        | `a \|\| b`                |
| 戻り値     | `return x`      | `return 0`, `return ""`   |
| 条件式     | `if (cond)`     | `if (true)`, `if (false)` |
| 文の削除   | `doSomething()` | （削除）                  |

### Equivalent Mutant問題

Mutation testingの根本的な課題として、equivalent mutantがあります。これは変異を加えてもプログラムの外部から観察可能な動作が変わらないmutantのことで、原理的にテストでは検出できません。例えば `x = x * 1` を `x = x * 0` に変えた場合はkillできますが、 `x = x + 0` を `x = x - 0` に変えた場合は動作が同一のため検出できません。この問題は決定不能であることが知られており、各ツールはヒューリスティクスで対処しています。

## Python: mutmut

:gh-meta[boxed/mutmut]はPythonにおける最も広く使われているmutation testingツールです。使いやすさを重視した設計で、`pytest`との統合がスムーズに行えます。

### セットアップと実行例

```bash
pip install mutmut
```

`pyproject.toml`で設定を記述します。

```toml title=pyproject.toml
[tool.mutmut]
paths_to_mutate = "src/"
tests_dir = "tests/"
```

対象となるコードとテストの例を示します。

```python title=src/calculator.py
def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

```python title=tests/test_calculator.py
import pytest
from src.calculator import divide

def test_divide_normal():
    assert divide(10, 2) == 5.0

def test_divide_by_zero():
    with pytest.raises(ValueError):
        divide(10, 0)
```

mutation testingを実行します。

```bash
mutmut run --paths-to-mutate src/calculator.py
```

結果を確認します。

```bash
mutmut results
```

survivedしたmutantがあれば、以下のようにdiffを確認できます。

```bash
mutmut show <mutant_id>
```

例えば `b == 0` が `b == 1` に変異したmutantがsurvivedしていた場合、`b=1`のケースに対するテストが不足していることがわかります。

### テストフレームワーク連携

mutmutはデフォルトで`pytest`を使用します。`unittest`や他のランナーを使う場合は`runner`設定で指定できます。

`pytest`との連携では、カバレッジ情報を活用した最適化が可能です。`mutate_only_covered_lines`を`true`にすると、テストでカバーされている行のみを変異対象にできます。

```toml title=pyproject.toml
[tool.mutmut]
paths_to_mutate = "src/"
tests_dir = "tests/"
mutate_only_covered_lines = true
```

また、`mypy`や`pyrefly`といった型チェッカーとの連携もサポートしています。`x: str = 'foo'`を`x: str = None`に変異させた場合、型チェッカーが検出できるため無駄な実行を省けます。

### 差分ベースの実行量の削減

mutmutはインクリメンタル実行を組み込みでサポートしています。

- 実行を途中で停止しても、次回は中断した箇所から再開する
- ソースコードが変更された関数のみを再テストする
- テストスイートが変更された場合、survivedしたmutantのみを再テストする

CIでの利用では、`--paths-to-mutate`にgit diffで取得した変更ファイルを渡すことで、変更箇所のみを対象にできます。

```bash
# 変更されたPythonファイルのみを対象にする
git diff --name-only origin/main -- '*.py' | xargs -I {} mutmut run --paths-to-mutate {}
```

## TypeScript: StrykerJS

:gh-meta[stryker-mutator/stryker-js]はJavaScript/TypeScriptエコシステムにおけるデファクトのmutation testingツールです。活発にメンテナンスされており、v7.0ではVitest対応が追加されました。

### セットアップと実行例

```bash
npm init stryker
# または手動インストール
npm install -D @stryker-mutator/core @stryker-mutator/vitest-runner @stryker-mutator/typescript-checker
```

設定ファイルを作成します。

```json title=stryker.config.json
{
  "$schema": "https://raw.githubusercontent.com/stryker-mutator/stryker/master/packages/core/schema/stryker-schema.json",
  "testRunner": "vitest",
  "checkers": ["typescript"],
  "tsconfigFile": "tsconfig.json",
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"]
}
```

対象コードとテストの例を示します。

```typescript title=src/calculator.ts
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
```

```typescript title=src/calculator.test.ts
import { describe, it, expect } from "vitest";
import { clamp } from "./calculator";

describe("clamp", () => {
  it("returns min when value is below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("returns max when value is above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
```

実行します。

```bash
npx stryker run
```

StrykerはHTMLレポートを生成し、各mutantのstatus（killed/survived/no coverage/compile error）を視覚的に確認できます。

### テストフレームワーク連携

StrykerJSは豊富なテストランナープラグインを提供しています。

| ランナー | パッケージ                       | 備考              |
| -------- | -------------------------------- | ----------------- |
| Vitest   | `@stryker-mutator/vitest-runner` | v7.0で追加。推奨  |
| Jest     | `@stryker-mutator/jest-runner`   | React/Next.js向け |
| Mocha    | `@stryker-mutator/mocha-runner`  | Node.js向け       |
| Karma    | `@stryker-mutator/karma-runner`  | Angular向け       |
| Node Tap | `@stryker-mutator/tap-runner`    | v7.0で追加        |

TypeScript Checkerプラグインは型エラーとなるmutantを自動的に除外します。例えば`number`型の戻り値を`""`（空文字列）に変異させた場合、コンパイルエラーとなるため実行がスキップされます。v6.4でパフォーマンスが最大50%改善されました。

### 差分ベースの実行量の削減（Incremental Mode）

StrykerJSのincremental modeは、mutation testingの実行量を削減する仕組みとして最も洗練されたものの1つです。

```bash
npx stryker run --incremental
```

動作の流れは以下の通りです。

1. 初回は通常通り全mutantをテストし、結果を`reports/stryker-incremental.json`に保存する
2. 2回目以降は保存済みのJSONを読み込み、ソースコードとテストファイルのdiffを算出する
3. 変更されたコードに関連するmutantのみ再実行し、それ以外は前回の結果を再利用する
4. 部分実行でも、全mutantの結果を含むレポートが生成される

CIでの推奨パターンは、incremental JSONファイルをCIアーティファクトとして管理する方法です。

```bash
# mainブランチの結果を取得してincremental実行
npx stryker run --incremental
```

特定のファイルのみを再テストしたい場合は`--force`と`--mutate`を組み合わせます。

```bash
npx stryker run --incremental --force --mutate src/calculator.ts
```

#### テスト変更の検出レベル

incrementalモードにおけるテスト変更検出の精度はランナーによって異なります。

- Jest/Mocha/Cucumberではテストの正確な位置まで追跡でき、変更されたテストのみ再実行できる
- Vitestではテストファイル単位での検出となり、ファイル内の変更があれば全テストが再実行される
- Karmaではテスト名のみの追跡となり、追加・削除のみ検出可能

## Rust: cargo-mutants

:gh-meta[sourcefrog/cargo-mutants]はRust向けのmutation testingツールで、ゼロコンフィグで動作する点が特徴です。`cargo test`をそのまま利用するため、既存のテスト環境に追加の設定なしで導入できます。

### セットアップと実行例

```bash
cargo install cargo-mutants
```

対象コードの例を示します。

```rust title=src/lib.rs
pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fibonacci_base_cases() {
        assert_eq!(fibonacci(0), 0);
        assert_eq!(fibonacci(1), 1);
    }

    #[test]
    fn test_fibonacci_recursive() {
        assert_eq!(fibonacci(10), 55);
    }
}
```

実行します。

```bash
cargo mutants
```

出力例を示します。

```text
Found 8 mutants to test
  Caught   fibonacci: replace fibonacci -> u64 with 0
  Caught   fibonacci: replace fibonacci -> u64 with 1
  Caught   fibonacci: replace == with != in fibonacci
  Caught   fibonacci: replace + with - in fibonacci
  ...
8 mutants tested: 8 caught
```

### テストフレームワーク連携

cargo-mutantsは`cargo test`をそのまま実行するため、標準のテストフレームワークはもちろん、`#[tokio::test]`、`#[sqlx::test]`などのカスタムテスト属性も自動的に認識します。テスト関数自体は変異対象から除外されます。

`nextest`を使用している場合は`--test-tool=nextest`で切り替えが可能です。

```bash
cargo mutants --test-tool=nextest
```

Rustの強い型システムはmutation testingにおいて大きな利点となります。例えば`Option<T>`を返す関数に対して`0`を返すmutantを生成しても型エラーでコンパイルが通らないため、自動的にスキップされます。これにより、実行が必要なmutant数が他の言語と比較して少なくなる傾向があります。

### 差分ベースの実行量の削減（`--in-diff`）

cargo-mutantsは`--in-diff`オプションでdiffファイルを受け取り、変更された箇所に関連するmutantのみを実行できます。

```bash
# PRの差分のみをテスト
git diff origin/main.. > pr.diff
cargo mutants --in-diff pr.diff
```

GitHub Actionsでの利用例を示します。

```yaml title=.github/workflows/mutants.yml
name: Mutation Testing
on: pull_request

jobs:
  mutants:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: cargo install cargo-mutants
      - run: git diff origin/${{ github.base_ref }}.. > git.diff
      - run: cargo mutants --no-shuffle -vV --in-diff git.diff
```

内部的には、cargo-mutantsはソースツリーをスクラッチディレクトリにコピーし、同じディレクトリを全mutantで再利用することでインクリメンタルビルドの恩恵を受けています。

## Go: Gremlins

Go向けのmutation testingツールは複数存在しますが、現在最も活発にメンテナンスされているのは:gh-meta[go-gremlins/gremlins]です。:gh-meta[zimmski/go-mutesting]（およびその[Avito fork](https://github.com/avito-tech/go-mutesting)）も選択肢ですが、Gremlinsの方が機能面で充実しています。

### セットアップと実行例

```bash
go install github.com/go-gremlins/gremlins/cmd/gremlins@latest
```

対象コードの例を示します。

```go title=pkg/math/math.go
package math

func Max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```

```go title=pkg/math/math_test.go
package math

import "testing"

func TestMax(t *testing.T) {
    tests := []struct {
        a, b, want int
    }{
        {1, 2, 2},
        {3, 1, 3},
        {5, 5, 5},
    }
    for _, tt := range tests {
        if got := Max(tt.a, tt.b); got != tt.want {
            t.Errorf("Max(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.want)
        }
    }
}
```

実行します。

```bash
gremlins unleash ./pkg/math/...
```

### テストフレームワーク連携

Gremlinsは`go test`を直接利用します。Goにはサードパーティのテストフレームワーク（testifyなど）がありますが、いずれも`go test`経由で実行されるため、追加の設定は不要です。

Gremlinsの特徴として、カバレッジ情報を事前に収集し、テストでカバーされているコードのみを変異対象とします。カバーされていないコードはそもそもテストが存在しないため、mutation testingを行っても意味がないという合理的なアプローチです。

### 差分ベースの実行量の削減

Gremlins自体にはStrykerJSのようなincrementalモードや、cargo-mutantsのような`--in-diff`オプションは現時点で組み込まれていません。

v0.6.0で追加された`--exclude-files`フラグを活用し、git diffと組み合わせることでワークアラウンドが可能です。

```bash
# 変更されたGoファイルのディレクトリのみを対象にする
CHANGED_DIRS=$(git diff --name-only origin/main -- '*.go' | xargs -I {} dirname {} | sort -u | sed 's|$|/...|')
gremlins unleash $CHANGED_DIRS
```

go-mutestingの方はターゲットを引数で柔軟に指定でき、ファイル単位、ディレクトリ単位、パッケージ単位での実行が可能です。

## どのプロジェクトで導入すべきか

### 向いているケース

- ビジネスロジックが集中する小〜中規模モジュール。関数の入出力が明確で、mutation operatorが効果的に働く
- 既にテストカバレッジが高いプロジェクト。カバレッジは高いがテストの質に自信がない場合、mutation testingが具体的な改善箇所を示してくれる
- CIで品質ゲートを設けたい場合。差分ベースの実行でPR単位のチェックが実用的になっている

### 向かないケース

- テストカバレッジが低いプロジェクト。まずカバレッジを上げる方が費用対効果が高い
- 巨大なモノリス。mutant数が爆発し、実行時間が非現実的になる。モジュール分割してから導入すべき
- UI/E2Eテスト中心のプロジェクト。mutation testingはユニットテスト・インテグレーションテストとの相性が良い

### 導入時の注意点

- 全mutantのテストは時間がかかる。まずは差分ベースの実行から始め、mainブランチでの定期的なフル実行と組み合わせるのが現実的
- Mutation Scoreは100%を目指す必要はない。equivalent mutantの存在もあり、80%程度を目安にするのが妥当
- 最初からプロジェクト全体に適用せず、重要なモジュールから段階的に始める

## まとめ

Mutation testingは「テストの質をテストする」手法であり、4言語ともツールが存在します。ツールの成熟度にはばらつきがあり、StrykerJS（TypeScript）とmutmut（Python）がエコシステムとして最も充実しています。cargo-mutants（Rust）はRustの型システムとの親和性が高く、ゼロコンフィグで始められる手軽さがあります。Go向けのGremlinsはまだ0.x系ですが、カバレッジベースのフィルタリングなど実用的な機能を備えています。

CIへの組み込みにおいては、差分ベースの実行（StrykerJSの`--incremental`、cargo-mutantsの`--in-diff`、mutmutの`--paths-to-mutate`）が実質的に必須です。フル実行はmainブランチでの定期実行に留め、PRでは変更箇所のみを対象にするのが実用的なアプローチです。

## References

- [mutmut documentation](https://mutmut.readthedocs.io/)
- [Stryker Mutator](https://stryker-mutator.io/)
- [StrykerJS Incremental Mode](https://stryker-mutator.io/docs/stryker-js/incremental/)
- [cargo-mutants documentation](https://mutants.rs/)
- [cargo-mutants PR diff testing](https://mutants.rs/pr-diff.html)
