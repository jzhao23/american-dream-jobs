"use client";

import { useState, useEffect } from "react";
import { getSavedCareers, unsaveCareer } from "@/lib/storage";
import careersIndex from "../../../data/careers-index.json";
import type { CareerIndex } from "@/types/career";
import {
  formatPay,
  getCategoryColor,
  getCategoryLabel,
  getAIRiskColor,
  getImportanceColor,
} from "@/types/career";
import { CareerActions } from "@/components/CareerActions";
import { NextSteps } from "@/components/NextSteps";

const allCareers = careersIndex as CareerIndex[];

export default function MyCareersPage() {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [savedCareers, setSavedCareers] = useState<CareerIndex[]>([]);

  useEffect(() => {
    const slugs = getSavedCareers();
    setSavedSlugs(slugs);
    setSavedCareers(allCareers.filter(c => slugs.includes(c.slug)));
  }, []);

  const handleUnsave = (slug: string) => {
    unsaveCareer(slug);
    setSavedSlugs(prev => prev.filter(s => s !== slug));
    setSavedCareers(prev => prev.filter(c => c.slug !== slug));
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            My Careers
          </h1>
          <p className="text-lg text-secondary-600">
            Your saved careers for quick access
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {savedCareers.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">
              No saved careers yet
            </h3>
            <p className="text-secondary-600 mb-6">
              Save careers you're interested in to access them quickly here.
            </p>
            <a
              href="/#careers"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Explore Careers
            </a>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block card overflow-hidden mb-8">
              <table className="w-full">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-secondary-900">
                      Career
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-secondary-900">
                      Category
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-secondary-900">
                      Median Pay
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-secondary-900">
                      AI Risk
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-secondary-900">
                      Importance
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-secondary-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {savedCareers.map((career) => (
                    <tr key={career.slug} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-4 py-3">
                        <a
                          href={`/careers/${career.slug}`}
                          className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                        >
                          {career.title}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(career.category)}`}>
                          {getCategoryLabel(career.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-secondary-900">
                        {formatPay(career.median_pay)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAIRiskColor(career.ai_risk)}`}>
                          {career.ai_risk}/10
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(career.importance)}`}>
                          {career.importance}/10
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <CareerActions career={career} variant="card" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 mb-8">
              {savedCareers.map((career) => (
                <div key={career.slug} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <a
                        href={`/careers/${career.slug}`}
                        className="font-semibold text-secondary-900 hover:text-primary-600"
                      >
                        {career.title}
                      </a>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getCategoryColor(career.category)}`}>
                        {getCategoryLabel(career.category)}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-primary-600 ml-2">
                      {formatPay(career.median_pay)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAIRiskColor(career.ai_risk)}`}>
                      AI Risk: {career.ai_risk}/10
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(career.importance)}`}>
                      Importance: {career.importance}/10
                    </span>
                  </div>
                  <CareerActions career={career} variant="card" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <NextSteps currentPage="home" />
    </div>
  );
}

