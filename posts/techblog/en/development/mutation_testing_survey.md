---
uuid: ba9eb27a-e56c-4e44-924f-4b921ef3e222
title: "Mutation Testing Survey — Comparing Major Tools for Go, Rust, Python, and TypeScript"
description: "A comparison of mutation testing tools for Go, Rust, Python, and TypeScript, covering setup, test framework integration, and diff-based optimization techniques for each language."
category: techblog
lang: en
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

- Mutation testing injects small mutations (mutants) into code and verifies whether tests can detect them. It quantifies "test quality," something code coverage alone cannot measure
- Recommended tools per language: Python -> mutmut, TypeScript -> StrykerJS, Rust -> cargo-mutants, Go -> Gremlins
- All tools support diff-based execution reduction (or have workarounds). Diff-based execution is practically essential when integrating into CI
- The strength of a language's type system directly affects mutation testing efficiency. In languages with strong type systems like Rust, invalid mutants are automatically eliminated by type checking, reducing execution time

## Tool Overview: Diff-Based and Parallel Execution Support

| Tool                                 | Language   | Diff-Based Execution                                                    | Parallel Execution    |
| ------------------------------------ | ---------- | ----------------------------------------------------------------------- | --------------------- |
| :gh-meta[boxed/mutmut]               | Python     | Yes: built-in incremental + target specification via `--paths-to-mutate` | No: sequential only   |
| :gh-meta[stryker-mutator/stryker-js] | TypeScript | Yes: JSON diff management via `--incremental`                            | Yes                   |
| :gh-meta[sourcefrog/cargo-mutants]   | Rust       | Yes: diff file specification via `--in-diff`                             | Yes: `-j` flag        |
| :gh-meta[go-gremlins/gremlins]       | Go         | Partial: workaround by combining with git diff                           | Yes                   |

## What Is Mutation Testing?

Code coverage indicates "which lines the tests executed," but whether the tests can actually detect bugs is a separate question. Even with 100% coverage, no bugs will be found if there isn't a single assertion.

Mutation testing addresses this problem and works as follows:

1. Generate mutants by applying small mutations to the source code
2. Run the test suite against each mutant
3. If a test fails, it's killed (successfully detected); if all tests pass, it survived (detection failed)

Ultimately, the Mutation Score — the proportion of killed mutants — serves as the quality metric for the test suite.

$$\text{Mutation Score} = \frac{\text{Killed Mutants}}{\text{Total Mutants} - \text{Equivalent Mutants}} \times 100$$

### Common Mutation Operators

| Type                  | Before          | After                     |
| --------------------- | --------------- | ------------------------- |
| Arithmetic operator   | `a + b`         | `a - b`                   |
| Comparison operator   | `a > b`         | `a >= b`, `a < b`         |
| Logical operator      | `a && b`        | `a \|\| b`                |
| Return value          | `return x`      | `return 0`, `return ""`   |
| Conditional           | `if (cond)`     | `if (true)`, `if (false)` |
| Statement deletion    | `doSomething()` | (deleted)                 |

### The Equivalent Mutant Problem

A fundamental challenge in mutation testing is the equivalent mutant. This is a mutant where the mutation does not change the program's externally observable behavior, making it inherently undetectable by tests. For example, changing `x = x * 1` to `x = x * 0` can be killed, but changing `x = x + 0` to `x = x - 0` cannot be detected because the behavior is identical. This problem is known to be undecidable, and each tool handles it with heuristics.

## Python: mutmut

:gh-meta[boxed/mutmut] is the most widely used mutation testing tool for Python. Designed with ease of use in mind, it integrates smoothly with `pytest`.

### Setup and Usage Example

```bash
pip install mutmut
```

Configure it in `pyproject.toml`.

```toml title=pyproject.toml
[tool.mutmut]
paths_to_mutate = "src/"
tests_dir = "tests/"
```

Here is an example of the target code and tests.

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

Run mutation testing.

```bash
mutmut run --paths-to-mutate src/calculator.py
```

Check the results.

```bash
mutmut results
```

If there are survived mutants, you can view the diff as follows.

```bash
mutmut show <mutant_id>
```

For example, if a mutant that changed `b == 0` to `b == 1` survived, it indicates that testing for the `b=1` case is insufficient.

### Test Framework Integration

mutmut uses `pytest` by default. To use `unittest` or another runner, specify it in the `runner` configuration.

When integrating with `pytest`, optimization using coverage information is available. Setting `mutate_only_covered_lines` to `true` limits mutations to lines covered by tests.

```toml title=pyproject.toml
[tool.mutmut]
paths_to_mutate = "src/"
tests_dir = "tests/"
mutate_only_covered_lines = true
```

It also supports integration with type checkers like `mypy` and `pyrefly`. If `x: str = 'foo'` is mutated to `x: str = None`, the type checker catches it, avoiding unnecessary execution.

### Diff-Based Execution Reduction

mutmut has built-in support for incremental execution.

- Execution can be stopped midway and will resume from where it left off on the next run
- Only functions in modified source code are retested
- When the test suite changes, only survived mutants are retested

For CI usage, you can pass files obtained from git diff to `--paths-to-mutate` to target only changed files.

```bash
# Target only modified Python files
git diff --name-only origin/main -- '*.py' | xargs -I {} mutmut run --paths-to-mutate {}
```

## TypeScript: StrykerJS

:gh-meta[stryker-mutator/stryker-js] is the de facto mutation testing tool in the JavaScript/TypeScript ecosystem. Actively maintained, v7.0 added Vitest support.

### Setup and Usage Example

```bash
npm init stryker
# Or manual installation
npm install -D @stryker-mutator/core @stryker-mutator/vitest-runner @stryker-mutator/typescript-checker
```

Create the configuration file.

```json title=stryker.config.json
{
  "$schema": "https://raw.githubusercontent.com/stryker-mutator/stryker/master/packages/core/schema/stryker-schema.json",
  "testRunner": "vitest",
  "checkers": ["typescript"],
  "tsconfigFile": "tsconfig.json",
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"]
}
```

Here is an example of the target code and tests.

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

Run it.

```bash
npx stryker run
```

Stryker generates an HTML report where you can visually inspect each mutant's status (killed/survived/no coverage/compile error).

### Test Framework Integration

StrykerJS provides a rich set of test runner plugins.

| Runner   | Package                          | Notes                    |
| -------- | -------------------------------- | ------------------------ |
| Vitest   | `@stryker-mutator/vitest-runner` | Added in v7.0. Recommended |
| Jest     | `@stryker-mutator/jest-runner`   | For React/Next.js        |
| Mocha    | `@stryker-mutator/mocha-runner`  | For Node.js              |
| Karma    | `@stryker-mutator/karma-runner`  | For Angular              |
| Node Tap | `@stryker-mutator/tap-runner`    | Added in v7.0            |

The TypeScript Checker plugin automatically excludes mutants that cause type errors. For example, if a `number` return value is mutated to `""` (empty string), it results in a compile error and execution is skipped. Performance was improved by up to 50% in v6.4.

### Diff-Based Execution Reduction (Incremental Mode)

StrykerJS's incremental mode is one of the most sophisticated mechanisms for reducing mutation testing execution.

```bash
npx stryker run --incremental
```

It works as follows:

1. On the first run, all mutants are tested normally and results are saved to `reports/stryker-incremental.json`
2. On subsequent runs, the saved JSON is loaded and diffs against source and test files are calculated
3. Only mutants related to changed code are re-executed; all others reuse previous results
4. Even with partial execution, a report containing all mutant results is generated

The recommended CI pattern is to manage the incremental JSON file as a CI artifact.

```bash
# Fetch main branch results and run incrementally
npx stryker run --incremental
```

To retest specific files, combine `--force` with `--mutate`.

```bash
npx stryker run --incremental --force --mutate src/calculator.ts
```

#### Test Change Detection Granularity

The precision of test change detection in incremental mode varies by runner.

- Jest/Mocha/Cucumber can track exact test positions and re-run only the changed tests
- Vitest detects changes at the test file level; if there are changes within a file, all tests in it are re-run
- Karma only tracks test names, detecting only additions and deletions

## Rust: cargo-mutants

:gh-meta[sourcefrog/cargo-mutants] is a mutation testing tool for Rust, distinguished by its zero-configuration operation. Since it uses `cargo test` directly, it can be introduced without additional configuration to existing test environments.

### Setup and Usage Example

```bash
cargo install cargo-mutants
```

Here is an example of the target code.

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

Run it.

```bash
cargo mutants
```

Example output:

```text
Found 8 mutants to test
  Caught   fibonacci: replace fibonacci -> u64 with 0
  Caught   fibonacci: replace fibonacci -> u64 with 1
  Caught   fibonacci: replace == with != in fibonacci
  Caught   fibonacci: replace + with - in fibonacci
  ...
8 mutants tested: 8 caught
```

### Test Framework Integration

Since cargo-mutants runs `cargo test` directly, it automatically recognizes not only the standard test framework but also custom test attributes like `#[tokio::test]` and `#[sqlx::test]`. Test functions themselves are excluded from mutation targets.

If you use `nextest`, you can switch with `--test-tool=nextest`.

```bash
cargo mutants --test-tool=nextest
```

Rust's strong type system provides a significant advantage in mutation testing. For example, even if a mutant is generated that returns `0` from a function returning `Option<T>`, it won't compile due to a type error and is automatically skipped. This tends to result in fewer mutants requiring execution compared to other languages.

### Diff-Based Execution Reduction (`--in-diff`)

cargo-mutants accepts a diff file via the `--in-diff` option and executes only mutants related to changed code.

```bash
# Test only PR diff
git diff origin/main.. > pr.diff
cargo mutants --in-diff pr.diff
```

Here is a GitHub Actions usage example.

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

Internally, cargo-mutants copies the source tree to a scratch directory and reuses the same directory for all mutants, benefiting from incremental builds.

## Go: Gremlins

Several mutation testing tools exist for Go, but the most actively maintained is :gh-meta[go-gremlins/gremlins]. :gh-meta[zimmski/go-mutesting] (and its [Avito fork](https://github.com/avito-tech/go-mutesting)) is also an option, but Gremlins is more feature-rich.

### Setup and Usage Example

```bash
go install github.com/go-gremlins/gremlins/cmd/gremlins@latest
```

Here is an example of the target code.

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

Run it.

```bash
gremlins unleash ./pkg/math/...
```

### Test Framework Integration

Gremlins uses `go test` directly. While Go has third-party test frameworks (such as testify), they all run via `go test`, so no additional configuration is needed.

A notable feature of Gremlins is that it pre-collects coverage information and only mutates code covered by tests. Code that is not covered has no tests to begin with, so performing mutation testing on it would be meaningless — a sensible approach.

### Diff-Based Execution Reduction

Gremlins does not currently have a built-in incremental mode like StrykerJS or an `--in-diff` option like cargo-mutants.

Using the `--exclude-files` flag added in v0.6.0 combined with git diff provides a workaround.

```bash
# Target only directories containing changed Go files
CHANGED_DIRS=$(git diff --name-only origin/main -- '*.go' | xargs -I {} dirname {} | sort -u | sed 's|$|/...|')
gremlins unleash $CHANGED_DIRS
```

go-mutesting allows flexible target specification via arguments, supporting execution at the file, directory, and package level.

## When Should You Adopt Mutation Testing?

### Good Fit

- Small to medium modules with concentrated business logic. Functions with clear inputs and outputs where mutation operators work effectively
- Projects that already have high test coverage. When coverage is high but test quality is uncertain, mutation testing reveals specific areas for improvement
- When you want quality gates in CI. Diff-based execution makes per-PR checks practical

### Poor Fit

- Projects with low test coverage. Increasing coverage first is more cost-effective
- Large monoliths. The number of mutants explodes, making execution time impractical. Split into modules before adopting
- Projects centered on UI/E2E testing. Mutation testing works best with unit and integration tests

### Adoption Tips

- Testing all mutants takes time. Start with diff-based execution and combine it with periodic full runs on the main branch for a practical approach
- A 100% Mutation Score is not necessary. Due to the existence of equivalent mutants, aiming for around 80% is reasonable
- Don't apply it to the entire project from the start — begin gradually with critical modules

## In Practice: Introducing StrykerJS to This Blog

I introduced StrykerJS to this blog (illumination-k.dev) itself and built a system to track quality metrics per PR. Here are the current numbers and configuration.

### Configuration

This site is a pnpm + Turbo monorepo, and mutation testing targets the following three packages:

- **md-plugins** — remark plugins (heading ID assignment, code titles, GitHub embeds, etc.)
- **ipynb2md** — Jupyter Notebook to Markdown conversion
- **cli** — Post processing CLI (image optimization, OG image generation, RSS generation)

The web package (Next.js frontend) is primarily UI components and is excluded from mutation testing; only vitest coverage is measured.

### Current Metrics

| Metric          | Value      |
| --------------- | ---------- |
| Line Coverage   | 70.98%     |
| Branch Coverage | 57.37%     |
| Mutation Score  | 47.49%     |
| Killed / Total  | 546 / 1156 |

The 47% Mutation Score is mainly due to insufficient coverage in the ipynb2md package (30%) and the cli package. md-plugins is at 62%, reflecting relatively thorough testing of remark plugins.

### CI Integration

The following workflow was configured in GitHub Actions:

1. **On PR**: Run `pnpm test:coverage` + `stryker run` and automatically post results as a PR comment (existing comments are updated in place)
2. **On main merge**: Append the same metrics to `metrics-history.json` and commit

```json title=stryker.config.json
{
  "testRunner": "vitest",
  "plugins": ["@stryker-mutator/vitest-runner"],
  "reporters": ["clear-text", "html", "json", "progress"],
  "jsonReporter": {
    "fileName": "reports/mutation/mutation.json"
  },
  "mutate": [
    "packages/md-plugins/**/*.ts",
    "packages/ipynb2md/src/**/*.ts",
    "cli/src/**/*.ts",
    "!**/*.test.ts",
    "!**/*.spec.ts"
  ]
}
```

Metric trends can be viewed on the [Quality Metrics](/metrics) page.

### Impressions

- Running mutation testing across multiple packages in a monorepo is straightforward because StrykerJS's Vitest runner automatically recognizes workspaces
- The initial full run takes about 4 minutes. This is acceptable for running per-PR in CI, but incremental mode would become essential as the project grows
- A 47% Mutation Score clearly indicates "tests exist but their quality is low." This is a problem you wouldn't notice by looking at 70% coverage alone

## Summary

Mutation testing is a technique for "testing the quality of your tests," and tools exist for all four languages. Tool maturity varies, with StrykerJS (TypeScript) and mutmut (Python) having the most complete ecosystems. cargo-mutants (Rust) has strong affinity with Rust's type system and offers the convenience of zero-configuration startup. Gremlins for Go is still in the 0.x series but provides practical features like coverage-based filtering.

For CI integration, diff-based execution (StrykerJS's `--incremental`, cargo-mutants' `--in-diff`, mutmut's `--paths-to-mutate`) is practically essential. Full runs should be limited to periodic execution on the main branch, while PRs should target only changed code — this is the practical approach.

## References

- [mutmut documentation](https://mutmut.readthedocs.io/)
- [Stryker Mutator](https://stryker-mutator.io/)
- [StrykerJS Incremental Mode](https://stryker-mutator.io/docs/stryker-js/incremental/)
- [cargo-mutants documentation](https://mutants.rs/)
- [cargo-mutants PR diff testing](https://mutants.rs/pr-diff.html)
