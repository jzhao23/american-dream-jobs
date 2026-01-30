"use client";

/**
 * CareerJobsList Component
 *
 * Displays job listings inline within a career card.
 * If no jobs available, renders nothing (silent empty state).
 */

import { useState } from "react";
import { JobListing } from "@/lib/jobs/types";
import { CompactJobCard } from "./CompactJobCard";
import { FindJobsModal } from "@/components/jobs/FindJobsModal";

interface CareerJobsListProps {
  jobs: JobListing[];
  careerSlug: string;
  careerTitle: string;
  isLoading?: boolean;
  locationName?: string;
}

export function CareerJobsList({
  jobs,
  careerSlug,
  careerTitle,
  isLoading = false,
  locationName,
}: CareerJobsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simple loading message
  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t border-sage-muted">
        <p className="text-sm text-ds-slate-muted italic">
          Searching for {careerTitle} jobs{locationName ? ` in ${locationName}` : ''}...
        </p>
      </div>
    );
  }

  // Silent empty state - render nothing if no jobs
  if (!jobs || jobs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-4 pt-4 border-t border-sage-muted">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-ds-slate text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 text-sage"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Jobs Hiring Now
          </h4>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-sage hover:text-sage-dark font-medium flex items-center gap-1 transition-colors"
          >
            View More
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Job Cards */}
        <div className="space-y-2">
          {jobs.slice(0, 3).map((job) => (
            <CompactJobCard key={job.id} job={job} />
          ))}
        </div>
      </div>

      {/* Find Jobs Modal */}
      <FindJobsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        careerSlug={careerSlug}
        careerTitle={careerTitle}
      />
    </>
  );
}
