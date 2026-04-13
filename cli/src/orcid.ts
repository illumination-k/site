import type {
  ProfileDump,
  ProfileEducation,
  ProfileEmployment,
  ProfileWork,
} from "common/profile";
import { logger } from "./logger";

const ORCID_API_BASE = "https://pub.orcid.org/v3.0";

async function fetchOrcidJson(
  orcidId: string,
  endpoint: string,
): Promise<unknown> {
  const url = `${ORCID_API_BASE}/${orcidId}/${endpoint}`;
  logger.info({ url }, `Fetching ORCID ${endpoint}`);

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `ORCID API error: ${res.status} ${res.statusText} for ${url}`,
    );
  }

  return res.json();
}

function formatOrcidDate(
  date: OrcidDate | null | undefined,
): string | undefined {
  if (!date?.year?.value) return undefined;
  const parts = [date.year.value];
  if (date.month?.value) {
    parts.push(date.month.value.padStart(2, "0"));
  }
  return parts.join("-");
}

interface OrcidDatePart {
  value: string;
}

interface OrcidDate {
  year?: OrcidDatePart | null;
  month?: OrcidDatePart | null;
  day?: OrcidDatePart | null;
}

interface OrcidOrganization {
  name: string;
}

interface OrcidAffiliationSummary {
  "department-name"?: string | null;
  "role-title"?: string | null;
  "start-date"?: OrcidDate | null;
  "end-date"?: OrcidDate | null;
  organization: OrcidOrganization;
}

interface OrcidAffiliationGroup {
  summaries: Record<string, OrcidAffiliationSummary>[];
}

interface OrcidExternalId {
  "external-id-type": string;
  "external-id-value": string;
  "external-id-url"?: { value: string } | null;
}

interface OrcidWorkSummary {
  "put-code": number;
  title: { title: { value: string } };
  "journal-title"?: { value: string } | null;
  "publication-date"?: OrcidDate | null;
  "external-ids"?: {
    "external-id"?: OrcidExternalId[];
  };
  type?: string;
  url?: { value: string } | null;
}

interface OrcidWorkGroup {
  "work-summary": OrcidWorkSummary[];
}

function parseAffiliations(
  groups: OrcidAffiliationGroup[],
  summaryKey: string,
): (ProfileEmployment | ProfileEducation)[] {
  const results: (ProfileEmployment | ProfileEducation)[] = [];

  for (const group of groups) {
    for (const summaryObj of group.summaries) {
      const summary = summaryObj[summaryKey];
      if (!summary) continue;

      results.push({
        organizationName: summary.organization.name,
        departmentName: summary["department-name"] ?? undefined,
        role: summary["role-title"] ?? undefined,
        startDate: formatOrcidDate(summary["start-date"]),
        endDate: formatOrcidDate(summary["end-date"]),
      });
    }
  }

  // Sort by startDate descending (most recent first)
  results.sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
  return results;
}

export async function fetchEmployments(
  orcidId: string,
): Promise<ProfileEmployment[]> {
  const data = (await fetchOrcidJson(orcidId, "employments")) as {
    "affiliation-group": OrcidAffiliationGroup[];
  };
  return parseAffiliations(data["affiliation-group"], "employment-summary");
}

export async function fetchEducations(
  orcidId: string,
): Promise<ProfileEducation[]> {
  const data = (await fetchOrcidJson(orcidId, "educations")) as {
    "affiliation-group": OrcidAffiliationGroup[];
  };
  return parseAffiliations(data["affiliation-group"], "education-summary");
}

function selectPreferredSummary(
  summaries: OrcidWorkSummary[],
): OrcidWorkSummary | undefined {
  // Prefer non-preprint version when duplicates exist in the same group
  const nonPreprint = summaries.find((s) => s.type !== "preprint");
  return nonPreprint ?? summaries[0];
}

// Threshold for Jaccard similarity above which two titles are treated as
// the same work. 0.85 tolerates minor word-level edits (a few changed,
// added, or dropped tokens out of ~20) without merging genuinely distinct
// papers that happen to share common nouns like "Marchantia polymorpha".
export const TITLE_SIMILARITY_THRESHOLD = 0.85;

function tokenizeTitle(title: string): Set<string> {
  return new Set(
    title
      .replace(/<[^>]+>/g, " ") // strip HTML tags like <i>
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 0),
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function titleSimilarity(a: string, b: string): number {
  return jaccardSimilarity(tokenizeTitle(a), tokenizeTitle(b));
}

export function dedupeWorksByTitle(works: ProfileWork[]): ProfileWork[] {
  // ORCID groups duplicates by external-id, but a preprint and its published
  // version often have different DOIs and end up in separate groups. Collapse
  // them here by fuzzy title matching, preferring the non-preprint version.
  type Entry = { work: ProfileWork; tokens: Set<string> };
  const result: Entry[] = [];

  for (const work of works) {
    const tokens = tokenizeTitle(work.title);
    let matchedIdx = -1;
    for (let i = 0; i < result.length; i++) {
      const existing = result[i];
      if (!existing) continue;
      if (
        jaccardSimilarity(tokens, existing.tokens) >= TITLE_SIMILARITY_THRESHOLD
      ) {
        matchedIdx = i;
        break;
      }
    }
    if (matchedIdx === -1) {
      result.push({ work, tokens });
      continue;
    }
    const existing = result[matchedIdx];
    if (!existing) continue;
    const existingIsPreprint = existing.work.type === "preprint";
    const candidateIsPreprint = work.type === "preprint";
    if (existingIsPreprint && !candidateIsPreprint) {
      result[matchedIdx] = { work, tokens };
    }
  }

  return result.map((entry) => entry.work);
}

export async function fetchCitationCount(
  doi: string,
): Promise<number | undefined> {
  // NOTE: Crossref's /works/{doi} route does not support the `select` query
  // parameter (it returns HTTP 400). Request the full record instead.
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=illumination.k.contact@gmail.com`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "illumination-k.dev/1.0 (mailto:illumination.k.contact@gmail.com)",
      },
    });
    if (!res.ok) {
      logger.warn({ doi, status: res.status }, "Crossref API request failed");
      return undefined;
    }
    const data = (await res.json()) as {
      message: { "is-referenced-by-count"?: number };
    };
    return data.message["is-referenced-by-count"];
  } catch (err) {
    logger.warn({ doi, err }, "Failed to fetch citation count from Crossref");
    return undefined;
  }
}

export async function fetchWorks(orcidId: string): Promise<ProfileWork[]> {
  const data = (await fetchOrcidJson(orcidId, "works")) as {
    group: OrcidWorkGroup[];
  };

  const collected: ProfileWork[] = [];

  for (const group of data.group) {
    const summary = selectPreferredSummary(group["work-summary"] ?? []);
    if (!summary) continue;

    const externalIds = summary["external-ids"]?.["external-id"] ?? [];
    const doiId = externalIds.find((id) => id["external-id-type"] === "doi");

    collected.push({
      title: summary.title.title.value,
      journalTitle: summary["journal-title"]?.value ?? undefined,
      publicationYear: summary["publication-date"]?.year?.value
        ? Number.parseInt(summary["publication-date"].year.value, 10)
        : undefined,
      doi: doiId?.["external-id-value"] ?? undefined,
      url: doiId?.["external-id-url"]?.value ?? summary.url?.value ?? undefined,
      type: summary.type ?? undefined,
    });
  }

  const works = dedupeWorksByTitle(collected);

  // Fetch citation counts from Crossref for works with DOIs
  const worksWithDoi = works.filter((w) => w.doi);
  if (worksWithDoi.length > 0) {
    logger.info(
      { count: worksWithDoi.length },
      "Fetching citation counts from Crossref",
    );
    // Process sequentially with small batches to respect rate limits
    for (const work of worksWithDoi) {
      if (work.doi) {
        work.citationCount = await fetchCitationCount(work.doi);
      }
    }
  }

  // Sort by publication year descending
  works.sort((a, b) => (b.publicationYear ?? 0) - (a.publicationYear ?? 0));
  return works;
}

export async function fetchOrcidProfile(orcidId: string): Promise<ProfileDump> {
  logger.info({ orcidId }, "Fetching ORCID profile");

  const [employments, educations, works] = await Promise.all([
    fetchEmployments(orcidId),
    fetchEducations(orcidId),
    fetchWorks(orcidId),
  ]);

  logger.info(
    {
      employments: employments.length,
      educations: educations.length,
      works: works.length,
    },
    "ORCID profile fetched",
  );

  return {
    orcidId,
    fetchedAt: new Date().toISOString(),
    employments,
    educations,
    works,
  };
}
