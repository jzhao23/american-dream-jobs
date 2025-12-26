"use client";

import { getAllCareerLaddersAtCompany } from "@/lib/companies";
import Link from "next/link";
import { useState } from "react";

interface CompanyCareerLadderProps {
  companySlug: string;
  companyName: string;
  initialRoleFamily?: string;
}

export function CompanyCareerLadder({
  companySlug,
  companyName,
  initialRoleFamily,
}: CompanyCareerLadderProps) {
  const ladders = getAllCareerLaddersAtCompany(companySlug);
  const [selectedFamily, setSelectedFamily] = useState(
    initialRoleFamily || ladders[0]?.role_family || ""
  );

  const currentLadder = ladders.find((l) => l.role_family === selectedFamily);

  if (ladders.length === 0) {
    return (
      <p className="text-secondary-500 text-sm py-4">
        No career ladder data available for {companyName}.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Role family selector */}
      {ladders.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {ladders.map((ladder) => (
            <button
              key={ladder.role_family}
              onClick={() => setSelectedFamily(ladder.role_family)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedFamily === ladder.role_family
                  ? "bg-primary-600 text-white"
                  : "bg-white text-secondary-600 hover:bg-secondary-100 border border-secondary-200"
              }`}
            >
              {ladder.role_family}
            </button>
          ))}
        </div>
      )}

      {/* Career ladder visualization */}
      {currentLadder && (
        <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
          <div className="px-4 py-3 bg-secondary-50 border-b border-secondary-200">
            <h4 className="font-semibold text-secondary-900">
              {currentLadder.role_family} Career Path at {companyName}
            </h4>
          </div>

          {/* Levels */}
          <div className="p-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {currentLadder.levels.map((level, index) => {
                const careerSlug = currentLadder.career_slug;
                const CardContent = (
                  <div className="flex flex-col items-center min-w-[120px]">
                    <div className={`bg-primary-50 border border-primary-200 rounded-lg p-3 text-center w-full transition-all ${
                      careerSlug ? "hover:bg-primary-100 hover:border-primary-300 hover:shadow-md cursor-pointer" : ""
                    }`}>
                      <div className="text-xs font-bold text-primary-600 mb-1">
                        {level.level_code}
                      </div>
                      <div className="text-sm font-medium text-secondary-900 leading-tight">
                        {level.title}
                      </div>
                      {careerSlug && (
                        <div className="mt-1 text-[10px] text-primary-500">
                          View career →
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-secondary-500 text-center">
                      {level.years_experience.min}-{level.years_experience.max} yrs
                    </div>
                    {level.compensation && (
                      <div className="mt-1 text-xs font-medium text-green-600">
                        ${(level.compensation.total_median / 1000).toFixed(0)}K
                      </div>
                    )}
                  </div>
                );

                return (
                  <div key={level.level_code} className="flex items-center">
                    {/* Level card - clickable if career exists */}
                    {careerSlug ? (
                      <Link href={`/careers/${careerSlug}`}>
                        {CardContent}
                      </Link>
                    ) : (
                      CardContent
                    )}

                    {/* Arrow */}
                    {index < currentLadder.levels.length - 1 && (
                      <div className="mx-2 text-secondary-300">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 py-2 bg-secondary-50 border-t border-secondary-200 text-xs text-secondary-500">
            Career progression timeline at {companyName}. Years shown are typical
            for each level.
          </div>
        </div>
      )}
    </div>
  );
}
