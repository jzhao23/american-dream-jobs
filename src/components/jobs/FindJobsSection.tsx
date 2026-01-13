"use client";

import { useState } from "react";
import { FindJobsModal } from "./FindJobsModal";

interface FindJobsSectionProps {
  careerSlug: string;
  careerTitle: string;
  alternateJobTitles?: string[];
  medianSalary?: number;
}

export function FindJobsSection({
  careerSlug,
  careerTitle,
  alternateJobTitles,
  medianSalary
}: FindJobsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatSalary = (salary: number) => {
    if (salary >= 1000) {
      return `$${(salary / 1000).toFixed(0)}K`;
    }
    return `$${salary.toLocaleString()}`;
  };

  return (
    <>
      <section className="card-warm p-6 md:p-8 bg-gradient-to-br from-sage-pale to-white border-2 border-sage-muted">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-semibold text-ds-slate">
                Ready to Find Your Next Job?
              </h2>
            </div>

            <p className="text-ds-slate-light mb-4">
              Search {careerTitle.toLowerCase()} positions from LinkedIn, Indeed, Glassdoor, and more.
              {medianSalary && (
                <span className="block sm:inline sm:ml-1">
                  Median salary: <span className="font-semibold text-sage">{formatSalary(medianSalary)}/year</span>
                </span>
              )}
            </p>

            <ul className="flex flex-wrap gap-4 text-sm text-ds-slate-light">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sage" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Up to 50 jobs
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sage" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Real-time from job boards
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sage" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Export to Excel
              </li>
            </ul>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-sage to-sage-dark text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find {careerTitle.split(',')[0]} Jobs
            </button>
          </div>
        </div>
      </section>

      <FindJobsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        careerSlug={careerSlug}
        careerTitle={careerTitle}
        alternateJobTitles={alternateJobTitles}
      />
    </>
  );
}
