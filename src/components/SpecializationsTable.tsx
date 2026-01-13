"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { formatPay, getAIResilienceEmoji, type AIResilienceClassification } from "@/types/career";
import { FindJobsButton } from "@/components/jobs/FindJobsButton";

interface Specialization {
  title: string;
  slug: string;
  onet_code?: string;
  description?: string;
  wages?: {
    annual?: {
      median?: number | null;
      pct_10?: number | null;
      pct_90?: number | null;
    } | null;
  } | null;
  ai_resilience?: AIResilienceClassification;
  tasks?: string[];
  technology_skills?: string[];
}

interface SpecializationsTableProps {
  specializations: Specialization[];
  parentCareerSlug: string;
  label?: string;
}

export function SpecializationsTable({
  specializations,
  parentCareerSlug,
  label = "Specializations",
}: SpecializationsTableProps) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (!specializations || specializations.length === 0) {
    return null;
  }

  // Sort by median pay descending
  const sortedSpecs = [...specializations].sort((a, b) => {
    const payA = a.wages?.annual?.median || 0;
    const payB = b.wages?.annual?.median || 0;
    return payB - payA;
  });

  const displayedSpecs = showAll ? sortedSpecs : sortedSpecs.slice(0, 5);
  const hasMore = sortedSpecs.length > 5;

  const toggleExpand = (slug: string) => {
    setExpandedSlug(expandedSlug === slug ? null : slug);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ds-slate-light">
        This career includes {specializations.length} specialized role{specializations.length !== 1 ? 's' : ''} with different focuses and compensation levels.
      </p>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sage-muted">
              <th className="text-left py-3 px-4 font-medium text-ds-slate-muted">Specialization</th>
              <th className="text-right py-3 px-4 font-medium text-ds-slate-muted">Median Pay</th>
              <th className="text-center py-3 px-4 font-medium text-ds-slate-muted">AI Outlook</th>
              <th className="text-right py-3 px-4 font-medium text-ds-slate-muted">O*NET Code</th>
              <th className="text-center py-3 px-4 font-medium text-ds-slate-muted">Find Jobs</th>
              <th className="text-center py-3 px-4 font-medium text-ds-slate-muted">Details</th>
            </tr>
          </thead>
          <tbody>
            {displayedSpecs.map((spec) => (
              <Fragment key={spec.slug}>
                <tr
                  className={`border-b border-sage-muted/50 hover:bg-sage-muted/30 transition-colors ${
                    expandedSlug === spec.slug ? 'bg-sage-muted/20' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleExpand(spec.slug)}
                      className="text-left font-medium text-sage hover:text-sage-dark hover:underline flex items-center gap-2"
                    >
                      <svg
                        className={`w-4 h-4 text-ds-slate-muted transition-transform ${
                          expandedSlug === spec.slug ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {spec.title}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right text-ds-slate">
                    {spec.wages?.annual?.median ? formatPay(spec.wages.annual.median) : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {spec.ai_resilience ? (
                      <span title={spec.ai_resilience}>
                        {getAIResilienceEmoji(spec.ai_resilience)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {spec.onet_code && (
                      <span className="text-xs bg-sage-muted text-ds-slate-muted px-2 py-0.5 rounded font-mono">
                        {spec.onet_code}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <FindJobsButton
                      careerSlug={spec.slug}
                      careerTitle={spec.title}
                      variant="primary"
                      className="text-xs px-3 py-1.5"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      href={`/specializations/${spec.slug}`}
                      className="text-xs text-sage hover:text-sage-dark hover:underline"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
                {/* Expanded Details Row */}
                {expandedSlug === spec.slug && (
                  <tr className="bg-sage-muted/10">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="pl-6 space-y-3">
                        {spec.description && (
                          <p className="text-sm text-ds-slate-light line-clamp-3">
                            {spec.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-ds-slate-muted">
                          {spec.wages?.annual?.pct_10 && spec.wages?.annual?.pct_90 && (
                            <span>
                              Pay range: {formatPay(spec.wages.annual.pct_10)} - {formatPay(spec.wages.annual.pct_90)}
                            </span>
                          )}
                          {spec.tasks && spec.tasks.length > 0 && (
                            <span>{spec.tasks.length} key tasks</span>
                          )}
                          {spec.technology_skills && spec.technology_skills.length > 0 && (
                            <span>{spec.technology_skills.length} technical skills</span>
                          )}
                        </div>
                        <Link
                          href={`/specializations/${spec.slug}`}
                          className="inline-flex items-center gap-1 text-sm text-sage hover:text-sage-dark font-medium"
                        >
                          View full details
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {displayedSpecs.map((spec) => (
          <div
            key={spec.slug}
            className={`bg-cream rounded-lg overflow-hidden ${
              expandedSlug === spec.slug ? 'ring-1 ring-sage' : ''
            }`}
          >
            <button
              onClick={() => toggleExpand(spec.slug)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sage">{spec.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-ds-slate-light">
                    <span>{spec.wages?.annual?.median ? formatPay(spec.wages.annual.median) : 'N/A'}</span>
                    {spec.ai_resilience && (
                      <span title={spec.ai_resilience}>
                        {getAIResilienceEmoji(spec.ai_resilience)}
                      </span>
                    )}
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-ds-slate-muted transition-transform ${
                    expandedSlug === spec.slug ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expandedSlug === spec.slug && (
              <div className="px-4 pb-4 space-y-3 border-t border-sage-muted">
                {spec.description && (
                  <p className="text-sm text-ds-slate-light line-clamp-3 pt-3">
                    {spec.description}
                  </p>
                )}
                {spec.onet_code && (
                  <div>
                    <span className="text-xs bg-sage-muted text-ds-slate-muted px-2 py-0.5 rounded font-mono">
                      {spec.onet_code}
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <FindJobsButton
                    careerSlug={spec.slug}
                    careerTitle={spec.title}
                    variant="primary"
                    className="text-sm"
                  />
                  <Link
                    href={`/specializations/${spec.slug}`}
                    className="inline-flex items-center gap-1 text-sm text-sage font-medium"
                  >
                    View full details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-sage hover:text-sage-dark font-medium flex items-center justify-center gap-1"
        >
          {showAll ? (
            <>
              Show less
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              Show all {sortedSpecs.length} {label.toLowerCase()}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}
