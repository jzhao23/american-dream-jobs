/**
 * AI Resilience Classification Algorithm v2.0
 *
 * This module implements the 4-tier AI Resilience classification system using
 * an additive scoring algorithm. It evaluates three dimensions and sums their
 * points to determine the final classification.
 *
 * ## Four Classification Tiers
 * - AI-Resilient (🟢): Score 5-6 - Strong protection from AI displacement
 * - AI-Augmented (🟡): Score 3-4 - AI assists but humans remain essential
 * - In Transition (🟠): Score 2 - Career being transformed by AI
 * - High Disruption Risk (🔴): Score 0-1 - Significant risk from AI
 *
 * ## Three Scoring Dimensions (0-2 points each, max 6)
 * 1. AI Exposure: Based on GPTs are GPTs β score (Eloundou et al., 2023)
 * 2. Job Growth: BLS employment projections 2024-2034
 * 3. Human Advantage: EPOCH framework score
 *
 * ## EPOCH Framework
 * Human Advantage is measured using five dimensions:
 * - Empathy: Emotional intelligence, patient/customer care
 * - Presence: Physical presence requirements, hands-on work
 * - Opinion: Judgment, decision-making, critical thinking
 * - Creativity: Innovation, problem-solving, artistic expression
 * - Hope: Mentorship, motivation, counseling
 *
 * Each dimension scored 1-5, sum determines category:
 * - Strong: sum >= 20 → +2 points
 * - Moderate: sum 12-19 → +1 point
 * - Weak: sum < 12 → +0 points
 *
 * ## Data Sources
 * - AI Exposure: "GPTs are GPTs" (Eloundou et al., 2023) - task-level LLM analysis
 * - Job Growth: BLS Employment Projections 2024-2034
 * - Human Advantage: EPOCH framework scores
 *
 * @see /docs/AI_RESILIENCE_METHODOLOGY.md for full methodology documentation
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * AI Exposure label based on GPTs β score
 * Thresholds:
 *   - Low: β < 0.25 (less than 25% of tasks accelerated by AI)
 *   - Medium: β 0.25-0.50 (25-50% of tasks accelerated)
 *   - High: β > 0.50 (more than 50% of tasks accelerated)
 */
export type AIExposureLabel = 'Low' | 'Medium' | 'High';

/**
 * AI Exposure data structure
 */
export interface AIExposure {
  score: number;           // 0-1 β score from GPTs paper
  label: AIExposureLabel;  // Low/Medium/High for display
  source: 'gpts' | 'aioe' | 'editorial'; // Data source ('editorial' for manual careers)
}

/**
 * Job growth label based on BLS 2024-2034 projections
 * Simplified to 3 categories for scoring:
 *   - Declining: < 0%
 *   - Stable: 0% to 5%
 *   - Growing: > 5%
 */
export type JobGrowthLabel = 'Declining' | 'Stable' | 'Growing';

/**
 * Human advantage category based on EPOCH score sum
 * Thresholds:
 *   - Strong: sum >= 20
 *   - Moderate: sum >= 12
 *   - Weak: sum < 12
 */
export type HumanAdvantageCategory = 'Weak' | 'Moderate' | 'Strong';

/**
 * Final AI Resilience classification tier
 */
export type AIResilienceClassification =
  | 'AI-Resilient'
  | 'AI-Augmented'
  | 'In Transition'
  | 'High Disruption Risk';

/**
 * EPOCH scores for a single career
 */
export interface EPOCHScores {
  empathy: number;    // 1-5: Emotional intelligence, patient/customer care
  presence: number;   // 1-5: Physical presence requirements
  opinion: number;    // 1-5: Judgment, decision-making, critical thinking
  creativity: number; // 1-5: Innovation, problem-solving
  hope: number;       // 1-5: Mentorship, motivation, counseling
}

/**
 * Complete AI assessment for a career (v2.0)
 */
export interface CareerAIAssessment {
  // Single AI Exposure metric (replaces taskExposure + automationPotential)
  aiExposure: AIExposure;

  // Job Growth
  jobGrowth: {
    label: JobGrowthLabel;
    percentChange: number;
    source: string;
  };

  // Human Advantage (EPOCH)
  humanAdvantage: {
    category: HumanAdvantageCategory;
    epochScores: EPOCHScores;
  };

  // Scoring breakdown
  scoring: {
    exposurePoints: number;
    growthPoints: number;
    humanAdvantagePoints: number;
    totalScore: number;
  };

  // Final classification
  classification: AIResilienceClassification;
  classificationRationale: string;

  // Metadata
  lastUpdated: string;
  methodology: string;
}

/**
 * Result from the AI Resilience calculation
 */
export interface AIResilienceResult {
  // Point scores for each dimension (0, 1, or 2)
  exposurePoints: number;
  growthPoints: number;
  humanAdvantagePoints: number;
  totalScore: number;

  // User-facing labels
  exposureLabel: AIExposureLabel;
  growthLabel: JobGrowthLabel;
  humanAdvantageLabel: HumanAdvantageCategory;

  // Final classification
  classification: AIResilienceClassification;
  emoji: '🟢' | '🟡' | '🟠' | '🔴';
  rationale: string;
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Score AI Exposure based on GPTs β score
 *
 * @param beta - The β score from GPTs are GPTs (0-1 range)
 * @returns Points (0-2) and label
 */
export function scoreExposure(beta: number): { points: 0 | 1 | 2; label: AIExposureLabel } {
  if (beta < 0.25) return { points: 2, label: 'Low' };
  if (beta <= 0.50) return { points: 1, label: 'Medium' };
  return { points: 0, label: 'High' };
}

/**
 * Score Job Growth based on BLS projections
 *
 * @param percentChange - Projected employment change 2024-2034
 * @returns Points (0-2) and label
 */
export function scoreGrowth(percentChange: number): { points: 0 | 1 | 2; label: JobGrowthLabel } {
  if (percentChange > 5) return { points: 2, label: 'Growing' };
  if (percentChange >= 0) return { points: 1, label: 'Stable' };
  return { points: 0, label: 'Declining' };
}

/**
 * Score Human Advantage based on EPOCH sum
 *
 * @param epochSum - Sum of EPOCH scores (5-25)
 * @returns Points (0-2) and label
 */
export function scoreEpoch(epochSum: number): { points: 0 | 1 | 2; label: HumanAdvantageCategory } {
  if (epochSum >= 20) return { points: 2, label: 'Strong' };
  if (epochSum >= 12) return { points: 1, label: 'Moderate' };
  return { points: 0, label: 'Weak' };
}

/**
 * Get classification from total score
 *
 * @param score - Total score (0-6)
 * @returns Classification and emoji
 */
export function getClassificationFromScore(score: number): {
  classification: AIResilienceClassification;
  emoji: '🟢' | '🟡' | '🟠' | '🔴';
} {
  if (score >= 5) return { classification: 'AI-Resilient', emoji: '🟢' };
  if (score >= 3) return { classification: 'AI-Augmented', emoji: '🟡' };
  if (score >= 2) return { classification: 'In Transition', emoji: '🟠' };
  return { classification: 'High Disruption Risk', emoji: '🔴' };
}

// ============================================================================
// Main Classification Function
// ============================================================================

/**
 * Input for AI Resilience calculation
 */
export interface AIResilienceInput {
  // AI Exposure (GPTs primary, AIOE fallback, editorial for manual careers)
  gptsExposureBeta: number | null;  // 0-1, from GPTs paper
  aioeExposure: number | null;      // 0-1, fallback if GPTs unavailable
  exposureSource?: 'gpts' | 'aioe' | 'editorial'; // 'editorial' for manual career assessments

  // Job Growth
  blsGrowthPercent: number;         // e.g., 6 for +6%

  // Human Advantage
  epochSum: number;                 // 5-25
}

/**
 * Calculate AI Resilience classification using additive scoring
 *
 * This is the main entry point for the v2.0 classification algorithm.
 * It scores three dimensions (0-2 points each) and sums them for a total
 * score of 0-6, which determines the final classification.
 *
 * @param input - The input data for classification
 * @returns Complete result with scores, labels, and classification
 */
export function calculateAIResilience(input: AIResilienceInput): AIResilienceResult {
  // Determine AI Exposure value (GPTs primary, AIOE fallback)
  const exposureValue = input.gptsExposureBeta ?? input.aioeExposure ?? 0.5;

  // Score each dimension
  const { points: exposurePoints, label: exposureLabel } = scoreExposure(exposureValue);
  const { points: growthPoints, label: growthLabel } = scoreGrowth(input.blsGrowthPercent);
  const { points: humanAdvantagePoints, label: humanAdvantageLabel } = scoreEpoch(input.epochSum);

  // Calculate total and get classification
  const totalScore = exposurePoints + growthPoints + humanAdvantagePoints;
  const { classification, emoji } = getClassificationFromScore(totalScore);

  // Generate rationale
  const rationale = generateRationale(
    exposureLabel,
    growthLabel,
    humanAdvantageLabel,
    totalScore,
    classification
  );

  return {
    exposurePoints,
    growthPoints,
    humanAdvantagePoints,
    totalScore,
    exposureLabel,
    growthLabel,
    humanAdvantageLabel,
    classification,
    emoji,
    rationale,
  };
}

/**
 * Generate a human-readable rationale for the classification
 */
function generateRationale(
  exposure: AIExposureLabel,
  growth: JobGrowthLabel,
  humanAdvantage: HumanAdvantageCategory,
  score: number,
  classification: AIResilienceClassification
): string {
  const parts: string[] = [];

  if (exposure === 'Low') {
    parts.push('low AI task exposure');
  } else if (exposure === 'High') {
    parts.push('high AI task exposure');
  }

  if (growth === 'Growing') {
    parts.push('growing job demand');
  } else if (growth === 'Declining') {
    parts.push('declining job demand');
  }

  if (humanAdvantage === 'Strong') {
    parts.push('strong human advantage');
  } else if (humanAdvantage === 'Weak') {
    parts.push('limited human advantage');
  }

  const summary = parts.length > 0 ? parts.join(', ') : 'balanced factors';

  switch (classification) {
    case 'AI-Resilient':
      return `Score ${score}/6: ${summary} provides strong protection from AI displacement`;
    case 'AI-Augmented':
      return `Score ${score}/6: ${summary} means AI will assist but humans remain essential`;
    case 'In Transition':
      return `Score ${score}/6: ${summary} indicates this career is being transformed by AI`;
    case 'High Disruption Risk':
      return `Score ${score}/6: ${summary} creates significant risk from AI disruption`;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate human advantage category from EPOCH scores
 *
 * @param scores - EPOCH scores object
 * @returns Human advantage category (Weak/Moderate/Strong)
 */
export function getHumanAdvantageFromEPOCH(scores: EPOCHScores): HumanAdvantageCategory {
  const sum = scores.empathy + scores.presence + scores.opinion +
              scores.creativity + scores.hope;

  if (sum >= 20) return 'Strong';
  if (sum >= 12) return 'Moderate';
  return 'Weak';
}

/**
 * Calculate EPOCH sum from scores
 */
export function calculateEPOCHSum(scores: EPOCHScores): number {
  return scores.empathy + scores.presence + scores.opinion +
         scores.creativity + scores.hope;
}

/**
 * Get job growth label from percent change (simplified 3-category version)
 *
 * @param percentChange - Projected employment change 2024-2034
 * @returns Job growth label
 */
export function getJobGrowthLabel(percentChange: number): JobGrowthLabel {
  if (percentChange > 5) return 'Growing';
  if (percentChange >= 0) return 'Stable';
  return 'Declining';
}

/**
 * Get AI exposure label from β score
 *
 * @param beta - GPTs β score (0-1)
 * @returns AI exposure label
 */
export function getAIExposureLabel(beta: number): AIExposureLabel {
  if (beta < 0.25) return 'Low';
  if (beta <= 0.50) return 'Medium';
  return 'High';
}

// ============================================================================
// Utility Functions for UI
// ============================================================================

/**
 * Get the color class for a classification tier
 */
export function getAIResilienceColor(classification: AIResilienceClassification): string {
  const colors: Record<AIResilienceClassification, string> = {
    'AI-Resilient': 'text-green-600 bg-green-100',
    'AI-Augmented': 'text-yellow-600 bg-yellow-100',
    'In Transition': 'text-orange-600 bg-orange-100',
    'High Disruption Risk': 'text-red-600 bg-red-100',
  };
  return colors[classification];
}

/**
 * Get the numeric tier for sorting (1 = most resilient, 4 = highest risk)
 */
export function getAIResilienceTier(classification: AIResilienceClassification): number {
  const tiers: Record<AIResilienceClassification, number> = {
    'AI-Resilient': 1,
    'AI-Augmented': 2,
    'In Transition': 3,
    'High Disruption Risk': 4,
  };
  return tiers[classification];
}

/**
 * Get the emoji indicator for a classification
 */
export function getAIResilienceEmoji(classification: AIResilienceClassification): string {
  const emojis: Record<AIResilienceClassification, string> = {
    'AI-Resilient': '🟢',
    'AI-Augmented': '🟡',
    'In Transition': '🟠',
    'High Disruption Risk': '🔴',
  };
  return emojis[classification];
}

/**
 * Get a short description for a classification
 */
export function getAIResilienceDescription(classification: AIResilienceClassification): string {
  const descriptions: Record<AIResilienceClassification, string> = {
    'AI-Resilient': 'Strong human advantage or growing demand protects this career from AI displacement',
    'AI-Augmented': 'AI will assist this work but human judgment and skills remain essential',
    'In Transition': 'This career is being transformed by AI; adaptation and skill evolution needed',
    'High Disruption Risk': 'High AI exposure combined with declining demand creates significant risk',
  };
  return descriptions[classification];
}

/**
 * Get color for an exposure/growth/advantage label
 */
export function getLabelColor(label: AIExposureLabel | JobGrowthLabel | HumanAdvantageCategory): string {
  const colors: Record<string, string> = {
    // AI Exposure (inverted - Low is good)
    'Low': 'text-green-600 bg-green-100',
    'Medium': 'text-yellow-600 bg-yellow-100',
    'High': 'text-red-600 bg-red-100',
    // Job Growth
    'Declining': 'text-red-600 bg-red-100',
    'Stable': 'text-yellow-600 bg-yellow-100',
    'Growing': 'text-green-600 bg-green-100',
    // Human Advantage
    'Weak': 'text-red-600 bg-red-100',
    'Moderate': 'text-yellow-600 bg-yellow-100',
    'Strong': 'text-green-600 bg-green-100',
  };
  return colors[label] || 'text-gray-600 bg-gray-100';
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * Convert classification to legacy AI Risk score (1-10)
 * For backwards compatibility during migration period
 */
export function classificationToLegacyScore(classification: AIResilienceClassification): number {
  const scores: Record<AIResilienceClassification, number> = {
    'AI-Resilient': 2,
    'AI-Augmented': 4,
    'In Transition': 6,
    'High Disruption Risk': 8,
  };
  return scores[classification];
}

/**
 * Convert classification to legacy AI Risk label
 */
export function classificationToLegacyLabel(classification: AIResilienceClassification): string {
  const labels: Record<AIResilienceClassification, string> = {
    'AI-Resilient': 'very_low',
    'AI-Augmented': 'low',
    'In Transition': 'medium',
    'High Disruption Risk': 'high',
  };
  return labels[classification];
}

// ============================================================================
// DEPRECATED: Legacy types and functions kept for migration
// These will be removed in a future version
// ============================================================================

/**
 * @deprecated Use AIExposureLabel instead
 */
export type TaskExposure = 'Low' | 'Medium' | 'High';

/**
 * @deprecated No longer used - removed in v2.0
 */
export type AutomationPotential = 'Low' | 'Medium' | 'High';

/**
 * @deprecated Use JobGrowthLabel instead. Legacy 5-category version.
 */
export type JobGrowthCategory =
  | 'Declining Quickly'
  | 'Declining Slowly'
  | 'Stable'
  | 'Growing Slowly'
  | 'Growing Quickly';

/**
 * @deprecated Use getJobGrowthLabel instead. Legacy 5-category version.
 */
export function getJobGrowthCategory(percentChange: number): JobGrowthCategory {
  if (percentChange < -10) return 'Declining Quickly';
  if (percentChange < 0) return 'Declining Slowly';
  if (percentChange <= 5) return 'Stable';
  if (percentChange <= 15) return 'Growing Slowly';
  return 'Growing Quickly';
}

/**
 * @deprecated Use calculateAIResilience instead
 */
export function classifyCareer(
  taskExposure: TaskExposure,
  _automationPotential: AutomationPotential,
  jobGrowth: JobGrowthCategory,
  humanAdvantage: HumanAdvantageCategory
): { classification: AIResilienceClassification; rationale: string } {
  // Convert legacy inputs to new format
  const exposureBeta = taskExposure === 'Low' ? 0.15 : taskExposure === 'Medium' ? 0.35 : 0.65;
  const growthPercent =
    jobGrowth === 'Declining Quickly' ? -15 :
    jobGrowth === 'Declining Slowly' ? -5 :
    jobGrowth === 'Stable' ? 2 :
    jobGrowth === 'Growing Slowly' ? 10 : 20;
  const epochSum = humanAdvantage === 'Strong' ? 22 : humanAdvantage === 'Moderate' ? 15 : 8;

  const result = calculateAIResilience({
    gptsExposureBeta: exposureBeta,
    aioeExposure: null,
    blsGrowthPercent: growthPercent,
    epochSum,
  });

  return {
    classification: result.classification,
    rationale: result.rationale,
  };
}
