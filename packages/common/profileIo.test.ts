import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileDump } from "./profile";
import { readProfileDump } from "./profileIo";

function makeValidDump(): ProfileDump {
  return {
    orcidId: "0000-0000-0000-0001",
    fetchedAt: "2024-05-01T12:00:00Z",
    ownerNames: ["Jane Doe"],
    employments: [{ organizationName: "Acme Corp", role: "Researcher" }],
    educations: [{ organizationName: "University X", departmentName: "CS" }],
    works: [
      {
        title: "A Paper",
        publicationYear: 2023,
        authors: [{ name: "Jane Doe", orcid: "0000-0000-0000-0001" }],
      },
    ],
  };
}

describe("readProfileDump", () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "common-profile-io-test-"));
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("parses a valid profile dump", async () => {
    const dumpPath = path.join(workDir, "profile.json");
    writeFileSync(dumpPath, JSON.stringify(makeValidDump()));

    const result = await readProfileDump(dumpPath);

    expect(result.orcidId).toBe("0000-0000-0000-0001");
    expect(result.ownerNames).toEqual(["Jane Doe"]);
    expect(result.employments).toHaveLength(1);
    expect(result.employments[0].organizationName).toBe("Acme Corp");
    expect(result.works[0].title).toBe("A Paper");
    expect(result.works[0].authors?.[0].orcid).toBe("0000-0000-0000-0001");
  });

  it("defaults ownerNames to [] when the field is missing from the file", async () => {
    const dumpPath = path.join(workDir, "profile.json");
    const { ownerNames: _omitted, ...dump } = makeValidDump();
    writeFileSync(dumpPath, JSON.stringify(dump));

    const result = await readProfileDump(dumpPath);
    expect(result.ownerNames).toEqual([]);
  });

  it("throws 'Invalid profile dump file' when schema validation fails", async () => {
    const dumpPath = path.join(workDir, "profile.json");
    writeFileSync(
      dumpPath,
      JSON.stringify({
        orcidId: "0000-0000-0000-0001",
        // Missing fetchedAt, employments, educations, works.
      }),
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(readProfileDump(dumpPath)).rejects.toBe(
      "Invalid profile dump file",
    );
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("throws when the JSON is malformed", async () => {
    const dumpPath = path.join(workDir, "profile.json");
    writeFileSync(dumpPath, "{ not valid json");

    await expect(readProfileDump(dumpPath)).rejects.toBeInstanceOf(SyntaxError);
  });

  it("rejects when the file does not exist", async () => {
    await expect(
      readProfileDump(path.join(workDir, "missing.json")),
    ).rejects.toBeDefined();
  });

  it("throws when works contain an entry missing the title field", async () => {
    const dumpPath = path.join(workDir, "profile.json");
    const dump = makeValidDump();
    // @ts-expect-error - intentionally invalid for test
    dump.works = [{ journalTitle: "no title" }];
    writeFileSync(dumpPath, JSON.stringify(dump));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(readProfileDump(dumpPath)).rejects.toBe(
      "Invalid profile dump file",
    );

    errorSpy.mockRestore();
  });
});
