import { readFileSync } from "node:fs";
import { join } from "node:path";

import { css } from "@/styled-system/css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quality Metrics",
  description:
    "illumination-k.dev のコード品質メトリクス — テストカバレッジとミューテーションスコアの推移",
};

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
}

const raw = readFileSync(
  join(process.cwd(), "src/data/metrics-history.ndjson"),
  "utf-8",
);
const history = raw
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line) as MetricsSnapshot);
const latest = history[history.length - 1];

function MetricCard({
  label,
  value,
  suffix = "%",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div
      className={css({
        bg: "bg.surface",
        borderWidth: 1,
        borderColor: "border.default",
        rounded: "xl",
        px: { base: 4, md: 6 },
        py: { base: 4, md: 5 },
        textAlign: "center",
      })}
    >
      <p
        className={css({
          color: "text.tertiary",
          fontSize: { base: "xs", md: "sm" },
          mb: 1,
        })}
      >
        {label}
      </p>
      <p
        className={css({
          fontSize: { base: "2xl", md: "3xl" },
          fontWeight: "black",
          color: "accent.primary",
        })}
      >
        {value}
        <span className={css({ fontSize: "lg", fontWeight: "medium" })}>
          {suffix}
        </span>
      </p>
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className={css({ mb: 3 })}>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          mb: 1,
        })}
      >
        <span className={css({ fontSize: "sm", color: "text.secondary" })}>
          {label}
        </span>
        <span
          className={css({
            fontSize: "sm",
            fontWeight: "bold",
            color: "text.primary",
          })}
        >
          {value}%
        </span>
      </div>
      <div
        className={css({
          h: 2,
          bg: "bg.page",
          rounded: "full",
          overflow: "hidden",
        })}
      >
        <div
          className={css({
            h: "full",
            bg: "accent.primary",
            rounded: "full",
            transition: "all",
          })}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function SparklineSvg({
  data,
  color = "currentColor",
}: {
  data: number[];
  color?: string;
}) {
  if (data.length === 0) return null;

  const width = 300;
  const height = 60;
  const padding = 4;

  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x =
      padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((v - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={css({ w: "full", h: "60px" })}
      role="img"
      aria-label="Metrics trend chart"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
      {data.length > 0 && (
        <circle
          cx={points[points.length - 1].split(",")[0]}
          cy={points[points.length - 1].split(",")[1]}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
}

function TrendSection({
  title,
  data,
  color,
}: {
  title: string;
  data: { date: string; value: number }[];
  color: string;
}) {
  return (
    <div
      className={css({
        bg: "bg.surface",
        borderWidth: 1,
        borderColor: "border.default",
        rounded: "xl",
        px: { base: 4, md: 6 },
        py: { base: 4, md: 5 },
      })}
    >
      <h3
        className={css({
          fontSize: { base: "sm", md: "md" },
          fontWeight: "bold",
          color: "text.primary",
          mb: 3,
        })}
      >
        {title}
      </h3>
      <SparklineSvg data={data.map((d) => d.value)} color={color} />
      {data.length > 1 && (
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            mt: 1,
          })}
        >
          <span className={css({ fontSize: "xs", color: "text.tertiary" })}>
            {data[0].date}
          </span>
          <span className={css({ fontSize: "xs", color: "text.tertiary" })}>
            {data[data.length - 1].date}
          </span>
        </div>
      )}
    </div>
  );
}

export default function MetricsPage() {
  const coverageLinesTrend = history.map((h) => ({
    date: h.date,
    value: h.coverage.lines,
  }));
  const mutationScoreTrend = history.map((h) => ({
    date: h.date,
    value: h.mutation.score,
  }));

  return (
    <div
      className={css({
        maxW: "3xl",
        mx: "auto",
        px: { base: 5, md: 8 },
        py: { base: 8, md: 12 },
      })}
    >
      <h1
        className={css({
          fontSize: { base: "2xl", md: "3xl" },
          fontWeight: "black",
          textAlign: "center",
          color: "text.primary",
          mb: 2,
        })}
      >
        Quality Metrics
      </h1>
      <p
        className={css({
          textAlign: "center",
          color: "text.tertiary",
          fontSize: "sm",
          mb: { base: 8, md: 10 },
        })}
      >
        テストカバレッジとミューテーションスコアの推移
      </p>

      {/* Key Metrics */}
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 4,
          mb: 8,
        })}
      >
        <MetricCard label="Line Coverage" value={latest.coverage.lines} />
        <MetricCard label="Branch Coverage" value={latest.coverage.branches} />
        <MetricCard label="Mutation Score" value={latest.mutation.score} />
        <MetricCard
          label="Mutants Killed"
          value={latest.mutation.killed}
          suffix={` / ${latest.mutation.total}`}
        />
      </div>

      {/* Coverage Detail */}
      <section
        className={css({
          bg: "bg.surface",
          borderWidth: 1,
          borderColor: "border.default",
          rounded: "xl",
          px: { base: 5, md: 7 },
          py: { base: 5, md: 6 },
          mb: 6,
        })}
      >
        <h2
          className={css({
            fontSize: { base: "lg", md: "xl" },
            fontWeight: "bold",
            color: "text.primary",
            mb: 4,
            display: "flex",
            alignItems: "center",
            gap: 2,
            _before: {
              content: '""',
              display: "block",
              w: 1,
              h: 5,
              bg: "accent.primary",
              rounded: "full",
              flexShrink: 0,
            },
          })}
        >
          Test Coverage
        </h2>
        <ProgressBar label="Lines" value={latest.coverage.lines} />
        <ProgressBar label="Statements" value={latest.coverage.statements} />
        <ProgressBar label="Functions" value={latest.coverage.functions} />
        <ProgressBar label="Branches" value={latest.coverage.branches} />
      </section>

      {/* Mutation Detail */}
      <section
        className={css({
          bg: "bg.surface",
          borderWidth: 1,
          borderColor: "border.default",
          rounded: "xl",
          px: { base: 5, md: 7 },
          py: { base: 5, md: 6 },
          mb: 6,
        })}
      >
        <h2
          className={css({
            fontSize: { base: "lg", md: "xl" },
            fontWeight: "bold",
            color: "text.primary",
            mb: 4,
            display: "flex",
            alignItems: "center",
            gap: 2,
            _before: {
              content: '""',
              display: "block",
              w: 1,
              h: 5,
              bg: "accent.primary",
              rounded: "full",
              flexShrink: 0,
            },
          })}
        >
          Mutation Testing
        </h2>
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 3,
          })}
        >
          {[
            { label: "Killed", value: latest.mutation.killed },
            { label: "Survived", value: latest.mutation.survived },
            { label: "Timeout", value: latest.mutation.timeout },
            { label: "No Coverage", value: latest.mutation.noCoverage },
          ].map((item) => (
            <div
              key={item.label}
              className={css({
                bg: "bg.page",
                rounded: "lg",
                px: 4,
                py: 3,
                textAlign: "center",
              })}
            >
              <p
                className={css({
                  fontSize: "xs",
                  color: "text.tertiary",
                  mb: 0.5,
                })}
              >
                {item.label}
              </p>
              <p
                className={css({
                  fontSize: "xl",
                  fontWeight: "bold",
                  color: "text.primary",
                })}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <ProgressBar label="Mutation Score" value={latest.mutation.score} />
      </section>

      {/* Trends */}
      <h2
        className={css({
          fontSize: { base: "lg", md: "xl" },
          fontWeight: "bold",
          color: "text.primary",
          mb: 4,
          display: "flex",
          alignItems: "center",
          gap: 2,
          _before: {
            content: '""',
            display: "block",
            w: 1,
            h: 5,
            bg: "accent.primary",
            rounded: "full",
            flexShrink: 0,
          },
        })}
      >
        Trends
      </h2>
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "1fr", md: "1fr 1fr" },
          gap: 4,
          mb: 8,
        })}
      >
        <TrendSection
          title="Line Coverage"
          data={coverageLinesTrend}
          color="#0ea5e9"
        />
        <TrendSection
          title="Mutation Score"
          data={mutationScoreTrend}
          color="#8b5cf6"
        />
      </div>

      {/* History Table */}
      {history.length > 1 && (
        <section
          className={css({
            bg: "bg.surface",
            borderWidth: 1,
            borderColor: "border.default",
            rounded: "xl",
            px: { base: 5, md: 7 },
            py: { base: 5, md: 6 },
            overflow: "auto",
          })}
        >
          <h2
            className={css({
              fontSize: { base: "lg", md: "xl" },
              fontWeight: "bold",
              color: "text.primary",
              mb: 4,
              display: "flex",
              alignItems: "center",
              gap: 2,
              _before: {
                content: '""',
                display: "block",
                w: 1,
                h: 5,
                bg: "accent.primary",
                rounded: "full",
                flexShrink: 0,
              },
            })}
          >
            History
          </h2>
          <table
            className={css({
              w: "full",
              fontSize: "sm",
              "& th": {
                textAlign: "left",
                color: "text.tertiary",
                fontWeight: "medium",
                pb: 2,
                pr: 4,
              },
              "& td": {
                color: "text.secondary",
                py: 1.5,
                pr: 4,
                borderTopWidth: 1,
                borderColor: "border.default",
              },
            })}
          >
            <thead>
              <tr>
                <th>Date</th>
                <th>SHA</th>
                <th>Lines</th>
                <th>Branches</th>
                <th>Mutation</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h) => (
                <tr key={`${h.date}-${h.sha}`}>
                  <td>{h.date}</td>
                  <td>
                    <code className={css({ fontSize: "xs" })}>{h.sha}</code>
                  </td>
                  <td>{h.coverage.lines}%</td>
                  <td>{h.coverage.branches}%</td>
                  <td>{h.mutation.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p
        className={css({
          textAlign: "center",
          color: "text.tertiary",
          fontSize: "xs",
          mt: 10,
        })}
      >
        Updated: {latest.date} ({latest.sha})
      </p>
    </div>
  );
}
