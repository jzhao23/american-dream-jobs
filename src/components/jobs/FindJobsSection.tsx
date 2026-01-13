"use client";

import { useState } from "react";
import { useLocation } from "@/lib/location-context";
import { FindJobsModal } from "./FindJobsModal";

interface FindJobsSectionProps {
  careerSlug: string;
  careerTitle: string;
  onetCode?: string;
  alternateJobTitles?: string[];
  medianSalary?: number;
}

export function FindJobsSection({
  careerSlug,
  careerTitle,
  onetCode,
  alternateJobTitles,
  medianSalary
}: FindJobsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { location } = useLocation();

  const formatSalary = (salary: number) => {
    if (salary >= 1000) {
      return `$${(salary / 1000).toFixed(0)}K`;
    }
    return `$${salary.toLocaleString()}`;
  };

  // Build CareerOneStop training URL
  const getTrainingUrl = () => {
    const baseUrl = "https://www.careeronestop.org/Toolkit/Training/find-local-training.aspx";
    const params = new URLSearchParams();

    if (onetCode) {
      params.set("onetcode", onetCode);
    }
    params.set("keyword", careerTitle);

    if (location?.shortName) {
      params.set("location", location.shortName);
    } else if (location?.state) {
      params.set("location", location.state);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <>
      <section className="card-warm p-6 md:p-8 bg-gradient-to-br from-sage-pale to-white border-2 border-sage-muted">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ds-slate">
                Ready to Start Your Career?
              </h2>
              <p className="text-sm text-ds-slate-light">
                Find jobs and training programs for {careerTitle.toLowerCase()}
                {medianSalary && (
                  <span className="ml-1">
                    - Median salary: <span className="font-semibold text-sage">{formatSalary(medianSalary)}/year</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Two-column CTA layout */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Find Jobs Card */}
            <div className="bg-white rounded-xl p-5 border border-sage-muted">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🔍</span>
                <h3 className="font-semibold text-ds-slate">Find Jobs</h3>
              </div>
              <p className="text-sm text-ds-slate-light mb-4">
                Search positions from LinkedIn, Indeed, Glassdoor, and more. Get up to 50 relevant job listings with salary info.
              </p>
              <ul className="flex flex-wrap gap-3 text-xs text-ds-slate-muted mb-4">
                <li className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-sage" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real-time results
                </li>
                <li className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-sage" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Export to Excel
                </li>
              </ul>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sage to-sage-dark text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find {careerTitle.split(',')[0]} Jobs
              </button>
            </div>

            {/* Find Training Card */}
            <div className="bg-white rounded-xl p-5 border border-sage-muted">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📚</span>
                <h3 className="font-semibold text-ds-slate">Find Training</h3>
              </div>
              <p className="text-sm text-ds-slate-light mb-4">
                Discover training programs, certifications, and educational resources to help you get started or advance your career.
              </p>
              <ul className="flex flex-wrap gap-3 text-xs text-ds-slate-muted mb-4">
                <li className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-sage" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Local programs
                </li>
                <li className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-sage" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  DOL verified
                </li>
              </ul>
              <a
                href={getTrainingUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-warm-white border-2 border-sage text-sage rounded-xl font-semibold hover:bg-sage-pale hover:border-sage-dark hover:text-sage-dark transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Find Training Programs
              </a>
            </div>
          </div>

          {/* CareerOneStop attribution */}
          <div className="flex items-center justify-center gap-2 text-xs text-ds-slate-muted">
            <span>Training data powered by</span>
            <a
              href="https://www.careeronestop.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sage hover:text-sage-dark hover:underline"
            >
              CareerOneStop
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <span>- U.S. Department of Labor</span>
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
