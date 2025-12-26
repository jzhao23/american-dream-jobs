import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllCompanies, getCompanyBySlug } from "@/lib/companies";
import { getIndustryColor, getCompanyLogoPlaceholder } from "@/types/company";
import { CompanyCareerLadder } from "@/components/CompanyCareerLadder";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all companies
export async function generateStaticParams() {
  const companies = getAllCompanies();
  return companies.map((company) => ({
    slug: company.slug,
  }));
}

// Generate metadata for each company page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);

  if (!company) {
    return {
      title: "Company Not Found | American Dream Jobs",
    };
  }

  return {
    title: `${company.name} Careers | American Dream Jobs`,
    description: `Explore career paths at ${company.name}. ${company.description}`,
  };
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-secondary-600 mb-6">
            <Link href="/" className="hover:text-primary-600">
              Home
            </Link>
            <span>/</span>
            <Link href="/companies" className="hover:text-primary-600">
              Companies
            </Link>
            <span>/</span>
            <span className="text-secondary-900">{company.name}</span>
          </div>

          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-secondary-100 flex items-center justify-center text-secondary-600 font-bold text-2xl shrink-0">
              {getCompanyLogoPlaceholder(company.name)}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                {company.industry.map((ind) => (
                  <span
                    key={ind}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getIndustryColor(ind)}`}
                  >
                    {ind.charAt(0).toUpperCase() + ind.slice(1)}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-2">
                {company.name}
              </h1>
              <p className="text-lg text-secondary-600">{company.description}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">Headquarters</div>
              <div className="font-semibold text-secondary-900">
                {company.headquarters}
              </div>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">Employees</div>
              <div className="font-semibold text-secondary-900">
                {company.employee_count}
              </div>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">Departments</div>
              <div className="font-semibold text-secondary-900">
                {company.departments.length}
              </div>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">Career Paths</div>
              <div className="font-semibold text-secondary-900">
                {company.career_ladders.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Career Ladders */}
          <section className="card p-6 md:p-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
              <span>📈</span>
              Career Paths at {company.name}
            </h2>
            <CompanyCareerLadder
              companySlug={company.slug}
              companyName={company.name}
            />
          </section>

          {/* Departments */}
          <section className="card p-6 md:p-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
              <span>🏢</span>
              Departments
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {company.departments.map((dept) => (
                <div
                  key={dept.name}
                  className="bg-secondary-50 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-secondary-900 mb-2">
                    {dept.name}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {dept.roles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-white border border-secondary-200 rounded text-sm text-secondary-700"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Related Careers */}
          {company.occupation_mappings.length > 0 && (
            <section className="card p-6 md:p-8">
              <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
                <span>💼</span>
                Related Career Pages
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {company.occupation_mappings.slice(0, 8).map((mapping) => (
                  <Link
                    key={mapping.onet_code}
                    href={`/careers/${mapping.slug}`}
                    className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors group"
                  >
                    <div>
                      <span className="font-medium text-secondary-900 group-hover:text-primary-600">
                        {mapping.typical_titles[0]}
                      </span>
                      <span className="text-sm text-secondary-500 ml-2">
                        {mapping.department}
                      </span>
                    </div>
                    <span className="text-secondary-400 group-hover:text-primary-600">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Data Source */}
          <div className="text-sm text-secondary-500 text-center">
            <p>
              Data sourced from{" "}
              <a
                href={company.theorg_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                TheOrg.com
              </a>{" "}
              and curated career data. Last updated:{" "}
              {new Date(company.last_updated).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
