/**
 * AI Assessment Detail Component
 *
 * Displays the full 4-dimension breakdown of an AI Resilience assessment:
 * - Task Exposure (from AIOE dataset)
 * - Automation Potential
 * - Job Growth (from BLS projections)
 * - Human Advantage (EPOCH framework)
 *
 * Also shows the classification rationale and methodology.
 */

'use client';

import { useState } from 'react';
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

export function AIAssessmentDetail({ assessment, className = '' }: AIAssessmentDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const epochDescriptions = {
    empathy: 'Emotional intelligence, patient/customer care',
    presence: 'Physical presence requirements, hands-on work',
    opinion: 'Judgment, decision-making, critical thinking',
    creativity: 'Innovation, problem-solving, artistic expression',
    hope: 'Mentorship, motivation, counseling',
  };

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

      {/* Summary Grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Task Exposure</div>
          <div className="mt-1">
            <LevelBadge level={assessment.taskExposure} />
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Automation Risk</div>
          <div className="mt-1">
            <LevelBadge level={assessment.automationPotential} />
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Job Growth</div>
          <div className="mt-1">
            <LevelBadge level={assessment.jobGrowth.category} />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {assessment.jobGrowth.percentChange > 0 ? '+' : ''}{assessment.jobGrowth.percentChange}% (2024-2034)
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Human Advantage</div>
          <div className="mt-1">
            <LevelBadge level={assessment.humanAdvantage.category} />
          </div>
        </div>
      </div>

      {/* Expandable EPOCH details */}
      <div className="border-t">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <InfoIcon className="w-4 h-4" />
            <span>EPOCH Human Advantage Breakdown</span>
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="p-4 bg-gray-50 border-t space-y-3">
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

            <div className="pt-2 border-t mt-3">
              <div className="text-sm text-gray-600">
                <strong>Total EPOCH Score:</strong>{' '}
                {assessment.humanAdvantage.epochScores.empathy +
                  assessment.humanAdvantage.epochScores.presence +
                  assessment.humanAdvantage.epochScores.opinion +
                  assessment.humanAdvantage.epochScores.creativity +
                  assessment.humanAdvantage.epochScores.hope}
                /25
                {' '}({assessment.humanAdvantage.category})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Methodology footer */}
      <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>
            Sources: AIOE Dataset (Felten et al. 2021), BLS Projections 2024-2034, EPOCH Framework
          </span>
          <span>Updated: {assessment.lastUpdated}</span>
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
