---
uuid: 847d9e31-79ec-4964-bbfb-53a64fea7127
title: "コード品質の数値化とHarness Engineering — 複雑度・カバレッジ・Mutation Scoreでプロジェクト品質をトラッキングする"
description: "Harness Engineeringの文脈でコード品質を継続的にトラッキングする方法をサーベイ。Cyclomatic/Cognitive Complexity・カバレッジ・Mutation Score・pass@kを体系的に整理し、このブログへの実際の導入例を紹介します。"
category: development
lang: ja
tags:
  - ai-generated
  - testing
  - code-quality
  - mutation-testing
  - llm
  - harness-engineering
created_at: 2026-03-29
updated_at: 2026-03-29
---

## TL;DR

- **Harness Engineering** — LLMエージェントが信頼性高く動作する「外部環境」を設計する新興ディシプリン（2026年2月）。Prompt Engineering → Context Engineering → Harness Engineeringという進化の第3段階
- コード品質メトリクスは目的別に使い分ける。複雑度（Cyclomatic/Cognitive Complexity）はリファクタリング候補の発見に、カバレッジはテストの到達範囲に、Mutation Scoreはテストの「検出能力」に使う
- LLMコード生成評価におけるpass@kはテスト通過率の不偏推定量。CodeBLEUは構文・意味を考慮したBLEU拡張だが、機能的に等価な別実装を過小評価する問題がある
- このブログでは既存のStryker + vitest coverageに **lizard** による複雑度計測を追加し、全メトリクスを一括収集する仕組みを構築した

## Harness Engineeringとは何か

2026年2月、OpenAIのRyan LopopoloがCodexを用いた大規模開発の報告書を公開した際、ある言葉が技術コミュニティに広まった。

> "Agents aren't hard; the Harness is hard."

**Harness Engineering** とは、LLMエージェントが複数セッションにわたって信頼性高く動作するための「外部環境」を設計・構築する規律のことだ。

### 3段階の進化

AIコーディングの文脈でのエンジニアの関心事は、おおよそ次のように進化してきた。

| 段階                    | 問い                                                                 | 期間        |
| ----------------------- | -------------------------------------------------------------------- | ----------- |
| Prompt Engineering      | 「どうすればより良い質問ができるか？」                               | 2022–2024年 |
| Context Engineering     | 「1セッション内で何を管理するか？」                                  | 2025年      |
| **Harness Engineering** | 「エージェントが複数セッションにわたって機能する環境をどう作るか？」 | 2026年〜    |

命名の経緯は、Mitchell Hashimoto（HashiCorp共同創業者）が2026年2月のブログ記事 _"My AI Adoption Journey"_ で "Engineer the Harness" というフレーズを使ったことに遡る。語源は馬具（手綱・鞍）のメタファーで、強力だが気まぐれな馬（LLMエージェント）を正しい方向に導く「装備一式」を意味する。

### OpenAIの実践例

OpenAIのCodexを使った内部開発事例（5ヶ月間）のまとめ。

| 項目           | 値                     |
| -------------- | ---------------------- |
| 生成コード行数 | 約100万行              |
| PRの件数       | 約1,500件              |
| チーム規模     | 最終的に7名            |
| 手動コード     | ゼロ                   |
| 生産性倍率     | 従来比1/10の期間で完成 |

エンジニアの仕事が根本的に変わった。「正しいコードを書く」から「エージェントが正しいコードを書ける環境を作る」へ。

Harnessの主要コンポーネントは3つある。

1. **Context Engineering** — `AGENTS.md` を目次として使い、知識ベースは `docs/` に構造化
2. **Architectural Constraints** — 依存方向をリンターで機械的に強制（ドキュメント化ではなく強制）
3. **Garbage Collection** — ドキュメントの矛盾やアーキテクチャ違反を定期検出するエージェント

### Harness Evalとコード品質

OpenAIが提案する **Agent Legibility Scorecard** には7つの評価軸があり、そのうちの1つが **Validation Harness** です。エージェントが生成したコードの品質を、自動で検証できる仕組みがあるかを問う指標です。

つまり「Harness Engineeringでエージェントを使いこなす」ためには、生成コードの品質を継続的に測定・追跡する仕組みが不可欠になる。

---

## コードクオリティの数値化サーベイ

コードの「品質」は単一の数値では表現できない。目的に応じて異なるメトリクスを組み合わせるのが基本的な考え方だ。

### 複雑度メトリクス

#### Cyclomatic Complexity（McCabe、1976年）

Thomas McCabeが1976年に提案した、制御フローグラフ上の線形独立パス数を数えるメトリクス。

$$M = E - N + 2P$$

- $E$：エッジ（辺）数
- $N$：ノード（節点）数
- $P$：出口ノード数

実用的には「決定点の数 + 1」として計算できる。

```
if A and B:      # A（決定点+1）、B（決定点+1）
    do_something()
elif C:          # C（決定点+1）
    do_other()
```

この関数のCyclomatic Complexityは4。

McCabe自身は「上限10が合理的な目安」と述べており、10を超えたらリファクタリングを推奨している。

| スコア | リスク評価           |
| ------ | -------------------- |
| 1–10   | 低リスク・テスト容易 |
| 11–20  | 中リスク             |
| 21–50  | 高リスク             |
| 51+    | テスト困難           |

**限界**: Cyclomatic Complexityは「テストしやすさ」（分岐の数）を測定するが、「理解しやすさ」は測定しない。同じスコアでもコードの可読性は大きく異なる可能性がある。また、1976年のFortranを前提とした設計のため、try/catchやラムダなどのモダン構文を適切に扱えない。

#### Cognitive Complexity（SonarSource、2016年）

G. Ann Campbell（SonarSource）が提案した、**コードの理解しやすさ**を定量化するメトリクス。Cyclomatic Complexityへの批判から生まれた。

スコアリングの3原則は以下の通りです。

1. **無視**: 複数文を1つに簡潔にまとめる構造は加算しない
2. **+1加算**: 線形フローを中断する構造（if/else、ループ等）ごとに +1
3. **ネストペナルティ**: ネストが深くなるほど追加で +1

```python
def sum_of_primes(max):
    total = 0
    for i in range(max):         # +1
        for j in range(2, i):    # +2（ネスト+1）
            if i % j == 0:       # +3（ネスト+2）
                break            # +1
        else:
            total += i
    return total
# Cyclomatic Complexity = 4、Cognitive Complexity = 7
```

二重ループのネスト構造が直感的に反映されている。Cyclomatic Complexityより人間の認知負荷に近い値を示すとされる。

#### なぜ両方必要か

| 観点           | Cyclomatic Complexity    | Cognitive Complexity           |
| -------------- | ------------------------ | ------------------------------ |
| 測定対象       | テスタビリティ（分岐数） | 理解しやすさ（ネスト構造含む） |
| switch文の扱い | caseごとに+1             | 全体で+1のみ                   |
| try/catch      | 考慮しない               | +1加算                         |
| 歴史           | 50年・実績豊富           | 10年・研究途上                 |

実務では「CCNがテスト網羅性の基準」として使いつつ、「Cognitive Complexityがリファクタリング優先度の判断」に使うというアプローチが現実的だ。

### カバレッジの階層

テストの「量」と「質」を段階的に測定する3層構造。

```
Line Coverage       ← テストが「実行した行」を測る
  ↓ より厳しい
Branch Coverage     ← テストが「条件分岐の両側」を通ったかを測る
  ↓ さらに厳しい
Mutation Coverage   ← テストが「実際にバグを検出できるか」を測る
```

#### Line / Branch Coverage

```
Line Coverage   = 実行された行数 / 全実行可能行数 × 100%
Branch Coverage = 実行された分岐数 / 全分岐数 × 100%
```

計算コストは低く、CI/CDに組み込みやすい。しかし、アサーションが1つもなくても数値が上がる問題がある。

#### Mutation Coverage（Mutation Score）

コードに意図的なバグ（mutant）を注入し、テストスイートがそれを検出できるかを測定する。

$$\text{Mutation Score} = \frac{\text{Killed Mutants}}{\text{Total Mutants} - \text{Equivalent Mutants}} \times 100$$

カバレッジ100%でもMutation Scoreが低い場合、テストが「実行しているだけでアサーションが機能していない」状態を示す。テストの「質」を測定できる唯一の指標だが、計算コストが非常に高い。

このブログでの運用については、[Mutation Testing サーベイ](/techblog/development/mutation_testing_survey)記事で詳細を解説している。

### LLMコード生成の評価指標

LLMが生成したコードを評価するためのメトリクスは、人間のコード評価とは異なる課題を持つ。

#### pass@k（HumanEval、2021年）

OpenAIのChen et al.（2021）が提案した関数的正確性に基づく評価指標。$k$個の解を生成したとき、少なくとも1つがユニットテストを通過する確率。

$$\text{pass}@k = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}$$

- $n$：生成した解の総数
- $c$：テストを通過した解の数
- $k$：選択する解の数

単純なサンプリングでは系統的な過小推定が生じるため、U統計量に基づく不偏推定量を使う。

**pass@1** は単発補完の評価に、**pass@10** や **pass@100** はモデル能力の上限測定に使われる。

**限界**: テストケースの品質に強く依存する。不完全なテストで19〜29%の過大評価が報告されている。また、HumanEvalは比較的簡単な問題（164問）が中心で、実務の複雑さを反映しにくい。

#### CodeBLEU（2020年）

テキスト類似度ベースのBLEUをコードの構文・意味情報で拡張した指標。

$$\text{CodeBLEU} = \alpha \cdot \text{BLEU} + \beta \cdot \text{BLEU}_{weight} + \gamma \cdot \text{Match}_{AST} + \delta \cdot \text{Match}_{DF}$$

| 成分                   | 説明                                           |
| ---------------------- | ---------------------------------------------- |
| BLEU                   | n-gramによる字面上の類似度                     |
| $\text{BLEU}_{weight}$ | キーワード（`for`, `if` 等）に重みをつけたBLEU |
| $\text{Match}_{AST}$   | 抽象構文木の一致度（構文的正確性）             |
| $\text{Match}_{DF}$    | データフローグラフの一致度（意味的正確性）     |

**限界**: 参照実装との類似度を測るため、機能的に等価な別実装を過小評価する。単一の「正解コード」を前提にしており、多様な正解を扱えない。

#### 現在の評価指標の限界とHarness Evalへの示唆

pass@kもCodeBLEUも、**単発の生成品質**を評価するのに向いている。しかし、Harness Engineeringの文脈では、エージェントが継続的に生成するコードの品質を**プロジェクトレベルで**追跡したい。

そのためには以下の組み合わせが実用的だ。

| 目的                 | 指標                        | ツール            |
| -------------------- | --------------------------- | ----------------- |
| コードの理解しやすさ | Cognitive Complexity        | lizard            |
| テストの到達範囲     | Branch Coverage             | vitest --coverage |
| テストの検出能力     | Mutation Score              | Stryker           |
| 技術的負債の傾向     | Code Churn + Defect Density | Git log分析       |

---

## このブログへの導入

このブログ（illumination-k.dev）のモノレポに、複雑度メトリクスを追加して全品質指標を一括トラッキングする仕組みを構築した。

### 現状の確認

既存のセットアップは以下の通り。

```bash
pnpm test:coverage    # vitest --coverage（Line/Branch Coverage）
pnpm test:mutation    # Stryker mutation testing（Mutation Score）
```

`scripts/collect-metrics.ts` がcoverage-summary.jsonとStrykerのmutation.jsonを集約し、`scripts/format-metrics-comment.ts` がGitHub PRコメント用にフォーマットする仕組みは既にある。

しかし、複雑度メトリクスは計測していなかった。

### lizardによる複雑度計測の追加

**lizard** はPython製の複雑度解析ツールで、多言語に対応しておりTypeScript・Go・Rust・C++など15言語以上をサポートしている。

```bash
pip install lizard

# TypeScriptパッケージの複雑度を計測（テストファイル除外）
lizard packages/ cli/src/ --languages ts -x "**/*.test.ts" --csv
```

CSVの列構成: `NLOC, CCN, token, PARAM, length, location, file, function, long_name, start, end`

このブログの現在の計測値（2026-03-29時点）。

| 指標              | 値                                           |
| ----------------- | -------------------------------------------- |
| 対象関数数        | 94                                           |
| 平均CCN           | 2.21                                         |
| 最大CCN           | 22（ipynb_schema.v4.4.ts の `invalidValue`） |
| CCN > 10 の関数数 | 2                                            |

平均CCNが2.21という値は健全だ。最大値22の `invalidValue` 関数はJSONスキーマのバリデーションロジックで、構造上複雑にならざるを得ない箇所なので、threshold警告の対象外として扱う。

### collect-metrics.ts の拡張

`scripts/collect-metrics.ts` にlizardによる複雑度集計を追加した。

```typescript title=scripts/collect-metrics.ts
interface ComplexityMetrics {
  functions: number;
  avgCCN: number;
  maxCCN: number;
  highCCNCount: number; // CCN > 10 の関数数
}

function collectComplexity(): ComplexityMetrics {
  const { execSync } = require("node:child_process");
  try {
    const csv = execSync(
      "lizard packages/ cli/src/ --languages ts -x '**/*.test.ts' --csv",
      { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }
    );
    const rows = csv
      .trim()
      .split("\n")
      .map((l: string) => l.split(","));
    const ccns = rows
      .filter((r: string[]) => r.length > 1 && /^\d+$/.test(r[1]))
      .map((r: string[]) => parseInt(r[1]));
    if (ccns.length === 0) return { functions: 0, avgCCN: 0, maxCCN: 0, highCCNCount: 0 };
    return {
      functions: ccns.length,
      avgCCN: Math.round((ccns.reduce((a: number, b: number) => a + b, 0) / ccns.length) * 100) / 100,
      maxCCN: Math.max(...ccns),
      highCCNCount: ccns.filter((c: number) => c > 10).length,
    };
  } catch {
    return { functions: 0, avgCCN: 0, maxCCN: 0, highCCNCount: 0 };
  }
}
```

`MetricsSnapshot` に `complexity` フィールドを追加し、`main()` 内で `collectComplexity()` を呼ぶだけで既存のスクリプトと統合できる。

### format-metrics-comment.ts の拡張

PRコメントに複雑度セクションを追加。

```typescript title=scripts/format-metrics-comment.ts
const cx = metrics.complexity;
const complexitySection = cx
  ? `
### Complexity
| Metric | Value |
|--------|-------|
| Functions | ${cx.functions} |
| Avg CCN | ${cx.avgCCN} |
| Max CCN | ${cx.maxCCN} |
| High CCN (>10) | ${cx.highCCNCount} |
`
  : "";
```

### 全メトリクスをまとめて実行するスクリプト

`package.json` に `metrics` スクリプトを追加した。

```json title=package.json
{
  "scripts": {
    "metrics": "run-s test:coverage test:mutation && npx tsx scripts/collect-metrics.ts"
  }
}
```

カバレッジ → Mutation Testing → 複雑度の順に実行し、最終的な全メトリクスをJSON出力する。

### 現在のトラッキング状況

```json
{
  "date": "2026-03-29",
  "coverage": {
    "lines": 70.98,
    "branches": 57.37,
    "functions": 69.05,
    "statements": 70.98
  },
  "mutation": {
    "score": 47.49,
    "killed": 546,
    "survived": 604,
    "total": 1156
  },
  "complexity": {
    "functions": 94,
    "avgCCN": 2.21,
    "maxCCN": 22,
    "highCCNCount": 2
  }
}
```

Mutation Score 47.49% は「テストが存在するが検出能力が低い」状態を示している。次のアクションはBranch CoverageとMutation Scoreの改善であり、CCNについては高複雑度関数2つをリファクタリング候補として管理する。

---

## まとめ

Harness Engineeringは「プロンプトを工夫する」から「エージェントが正しく動ける仕組みを作る」への転換を意味する。その仕組みの中核の1つが、生成コードの品質を継続的に数値化・追跡することだ。

コード品質メトリクスは目的によって使い分ける必要がある。

- **複雑度**（Cyclomatic/Cognitive Complexity）→ リファクタリング優先度の判断
- **Branch Coverage** → テストの到達範囲の確認
- **Mutation Score** → テストの検出能力の測定
- **pass@k** → LLMが生成したコードの単発品質評価

このブログでは既存のStryker + vitest coverageにlizardによる複雑度計測を追加し、`pnpm metrics` コマンドで全指標を一括収集できるようにした。メトリクスはPRコメントとして自動投稿され、`web/src/data/metrics-history.json` に時系列で蓄積される。

数値を取り続けることで「エージェントが生成したコードが時間経過でどう変化しているか」が見えてくる。これがHarness Evalの出発点だ。

## References

- [Harness Engineering — Martin Fowler](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html)
- [Harness engineering: leveraging Codex in an agent-first world — OpenAI](https://openai.com/index/harness-engineering/)
- [My AI Adoption Journey — Mitchell Hashimoto](https://mitchellh.com/writing/my-ai-adoption-journey)
- [Cognitive Complexity: An Overview and Evaluation — G. Ann Campbell (2018)](https://www.sonarsource.com/resources/cognitive-complexity/)
- [Evaluating Large Language Models Trained on Code — Chen et al. (2021, arXiv:2107.03374)](https://arxiv.org/abs/2107.03374)
- [CodeBLEU: a Method for Automatic Evaluation of Code Synthesis — Ren et al. (2020, arXiv:2009.10297)](https://arxiv.org/abs/2009.10297)
- [lizard — GitHub](https://github.com/terryyin/lizard)
- [Demystifying Evals for AI Agents — Anthropic Engineering](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
