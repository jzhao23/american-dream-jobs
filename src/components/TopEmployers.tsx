"use client";

import { useState } from "react";
import { getTopEmployersForCareer } from "@/lib/companies";
import { getIndustryColor, getCompanyLogoPlaceholder } from "@/types/company";
import { CompanyCareerLadder } from "./CompanyCareerLadder";

interface TopEmployersProps {
  careerSlug: string;
  careerTitle: string;
}

export function TopEmployers({ careerSlug, careerTitle }: TopEmployersProps) {
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const employers = getTopEmployersForCareer(careerSlug, 5);

  if (employers.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary-200 bg-secondary-50">
        <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
          <span>Where They Work</span>
        </h2>
        <p className="text-secondary-600 text-sm mt-1">
          Top companies hiring {careerTitle.toLowerCase()}s
        </p>
      </div>

      <div className="divide-y divide-secondary-100">
        {employers.map(({ company, typical_title, department }) => (
          <div key={company.slug} className="group">
            {/* Company row */}
            <button
              onClick={() =>
                setExpandedCompany(
                  expandedCompany === company.slug ? null : company.slug
                )
              }
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary-50 transition-colors text-left"
            >
              {/* Logo placeholder */}
              <div className="w-12 h-12 rounded-lg bg-secondary-100 flex items-center justify-center text-secondary-600 font-bold text-sm shrink-0">
                {getCompanyLogoPlaceholder(company.name)}
              </div>

              {/* Company info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                    {company.name}
                  </h3>
                  {company.industry.slice(0, 2).map((ind) => (
                    <span
                      key={ind}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getIndustryColor(ind)}`}
                    >
                      {ind}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-sm text-secondary-500 mt-1">
                  <span>{typical_title}</span>
                  <span className="text-secondary-300">|</span>
                  <span>{department}</span>
                  <span className="text-secondary-300">|</span>
                  <span>{company.employee_count} employees</span>
                </div>
              </div>

              {/* Expand indicator */}
              <div className="text-secondary-400 shrink-0">
                <svg
                  className={`w-5 h-5 transition-transform ${
                    expandedCompany === company.slug ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Expanded career ladder */}
            {expandedCompany === company.slug && (
              <div className="px-6 pb-4 bg-secondary-50">
                <CompanyCareerLadder
                  companySlug={company.slug}
                  companyName={company.name}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View more link */}
      <div className="px-6 py-3 border-t border-secondary-200 bg-secondary-50">
        <p className="text-sm text-secondary-500 text-center">
          Showing top {employers.length} employers for this role
        </p>
      </div>
    </section>
  );
}
