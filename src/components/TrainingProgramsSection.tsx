/**
 * Training Programs Section Component
 *
 * Displays recommended training programs for a career including:
 * - Bootcamps, certifications, online courses, apprenticeships
 * - Cost, duration, and format information
 * - Links to external program pages
 */

'use client';

import { useState } from 'react';
import type { TrainingPrograms, TrainingProgram } from '@/types/career';

// Icons
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
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

// Program type badge colors
const TYPE_COLORS: Record<string, string> = {
  bootcamp: 'bg-purple-100 text-purple-700',
  certification: 'bg-blue-100 text-blue-700',
  online_course: 'bg-green-100 text-green-700',
  apprenticeship: 'bg-orange-100 text-orange-700',
  degree_program: 'bg-indigo-100 text-indigo-700',
  professional_development: 'bg-teal-100 text-teal-700',
};

const TYPE_LABELS: Record<string, string> = {
  bootcamp: 'Bootcamp',
  certification: 'Certification',
  online_course: 'Online Course',
  apprenticeship: 'Apprenticeship',
  degree_program: 'Degree Program',
  professional_development: 'Professional Dev',
};

function formatCost(cost: TrainingProgram['cost']): string {
  if (!cost) return 'Cost varies';
  if (cost.type === 'free') return 'Free';
  if (cost.amount !== null && cost.amount !== undefined) {
    return `$${cost.amount.toLocaleString()}`;
  }
  const labels: Record<string, string> = {
    low: 'Low cost',
    moderate: 'Moderate cost',
    high: 'Higher cost',
  };
  return labels[cost.type] || 'Cost varies';
}

function formatDuration(months: number | null | undefined): string {
  if (!months) return '';
  if (months < 1) return `${Math.round(months * 4)} weeks`;
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years}+ years`;
}

interface TrainingProgramCardProps {
  program: TrainingProgram;
}

function TrainingProgramCard({ program }: TrainingProgramCardProps) {
  return (
    <div className="bg-white border rounded-lg p-4 hover:border-sage transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[program.type] || 'bg-gray-100 text-gray-700'}`}>
              {TYPE_LABELS[program.type] || program.type}
            </span>
            {program.format && (
              <span className="text-xs text-gray-500 capitalize">{program.format}</span>
            )}
          </div>

          <a
            href={program.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 hover:text-sage transition-colors group inline-flex items-center gap-1"
          >
            {program.name}
            <ExternalLinkIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>

          <p className="text-sm text-gray-600 mt-1">{program.provider}</p>

          {program.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{program.description}</p>
          )}

          {program.credential_earned && (
            <p className="text-sm text-sage mt-2">
              Credential: {program.credential_earned}
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <div className={`text-sm font-medium ${program.cost?.type === 'free' ? 'text-green-600' : 'text-gray-900'}`}>
            {formatCost(program.cost)}
          </div>
          {program.duration_months && (
            <div className="text-xs text-gray-500 mt-1">
              {formatDuration(program.duration_months)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TrainingProgramsSectionProps {
  programs: TrainingPrograms | null | undefined;
  careerTitle: string;
  className?: string;
}

export function TrainingProgramsSection({ programs, careerTitle, className = '' }: TrainingProgramsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (!programs || programs.programs.length === 0) {
    // Show category resources if available, otherwise don't render
    if (!programs?.category_resources?.length) {
      return null;
    }

    return (
      <section className={`${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <GraduationCapIcon className="w-6 h-6 text-sage" />
          <h2 className="text-xl font-semibold text-gray-900">Training Resources</h2>
        </div>

        <p className="text-gray-600 mb-4">
          Explore training resources for careers in this field:
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {programs.category_resources.map((resource, i) => (
            <a
              key={i}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:border-sage transition-colors group"
            >
              <div className="flex-1">
                <span className="font-medium text-gray-900 group-hover:text-sage transition-colors">
                  {resource.name}
                </span>
                {resource.description && (
                  <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                )}
              </div>
              <ExternalLinkIcon className="w-4 h-4 text-gray-400 group-hover:text-sage transition-colors" />
            </a>
          ))}
        </div>
      </section>
    );
  }

  const displayPrograms = showAll ? programs.programs : programs.programs.slice(0, 4);
  const hasMore = programs.programs.length > 4;

  return (
    <section className={`${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <GraduationCapIcon className="w-6 h-6 text-sage" />
        <h2 className="text-xl font-semibold text-gray-900">Training Programs</h2>
      </div>

      <p className="text-gray-600 mb-4">
        Recommended training programs for {careerTitle.toLowerCase()}:
      </p>

      <div className="space-y-3">
        {displayPrograms.map((program, i) => (
          <TrainingProgramCard key={program.id || i} program={program} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 flex items-center gap-1 text-sage hover:text-sage-dark font-medium text-sm transition-colors"
        >
          {showAll ? 'Show less' : `Show ${programs.programs.length - 4} more programs`}
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Category resources */}
      {programs.category_resources && programs.category_resources.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Additional Resources</h3>
          <div className="flex flex-wrap gap-2">
            {programs.category_resources.map((resource, i) => (
              <a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
              >
                {resource.name}
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Last updated */}
      {programs.last_updated && (
        <p className="mt-4 text-xs text-gray-400">
          Last updated: {programs.last_updated}
        </p>
      )}
    </section>
  );
}
