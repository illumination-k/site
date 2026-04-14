import { describe, expect, it } from "vitest";

import {
  profileDumpSchema,
  profileEducationSchema,
  profileEmploymentSchema,
  profileWorkAuthorSchema,
  profileWorkSchema,
} from "./profile";

describe("profileEmploymentSchema", () => {
  it("parses a fully populated employment record", () => {
    const result = profileEmploymentSchema.parse({
      organizationName: "Acme Corp",
      departmentName: "Research",
      role: "Engineer",
      startDate: "2020-01",
      endDate: "2023-12",
    });

    expect(result.organizationName).toBe("Acme Corp");
    expect(result.role).toBe("Engineer");
  });

  it("requires organizationName", () => {
    expect(() => profileEmploymentSchema.parse({})).toThrow();
  });

  it("treats departmentName, role, startDate and endDate as optional", () => {
    const result = profileEmploymentSchema.parse({
      organizationName: "Solo LLC",
    });
    expect(result.organizationName).toBe("Solo LLC");
    expect(result.departmentName).toBeUndefined();
    expect(result.role).toBeUndefined();
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
  });

  it("rejects non-string organizationName", () => {
    expect(() =>
      profileEmploymentSchema.parse({ organizationName: 42 }),
    ).toThrow();
  });
});

describe("profileEducationSchema", () => {
  it("parses a fully populated education record", () => {
    const result = profileEducationSchema.parse({
      organizationName: "University X",
      departmentName: "CS",
      role: "PhD",
      startDate: "2015",
      endDate: "2019",
    });
    expect(result.organizationName).toBe("University X");
    expect(result.role).toBe("PhD");
  });

  it("requires organizationName", () => {
    expect(() => profileEducationSchema.parse({ role: "Student" })).toThrow();
  });

  it("accepts the minimum shape (just organizationName)", () => {
    const result = profileEducationSchema.parse({
      organizationName: "Some School",
    });
    expect(result.organizationName).toBe("Some School");
  });
});

describe("profileWorkAuthorSchema", () => {
  it("parses a name-only author", () => {
    const result = profileWorkAuthorSchema.parse({ name: "Jane Doe" });
    expect(result).toEqual({ name: "Jane Doe" });
  });

  it("parses a name with an ORCID", () => {
    const result = profileWorkAuthorSchema.parse({
      name: "Jane Doe",
      orcid: "0000-0000-0000-0001",
    });
    expect(result.orcid).toBe("0000-0000-0000-0001");
  });

  it("requires name", () => {
    expect(() => profileWorkAuthorSchema.parse({})).toThrow();
  });
});

describe("profileWorkSchema", () => {
  it("requires only the title field", () => {
    const result = profileWorkSchema.parse({ title: "A Paper" });
    expect(result.title).toBe("A Paper");
    expect(result.authors).toBeUndefined();
  });

  it("parses a fully populated work record", () => {
    const result = profileWorkSchema.parse({
      title: "Reproducible Research",
      journalTitle: "Nature",
      publicationYear: 2023,
      doi: "10.1000/example",
      url: "https://example.com/paper",
      type: "journal-article",
      citationCount: 42,
      authors: [
        { name: "Alice", orcid: "0000-0000-0000-0001" },
        { name: "Bob" },
      ],
    });

    expect(result.publicationYear).toBe(2023);
    expect(result.citationCount).toBe(42);
    expect(result.authors).toHaveLength(2);
    expect(result.authors?.[0].orcid).toBe("0000-0000-0000-0001");
  });

  it("rejects non-numeric publicationYear", () => {
    expect(() =>
      profileWorkSchema.parse({ title: "X", publicationYear: "2023" }),
    ).toThrow();
  });

  it("rejects non-numeric citationCount", () => {
    expect(() =>
      profileWorkSchema.parse({ title: "X", citationCount: "42" }),
    ).toThrow();
  });

  it("rejects authors entries missing a name", () => {
    expect(() =>
      profileWorkSchema.parse({
        title: "X",
        authors: [{ orcid: "0000-0000-0000-0001" }],
      }),
    ).toThrow();
  });

  it("requires title", () => {
    expect(() => profileWorkSchema.parse({})).toThrow();
  });
});

describe("profileDumpSchema", () => {
  function validDump() {
    return {
      orcidId: "0000-0000-0000-0001",
      fetchedAt: "2024-05-01T12:00:00Z",
      ownerNames: ["Jane Doe"],
      employments: [{ organizationName: "Acme" }],
      educations: [{ organizationName: "University X" }],
      works: [{ title: "Paper One" }],
    };
  }

  it("parses a complete dump", () => {
    const result = profileDumpSchema.parse(validDump());
    expect(result.orcidId).toBe("0000-0000-0000-0001");
    expect(result.ownerNames).toEqual(["Jane Doe"]);
    expect(result.works).toHaveLength(1);
  });

  it("defaults ownerNames to an empty array when omitted", () => {
    const { ownerNames: _omitted, ...dump } = validDump();
    const result = profileDumpSchema.parse(dump);
    expect(result.ownerNames).toEqual([]);
  });

  it("requires orcidId", () => {
    const { orcidId: _omitted, ...dump } = validDump();
    expect(() => profileDumpSchema.parse(dump)).toThrow();
  });

  it("requires fetchedAt", () => {
    const { fetchedAt: _omitted, ...dump } = validDump();
    expect(() => profileDumpSchema.parse(dump)).toThrow();
  });

  it("requires employments to be an array", () => {
    expect(() =>
      profileDumpSchema.parse({ ...validDump(), employments: "nope" }),
    ).toThrow();
  });

  it("requires educations to be an array", () => {
    expect(() =>
      profileDumpSchema.parse({ ...validDump(), educations: null }),
    ).toThrow();
  });

  it("requires works to be an array", () => {
    expect(() =>
      profileDumpSchema.parse({ ...validDump(), works: undefined }),
    ).toThrow();
  });

  it("rejects an employments entry with the wrong shape", () => {
    expect(() =>
      profileDumpSchema.parse({
        ...validDump(),
        employments: [{ role: "missing org name" }],
      }),
    ).toThrow();
  });

  it("rejects a works entry without a title", () => {
    expect(() =>
      profileDumpSchema.parse({
        ...validDump(),
        works: [{ journalTitle: "no title here" }],
      }),
    ).toThrow();
  });

  it("accepts empty arrays for employments, educations and works", () => {
    const result = profileDumpSchema.parse({
      orcidId: "0000-0000-0000-0001",
      fetchedAt: "2024-05-01T12:00:00Z",
      employments: [],
      educations: [],
      works: [],
    });
    expect(result.employments).toEqual([]);
    expect(result.educations).toEqual([]);
    expect(result.works).toEqual([]);
    expect(result.ownerNames).toEqual([]);
  });
});
