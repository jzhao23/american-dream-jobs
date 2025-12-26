import type { Company, CompanyIndex } from "@/types/company";
import companiesData from "@/../data/companies.json";

// Type assertion for the imported JSON
const companies = companiesData.companies as Company[];

/**
 * Get all companies
 */
export function getAllCompanies(): Company[] {
  return companies;
}

/**
 * Get a company by its slug
 */
export function getCompanyBySlug(slug: string): Company | null {
  return companies.find((c) => c.slug === slug) || null;
}

/**
 * Get companies that hire for a specific O*NET occupation code
 */
export function getCompaniesByOccupation(onetCode: string): Company[] {
  return companies.filter((company) =>
    company.occupation_mappings.some((mapping) => mapping.onet_code === onetCode)
  );
}

/**
 * Get companies that hire for a specific career slug
 */
export function getCompaniesByCareerSlug(careerSlug: string): Company[] {
  return companies.filter((company) =>
    company.occupation_mappings.some((mapping) => mapping.slug === careerSlug)
  );
}

/**
 * Get top employers for a career (by slug or O*NET code)
 * Returns companies with the typical job title used at that company
 */
export function getTopEmployersForCareer(
  identifier: string,
  limit: number = 5
): Array<{
  company: Company;
  typical_title: string;
  department: string;
}> {
  const results: Array<{
    company: Company;
    typical_title: string;
    department: string;
  }> = [];

  for (const company of companies) {
    const mapping = company.occupation_mappings.find(
      (m) => m.slug === identifier || m.onet_code === identifier
    );

    if (mapping) {
      results.push({
        company,
        typical_title: mapping.typical_titles[0] || "Professional",
        department: mapping.department,
      });
    }
  }

  // Sort by employee count (larger companies first)
  results.sort((a, b) => {
    const countA = parseEmployeeCount(a.company.employee_count);
    const countB = parseEmployeeCount(b.company.employee_count);
    return countB - countA;
  });

  return results.slice(0, limit);
}

/**
 * Get companies by industry
 */
export function getCompaniesByIndustry(industry: string): Company[] {
  return companies.filter((c) =>
    c.industry.some((ind) => ind.toLowerCase() === industry.toLowerCase())
  );
}

/**
 * Get company index for lightweight listing
 */
export function getCompanyIndex(): CompanyIndex[] {
  return companies.map((c) => ({
    slug: c.slug,
    name: c.name,
    industry: c.industry,
    employee_count: c.employee_count,
    headquarters: c.headquarters,
    department_count: c.departments.length,
    logo_url: c.logo_url,
  }));
}

/**
 * Get career ladder for a specific role family at a company
 */
export function getCareerLadderAtCompany(
  companySlug: string,
  roleFamily: string
): Company["career_ladders"][0] | null {
  const company = getCompanyBySlug(companySlug);
  if (!company) return null;

  return (
    company.career_ladders.find(
      (ladder) => ladder.role_family.toLowerCase() === roleFamily.toLowerCase()
    ) || company.career_ladders[0] || null
  );
}

/**
 * Get all career ladders at a company
 */
export function getAllCareerLaddersAtCompany(
  companySlug: string
): Company["career_ladders"] {
  const company = getCompanyBySlug(companySlug);
  return company?.career_ladders || [];
}

/**
 * Parse employee count string to number for sorting
 */
function parseEmployeeCount(count: string): number {
  const cleaned = count.replace(/[,+]/g, "");
  return parseInt(cleaned, 10) || 0;
}

/**
 * Get unique industries from all companies
 */
export function getAllIndustries(): string[] {
  const industries = new Set<string>();
  for (const company of companies) {
    for (const industry of company.industry) {
      industries.add(industry);
    }
  }
  return Array.from(industries).sort();
}

/**
 * Search companies by name
 */
export function searchCompanies(query: string): Company[] {
  const lowerQuery = query.toLowerCase();
  return companies.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery)
  );
}
