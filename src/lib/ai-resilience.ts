/**
 * AI Resilience Classification Algorithm
 *
 * This module implements the 4-tier AI Resilience classification system that replaces
 * the legacy 1-10 numeric AI Risk score. It uses four input dimensions to classify
 * careers into one of four resilience tiers.
 *
 * ## Four Classification Tiers
 * 1. AI-Resilient (🟢): Low exposure + Strong human advantage OR Growing market
 * 2. AI-Augmented (🟡): Medium exposure, AI assists but doesn't replace
 * 3. In Transition (🟠): High exposure + Moderate human advantage
 * 4. High Disruption Risk (🔴): High exposure + Weak human advantage + Declining market
 *
 * ## Four Input Dimensions
 * 1. Task Exposure: How much of the job's tasks can AI potentially perform (Low/Medium/High)
 * 2. Automation Potential: Likelihood of full automation (Low/Medium/High)
 * 3. Job Growth: BLS employment projections 2024-2034 (5 categories)
 * 4. Human Advantage: EPOCH framework score (Weak/Moderate/Strong)
 *
 * ## EPOCH Framework
 * Human Advantage is measured using the EPOCH framework:
 * - Empathy: Emotional intelligence, patient/customer care
 * - Presence: Physical presence requirements, hands-on work
 * - Opinion: Judgment, decision-making, critical thinking
 * - Creativity: Innovation, problem-solving, artistic expression
 * - Hope: Mentorship, motivation, counseling
 *
 * Each dimension scored 1-5, sum determines category:
 * - Strong: sum >= 20
 * - Moderate: sum >= 12
 * - Weak: sum < 12
 *
 * ## Data Sources
 * - Task Exposure: AIOE Dataset (Felten, Raj, Seamans 2021)
 * - Job Growth: BLS Employment Projections 2024-2034 via CareerOneStop
 * - Human Advantage: Manually curated EPOCH scores
 *
 * @see /docs/AI_RESILIENCE_METHODOLOGY.md for full methodology documentation
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * AI task exposure level based on AIOE scores
 * Low = bottom tercile, Medium = middle tercile, High = top tercile
 */
export type TaskExposure = 'Low' | 'Medium' | 'High';

/**
 * Automation potential (derived from task exposure for now)
 */
export type AutomationPotential = 'Low' | 'Medium' | 'High';

/**
 * Job growth category based on BLS 2024-2034 projections
 * Thresholds:
 *   - Declining Quickly: < -10%
 *   - Declining Slowly: -10% to 0%
 *   - Stable: 0% to 5%
 *   - Growing Slowly: 5% to 15%
 *   - Growing Quickly: > 15%
 */
export type JobGrowthCategory =
  | 'Declining Quickly'
  | 'Declining Slowly'
  | 'Stable'
  | 'Growing Slowly'
  | 'Growing Quickly';

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
 * Complete AI assessment for a career
 */
export interface CareerAIAssessment {
  taskExposure: TaskExposure;
  automationPotential: AutomationPotential;
  jobGrowth: {
    category: JobGrowthCategory;
    percentChange: number;
    source: string;
  };
  humanAdvantage: {
    category: HumanAdvantageCategory;
    epochScores: EPOCHScores;
  };
  classification: AIResilienceClassification;
  classificationRationale: string;
  lastUpdated: string;
  methodology: string;
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
 * Get job growth category from percent change
 *
 * @param percentChange - Projected employment change 2024-2034
 * @returns Job growth category
 */
export function getJobGrowthCategory(percentChange: number): JobGrowthCategory {
  if (percentChange < -10) return 'Declining Quickly';
  if (percentChange < 0) return 'Declining Slowly';
  if (percentChange <= 5) return 'Stable';
  if (percentChange <= 15) return 'Growing Slowly';
  return 'Growing Quickly';
}

// ============================================================================
// Classification Algorithm
// ============================================================================

/**
 * Classify a career into one of four AI Resilience tiers
 *
 * This function implements a priority-ordered rule system. Earlier rules take
 * precedence over later ones. The algorithm considers job growth prospects,
 * AI task exposure, and human advantage (EPOCH) scores.
 *
 * IMPORTANT: Rule order matters! The first matching rule determines the classification.
 *
 * @param taskExposure - How much of the job's tasks can AI perform (Low/Medium/High)
 * @param automationPotential - Likelihood of full automation (Low/Medium/High)
 * @param jobGrowth - BLS employment projections category
 * @param humanAdvantage - EPOCH framework category
 * @returns Object with classification and rationale
 */
export function classifyCareer(
  taskExposure: TaskExposure,
  automationPotential: AutomationPotential,
  jobGrowth: JobGrowthCategory,
  humanAdvantage: HumanAdvantageCategory
): { classification: AIResilienceClassification; rationale: string } {

  // ========== AI-RESILIENT RULES ==========

  // RULE 1: Fast-growing careers with LOW/MEDIUM exposure are resilient
  // Rationale: Strong demand + limited AI applicability = safe
  // Note: High exposure + growing = still augmented (AI transforms but doesn't eliminate)
  // Example: Nurse Practitioners (growing + medium exposure = resilient)
  if (jobGrowth === 'Growing Quickly' && taskExposure !== 'High') {
    return {
      classification: 'AI-Resilient',
      rationale: 'Growing Quickly + Limited Exposure: Strong employment growth combined with limited AI applicability'
    };
  }

  // RULE 2: Strong human advantage protects against moderate exposure
  // Rationale: High EPOCH scores mean AI augments rather than replaces
  // Example: Registered Nurses (high empathy/presence = AI can't replace bedside care)
  if (humanAdvantage === 'Strong' && taskExposure !== 'High') {
    return {
      classification: 'AI-Resilient',
      rationale: 'Strong Human Advantage: High EPOCH scores with low/medium AI exposure means human skills remain essential'
    };
  }

  // RULE 3: Growing slowly + low exposure = safe
  // Rationale: Demand is increasing for jobs AI can't easily do
  // Example: Electricians (5-15% growth, hands-on physical work)
  if (jobGrowth === 'Growing Slowly' && taskExposure === 'Low') {
    return {
      classification: 'AI-Resilient',
      rationale: 'Growing + Low Exposure: Steady demand growth for work that AI cannot easily automate'
    };
  }

  // ========== AI-AUGMENTED RULES ==========

  // RULE 4: Low exposure + not declining quickly = augmented
  // Rationale: AI has limited applicability, job is stable
  // Example: Plumbers (low AI exposure, stable demand)
  if (taskExposure === 'Low' && jobGrowth !== 'Declining Quickly') {
    return {
      classification: 'AI-Augmented',
      rationale: 'Low Exposure: AI has limited applicability to this work; stable employment prospects'
    };
  }

  // RULE 5: Medium exposure + moderate/strong human advantage = augmented
  // Rationale: AI assists but human judgment remains central
  // Example: Accountants (AI helps with calculations, humans do judgment calls)
  if (taskExposure === 'Medium' && (humanAdvantage === 'Moderate' || humanAdvantage === 'Strong')) {
    return {
      classification: 'AI-Augmented',
      rationale: 'Medium Exposure + Human Skills: AI augments this work but human judgment remains essential'
    };
  }

  // RULE 5b: High exposure + growing quickly = augmented (not resilient)
  // Rationale: Even with high growth, high AI exposure means transformation is happening
  // Example: Software Developers (growing fast but AI is changing how they work)
  if (taskExposure === 'High' && jobGrowth === 'Growing Quickly') {
    return {
      classification: 'AI-Augmented',
      rationale: 'High Exposure + Growing: Strong demand but AI is significantly augmenting this work'
    };
  }

  // ========== IN TRANSITION RULES ==========
  // These rules need to be checked BEFORE the stable + moderate rule
  // to ensure high exposure jobs are properly classified

  // RULE 6: High exposure + stable = transitioning
  // Rationale: AI impact is being absorbed but transformation is underway
  // Example: Radiologists (AI can read scans, role is evolving)
  // MUST BE CHECKED BEFORE STABLE + MODERATE RULE
  if (taskExposure === 'High' && jobGrowth === 'Stable') {
    return {
      classification: 'In Transition',
      rationale: 'High Exposure + Stable: AI is transforming this work; role is evolving rather than disappearing'
    };
  }

  // RULE 7: High exposure + declining slowly + moderate human advantage
  // Rationale: Significant AI impact but human skills provide some protection
  // Example: Paralegals (AI can research, but judgment still needed)
  if (taskExposure === 'High' && jobGrowth === 'Declining Slowly' && humanAdvantage === 'Moderate') {
    return {
      classification: 'In Transition',
      rationale: 'High Exposure + Moderate Decline: AI is significantly impacting this field, but human skills provide partial protection'
    };
  }

  // ========== AI-AUGMENTED (continued) ==========

  // RULE 8: Stable growth + moderate human advantage = augmented
  // Rationale: Balanced outlook with AI as a tool
  // Example: Graphic Designers (AI assists creative work, human taste still matters)
  // NOTE: This rule only applies when NOT high exposure (checked above)
  if (jobGrowth === 'Stable' && humanAdvantage === 'Moderate') {
    return {
      classification: 'AI-Augmented',
      rationale: 'Stable + Moderate Human Skills: Balanced outlook where AI serves as a tool rather than replacement'
    };
  }

  // RULE 9: Medium exposure + declining slowly + weak human advantage
  // Rationale: Some AI pressure + declining demand + limited human differentiation
  // Example: Some clerical roles with declining demand
  if (taskExposure === 'Medium' && jobGrowth === 'Declining Slowly' && humanAdvantage === 'Weak') {
    return {
      classification: 'In Transition',
      rationale: 'Medium Exposure + Weak Human Advantage + Decline: Facing pressure from both AI capabilities and market shifts'
    };
  }

  // ========== HIGH DISRUPTION RISK RULES ==========

  // RULE 10: High exposure + declining quickly + weak human advantage
  // Rationale: Maximum risk factors aligned
  // Example: Data Entry Keyers (AI can do the work, demand dropping fast)
  if (taskExposure === 'High' && jobGrowth === 'Declining Quickly' && humanAdvantage === 'Weak') {
    return {
      classification: 'High Disruption Risk',
      rationale: 'Maximum Risk: High AI exposure, rapidly declining demand, and limited human differentiation'
    };
  }

  // RULE 11: High exposure + any decline + weak human advantage
  // Rationale: High-risk combination even with slower decline
  // Example: Telemarketers (AI can call, declining demand, little human advantage)
  if (taskExposure === 'High' && (jobGrowth === 'Declining Quickly' || jobGrowth === 'Declining Slowly') && humanAdvantage === 'Weak') {
    return {
      classification: 'High Disruption Risk',
      rationale: 'High Risk: High AI exposure combined with declining employment and limited human differentiation'
    };
  }

  // ========== DEFAULT FALLBACK ==========

  // RULE 12: Default to In Transition for ambiguous cases
  // Rationale: Uncertainty = prudent caution
  if (taskExposure === 'High') {
    return {
      classification: 'In Transition',
      rationale: 'High AI Exposure: Significant AI applicability suggests ongoing transformation'
    };
  }

  return {
    classification: 'AI-Augmented',
    rationale: 'Default: Moderate AI impact with balanced human-AI collaboration expected'
  };
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
