/**
 * Collect coverage and mutation testing metrics from report files.
 * Outputs a JSON object with summary data.
 *
 * Usage: npx tsx scripts/collect-metrics.ts [--update-history]
 *
 * When --update-history is passed, appends the metrics to web/src/data/metrics-history.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
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

interface MetricsSnapshot {
  date: string;
  sha: string;
  pr?: number;
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

function parsePrArg(): number | undefined {
  const idx = process.argv.indexOf("--pr");
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  const val = Number(process.argv[idx + 1]);
  return Number.isNaN(val) ? undefined : val;
}

function main() {
  const sha = process.env.GITHUB_SHA?.slice(0, 7) ?? "local";
  const date = new Date().toISOString().split("T")[0];
  const updateHistory = process.argv.includes("--update-history");
  const pr = parsePrArg();

  const snapshot: MetricsSnapshot = {
    date,
    sha,
    ...(pr != null ? { pr } : {}),
    coverage: collectCoverage(),
    mutation: collectMutation(),
  };

  // Always output to stdout
  console.log(JSON.stringify(snapshot, null, 2));

  if (updateHistory) {
    const historyDir = join(root, "web", "src", "data");
    const historyPath = join(historyDir, "metrics-history.ndjson");

    if (!existsSync(historyDir)) {
      mkdirSync(historyDir, { recursive: true });
    }

    const lines = existsSync(historyPath)
      ? readFileSync(historyPath, "utf-8").trim().split("\n").filter(Boolean)
      : [];

    if (pr != null) {
      // Upsert by PR number: replace existing entry for same PR
      const filtered = lines.filter((line) => {
        const h = JSON.parse(line) as MetricsSnapshot;
        return h.pr !== pr;
      });
      filtered.push(JSON.stringify(snapshot));
      const trimmed = filtered.slice(-100);
      writeFileSync(historyPath, trimmed.join("\n") + "\n");
      console.error(`Updated metrics for PR #${pr} (${trimmed.length} entries)`);
    } else {
      // Legacy: deduplicate by date+sha
      const exists = lines.some((line) => {
        const h = JSON.parse(line) as MetricsSnapshot;
        return h.date === date && h.sha === sha;
      });

      if (!exists) {
        lines.push(JSON.stringify(snapshot));
        const trimmed = lines.slice(-100);
        writeFileSync(historyPath, trimmed.join("\n") + "\n");
        console.error(`Updated metrics history (${trimmed.length} entries)`);
      } else {
        console.error("Entry already exists, skipping");
      }
    }
  }
}

main();
