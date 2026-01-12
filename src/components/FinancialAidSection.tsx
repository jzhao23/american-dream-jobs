/**
 * Financial Aid Section Component
 *
 * Displays scholarship and financial aid information for a career including:
 * - Federal aid eligibility
 * - Common funding sources
 * - Specific scholarships with amounts and eligibility
 */

'use client';

import { useState } from 'react';
import type { FinancialAid, Scholarship } from '@/types/career';

// Icons
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// Scope badge colors
const SCOPE_COLORS: Record<string, string> = {
  national: 'bg-blue-100 text-blue-700',
  state: 'bg-green-100 text-green-700',
  local: 'bg-yellow-100 text-yellow-700',
  institution: 'bg-purple-100 text-purple-700',
};

function formatAmount(amount: Scholarship['amount']): string {
  if (!amount) return 'Amount varies';
  if (typeof amount === 'string') return amount;
  if (amount.min === amount.max) {
    return `$${amount.min.toLocaleString()}`;
  }
  return `$${amount.min.toLocaleString()} - $${amount.max.toLocaleString()}`;
}

interface ScholarshipCardProps {
  scholarship: Scholarship;
}

function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
  return (
    <div className="bg-white border rounded-lg p-4 hover:border-sage transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {scholarship.scope && (
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${SCOPE_COLORS[scholarship.scope] || 'bg-gray-100 text-gray-700'}`}>
                {scholarship.scope}
              </span>
            )}
            {scholarship.renewable && (
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                Renewable
              </span>
            )}
          </div>

          <a
            href={scholarship.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 hover:text-sage transition-colors group inline-flex items-center gap-1"
          >
            {scholarship.name}
            <ExternalLinkIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>

          <p className="text-sm text-gray-600 mt-1">{scholarship.provider}</p>

          {scholarship.eligibility && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              <span className="font-medium">Eligibility:</span> {scholarship.eligibility}
            </p>
          )}

          {scholarship.deadline && (
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium">Deadline:</span> {scholarship.deadline}
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-lg font-semibold text-sage">
            {formatAmount(scholarship.amount)}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FinancialAidSectionProps {
  financialAid: FinancialAid | null | undefined;
  careerTitle: string;
  estimatedCost?: { min_cost: number; max_cost: number; typical_cost: number } | null;
  className?: string;
}

export function FinancialAidSection({ financialAid, careerTitle, estimatedCost, className = '' }: FinancialAidSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (!financialAid) {
    return null;
  }

  const displayScholarships = showAll
    ? financialAid.scholarships
    : financialAid.scholarships.slice(0, 3);
  const hasMore = financialAid.scholarships.length > 3;

  return (
    <section className={`${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <DollarIcon className="w-6 h-6 text-sage" />
        <h2 className="text-xl font-semibold text-gray-900">Scholarships & Financial Aid</h2>
      </div>

      {/* Federal Aid Eligibility Banner */}
      {financialAid.federal_aid_eligible && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Federal Financial Aid Eligible</span>
          </div>
          <p className="text-sm text-green-700 mt-1 ml-7">
            FAFSA, Pell Grants, and federal student loans available for qualifying programs
          </p>
        </div>
      )}

      {/* Cost context if available */}
      {estimatedCost && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Estimated education cost:</span>{' '}
            ${estimatedCost.typical_cost.toLocaleString()}
            <span className="text-gray-500">
              {' '}(range: ${estimatedCost.min_cost.toLocaleString()} - ${estimatedCost.max_cost.toLocaleString()})
            </span>
          </p>
        </div>
      )}

      {/* Typical Aid Sources */}
      {financialAid.typical_aid_sources.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Common Funding Sources</h3>
          <div className="flex flex-wrap gap-2">
            {financialAid.typical_aid_sources.map((source, i) => (
              <span
                key={i}
                className="inline-block px-3 py-1.5 bg-sage/10 text-sage-dark rounded-full text-sm"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Employer Programs */}
      {financialAid.employer_programs && financialAid.employer_programs.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Employer-Sponsored Options</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {financialAid.employer_programs.map((program, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                {program}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scholarships List */}
      {financialAid.scholarships.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Scholarships ({financialAid.scholarships.length})
          </h3>
          <div className="space-y-3">
            {displayScholarships.map((scholarship, i) => (
              <ScholarshipCard key={scholarship.id || i} scholarship={scholarship} />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 flex items-center gap-1 text-sage hover:text-sage-dark font-medium text-sm transition-colors"
            >
              {showAll ? 'Show less' : `Show ${financialAid.scholarships.length - 3} more scholarships`}
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* Category Resources */}
      {financialAid.category_resources && financialAid.category_resources.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Scholarship Search Resources</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {financialAid.category_resources.map((resource, i) => (
              <a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded transition-colors group"
              >
                <span className="text-sm text-gray-700 group-hover:text-sage transition-colors">
                  {resource.name}
                </span>
                <ExternalLinkIcon className="w-3 h-3 text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Last updated */}
      {financialAid.last_updated && (
        <p className="mt-4 text-xs text-gray-400">
          Last updated: {financialAid.last_updated}
        </p>
      )}
    </section>
  );
}
