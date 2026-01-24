"use client";

/**
 * CompactJobCard Component
 *
 * A compact job card for inline display within career cards.
 * Shows job title, company, location, salary, and apply button.
 */

import { JobListing } from "@/lib/jobs/types";

interface CompactJobCardProps {
  job: JobListing;
}

export function CompactJobCard({ job }: CompactJobCardProps) {
  // Format salary range
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

  // Format location with remote badge
  const formatLocation = (): string => {
    const parts = [job.location];
    if (job.locationType === "remote") {
      return "Remote";
    } else if (job.locationType === "hybrid") {
      parts.push("Hybrid");
    }
    return parts.join(" · ");
  };

  const salaryStr = formatSalary(job.salary);

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-cream rounded-lg border border-sage-muted hover:border-sage transition-colors">
      <div className="flex-1 min-w-0">
        {/* Title and Company */}
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-ds-slate text-sm truncate">
            {job.title}
          </h4>
          <span className="text-ds-slate-muted text-sm hidden sm:inline">·</span>
          <span className="text-ds-slate-light text-sm truncate hidden sm:inline">
            {job.company}
          </span>
        </div>
        {/* Company on mobile */}
        <p className="text-ds-slate-light text-xs truncate sm:hidden mb-1">
          {job.company}
        </p>
        {/* Location and Salary */}
        <div className="flex items-center gap-2 text-xs text-ds-slate-muted">
          <span className="truncate">{formatLocation()}</span>
          {salaryStr && (
            <>
              <span>·</span>
              <span className="text-sage font-medium whitespace-nowrap">{salaryStr}</span>
            </>
          )}
        </div>
      </div>

      {/* Apply Button */}
      <a
        href={job.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-sage text-white rounded-md hover:bg-sage-dark transition-colors"
      >
        Apply
      </a>
    </div>
  );
}
