/**
 * Collect coverage and mutation testing metrics from report files.
 * Outputs a JSON object with summary data.
 *
 * Usage: npx tsx scripts/collect-metrics.ts [--update-history]
 *
 * When --update-history is passed, appends the metrics to web/src/data/metrics-history.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface CoverageEntry {
  lines: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
}

interface MutationReport {
  files: Record<
    string,
    { mutants: Array<{ status: string }> }
  >;
}

interface ComplexityMetrics {
  functions: number;
  avgCCN: number;
  maxCCN: number;
  highCCNCount: number;
}

interface MetricsSnapshot {
  date: string;
  sha: string;
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  mutation: {
    score: number;
    killed: number;
    survived: number;
    timeout: number;
    noCoverage: number;
    total: number;
  };
  complexity: ComplexityMetrics;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function collectCoverage(): MetricsSnapshot["coverage"] {
  const packages = ["packages/md-plugins", "packages/ipynb2md", "cli", "web"];
  let totalLines = 0,
    coveredLines = 0;
  let totalStatements = 0,
    coveredStatements = 0;
  let totalFunctions = 0,
    coveredFunctions = 0;
  let totalBranches = 0,
    coveredBranches = 0;

  for (const pkg of packages) {
    const summaryPath = join(root, pkg, "coverage", "coverage-summary.json");
    if (!existsSync(summaryPath)) continue;

    const data = JSON.parse(readFileSync(summaryPath, "utf-8"));
    const total: CoverageEntry = data.total;

    totalLines += total.lines.total;
    coveredLines += total.lines.covered;
    totalStatements += total.statements.total;
    coveredStatements += total.statements.covered;
    totalFunctions += total.functions.total;
    coveredFunctions += total.functions.covered;
    totalBranches += total.branches.total;
    coveredBranches += total.branches.covered;
  }

  const pct = (covered: number, total: number) =>
    total === 0 ? 0 : Math.round((covered / total) * 10000) / 100;

  return {
    lines: pct(coveredLines, totalLines),
    statements: pct(coveredStatements, totalStatements),
    functions: pct(coveredFunctions, totalFunctions),
    branches: pct(coveredBranches, totalBranches),
  };
}

function collectMutation(): MetricsSnapshot["mutation"] {
  const reportPath = join(root, "reports", "mutation", "mutation.json");
  if (!existsSync(reportPath)) {
    return { score: 0, killed: 0, survived: 0, timeout: 0, noCoverage: 0, total: 0 };
  }

  const data: MutationReport = JSON.parse(readFileSync(reportPath, "utf-8"));
  let killed = 0,
    survived = 0,
    timeout = 0,
    noCoverage = 0,
    total = 0;

  for (const file of Object.values(data.files)) {
    for (const mutant of file.mutants) {
      total++;
      switch (mutant.status) {
        case "Killed":
          killed++;
          break;
        case "Survived":
          survived++;
          break;
        case "Timeout":
          timeout++;
          break;
        case "NoCoverage":
          noCoverage++;
          break;
      }
    }
  }

  const detected = killed + timeout;
  const score = total === 0 ? 0 : Math.round((detected / total) * 10000) / 100;

  return { score, killed, survived, timeout, noCoverage, total };
}

function collectComplexity(): ComplexityMetrics {
  try {
    const csv = execSync(
      "lizard packages/ cli/src/ --languages ts -x '**/*.test.ts' --csv",
      { encoding: "utf-8", cwd: root, stdio: ["pipe", "pipe", "ignore"] }
    );
    const ccns = csv
      .trim()
      .split("\n")
      .map((l) => l.split(","))
      .filter((r) => r.length > 1 && /^\d+$/.test(r[1]))
      .map((r) => parseInt(r[1]));
    if (ccns.length === 0) return { functions: 0, avgCCN: 0, maxCCN: 0, highCCNCount: 0 };
    return {
      functions: ccns.length,
      avgCCN: Math.round((ccns.reduce((a, b) => a + b, 0) / ccns.length) * 100) / 100,
      maxCCN: Math.max(...ccns),
      highCCNCount: ccns.filter((c) => c > 10).length,
    };
  } catch {
    return { functions: 0, avgCCN: 0, maxCCN: 0, highCCNCount: 0 };
  }
}

function main() {
  const sha = process.env.GITHUB_SHA?.slice(0, 7) ?? "local";
  const date = new Date().toISOString().split("T")[0];
  const updateHistory = process.argv.includes("--update-history");

  const snapshot: MetricsSnapshot = {
    date,
    sha,
    coverage: collectCoverage(),
    mutation: collectMutation(),
    complexity: collectComplexity(),
  };

  // Always output to stdout
  console.log(JSON.stringify(snapshot, null, 2));

  if (updateHistory) {
    const historyDir = join(root, "web", "src", "data");
    const historyPath = join(historyDir, "metrics-history.json");

    if (!existsSync(historyDir)) {
      mkdirSync(historyDir, { recursive: true });
    }

    const history: MetricsSnapshot[] = existsSync(historyPath)
      ? JSON.parse(readFileSync(historyPath, "utf-8"))
      : [];

    // Deduplicate by date+sha
    const exists = history.some((h) => h.date === date && h.sha === sha);
    if (!exists) {
      history.push(snapshot);
      // Keep last 100 entries
      const trimmed = history.slice(-100);
      writeFileSync(historyPath, JSON.stringify(trimmed, null, 2) + "\n");
      console.error(`Updated metrics history (${trimmed.length} entries)`);
    } else {
      console.error("Entry already exists, skipping");
    }
  }
}

main();
