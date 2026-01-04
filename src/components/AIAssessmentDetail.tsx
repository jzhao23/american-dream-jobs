/**
 * AI Assessment Detail Component v2.0
 *
 * Displays the 3-dimension breakdown of an AI Resilience assessment with additive scoring:
 * - AI Exposure (from GPTs are GPTs / AIOE fallback)
 * - Job Growth (from BLS projections)
 * - Human Advantage (EPOCH framework)
 *
 * Each dimension shows:
 * - Label (Low/Medium/High, Growing/Stable/Declining, Strong/Moderate/Weak)
 * - Points earned (0-2)
 * - Visual bar
 * - Expandable detail section
 *
 * Also shows the total score (0-6), classification, and methodology link.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AIResilienceBadge } from './AIResilienceBadge';
import type { CareerAIAssessment } from '@/lib/ai-resilience';

// Simple SVG icons
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
  careerTitle?: string;
  className?: string;
}

// Color mapping for labels
const LABEL_COLORS: Record<string, string> = {
  // AI Exposure (inverted - Low is good)
  Low: 'text-green-600 bg-green-100',
  Medium: 'text-yellow-600 bg-yellow-100',
  High: 'text-red-600 bg-red-100',
  // Job Growth
  Declining: 'text-red-600 bg-red-100',
  Stable: 'text-yellow-600 bg-yellow-100',
  Growing: 'text-green-600 bg-green-100',
  // Human Advantage
  Weak: 'text-red-600 bg-red-100',
  Moderate: 'text-yellow-600 bg-yellow-100',
  Strong: 'text-green-600 bg-green-100',
};

function LevelBadge({ level, points }: { level: string; points: number }) {
  const colorClass = LABEL_COLORS[level] || 'text-gray-600 bg-gray-100';
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${colorClass}`}>
        {level}
      </span>
      <span className="text-sm text-gray-500">+{points}</span>
    </div>
  );
}

function PointsBar({ points, maxPoints = 2 }: { points: number; maxPoints?: number }) {
  const percentage = (points / maxPoints) * 100;
  const barColor = points === 2 ? 'bg-green-500' : points === 1 ? 'bg-yellow-500' : 'bg-gray-300';

  return (
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${barColor} rounded-full transition-all`}
        style={{ width: `${percentage}%` }}
      />
    </div>
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

export function AIAssessmentDetail({ assessment, careerTitle, className = '' }: AIAssessmentDetailProps) {
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

  // Get scoring from assessment
  const scoring = assessment.scoring || {
    exposurePoints: 1,
    growthPoints: 1,
    humanAdvantagePoints: 1,
    totalScore: 3,
  };

  // Format exposure percentage for display
  const exposurePercent = Math.round((assessment.aiExposure?.score || 0) * 100);

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header with classification */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Resilience Score</h3>
            <p className="text-sm text-gray-600 mt-1">{assessment.classificationRationale}</p>
          </div>
          <AIResilienceBadge classification={assessment.classification} size="lg" />
        </div>
      </div>

      {/* Score Breakdown - 3 dimensions */}
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4">How we calculated this:</p>

        <div className="space-y-4">
          {/* AI Exposure */}
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">AI Exposure</span>
                <LevelBadge level={assessment.aiExposure?.label || 'Medium'} points={scoring.exposurePoints} />
              </div>
            </div>
            <PointsBar points={scoring.exposurePoints} />
            <p className="text-xs text-gray-500 mt-2">
              {exposurePercent}% of tasks can be accelerated by AI
            </p>
          </div>

          {/* Job Growth */}
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Job Growth</span>
                <LevelBadge level={assessment.jobGrowth.label} points={scoring.growthPoints} />
              </div>
            </div>
            <PointsBar points={scoring.growthPoints} />
            <p className="text-xs text-gray-500 mt-2">
              {assessment.jobGrowth.percentChange > 0 ? '+' : ''}{assessment.jobGrowth.percentChange}% projected (2024-2034)
            </p>
          </div>

          {/* Human Advantage */}
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Human Advantage</span>
                <LevelBadge level={assessment.humanAdvantage.category} points={scoring.humanAdvantagePoints} />
              </div>
            </div>
            <PointsBar points={scoring.humanAdvantagePoints} />
            <p className="text-xs text-gray-500 mt-2">
              EPOCH score: {totalEpochScore}/25
            </p>
          </div>
        </div>

        {/* Total Score */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Total Score</span>
            <span className="text-lg font-bold text-gray-900">{scoring.totalScore}/6</span>
          </div>
          <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                scoring.totalScore >= 5 ? 'bg-green-500' :
                scoring.totalScore >= 3 ? 'bg-yellow-500' :
                scoring.totalScore >= 2 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${(scoring.totalScore / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expandable sections for each dimension */}

      {/* AI Exposure Details */}
      <ExpandableSection title="Learn more: AI Exposure">
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            {careerTitle ? (
              <>
                About <strong>{exposurePercent}%</strong> of {careerTitle.toLowerCase()} tasks can be
                significantly accelerated by AI tools like ChatGPT.
              </>
            ) : (
              <>
                AI Exposure measures what percentage of this occupation's tasks can be
                completed <strong>50% faster</strong> using AI tools while maintaining quality.
              </>
            )}
          </p>
          <div className="bg-white rounded border p-3">
            <h4 className="font-semibold text-gray-900 mb-2">Scoring:</h4>
            <ul className="space-y-1 text-gray-600">
              <li><span className="font-medium text-green-600">Low (&lt;25%):</span> +2 points - Most tasks protected from AI</li>
              <li><span className="font-medium text-yellow-600">Medium (25-50%):</span> +1 point - Mixed exposure</li>
              <li><span className="font-medium text-red-600">High (&gt;50%):</span> +0 points - Majority of tasks AI-exposed</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500">
            Source: "GPTs are GPTs" (Eloundou et al., 2023) - task-level LLM exposure analysis
            {assessment.aiExposure?.source === 'aioe' && ' | Fallback: AIOE Dataset (Felten et al., 2021)'}
          </p>
        </div>
      </ExpandableSection>

      {/* Job Growth Details */}
      <ExpandableSection title="Learn more: Job Growth">
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
          </div>
          <div className="bg-white rounded border p-3">
            <h4 className="font-semibold text-gray-900 mb-2">Scoring:</h4>
            <ul className="space-y-1 text-gray-600">
              <li><span className="font-medium text-green-600">Growing (&gt;5%):</span> +2 points</li>
              <li><span className="font-medium text-yellow-600">Stable (0-5%):</span> +1 point</li>
              <li><span className="font-medium text-red-600">Declining (&lt;0%):</span> +0 points</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500">
            Source: BLS Employment Projections 2024-2034
          </p>
        </div>
      </ExpandableSection>

      {/* EPOCH Human Advantage Details */}
      <ExpandableSection title="Learn more: Human Advantage (EPOCH)">
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
          </div>

          <div className="bg-white rounded border p-3 mt-3">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Scoring:</h4>
            <ul className="space-y-1 text-gray-600 text-sm">
              <li><span className="font-medium text-green-600">Strong (20+):</span> +2 points</li>
              <li><span className="font-medium text-yellow-600">Moderate (12-19):</span> +1 point</li>
              <li><span className="font-medium text-red-600">Weak (&lt;12):</span> +0 points</li>
            </ul>
          </div>
        </div>
      </ExpandableSection>

      {/* Methodology footer */}
      <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>
            Methodology: v2.0 - GPTs are GPTs / BLS / EPOCH Additive Scoring
          </span>
          <span>Updated: {assessment.lastUpdated}</span>
        </div>
        <div className="mt-2">
          <Link
            href="/methodology"
            className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
          >
            View full methodology &rarr;
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
  const scoring = assessment.scoring || { totalScore: 3 };

  return (
    <div className="space-y-2">
      <AIResilienceBadge classification={assessment.classification} size="sm" />
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Exposure:</span>{' '}
          <span className="font-medium">{assessment.aiExposure?.label || 'Medium'}</span>
        </div>
        <div>
          <span className="text-gray-500">Growth:</span>{' '}
          <span className="font-medium">{assessment.jobGrowth.percentChange > 0 ? '+' : ''}{assessment.jobGrowth.percentChange}%</span>
        </div>
        <div>
          <span className="text-gray-500">Score:</span>{' '}
          <span className="font-medium">{scoring.totalScore}/6</span>
        </div>
      </div>
    </div>
  );
}
