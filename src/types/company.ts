import { z } from "zod";

// Industry categories
export const IndustryEnum = z.enum([
  "technology",
  "finance",
  "healthcare",
  "retail",
  "manufacturing",
  "aerospace",
  "entertainment",
  "energy",
  "consulting",
  "other",
]);

// Data source for company info
export const CompanyDataSourceEnum = z.enum(["theorg", "manual", "levels_fyi"]);

// Department schema
export const DepartmentSchema = z.object({
  name: z.string(),
  employee_count: z.number(),
  roles: z.array(z.string()),
});

// Career level within a company
export const CompanyLevelSchema = z.object({
  title: z.string(), // "Software Engineer L3"
  level_code: z.string(), // "L3", "SDE I", "E3"
  years_experience: z.object({
    min: z.number(),
    max: z.number(),
  }),
  compensation: z
    .object({
      total_min: z.number(),
      total_median: z.number(),
      total_max: z.number(),
    })
    .optional(),
});

// Career ladder for a role family at a company
export const CompanyCareerLadderSchema = z.object({
  role_family: z.string(), // "Software Engineering", "Product Management"
  career_slug: z.string().optional(), // Link to career page: "software-developers"
  levels: z.array(CompanyLevelSchema),
});

// Mapping between company roles and O*NET occupations
export const OccupationMappingSchema = z.object({
  onet_code: z.string(), // "15-1252.00"
  slug: z.string(), // "software-developer"
  department: z.string(), // "Engineering"
  typical_titles: z.array(z.string()), // ["Software Engineer", "SWE", "Developer"]
});

// Full Company schema
export const CompanySchema = z.object({
  slug: z.string(),
  name: z.string(),
  industry: z.array(z.string()),
  employee_count: z.string(), // "10,000+", "5,001-10,000"
  headquarters: z.string(),
  description: z.string(),
  logo_url: z.string().optional(),
  theorg_url: z.string(),

  // Organizational structure
  departments: z.array(DepartmentSchema),

  // Career progression by role family
  career_ladders: z.array(CompanyCareerLadderSchema),

  // Mapping to careers in our system
  occupation_mappings: z.array(OccupationMappingSchema),

  // Metadata
  last_updated: z.string(),
  data_source: CompanyDataSourceEnum,
});

// Lightweight company index for lists
export const CompanyIndexSchema = z.object({
  slug: z.string(),
  name: z.string(),
  industry: z.array(z.string()),
  employee_count: z.string(),
  headquarters: z.string(),
  department_count: z.number(),
  logo_url: z.string().optional(),
});

// TypeScript types
export type Industry = z.infer<typeof IndustryEnum>;
export type CompanyDataSource = z.infer<typeof CompanyDataSourceEnum>;
export type Department = z.infer<typeof DepartmentSchema>;
export type CompanyLevel = z.infer<typeof CompanyLevelSchema>;
export type CompanyCareerLadder = z.infer<typeof CompanyCareerLadderSchema>;
export type OccupationMapping = z.infer<typeof OccupationMappingSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type CompanyIndex = z.infer<typeof CompanyIndexSchema>;

// Helper functions
export function formatEmployeeCount(count: string): string {
  return count.replace(/,/g, ",");
}

export function getIndustryColor(industry: string): string {
  const colors: Record<string, string> = {
    technology: "bg-blue-100 text-blue-800",
    finance: "bg-green-100 text-green-800",
    healthcare: "bg-rose-100 text-rose-800",
    retail: "bg-amber-100 text-amber-800",
    manufacturing: "bg-zinc-100 text-zinc-800",
    aerospace: "bg-indigo-100 text-indigo-800",
    entertainment: "bg-pink-100 text-pink-800",
    energy: "bg-yellow-100 text-yellow-800",
    consulting: "bg-purple-100 text-purple-800",
    other: "bg-gray-100 text-gray-800",
  };
  return colors[industry.toLowerCase()] || colors.other;
}

export function getCompanyLogoPlaceholder(name: string): string {
  // Return initials for placeholder
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
