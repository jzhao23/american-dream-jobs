"use client";

/**
 * AllJobsModal Component
 *
 * Modal showing all jobs across all recommended careers.
 * Includes filtering by career.
 */

import { useState, useMemo } from "react";
import { JobListing } from "@/lib/jobs/types";

interface JobWithCareer extends JobListing {
  careerSlug: string;
  careerTitle: string;
}

interface AllJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobWithCareer[];
  careers: Array<{ slug: string; title: string }>;
}

export function AllJobsModal({
  isOpen,
  onClose,
  jobs,
  careers,
}: AllJobsModalProps) {
  const [selectedCareer, setSelectedCareer] = useState<string>("all");

  // Filter jobs by selected career
  const filteredJobs = useMemo(() => {
    if (selectedCareer === "all") {
      return jobs;
    }
    return jobs.filter((job) => job.careerSlug === selectedCareer);
  }, [jobs, selectedCareer]);

  // Get careers that have jobs
  const careersWithJobs = useMemo(() => {
    const slugsWithJobs = new Set(jobs.map((j) => j.careerSlug));
    return careers.filter((c) => slugsWithJobs.has(c.slug));
  }, [jobs, careers]);

  // Format salary
  const formatSalary = (salary: JobListing["salary"]): string | null => {
    if (!salary || (!salary.min && !salary.max)) return null;

    const formatNumber = (num: number) => {
      if (salary.period === "hour") {
        return `$${num}/hr`;
      }
      return `$${Math.round(num / 1000)}k`;
    };

    if (salary.min && salary.max) {
      return `${formatNumber(salary.min)} - ${formatNumber(salary.max)}`;
    } else if (salary.min) {
      return `${formatNumber(salary.min)}+`;
    } else if (salary.max) {
      return `Up to ${formatNumber(salary.max)}`;
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-warm-white rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-sage-muted">
            <div>
              <h2 className="font-display text-xl font-semibold text-ds-slate">
                All Jobs for Your Careers
              </h2>
              <p className="text-sm text-ds-slate-muted mt-1">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-ds-slate-muted hover:text-ds-slate transition-colors rounded-lg hover:bg-sage-pale"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Filter */}
          {careersWithJobs.length > 1 && (
            <div className="px-6 py-3 border-b border-sage-muted bg-cream">
              <label className="text-sm text-ds-slate-muted mr-2">
                Filter by career:
              </label>
              <select
                value={selectedCareer}
                onChange={(e) => setSelectedCareer(e.target.value)}
                className="px-3 py-1.5 text-sm border border-sage-muted rounded-lg bg-warm-white text-ds-slate focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              >
                <option value="all">All Careers ({jobs.length})</option>
                {careersWithJobs.map((career) => {
                  const count = jobs.filter(
                    (j) => j.careerSlug === career.slug
                  ).length;
                  return (
                    <option key={career.slug} value={career.slug}>
                      {career.title} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Job List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-ds-slate-muted">
                No jobs found for the selected career.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 bg-cream rounded-xl border border-sage-muted hover:border-sage transition-colors"
                  >
                    {/* Career Tag */}
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-sage-pale text-sage rounded-full">
                        {job.careerTitle}
                      </span>
                    </div>

                    {/* Job Details */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-ds-slate mb-1">
                          {job.title}
                        </h3>
                        <p className="text-sm text-ds-slate-light mb-2">
                          {job.company}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-ds-slate-muted">
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {job.location}
                            {job.locationType === "remote" && " (Remote)"}
                            {job.locationType === "hybrid" && " (Hybrid)"}
                          </span>
                          {formatSalary(job.salary) && (
                            <span className="text-sage font-medium">
                              {formatSalary(job.salary)}
                            </span>
                          )}
                        </div>
                      </div>

                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-4 py-2 text-sm font-medium bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors"
                      >
                        Apply
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
