/**
 * AI Resilience Badge Component
 *
 * Displays a color-coded badge showing the AI Resilience classification
 * for a career. Uses the 4-tier system:
 * - AI-Resilient (green)
 * - AI-Augmented (yellow)
 * - In Transition (orange)
 * - High Disruption Risk (red)
 */

import {
  type AIResilienceClassification,
  getAIResilienceColor,
  getAIResilienceEmoji,
  getAIResilienceDescription,
} from '@/types/career';

interface AIResilienceBadgeProps {
  classification: AIResilienceClassification;
  showEmoji?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AIResilienceBadge({
  classification,
  showEmoji = true,
  showTooltip = true,
  size = 'md',
}: AIResilienceBadgeProps) {
  const colorClass = getAIResilienceColor(classification);
  const emoji = getAIResilienceEmoji(classification);
  const description = getAIResilienceDescription(classification);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClasses[size]}`}
      title={showTooltip ? description : undefined}
    >
      {showEmoji && <span>{emoji}</span>}
      <span>{classification}</span>
    </span>
  );
}

/**
 * Compact version of the badge for lists and tables
 */
export function AIResilienceBadgeCompact({
  classification,
}: {
  classification: AIResilienceClassification;
}) {
  const emoji = getAIResilienceEmoji(classification);
  const description = getAIResilienceDescription(classification);

  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`${classification}: ${description}`}
    >
      <span>{emoji}</span>
    </span>
  );
}

/**
 * Badge with tier number for sorting context
 */
export function AIResilienceBadgeWithTier({
  classification,
  tier,
}: {
  classification: AIResilienceClassification;
  tier: number;
}) {
  const colorClass = getAIResilienceColor(classification);
  const emoji = getAIResilienceEmoji(classification);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 rounded-full text-sm px-2 py-1 font-medium ${colorClass}`}
      >
        <span>{emoji}</span>
        <span>{classification}</span>
      </span>
      <span className="text-xs text-gray-500">Tier {tier}/4</span>
    </div>
  );
}
