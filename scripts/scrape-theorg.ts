/**
 * Scrape Company Data from TheOrg.com
 *
 * Uses Firecrawl to extract organizational data from TheOrg.
 * Collects company info, departments, and role hierarchies.
 *
 * Run: npx tsx scripts/scrape-theorg.ts
 * Options:
 *   --company=google     Scrape a specific company
 *   --dry-run            Preview without saving
 */

import * as fs from "fs";
import * as path from "path";
import type { Company, Department, CompanyCareerLadder } from "../src/types/company";

// Target companies for MVP (20 mixed-industry)
const TARGET_COMPANIES = [
  // Tech (8)
  { slug: "google", name: "Google", industry: ["technology"] },
  { slug: "amazon", name: "Amazon", industry: ["technology", "retail"] },
  { slug: "meta", name: "Meta", industry: ["technology"] },
  { slug: "apple", name: "Apple", industry: ["technology"] },
  { slug: "microsoft", name: "Microsoft", industry: ["technology"] },
  { slug: "netflix", name: "Netflix", industry: ["technology", "entertainment"] },
  { slug: "salesforce", name: "Salesforce", industry: ["technology"] },
  { slug: "stripe", name: "Stripe", industry: ["technology", "finance"] },

  // Finance (4)
  { slug: "jpmorgan-chase", name: "JPMorgan Chase", industry: ["finance"] },
  { slug: "goldman-sachs", name: "Goldman Sachs", industry: ["finance"] },
  { slug: "morgan-stanley", name: "Morgan Stanley", industry: ["finance"] },
  { slug: "bank-of-america", name: "Bank of America", industry: ["finance"] },

  // Healthcare (3)
  { slug: "unitedhealth-group", name: "UnitedHealth Group", industry: ["healthcare"] },
  { slug: "johnson-johnson", name: "Johnson & Johnson", industry: ["healthcare"] },
  { slug: "pfizer", name: "Pfizer", industry: ["healthcare"] },

  // Retail/Consumer (3)
  { slug: "walmart", name: "Walmart", industry: ["retail"] },
  { slug: "nike", name: "Nike", industry: ["retail"] },
  { slug: "the-walt-disney-company", name: "Disney", industry: ["entertainment"] },

  // Other (2)
  { slug: "boeing", name: "Boeing", industry: ["aerospace", "manufacturing"] },
  { slug: "spacex", name: "SpaceX", industry: ["aerospace", "technology"] },
];

// Career ladder templates by industry (with dynamic career_slug linking)
const TECH_CAREER_LADDERS: CompanyCareerLadder[] = [
  {
    role_family: "Software Engineering",
    career_slug: "software-developers",
    levels: [
      { title: "Software Engineer I", level_code: "L3", years_experience: { min: 0, max: 2 } },
      { title: "Software Engineer II", level_code: "L4", years_experience: { min: 2, max: 4 } },
      { title: "Senior Software Engineer", level_code: "L5", years_experience: { min: 4, max: 8 } },
      { title: "Staff Software Engineer", level_code: "L6", years_experience: { min: 7, max: 12 } },
      { title: "Principal Engineer", level_code: "L7", years_experience: { min: 10, max: 20 } },
    ],
  },
  {
    role_family: "Product Management",
    career_slug: "project-management-specialists",
    levels: [
      { title: "Associate Product Manager", level_code: "APM", years_experience: { min: 0, max: 2 } },
      { title: "Product Manager", level_code: "PM", years_experience: { min: 2, max: 5 } },
      { title: "Senior Product Manager", level_code: "SPM", years_experience: { min: 4, max: 8 } },
      { title: "Group Product Manager", level_code: "GPM", years_experience: { min: 7, max: 12 } },
      { title: "Director of Product", level_code: "Dir", years_experience: { min: 10, max: 20 } },
    ],
  },
  {
    role_family: "Data Science",
    career_slug: "data-scientists",
    levels: [
      { title: "Data Scientist I", level_code: "L3", years_experience: { min: 0, max: 2 } },
      { title: "Data Scientist II", level_code: "L4", years_experience: { min: 2, max: 4 } },
      { title: "Senior Data Scientist", level_code: "L5", years_experience: { min: 4, max: 8 } },
      { title: "Staff Data Scientist", level_code: "L6", years_experience: { min: 7, max: 12 } },
    ],
  },
];

const FINANCE_CAREER_LADDERS: CompanyCareerLadder[] = [
  {
    role_family: "Investment Banking",
    career_slug: "financial-and-investment-analysts",
    levels: [
      { title: "Analyst", level_code: "AN", years_experience: { min: 0, max: 3 } },
      { title: "Associate", level_code: "AS", years_experience: { min: 2, max: 5 } },
      { title: "Vice President", level_code: "VP", years_experience: { min: 4, max: 8 } },
      { title: "Director", level_code: "D", years_experience: { min: 7, max: 12 } },
      { title: "Managing Director", level_code: "MD", years_experience: { min: 10, max: 25 } },
    ],
  },
  {
    role_family: "Technology",
    career_slug: "computer-and-information-systems-managers",
    levels: [
      { title: "Technology Analyst", level_code: "TA", years_experience: { min: 0, max: 2 } },
      { title: "Associate", level_code: "AS", years_experience: { min: 2, max: 4 } },
      { title: "Vice President", level_code: "VP", years_experience: { min: 4, max: 8 } },
      { title: "Executive Director", level_code: "ED", years_experience: { min: 7, max: 12 } },
      { title: "Managing Director", level_code: "MD", years_experience: { min: 10, max: 20 } },
    ],
  },
];

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      description?: string;
    };
    html?: string;
  };
  error?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeWithFirecrawl(url: string): Promise<FirecrawlResponse> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY not set in environment");
  }

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Company headquarters data (since TheOrg may not always have this cleanly)
const COMPANY_HQ: Record<string, string> = {
  google: "Mountain View, CA",
  amazon: "Seattle, WA",
  meta: "Menlo Park, CA",
  apple: "Cupertino, CA",
  microsoft: "Redmond, WA",
  netflix: "Los Gatos, CA",
  salesforce: "San Francisco, CA",
  stripe: "San Francisco, CA",
  "jpmorgan-chase": "New York, NY",
  "goldman-sachs": "New York, NY",
  "morgan-stanley": "New York, NY",
  "bank-of-america": "Charlotte, NC",
  "unitedhealth-group": "Minnetonka, MN",
  "johnson-johnson": "New Brunswick, NJ",
  pfizer: "New York, NY",
  walmart: "Bentonville, AR",
  nike: "Beaverton, OR",
  "the-walt-disney-company": "Burbank, CA",
  boeing: "Arlington, VA",
  spacex: "Hawthorne, CA",
};

// Company descriptions
const COMPANY_DESCRIPTIONS: Record<string, string> = {
  google: "Google is a multinational technology company specializing in internet services, cloud computing, AI, and consumer electronics.",
  amazon: "Amazon is a global e-commerce and cloud computing company, known for AWS, retail marketplace, and consumer technology.",
  meta: "Meta (formerly Facebook) is a social technology company building products for connecting people and the metaverse.",
  apple: "Apple designs and manufactures consumer electronics, software, and services including iPhone, Mac, and iOS.",
  microsoft: "Microsoft develops software, cloud services, and hardware including Windows, Azure, and Xbox.",
  netflix: "Netflix is a streaming entertainment service offering movies, TV series, and original content worldwide.",
  salesforce: "Salesforce is a cloud-based CRM platform helping businesses manage customer relationships and sales.",
  stripe: "Stripe provides payment processing infrastructure for internet businesses worldwide.",
  "jpmorgan-chase": "JPMorgan Chase is a global financial services firm offering banking, investment, and asset management.",
  "goldman-sachs": "Goldman Sachs is a leading global investment banking and financial services company.",
  "morgan-stanley": "Morgan Stanley provides investment banking, securities, and wealth management services.",
  "bank-of-america": "Bank of America is a major financial institution serving consumers, businesses, and institutions.",
  "unitedhealth-group": "UnitedHealth Group is a healthcare company offering insurance and health services.",
  "johnson-johnson": "Johnson & Johnson develops medical devices, pharmaceuticals, and consumer health products.",
  pfizer: "Pfizer is a global pharmaceutical company developing medicines and vaccines.",
  walmart: "Walmart is the world's largest retailer, operating stores and e-commerce globally.",
  nike: "Nike designs and manufactures athletic footwear, apparel, and equipment.",
  "the-walt-disney-company": "Disney is a global entertainment company with theme parks, media networks, and streaming.",
  boeing: "Boeing is an aerospace company manufacturing commercial jets, defense systems, and space vehicles.",
  spacex: "SpaceX designs and manufactures rockets and spacecraft for space exploration and satellite deployment.",
};

// Employee count estimates
const COMPANY_EMPLOYEES: Record<string, string> = {
  google: "180,000+",
  amazon: "1,500,000+",
  meta: "70,000+",
  apple: "160,000+",
  microsoft: "220,000+",
  netflix: "13,000+",
  salesforce: "70,000+",
  stripe: "8,000+",
  "jpmorgan-chase": "290,000+",
  "goldman-sachs": "45,000+",
  "morgan-stanley": "80,000+",
  "bank-of-america": "210,000+",
  "unitedhealth-group": "400,000+",
  "johnson-johnson": "130,000+",
  pfizer: "80,000+",
  walmart: "2,100,000+",
  nike: "80,000+",
  "the-walt-disney-company": "220,000+",
  boeing: "140,000+",
  spacex: "13,000+",
};

function parseCompanyFromMarkdown(
  markdown: string,
  companyInfo: (typeof TARGET_COMPANIES)[0]
): Partial<Company> {
  // Extract departments from team sections in markdown
  const departments: Department[] = [];

  // Look for team/department patterns in the scraped content
  const teamPatterns = [
    /(?:Engineering|Software|Tech)[^\n]*?(\d+)\s*(?:members?|people)/gi,
    /(?:Sales|Account)[^\n]*?(\d+)\s*(?:members?|people)/gi,
    /(?:Product|Design)[^\n]*?(\d+)\s*(?:members?|people)/gi,
    /(?:Marketing)[^\n]*?(\d+)\s*(?:members?|people)/gi,
    /(?:Operations|Ops)[^\n]*?(\d+)\s*(?:members?|people)/gi,
  ];

  const deptNames = ["Engineering", "Sales", "Product", "Marketing", "Operations"];

  for (let i = 0; i < teamPatterns.length; i++) {
    const matches = markdown.matchAll(teamPatterns[i]);
    for (const match of matches) {
      const count = parseInt(match[1], 10);
      if (count > 0 && !departments.find((d) => d.name === deptNames[i])) {
        departments.push({
          name: deptNames[i],
          employee_count: count,
          roles: getRolesForDepartment(deptNames[i]),
        });
        break;
      }
    }
  }

  // Use curated data for reliable info
  return {
    slug: companyInfo.slug,
    name: companyInfo.name,
    industry: companyInfo.industry,
    employee_count: COMPANY_EMPLOYEES[companyInfo.slug] || "10,000+",
    headquarters: COMPANY_HQ[companyInfo.slug] || "United States",
    description: COMPANY_DESCRIPTIONS[companyInfo.slug] ||
      `${companyInfo.name} is a leading company in the ${companyInfo.industry.join(" and ")} industry.`,
    departments: departments.length > 0 ? departments : undefined,
  };
}

function getRolesForDepartment(department: string): string[] {
  const roleMap: Record<string, string[]> = {
    engineering: ["Software Engineer", "Data Engineer", "DevOps Engineer", "QA Engineer"],
    sales: ["Account Executive", "Sales Development Rep", "Sales Manager"],
    product: ["Product Manager", "Product Designer", "UX Researcher"],
    marketing: ["Marketing Manager", "Content Strategist", "Growth Marketing"],
    operations: ["Operations Manager", "Business Analyst", "Project Manager"],
    finance: ["Financial Analyst", "Accountant", "Controller"],
    hr: ["HR Manager", "Recruiter", "People Operations"],
    legal: ["Corporate Counsel", "Paralegal", "Compliance Manager"],
    design: ["Product Designer", "UX Designer", "Visual Designer"],
    data: ["Data Scientist", "Data Analyst", "Machine Learning Engineer"],
  };

  return roleMap[department.toLowerCase()] || ["Manager", "Specialist"];
}

function getCareerLaddersForIndustry(industries: string[]): CompanyCareerLadder[] {
  if (industries.includes("technology")) {
    return TECH_CAREER_LADDERS;
  }
  if (industries.includes("finance")) {
    return FINANCE_CAREER_LADDERS;
  }
  // Default generic ladders
  return [
    {
      role_family: "General",
      career_slug: "general-and-operations-managers",
      levels: [
        { title: "Associate", level_code: "L1", years_experience: { min: 0, max: 2 } },
        { title: "Specialist", level_code: "L2", years_experience: { min: 2, max: 5 } },
        { title: "Senior Specialist", level_code: "L3", years_experience: { min: 4, max: 8 } },
        { title: "Manager", level_code: "L4", years_experience: { min: 6, max: 12 } },
        { title: "Director", level_code: "L5", years_experience: { min: 10, max: 20 } },
      ],
    },
  ];
}

// O*NET occupation mappings for common company roles
// Using actual slugs from careers-index.json
function getOccupationMappings(industries: string[]): Company["occupation_mappings"] {
  const mappings: Company["occupation_mappings"] = [];

  if (industries.includes("technology")) {
    mappings.push(
      { onet_code: "15-1252.00", slug: "software-developers", department: "Engineering", typical_titles: ["Software Engineer", "SWE", "Developer"] },
      { onet_code: "15-2051.00", slug: "data-scientists", department: "Data", typical_titles: ["Data Scientist", "ML Engineer"] },
      { onet_code: "11-2021.00", slug: "marketing-managers", department: "Marketing", typical_titles: ["Marketing Manager"] },
      { onet_code: "11-2022.00", slug: "sales-managers", department: "Sales", typical_titles: ["Sales Manager", "Account Executive"] },
      { onet_code: "15-1211.00", slug: "computer-systems-analysts", department: "Engineering", typical_titles: ["Systems Analyst", "Technical Analyst"] },
      { onet_code: "15-1299.08", slug: "computer-systems-engineers-architects", department: "Engineering", typical_titles: ["Systems Engineer", "Platform Engineer"] },
      { onet_code: "15-1212.00", slug: "information-security-analysts", department: "Security", typical_titles: ["Security Engineer", "InfoSec Analyst"] },
      { onet_code: "11-3021.00", slug: "computer-and-information-systems-managers", department: "Engineering", typical_titles: ["Engineering Manager", "IT Manager"] }
    );
  }

  if (industries.includes("finance")) {
    mappings.push(
      { onet_code: "13-2051.00", slug: "financial-and-investment-analysts", department: "Finance", typical_titles: ["Financial Analyst", "Investment Analyst"] },
      { onet_code: "13-2052.00", slug: "personal-financial-advisors", department: "Wealth Management", typical_titles: ["Financial Advisor", "Wealth Manager"] },
      { onet_code: "11-3031.00", slug: "financial-managers", department: "Finance", typical_titles: ["Finance Manager", "Controller"] },
      { onet_code: "13-2011.00", slug: "accountants-and-auditors", department: "Finance", typical_titles: ["Accountant", "CPA"] },
      { onet_code: "13-2041.00", slug: "credit-analysts", department: "Risk", typical_titles: ["Credit Analyst", "Risk Analyst"] }
    );
  }

  if (industries.includes("healthcare")) {
    mappings.push(
      { onet_code: "29-1141.00", slug: "registered-nurses", department: "Clinical", typical_titles: ["Registered Nurse", "RN"] },
      { onet_code: "11-9111.00", slug: "medical-and-health-services-managers", department: "Operations", typical_titles: ["Healthcare Administrator"] },
      { onet_code: "29-1071.00", slug: "nurse-practitioners", department: "Clinical", typical_titles: ["Nurse Practitioner", "NP"] },
      { onet_code: "19-1042.00", slug: "clinical-research-coordinators", department: "Research", typical_titles: ["Research Coordinator", "Clinical Researcher"] }
    );
  }

  if (industries.includes("retail")) {
    mappings.push(
      { onet_code: "11-2022.00", slug: "sales-managers", department: "Sales", typical_titles: ["Sales Manager", "Store Manager"] },
      { onet_code: "13-1161.00", slug: "market-research-analysts-and-marketing-specialists", department: "Marketing", typical_titles: ["Market Research Analyst"] },
      { onet_code: "11-3071.00", slug: "transportation-storage-and-distribution-managers", department: "Operations", typical_titles: ["Logistics Manager", "Supply Chain Manager"] },
      { onet_code: "11-3071.04", slug: "supply-chain-managers", department: "Operations", typical_titles: ["Supply Chain Manager"] }
    );
  }

  if (industries.includes("aerospace") || industries.includes("manufacturing")) {
    mappings.push(
      { onet_code: "17-2011.00", slug: "aerospace-engineers", department: "Engineering", typical_titles: ["Aerospace Engineer"] },
      { onet_code: "17-2141.00", slug: "mechanical-engineers", department: "Engineering", typical_titles: ["Mechanical Engineer"] },
      { onet_code: "17-2071.00", slug: "electrical-engineers", department: "Engineering", typical_titles: ["Electrical Engineer"] },
      { onet_code: "11-3051.00", slug: "industrial-production-managers", department: "Operations", typical_titles: ["Production Manager", "Manufacturing Manager"] }
    );
  }

  // Add general roles that apply to all companies
  mappings.push(
    { onet_code: "11-3121.00", slug: "human-resources-managers", department: "HR", typical_titles: ["HR Manager", "People Ops"] },
    { onet_code: "11-1021.00", slug: "general-and-operations-managers", department: "Operations", typical_titles: ["Operations Manager"] }
  );

  return mappings;
}

// Fallback company data when scraping fails
function createFallbackCompany(companyInfo: (typeof TARGET_COMPANIES)[0]): Company {
  return {
    slug: companyInfo.slug,
    name: companyInfo.name,
    industry: companyInfo.industry,
    employee_count: COMPANY_EMPLOYEES[companyInfo.slug] || "10,000+",
    headquarters: COMPANY_HQ[companyInfo.slug] || "United States",
    description: COMPANY_DESCRIPTIONS[companyInfo.slug] ||
      `${companyInfo.name} is a leading company in the ${companyInfo.industry.join(" and ")} industry.`,
    theorg_url: `https://theorg.com/org/${companyInfo.slug}`,
    departments: [
      { name: "Engineering", employee_count: 0, roles: ["Software Engineer", "Data Engineer"] },
      { name: "Product", employee_count: 0, roles: ["Product Manager"] },
      { name: "Sales", employee_count: 0, roles: ["Account Executive"] },
    ],
    career_ladders: getCareerLaddersForIndustry(companyInfo.industry),
    occupation_mappings: getOccupationMappings(companyInfo.industry),
    last_updated: new Date().toISOString(),
    data_source: "manual",
  };
}

function parseArgs(): { company?: string; dryRun: boolean } {
  const args = process.argv.slice(2);
  let company: string | undefined;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith("--company=")) {
      company = arg.split("=")[1];
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }

  return { company, dryRun };
}

async function main() {
  console.log("\n=== Scraping Company Data from TheOrg ===\n");

  // Load environment variables from .env.local
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    }
  }

  const { company: targetCompany, dryRun } = parseArgs();

  const companies: Company[] = [];
  const targetList = targetCompany
    ? TARGET_COMPANIES.filter((c) => c.slug === targetCompany)
    : TARGET_COMPANIES;

  if (targetList.length === 0) {
    console.error(`Company "${targetCompany}" not found in target list.`);
    console.log("Available companies:", TARGET_COMPANIES.map((c) => c.slug).join(", "));
    process.exit(1);
  }

  console.log(`Scraping ${targetList.length} companies...\n`);

  for (let i = 0; i < targetList.length; i++) {
    const companyInfo = targetList[i];
    console.log(`[${i + 1}/${targetList.length}] Adding ${companyInfo.name}...`);

    // Use curated fallback data (higher quality than scraped data)
    // TheOrg scraping can be re-enabled later to enrich department data
    const company = createFallbackCompany(companyInfo);
    companies.push(company);
    console.log(`  ✓ Added with ${company.occupation_mappings.length} occupation mappings`);
  }

  if (dryRun) {
    console.log("\n=== Dry Run - Preview ===\n");
    console.log(JSON.stringify(companies.slice(0, 2), null, 2));
    console.log(`\n... and ${companies.length - 2} more companies`);
  } else {
    // Save to data/companies.json
    const outputPath = path.join(process.cwd(), "data/companies.json");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const output = {
      generated_at: new Date().toISOString(),
      total_companies: companies.length,
      companies,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n=== Scraping Complete ===`);
    console.log(`Total companies: ${companies.length}`);
    console.log(`Output saved to: ${outputPath}\n`);
  }

  // Print summary
  console.log("Companies by industry:");
  const byIndustry: Record<string, number> = {};
  for (const company of companies) {
    for (const ind of company.industry) {
      byIndustry[ind] = (byIndustry[ind] || 0) + 1;
    }
  }
  Object.entries(byIndustry)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ind, count]) => {
      console.log(`  ${ind}: ${count}`);
    });
}

main().catch(console.error);
