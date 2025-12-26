import { getAllCompanies, getAllIndustries } from "@/lib/companies";
import { getIndustryColor, getCompanyLogoPlaceholder } from "@/types/company";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Top Companies | American Dream Jobs",
  description:
    "Explore career paths at top companies across tech, finance, healthcare, and more. See career ladders, typical roles, and growth opportunities.",
};

export default function CompaniesPage() {
  const companies = getAllCompanies();
  const industries = getAllIndustries();

  // Group companies by primary industry
  const companiesByIndustry: Record<string, typeof companies> = {};
  for (const company of companies) {
    const primaryIndustry = company.industry[0];
    if (!companiesByIndustry[primaryIndustry]) {
      companiesByIndustry[primaryIndustry] = [];
    }
    companiesByIndustry[primaryIndustry].push(company);
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero */}
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            Top Companies
          </h1>
          <p className="text-lg text-secondary-600 max-w-3xl">
            Explore career paths at {companies.length} leading companies. See how roles
            progress, typical titles, and what departments hire for each position.
          </p>

          {/* Industry filters */}
          <div className="flex flex-wrap gap-2 mt-6">
            {industries.map((industry) => (
              <a
                key={industry}
                href={`#${industry}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${getIndustryColor(industry)} hover:opacity-80`}
              >
                {industry.charAt(0).toUpperCase() + industry.slice(1)}
                <span className="ml-1 opacity-70">
                  ({companiesByIndustry[industry]?.length || 0})
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {Object.entries(companiesByIndustry).map(([industry, industryCompanies]) => (
          <section key={industry} id={industry} className="mb-12">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6 flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm ${getIndustryColor(industry)}`}
              >
                {industry.charAt(0).toUpperCase() + industry.slice(1)}
              </span>
              <span className="text-secondary-400 text-lg font-normal">
                {industryCompanies.length} companies
              </span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industryCompanies.map((company) => (
                <Link
                  key={company.slug}
                  href={`/companies/${company.slug}`}
                  className="card p-6 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-start gap-4">
                    {/* Logo placeholder */}
                    <div className="w-14 h-14 rounded-xl bg-secondary-100 flex items-center justify-center text-secondary-600 font-bold text-lg shrink-0 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                      {getCompanyLogoPlaceholder(company.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                        {company.name}
                      </h3>
                      <p className="text-sm text-secondary-500 mt-0.5">
                        {company.headquarters}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {company.industry.map((ind) => (
                          <span
                            key={ind}
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getIndustryColor(ind)}`}
                          >
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-secondary-600 mt-4 line-clamp-2">
                    {company.description}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-100">
                    <div className="text-sm text-secondary-500">
                      {company.employee_count} employees
                    </div>
                    <div className="text-sm text-secondary-500">
                      {company.career_ladders.length} career paths
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
