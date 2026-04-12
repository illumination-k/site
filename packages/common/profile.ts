import { z } from "zod";

export const profileEmploymentSchema = z.object({
  organizationName: z.string(),
  departmentName: z.string().optional(),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ProfileEmployment = z.infer<typeof profileEmploymentSchema>;

export const profileEducationSchema = z.object({
  organizationName: z.string(),
  departmentName: z.string().optional(),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ProfileEducation = z.infer<typeof profileEducationSchema>;

export const profileWorkSchema = z.object({
  title: z.string(),
  journalTitle: z.string().optional(),
  publicationYear: z.number().optional(),
  doi: z.string().optional(),
  url: z.string().optional(),
  type: z.string().optional(),
  citationCount: z.number().optional(),
});

export type ProfileWork = z.infer<typeof profileWorkSchema>;

export const profileDumpSchema = z.object({
  orcidId: z.string(),
  fetchedAt: z.string(),
  employments: z.array(profileEmploymentSchema),
  educations: z.array(profileEducationSchema),
  works: z.array(profileWorkSchema),
});

export type ProfileDump = z.infer<typeof profileDumpSchema>;
