/**
 * AI Assessment Detail Component
 *
 * Displays the full 4-dimension breakdown of an AI Resilience assessment:
 * - Task Exposure (from GPTs are GPTs dataset, with AIOE fallback)
 * - Automation Potential
 * - Job Growth (from BLS projections)
 * - Human Advantage (EPOCH framework)
 *
 * Each dimension includes:
 * - One-line description
 * - Level badge
 * - Expandable detail section
 *
 * Also shows the classification rationale, methodology link, and sources.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AIResilienceBadge } from './AIResilienceBadge';
import type { CareerAIAssessment } from '@/lib/ai-resilience';

// Simple SVG icons to avoid external dependency
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

interface AIAssessmentDetailProps {
  assessment: CareerAIAssessment;
  className?: string;
}

// Color mapping for levels
const LEVEL_COLORS = {
  Low: 'text-green-600 bg-green-100',
  Medium: 'text-yellow-600 bg-yellow-100',
  High: 'text-red-600 bg-red-100',
  Weak: 'text-red-600 bg-red-100',
  Moderate: 'text-yellow-600 bg-yellow-100',
  Strong: 'text-green-600 bg-green-100',
  'Declining Quickly': 'text-red-600 bg-red-100',
  'Declining Slowly': 'text-orange-600 bg-orange-100',
  'Stable': 'text-yellow-600 bg-yellow-100',
  'Growing Slowly': 'text-emerald-600 bg-emerald-100',
  'Growing Quickly': 'text-green-600 bg-green-100',
};

// One-line descriptions for each dimension
const DIMENSION_DESCRIPTIONS = {
  taskExposure: 'How much of this job involves tasks AI can currently perform',
  automationRisk: 'Likelihood that AI replaces workers vs. assists them',
  jobGrowth: 'Projected change in employment over 10 years',
  humanAdvantage: 'How much this role relies on distinctly human capabilities',
};

function LevelBadge({ level }: { level: string }) {
  const colorClass = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || 'text-gray-600 bg-gray-100';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${colorClass}`}>
      {level}
    </span>
  );
}

function EPOCHBar({ label, score, description }: { label: string; score: number; description: string }) {
  const percentage = (score / 5) * 100;
  const barColor = score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1" title={description}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500">{score}/5</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Expandable section component
function ExpandableSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  return (
    <div className="border-t">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          {icon || <InfoIcon className="w-4 h-4" />}
          <span>{title}</span>
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t">
          {children}
        </div>
      )}
    </div>
  );
}

export function AIAssessmentDetail({ assessment, className = '' }: AIAssessmentDetailProps) {
  const epochDescriptions = {
    empathy: 'Emotional intelligence, patient/customer care',
    presence: 'Physical presence requirements, hands-on work',
    opinion: 'Judgment, decision-making, critical thinking',
    creativity: 'Innovation, problem-solving, artistic expression',
    hope: 'Mentorship, motivation, counseling',
  };

  // Calculate total EPOCH score
  const totalEpochScore =
    assessment.humanAdvantage.epochScores.empathy +
    assessment.humanAdvantage.epochScores.presence +
    assessment.humanAdvantage.epochScores.opinion +
    assessment.humanAdvantage.epochScores.creativity +
    assessment.humanAdvantage.epochScores.hope;

  // Determine job growth comparison to average
  const growthComparison = assessment.jobGrowth.percentChange > 4
    ? 'above average'
    : assessment.jobGrowth.percentChange < 0
    ? 'below average'
    : 'near average';

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header with classification */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Resilience Assessment</h3>
            <p className="text-sm text-gray-600 mt-1">{assessment.classificationRationale}</p>
          </div>
          <AIResilienceBadge classification={assessment.classification} size="lg" />
        </div>
      </div>

      {/* Summary Grid with descriptions */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Task Exposure */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Task Exposure</div>
          <div className="mt-1">
            <LevelBadge level={assessment.taskExposure} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{DIMENSION_DESCRIPTIONS.taskExposure}</p>
        </div>

        {/* Automation Risk */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Automation Risk</div>
          <div className="mt-1">
            <LevelBadge level={assessment.automationPotential} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{DIMENSION_DESCRIPTIONS.automationRisk}</p>
        </div>

        {/* Job Growth */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Job Growth</div>
          <div className="mt-1">
            <LevelBadge level={assessment.jobGrowth.category} />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {assessment.jobGrowth.percentChange > 0 ? '+' : ''}{assessment.jobGrowth.percentChange}% over 10 years
          </div>
          <p className="text-xs text-gray-400">(BLS 2024-2034)</p>
        </div>

        {/* Human Advantage */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Human Advantage</div>
          <div className="mt-1">
            <LevelBadge level={assessment.humanAdvantage.category} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{DIMENSION_DESCRIPTIONS.humanAdvantage}</p>
        </div>
      </div>

      {/* Expandable sections for each dimension */}

      {/* Task Exposure Details */}
      <ExpandableSection title="Task Exposure Details">
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            Task exposure measures how much of this occupation's work involves activities that
            current AI systems can perform or significantly assist with.
          </p>
          <div className="bg-white rounded border p-3">
            <h4 className="font-semibold text-gray-900 mb-2">What the levels mean:</h4>
            <ul className="space-y-1 text-gray-600">
              <li><span className="font-medium text-green-600">Low:</span> Most tasks require physical presence, hands-on work, or complex human interaction</li>
              <li><span className="font-medium text-yellow-600">Medium:</span> Mix of AI-exposed and protected tasks</li>
              <li><span className="font-medium text-red-600">High:</span> Many tasks involve data processing, analysis, or content generation that AI handles well</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500">
            Source: GPTs are GPTs (Eloundou et al. 2023); AIOE Dataset (Felten et al. 2021) for fallback
          </p>
        </div>
      </ExpandableSection>

      {/* Automation Risk Details */}
      <ExpandableSection title="Automation Risk Details">
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            Automation risk assesses whether AI is likely to <em>replace</em> workers entirely
            versus <em>augment</em> their productivity. High exposure doesn't always mean high
            automation risk.
          </p>
          <div className="bg-white rounded border p-3">
            <h4 className="font-semibold text-gray-900 mb-2">Key distinction:</h4>
            <ul className="space-y-1 text-gray-600">
              <li><strong>Exposure</strong> = Can AI do parts of this job?</li>
              <li><strong>Automation Risk</strong> = Will AI replace workers or help them?</li>
            </ul>
          </div>
          <div className="bg-white rounded border p-3">
            <h4 className="font-semibold text-gray-900 mb-2">What the levels mean:</h4>
            <ul className="space-y-1 text-gray-600">
              <li><span className="font-medium text-green-600">Low:</span> Most tasks require judgment, creativity, or physical presence — AI augments rather than replaces</li>
              <li><span className="font-medium text-yellow-600">Medium:</span> Some routine tasks can be automated, but core responsibilities remain human</li>
              <li><span className="font-medium text-red-600">High:</span> Predominantly routine, rule-based tasks that AI can perform end-to-end</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500">
            Note: "Automatable" doesn't mean "will be automated" — cost, regulations, and organizational factors matter.
          </p>
        </div>
      </ExpandableSection>

      {/* Job Growth Details */}
      <ExpandableSection title="Job Growth Details">
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            Job growth projections come from the Bureau of Labor Statistics (BLS), which forecasts
            employment changes over a 10-year period based on economic, demographic, and technological trends.
          </p>
          <div className="bg-white rounded border p-3">
            <h4 className="font-semibold text-gray-900 mb-2">This occupation's outlook:</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {assessment.jobGrowth.percentChange > 0 ? '+' : ''}{assessment.jobGrowth.percentChange}%
              </span>
              <span className="text-gray-600">projected change (2024-2034)</span>
            </div>
            <p className="text-gray-500 mt-1">
              This is {growthComparison} for all occupations (economy average: ~4%)
            </p>
          </div>
          <div className="bg-white rounded border p-3">
            <h4 className="font-semibold text-gray-900 mb-2">Growth categories:</h4>
            <ul className="space-y-1 text-gray-600">
              <li><span className="font-medium text-red-600">Declining Quickly:</span> More than 10% decline</li>
              <li><span className="font-medium text-orange-600">Declining Slowly:</span> 0% to 10% decline</li>
              <li><span className="font-medium text-yellow-600">Stable:</span> 0% to 5% growth</li>
              <li><span className="font-medium text-emerald-600">Growing Slowly:</span> 5% to 15% growth</li>
              <li><span className="font-medium text-green-600">Growing Quickly:</span> More than 15% growth</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500">
            Source: BLS Employment Projections 2024-2034. Note: Projections assume no major economic disruptions
            and are updated every 2 years.
          </p>
        </div>
      </ExpandableSection>

      {/* EPOCH Human Advantage Details */}
      <ExpandableSection title="Human Advantage (EPOCH) Breakdown">
        <div className="space-y-3">
          <p className="text-sm text-gray-700 mb-4">
            EPOCH measures five distinctly human capabilities that AI cannot easily replicate.
            Higher scores indicate stronger protection against AI displacement.
          </p>

          <EPOCHBar
            label="E - Empathy"
            score={assessment.humanAdvantage.epochScores.empathy}
            description={epochDescriptions.empathy}
          />
          <EPOCHBar
            label="P - Presence"
            score={assessment.humanAdvantage.epochScores.presence}
            description={epochDescriptions.presence}
          />
          <EPOCHBar
            label="O - Opinion"
            score={assessment.humanAdvantage.epochScores.opinion}
            description={epochDescriptions.opinion}
          />
          <EPOCHBar
            label="C - Creativity"
            score={assessment.humanAdvantage.epochScores.creativity}
            description={epochDescriptions.creativity}
          />
          <EPOCHBar
            label="H - Hope"
            score={assessment.humanAdvantage.epochScores.hope}
            description={epochDescriptions.hope}
          />

          <div className="pt-3 border-t mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Total EPOCH Score:</span>
              <span className="text-sm text-gray-700">
                {totalEpochScore}/25 ({assessment.humanAdvantage.category})
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Strong (20+) | Moderate (12-19) | Weak (&lt;12)
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Methodology footer */}
      <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>
            Sources: GPTs are GPTs (2023), AIOE (2021, fallback), BLS Projections 2024-2034, EPOCH Framework
          </span>
          <span>Updated: {assessment.lastUpdated}</span>
        </div>
        <div className="mt-2">
          <Link
            href="/methodology"
            className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
          >
            How we calculate these ratings &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for comparison views
 */
export function AIAssessmentCompact({ assessment }: { assessment: CareerAIAssessment }) {
  return (
    <div className="space-y-2">
      <AIResilienceBadge classification={assessment.classification} size="sm" />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Exposure:</span>{' '}
          <span className="font-medium">{assessment.taskExposure}</span>
        </div>
        <div>
          <span className="text-gray-500">Growth:</span>{' '}
          <span className="font-medium">{assessment.jobGrowth.percentChange > 0 ? '+' : ''}{assessment.jobGrowth.percentChange}%</span>
        </div>
      </div>
    </div>
  );
}
