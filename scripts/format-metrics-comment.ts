/**
 * Format metrics JSON (from stdin or file) as a GitHub PR comment markdown.
 *
 * Usage: npx tsx scripts/collect-metrics.ts | npx tsx scripts/format-metrics-comment.ts
 */

import { readFileSync } from "node:fs";

const input = readFileSync(process.stdin.fd, "utf-8");
const metrics = JSON.parse(input);

const cov = metrics.coverage;
const mut = metrics.mutation;
const cx = metrics.complexity as { functions: number; avgCCN: number; maxCCN: number; highCCNCount: number } | undefined;

const bar = (pct: number) => {
  const filled = Math.round(pct / 5);
  return "█".repeat(filled) + "░".repeat(20 - filled);
};

const complexitySection = cx
  ? `\n### Complexity\n| Metric | Value |\n|--------|-------|\n| Functions | ${cx.functions} |\n| Avg CCN | ${cx.avgCCN} |\n| Max CCN | ${cx.maxCCN} |\n| High CCN (>10) | ${cx.highCCNCount} |\n`
  : "";

const comment = `## 📊 Quality Metrics

### Coverage
| Metric | Coverage | |
|--------|----------|---|
| Lines | **${cov.lines}%** | \`${bar(cov.lines)}\` |
| Statements | **${cov.statements}%** | \`${bar(cov.statements)}\` |
| Functions | **${cov.functions}%** | \`${bar(cov.functions)}\` |
| Branches | **${cov.branches}%** | \`${bar(cov.branches)}\` |

### Mutation Testing
| Metric | Value |
|--------|-------|
| Mutation Score | **${mut.score}%** |
| Killed | ${mut.killed} |
| Survived | ${mut.survived} |
| Timeout | ${mut.timeout} |
| No Coverage | ${mut.noCoverage} |
| Total Mutants | ${mut.total} |
${complexitySection}
<sub>${metrics.sha} / ${metrics.date}</sub>`;

console.log(comment);
