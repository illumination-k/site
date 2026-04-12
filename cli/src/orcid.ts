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

export async function fetchWorks(orcidId: string): Promise<ProfileWork[]> {
  const data = (await fetchOrcidJson(orcidId, "works")) as {
    group: OrcidWorkGroup[];
  };

  const works: ProfileWork[] = [];

  for (const group of data.group) {
    // Use the first (preferred) work summary in each group
    const summary = group["work-summary"]?.[0];
    if (!summary) continue;

    const externalIds = summary["external-ids"]?.["external-id"] ?? [];
    const doiId = externalIds.find((id) => id["external-id-type"] === "doi");

    works.push({
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
