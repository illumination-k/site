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

const bar = (pct: number) => {
  const filled = Math.round(pct / 5);
  return "█".repeat(filled) + "░".repeat(20 - filled);
};

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

<sub>${metrics.sha} / ${metrics.date}</sub>`;

console.log(comment);
