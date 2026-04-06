import type { PostMeta } from "common";
import type { LintError } from "./lint";

interface CharLimits {
  min: number;
  max: number;
}

interface SeoLimits {
  title: CharLimits;
  description: CharLimits;
}

const SEO_LIMITS: Record<string, SeoLimits> = {
  en: {
    title: { min: 30, max: 70 },
    description: { min: 70, max: 160 },
  },
  ja: {
    title: { min: 15, max: 60 },
    description: { min: 50, max: 160 },
  },
};

const LINT_FIELDS = ["title", "description"] as const;

export function lintSeoMeta(
  meta: PostMeta,
  filePath: string,
  frontMatterLines: Map<string, number>,
): LintError[] {
  const limits = SEO_LIMITS[meta.lang] ?? SEO_LIMITS.en;
  const errors: LintError[] = [];

  for (const field of LINT_FIELDS) {
    const value = meta[field];
    const len = value.length;
    const { min, max } = limits[field];

    if (len < min) {
      errors.push({
        file: filePath,
        message: `${field} is too short for SEO (${len} chars, recommended minimum: ${min} for lang="${meta.lang}")`,
        line: frontMatterLines.get(field),
        ruleId: "seo-meta-length",
      });
    } else if (len > max) {
      errors.push({
        file: filePath,
        message: `${field} is too long for SEO (${len} chars, recommended maximum: ${max} for lang="${meta.lang}")`,
        line: frontMatterLines.get(field),
        ruleId: "seo-meta-length",
      });
    }
  }

  return errors;
}

export function extractFrontMatterLines(raw: string): Map<string, number> {
  const lines = raw.split("\n");
  const result = new Map<string, number>();
  let inFrontMatter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") {
      if (inFrontMatter) break;
      inFrontMatter = true;
      continue;
    }
    if (inFrontMatter) {
      const match = line.match(/^(\w+):/);
      if (match) {
        result.set(match[1], i + 1);
      }
    }
  }

  return result;
}
