import { z } from "zod";
import { type CategoryId, getCategoryColor as getCategoryColorFromMetadata, getCategoryMetadata, isCategoryId } from "@/lib/categories";

// Training time categories
export const TrainingTimeEnum = z.enum(["<6mo", "6-24mo", "2-4yr", "4+yr"]);

// AI Risk labels
export const AIRiskLabelEnum = z.enum(["very_low", "low", "medium", "high", "very_high"]);

// Importance labels
export const ImportanceLabelEnum = z.enum(["standard", "important", "critical"]);

// AI Resilience Classification (4-tier) - defined early for CareerIndexSchema
export const AIResilienceClassificationEnum = z.enum([
  "AI-Resilient",         // 🟢 Low exposure + Strong human advantage OR Growing market
  "AI-Augmented",         // 🟡 Medium exposure, AI assists but doesn't replace
  "In Transition",        // 🟠 High exposure + Moderate human advantage
  "High Disruption Risk"  // 🔴 High exposure + Weak human advantage + Declining market
]);
export type AIResilienceClassification = z.infer<typeof AIResilienceClassificationEnum>;

// Data source discriminator - defined early for CareerIndexSchema
export const DataSourceEnum = z.enum(['onet', 'manual']);
export type DataSource = z.infer<typeof DataSourceEnum>;

// ============================================================================
// CAREER CONSOLIDATION (v2.2)
// ============================================================================

// Display strategy for career detail page
export const DisplayStrategyEnum = z.enum(['career-only', 'show-specializations']);
export type DisplayStrategy = z.infer<typeof DisplayStrategyEnum>;

// Grouping strategy used for consolidation
export const GroupingStrategyEnum = z.enum(['soc-based', 'functional', 'singleton', 'catchall']);
export type GroupingStrategy = z.infer<typeof GroupingStrategyEnum>;

// Pay range for consolidated careers (aggregated from specializations)
export const PayRangeSchema = z.object({
  min: z.number(),  // Min 10th percentile across all specializations
  max: z.number(),  // Max 90th percentile across all specializations
});
export type PayRange = z.infer<typeof PayRangeSchema>;

// Career Index schema (for explorer - lightweight)
export const CareerIndexSchema = z.object({
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  median_pay: z.number(),
  training_time: TrainingTimeEnum,
  training_years: z.object({
    min: z.number(),
    typical: z.number(),
    max: z.number(),
  }).nullable().optional(),
  typical_education: z.string().optional(),
  // LEGACY: ai_risk fields kept for backwards compatibility during migration
  ai_risk: z.number(),
  ai_risk_label: AIRiskLabelEnum,
  // NEW: AI Resilience classification (4-tier system)
  ai_resilience: AIResilienceClassificationEnum.optional(),
  ai_resilience_tier: z.number().min(1).max(4).optional(), // 1=Resilient, 4=High Risk (for sorting)
  // Data source discriminator (v2.1) - 'onet' or 'manual'
  data_source: DataSourceEnum.optional(),
  // ARCHIVED: importance fields removed from UI - see data/archived/importance-scores-backup.json
  // importance: z.number(),
  // importance_label: ImportanceLabelEnum,
  // flag_count: z.number(),
  description: z.string().optional(),

  // CONSOLIDATION FIELDS (v2.2)
  // Number of specializations under this career (for consolidated careers)
  specialization_count: z.number().optional(),
  // Display strategy: 'career-only' or 'show-specializations'
  display_strategy: DisplayStrategyEnum.optional(),
  // Pay range (min 10th pct, max 90th pct) across specializations
  pay_range: PayRangeSchema.optional(),
  // Parent career slug (for specialization records only)
  parent_career_slug: z.string().optional(),
  // Is this a consolidated career (true) or an individual specialization (false)
  is_consolidated: z.boolean().optional(),
});

// Career Progression Level
export const ProgressionLevelSchema = z.object({
  level_name: z.string(),
  level_number: z.number(),
  years_experience: z.object({
    min: z.number(),
    typical: z.number(),
    max: z.number(),
  }),
  compensation: z.object({
    total: z.object({
      min: z.number(),
      median: z.number(),
      max: z.number(),
    }),
    breakdown: z.object({
      salary: z.number(),
      equity: z.number().nullable(),
      bonus: z.number().nullable(),
    }).nullable(),
  }),
});

// Career Progression
export const CareerProgressionSchema = z.object({
  source: z.enum(["levels_fyi", "bls_percentiles"]),
  source_title: z.string().nullable(),
  match_confidence: z.enum(["exact", "close", "approximate", "fallback"]),
  levels: z.array(ProgressionLevelSchema),
  timeline: z.array(z.object({
    year: z.number(),
    level_name: z.string(),
    expected_compensation: z.number(),
  })),
});

// AI Risk Assessment (LEGACY - being replaced by AI Resilience)
export const AIRiskSchema = z.object({
  score: z.number(),
  label: AIRiskLabelEnum,
  confidence: z.enum(["high", "medium", "low"]),
  rationale: z.object({
    summary: z.string(),
    factors_increasing_risk: z.array(z.string()),
    factors_decreasing_risk: z.array(z.string()),
  }),
  last_assessed: z.string(),
  assessor: z.enum(["claude", "human_override"]),
});

// ============================================================================
// AI RESILIENCE CLASSIFICATION v2.0 (Additive Scoring System)
// ============================================================================

// AI Exposure Label (based on GPTs are GPTs β score)
// Thresholds: Low (<0.25), Medium (0.25-0.50), High (>0.50)
export const AIExposureLabelEnum = z.enum(["Low", "Medium", "High"]);
export type AIExposureLabel = z.infer<typeof AIExposureLabelEnum>;

// AI Exposure Schema (replaces taskExposure + automationPotential)
export const AIExposureSchema = z.object({
  score: z.number().min(0).max(1),           // 0-1 β score from GPTs paper
  label: AIExposureLabelEnum,                 // Low/Medium/High for display
  source: z.enum(["gpts", "aioe", "editorial"]), // Data source used (editorial for manual careers)
});
export type AIExposure = z.infer<typeof AIExposureSchema>;

// Job Growth Label (simplified 3-category version for v2.0)
// Thresholds: Declining (<0%), Stable (0-5%), Growing (>5%)
export const JobGrowthLabelEnum = z.enum(["Declining", "Stable", "Growing"]);
export type JobGrowthLabel = z.infer<typeof JobGrowthLabelEnum>;

// Human Advantage Category (based on EPOCH sum)
// Thresholds: Weak (<12), Moderate (12-19), Strong (>=20)
export const HumanAdvantageCategoryEnum = z.enum(["Weak", "Moderate", "Strong"]);
export type HumanAdvantageCategory = z.infer<typeof HumanAdvantageCategoryEnum>;

// NOTE: AIResilienceClassificationEnum is defined at top of file for CareerIndexSchema

// EPOCH Scores (Human Advantage Framework)
export const EPOCHScoresSchema = z.object({
  empathy: z.number().min(1).max(5),    // Emotional intelligence, patient/customer care
  presence: z.number().min(1).max(5),   // Physical presence requirements
  opinion: z.number().min(1).max(5),    // Judgment, decision-making, critical thinking
  creativity: z.number().min(1).max(5), // Innovation, problem-solving
  hope: z.number().min(1).max(5),       // Mentorship, motivation, counseling
});
export type EPOCHScores = z.infer<typeof EPOCHScoresSchema>;

// Scoring breakdown for AI Resilience calculation
export const AIResilienceScoringSchema = z.object({
  exposurePoints: z.number().min(0).max(2),       // 0-2 points
  growthPoints: z.number().min(0).max(2),         // 0-2 points
  humanAdvantagePoints: z.number().min(0).max(2), // 0-2 points
  totalScore: z.number().min(0).max(6),           // 0-6 total
});
export type AIResilienceScoring = z.infer<typeof AIResilienceScoringSchema>;

// Full AI Assessment Schema v2.0
export const CareerAIAssessmentSchema = z.object({
  // Single AI Exposure metric (replaces taskExposure + automationPotential)
  aiExposure: AIExposureSchema,

  // Job Growth
  jobGrowth: z.object({
    label: JobGrowthLabelEnum,
    percentChange: z.number(),
    source: z.string(),
  }),

  // Human Advantage (EPOCH)
  humanAdvantage: z.object({
    category: HumanAdvantageCategoryEnum,
    epochScores: EPOCHScoresSchema,
  }),

  // Scoring breakdown (new in v2.0)
  scoring: AIResilienceScoringSchema,

  // Final classification
  classification: AIResilienceClassificationEnum,
  classificationRationale: z.string(),

  // Metadata
  lastUpdated: z.string(),
  methodology: z.string(),
});
export type CareerAIAssessment = z.infer<typeof CareerAIAssessmentSchema>;

// ============================================================================
// TIME TO PAYCHECK (v2.3)
// ============================================================================

// Time-to-first-paycheck estimates for job seekers
export const TimeToPaycheckSchema = z.object({
  min_months: z.number(),              // Fastest path (bootcamp, apprenticeship)
  typical_months: z.number(),          // Standard education path
  max_months: z.number(),              // Including job search buffer
  can_earn_while_learning: z.boolean(), // Apprenticeships, work-study
  immediate_entry_options: z.array(z.string()).optional(), // e.g., ["Paid apprenticeship", "Entry-level role"]
  notes: z.string().optional(),
  data_source: z.enum(['calculated', 'manual', 'verified']).optional(),
  last_updated: z.string().optional(),
});
export type TimeToPaycheck = z.infer<typeof TimeToPaycheckSchema>;

// ============================================================================
// TRAINING PROGRAMS (v2.3)
// ============================================================================

// Training program types
export const TrainingProgramTypeEnum = z.enum([
  'bootcamp',
  'certification',
  'online_course',
  'apprenticeship',
  'degree_program',
  'professional_development',
]);
export type TrainingProgramType = z.infer<typeof TrainingProgramTypeEnum>;

// Individual training program
export const TrainingProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: TrainingProgramTypeEnum,
  provider: z.string(),
  url: z.string().url(),
  description: z.string().optional(),
  duration_months: z.number().optional(),
  format: z.enum(['online', 'in-person', 'hybrid']).optional(),
  cost: z.object({
    amount: z.number().nullable(),
    type: z.enum(['free', 'low', 'moderate', 'high']),
    notes: z.string().optional(),
  }).optional(),
  credential_earned: z.string().optional(),
  relevance_score: z.number().min(1).max(5).optional(),
  verified: z.boolean().optional(),
  last_verified: z.string().optional(),
});
export type TrainingProgram = z.infer<typeof TrainingProgramSchema>;

// Training programs container for a career
export const TrainingProgramsSchema = z.object({
  programs: z.array(TrainingProgramSchema),
  category_resources: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    description: z.string(),
  })).optional(),
  last_updated: z.string(),
});
export type TrainingPrograms = z.infer<typeof TrainingProgramsSchema>;

// ============================================================================
// SCHOLARSHIPS & FINANCIAL AID (v2.3)
// ============================================================================

// Individual scholarship
export const ScholarshipSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  provider: z.string(),
  amount: z.union([
    z.object({ min: z.number(), max: z.number() }),
    z.string(), // For "Full tuition", "Varies", etc.
  ]).optional(),
  eligibility: z.string().optional(),
  deadline: z.string().optional(),
  renewable: z.boolean().optional(),
  scope: z.enum(['national', 'state', 'local', 'institution']).optional(),
  verified: z.boolean().optional(),
  last_verified: z.string().optional(),
});
export type Scholarship = z.infer<typeof ScholarshipSchema>;

// Financial aid container for a career
export const FinancialAidSchema = z.object({
  scholarships: z.array(ScholarshipSchema),
  federal_aid_eligible: z.boolean(),
  typical_aid_sources: z.array(z.string()),
  employer_programs: z.array(z.string()).optional(),
  category_resources: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    description: z.string(),
  })).optional(),
  last_updated: z.string(),
});
export type FinancialAid = z.infer<typeof FinancialAidSchema>;

// ============================================================================
// MANUAL CAREER SUPPORT (v2.1)
// ============================================================================

// NOTE: DataSourceEnum is defined at top of file for CareerIndexSchema

// Source citations for manually-sourced careers (transparency requirement)
export const SourceCitationsSchema = z.object({
  wages: z.string(),           // e.g., "Glassdoor, Levels.fyi, LinkedIn Salary (Jan 2026)"
  skills: z.string(),          // e.g., "LinkedIn job postings analysis"
  outlook: z.string(),         // e.g., "LinkedIn Jobs on the Rise 2026"
  ai_assessment: z.string(),   // e.g., "Editorial assessment based on task analysis"
});
export type SourceCitations = z.infer<typeof SourceCitationsSchema>;

// LinkedIn market data for manually-sourced careers
export const LinkedInDataSchema = z.object({
  industries: z.array(z.string()),           // Top industries hiring this role
  locations: z.array(z.string()),            // Top locations
  remote_availability: z.string(),           // e.g., "53% remote/hybrid"
  median_experience_years: z.number(),       // Typical experience level
  top_transitions_from: z.array(z.string()), // Common prior roles
  gender_distribution: z.object({
    female: z.number(),
    male: z.number(),
  }).optional(),
});
export type LinkedInData = z.infer<typeof LinkedInDataSchema>;

// ============================================================================
// DEPRECATED: Legacy types kept for backwards compatibility during migration
// ============================================================================

/** @deprecated Use AIExposureLabelEnum instead */
export const TaskExposureEnum = z.enum(["Low", "Medium", "High"]);
/** @deprecated Use AIExposureLabel instead */
export type TaskExposure = z.infer<typeof TaskExposureEnum>;

/** @deprecated No longer used in v2.0 - automationPotential removed */
export const AutomationPotentialEnum = z.enum(["Low", "Medium", "High"]);
/** @deprecated No longer used in v2.0 */
export type AutomationPotential = z.infer<typeof AutomationPotentialEnum>;

/** @deprecated Use JobGrowthLabelEnum instead (simplified 3-category) */
export const JobGrowthCategoryEnum = z.enum([
  "Declining Quickly",  // < -10%
  "Declining Slowly",   // -10% to 0%
  "Stable",             // 0% to 5%
  "Growing Slowly",     // 5% to 15%
  "Growing Quickly"     // > 15%
]);
/** @deprecated Use JobGrowthLabel instead */
export type JobGrowthCategory = z.infer<typeof JobGrowthCategoryEnum>;

// National Importance Assessment
export const NationalImportanceSchema = z.object({
  score: z.number(),
  label: ImportanceLabelEnum,
  flag_count: z.number(),
  rationale: z.object({
    summary: z.string(),
    critical_infrastructure_sector: z.string().nullable(),
    defense_related: z.boolean(),
    shortage_occupation: z.boolean(),
    cannot_offshore: z.boolean(),
  }),
  framework_alignments: z.array(z.object({
    framework: z.string(),
    aligned: z.boolean(),
    sector: z.string().nullable(),
  })),
  last_assessed: z.string(),
  assessor: z.enum(["claude", "human_override"]),
});

// Education schema
export const EducationSchema = z.object({
  requires_high_school: z.boolean(),
  requires_some_college: z.boolean(),
  requires_associates: z.boolean(),
  requires_bachelors: z.boolean(),
  requires_masters: z.boolean(),
  requires_doctorate: z.boolean(),
  requires_professional_degree: z.boolean(),
  requires_apprenticeship: z.boolean(),
  requires_license_or_cert: z.boolean(),
  requires_on_the_job_training: z.boolean(),
  typical_entry_education: z.string(),
  work_experience_required: z.string(),
  on_the_job_training: z.string(),
  time_to_job_ready: z.object({
    min_years: z.number(),
    typical_years: z.number(),
    max_years: z.number(),
    earning_while_learning: z.boolean(),
    notes: z.string(),
  }),
  // Education duration derived from typical_entry_education (ground truth)
  education_duration: z.object({
    min_years: z.number(),
    typical_years: z.number(),
    max_years: z.number(),
    source: z.literal('typical_entry_education'),
    education_level: z.string(),
  }).optional(),
  estimated_cost: z.object({
    min_cost: z.number(),
    max_cost: z.number(),
    typical_cost: z.number(),
    cost_breakdown: z.array(z.object({
      item: z.string(),
      min: z.number(),
      max: z.number(),
      typical: z.number().optional(),
    })),
    notes: z.string(),
  }),
  // NEW: Cost breakdown by institution type
  cost_by_institution_type: z.object({
    public_in_state: z.object({
      total: z.number(),
      per_year: z.number(),
    }).nullable(),
    public_out_of_state: z.object({
      total: z.number(),
      per_year: z.number(),
    }).nullable(),
    private_nonprofit: z.object({
      total: z.number(),
      per_year: z.number(),
    }).nullable(),
    community_college: z.object({
      total: z.number(),
      per_year: z.number(),
    }).nullable(),
    trade_school: z.object({
      total: z.number(),
      program_length_months: z.number(),
    }).nullable(),
    apprenticeship: z.object({
      cost: z.number(),
      earn_while_learning: z.boolean(),
    }).nullable(),
  }).optional(),
  // NEW: Data source metadata
  cost_data_source: z.object({
    primary: z.enum(['college_board', 'professional_association', 'trade_data', 'estimated']),
    cip_codes: z.array(z.string()).optional(),
    year: z.number(),
    confidence: z.enum(['high', 'medium', 'low']),
  }).optional(),
});

// Wages schema
export const WagesSchema = z.object({
  source: z.string(),
  year: z.number(),
  annual: z.object({
    pct_10: z.number().nullable(),
    pct_25: z.number().nullable(),
    median: z.number().nullable(),
    pct_75: z.number().nullable(),
    pct_90: z.number().nullable(),
    mean: z.number().nullable(),
  }),
  hourly: z.object({
    pct_10: z.number().nullable(),
    pct_25: z.number().nullable(),
    median: z.number().nullable(),
    pct_75: z.number().nullable(),
    pct_90: z.number().nullable(),
    mean: z.number().nullable(),
  }),
  employment_count: z.number().nullable(),
});

// Full Career schema
export const CareerSchema = z.object({
  // O*NET-specific fields - OPTIONAL for manual careers
  onet_code: z.string().optional(),    // Required for O*NET careers, undefined for manual
  soc_code: z.string().optional(),     // Required for O*NET careers, undefined for manual
  job_zone: z.number().optional(),     // O*NET job zone (1-5), undefined for manual
  job_family: z.string().optional(),   // O*NET job family, undefined for manual

  // Core identity fields - REQUIRED for all careers
  title: z.string(),
  slug: z.string(),
  alternate_titles: z.array(z.string()),
  description: z.string(),
  category: z.string(),
  subcategory: z.string(),

  // Data source discriminator (v2.1) - defaults to 'onet' if not specified
  data_source: DataSourceEnum.optional(),

  // CONSOLIDATION FIELDS (v2.2)
  // Number of specializations under this career (for consolidated careers)
  specialization_count: z.number().optional(),
  // Slugs of specializations under this career
  specialization_slugs: z.array(z.string()).optional(),
  // Parent career slug (for specialization records only)
  parent_career_slug: z.string().optional(),
  // Display strategy: 'career-only' or 'show-specializations'
  display_strategy: DisplayStrategyEnum.optional(),
  // Grouping strategy used for consolidation
  grouping_strategy: GroupingStrategyEnum.optional(),
  // Custom label for specializations section (e.g., "Medical Specialties", "Nursing Roles")
  specialization_label: z.string().optional(),
  // Pay range (min 10th pct, max 90th pct) across specializations
  pay_range: PayRangeSchema.optional(),
  // Is this a consolidated career (true) or an individual specialization (false)
  is_consolidated: z.boolean().optional(),
  // Primary O*NET code for this consolidated career (for data lookups)
  primary_onet_code: z.string().optional(),

  // Source citations for manual careers (v2.1)
  source_citations: SourceCitationsSchema.optional(),

  // LinkedIn market data for manual careers (v2.1)
  linkedin_data: LinkedInDataSchema.optional(),

  // Compensation
  wages: WagesSchema.nullable(),

  // Education & training
  education: EducationSchema,

  // Employment outlook
  outlook: z.any().nullable(),

  // Job content
  tasks: z.array(z.string()),
  technology_skills: z.array(z.string()),
  abilities: z.array(z.string()),

  // Data provenance
  data_sources: z.array(z.object({
    source: z.string(),
    url: z.string(),
    retrieved_at: z.string(),
  })),
  last_updated: z.string(),
  data_completeness: z.object({
    has_wages: z.boolean(),
    has_education: z.boolean(),
    has_outlook: z.boolean(),
    has_tasks: z.boolean(),
    completeness_score: z.number(),
  }),

  // AI risk & resilience
  ai_risk: AIRiskSchema.nullable(),
  national_importance: NationalImportanceSchema.nullable(),
  // AI Resilience classification (4-tier system)
  ai_resilience: AIResilienceClassificationEnum.optional(),
  ai_resilience_tier: z.number().min(1).max(4).optional(),
  ai_assessment: CareerAIAssessmentSchema.optional(),

  // Career progression
  career_progression: CareerProgressionSchema.nullable(),

  // Time to paycheck (v2.3)
  time_to_paycheck: TimeToPaycheckSchema.nullable().optional(),

  // Training programs (v2.3)
  training_programs: TrainingProgramsSchema.nullable().optional(),

  // Financial aid (v2.3)
  financial_aid: FinancialAidSchema.nullable().optional(),

  // Media & content
  video: z.object({
    source: z.enum(["careeronestop", "youtube"]),  // Extended for manual careers
    videoUrl: z.string().url(),      // Direct MP4 URL from CDN (or YouTube embed URL)
    posterUrl: z.string().url(),     // Thumbnail image
    title: z.string(),
    lastVerified: z.string(),
  }).nullable().optional(),
  inside_look: z.object({
    content: z.string(),
    generated_at: z.string(),
  }).nullable().optional(),
});

// Career Video schema (standalone for component use)
export const CareerVideoSchema = z.object({
  source: z.enum(["careeronestop", "youtube"]),  // Extended for manual careers
  videoUrl: z.string().url(),      // Direct MP4 URL from CDN (or YouTube embed URL)
  posterUrl: z.string().url(),     // Thumbnail image
  title: z.string(),
  lastVerified: z.string(),
});

// Inside Career schema (standalone for component use)
export const InsideCareerSchema = z.object({
  content: z.string(),
  generated_at: z.string(),
});

// TypeScript types
export type TrainingTime = z.infer<typeof TrainingTimeEnum>;
export type AIRiskLabel = z.infer<typeof AIRiskLabelEnum>;
export type ImportanceLabel = z.infer<typeof ImportanceLabelEnum>;
export type CareerIndex = z.infer<typeof CareerIndexSchema>;
export type ProgressionLevel = z.infer<typeof ProgressionLevelSchema>;
export type CareerProgression = z.infer<typeof CareerProgressionSchema>;
export type AIRisk = z.infer<typeof AIRiskSchema>;
export type NationalImportance = z.infer<typeof NationalImportanceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Wages = z.infer<typeof WagesSchema>;
export type Career = z.infer<typeof CareerSchema>;
export type CareerVideo = z.infer<typeof CareerVideoSchema>;
export type InsideCareer = z.infer<typeof InsideCareerSchema>;

// Helper functions
export function formatPay(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPayRange(min: number, max: number): string {
  return `${formatPay(min)} - ${formatPay(max)}`;
}

export function getTrainingTimeLabel(time: TrainingTime, actualYears?: { min: number; max: number; typical: number }): string {
  const labels: Record<TrainingTime, string> = {
    "<6mo": "Less than 6 months",
    "6-24mo": "6 months to 2 years",
    "2-4yr": "2 to 4 years",
    "4+yr": "4+ years",
  };

  // For 4+ years, show actual range if available
  if (time === "4+yr" && actualYears) {
    if (actualYears.min === actualYears.max) {
      return `${actualYears.min} years`;
    }
    return `${actualYears.min}-${actualYears.max} years`;
  }

  return labels[time];
}

export function getAIRiskColor(score: number): string {
  if (score <= 2) return "text-green-600 bg-green-100";      // Very Low
  if (score <= 4) return "text-emerald-600 bg-emerald-100";  // Low
  if (score <= 6) return "text-yellow-600 bg-yellow-100";    // Medium
  if (score <= 8) return "text-orange-600 bg-orange-100";    // High
  return "text-red-600 bg-red-100";                          // Very High
}

export function getAIRiskLabel(score: number): string {
  if (score <= 2) return "Very Low Risk";
  if (score <= 4) return "Low Risk";
  if (score <= 6) return "Medium Risk";
  if (score <= 8) return "High Risk";
  return "Very High Risk";
}

// ============================================================================
// AI RESILIENCE HELPER FUNCTIONS
// ============================================================================

/**
 * Get the Tailwind color classes for an AI Resilience classification
 */
export function getAIResilienceColor(classification: AIResilienceClassification): string {
  const colors: Record<AIResilienceClassification, string> = {
    "AI-Resilient": "text-green-600 bg-green-100",
    "AI-Augmented": "text-yellow-600 bg-yellow-100",
    "In Transition": "text-orange-600 bg-orange-100",
    "High Disruption Risk": "text-red-600 bg-red-100",
  };
  return colors[classification];
}

/**
 * Get the numeric tier for sorting (1 = most resilient, 4 = highest risk)
 */
export function getAIResilienceTier(classification: AIResilienceClassification): number {
  const tiers: Record<AIResilienceClassification, number> = {
    "AI-Resilient": 1,
    "AI-Augmented": 2,
    "In Transition": 3,
    "High Disruption Risk": 4,
  };
  return tiers[classification];
}

/**
 * Get the emoji indicator for a classification
 */
export function getAIResilienceEmoji(classification: AIResilienceClassification): string {
  const emojis: Record<AIResilienceClassification, string> = {
    "AI-Resilient": "🟢",
    "AI-Augmented": "🟡",
    "In Transition": "🟠",
    "High Disruption Risk": "🔴",
  };
  return emojis[classification];
}

/**
 * Get a short description for a classification
 */
export function getAIResilienceDescription(classification: AIResilienceClassification): string {
  const descriptions: Record<AIResilienceClassification, string> = {
    "AI-Resilient": "Strong human advantage or growing demand protects this career",
    "AI-Augmented": "AI assists this work but human skills remain essential",
    "In Transition": "This career is being transformed by AI; adaptation needed",
    "High Disruption Risk": "High AI exposure with declining demand creates risk",
  };
  return descriptions[classification];
}

// ARCHIVED: Importance functions - kept for potential restoration
// See data/archived/importance-scores-backup.json for preserved data
export function getImportanceFlags(flagCount: number): string {
  return "🇺🇸".repeat(flagCount);
}

export function getImportanceScoreDisplay(score: number): string {
  return `${score}/10`;
}

export function getCategoryColor(category: string): string {
  // Use new category system if it's a valid CategoryId
  if (isCategoryId(category)) {
    return getCategoryColorFromMetadata(category);
  }

  // Fallback for legacy category names (backwards compatibility)
  const legacyColors: Record<string, string> = {
    "Healthcare": "bg-rose-100 text-rose-800",
    "Technology": "bg-blue-100 text-blue-800",
    "Construction": "bg-amber-100 text-amber-800",
    "Education": "bg-purple-100 text-purple-800",
    "Management": "bg-indigo-100 text-indigo-800",
    "Science": "bg-cyan-100 text-cyan-800",
    "Installation & Repair": "bg-orange-100 text-orange-800",
    "Production": "bg-zinc-100 text-zinc-800",
    "Transportation": "bg-emerald-100 text-emerald-800",
    "Protective Services": "bg-red-100 text-red-800",
    "Office & Admin": "bg-slate-100 text-slate-800",
    "Business & Finance": "bg-green-100 text-green-800",
    "Legal": "bg-violet-100 text-violet-800",
    "Arts & Media": "bg-pink-100 text-pink-800",
    "Sales": "bg-teal-100 text-teal-800",
    "Social Services": "bg-fuchsia-100 text-fuchsia-800",
    "Food Service": "bg-yellow-100 text-yellow-800",
    "Personal Care": "bg-lime-100 text-lime-800",
    "Agriculture": "bg-green-100 text-green-800",
    "Building & Grounds": "bg-stone-100 text-stone-800",
    "Military": "bg-gray-100 text-gray-800",
  };
  return legacyColors[category] || "bg-gray-100 text-gray-800";
}

export function getCategoryLabel(category: string): string {
  // Use new category system if it's a valid CategoryId
  if (isCategoryId(category)) {
    return getCategoryMetadata(category).shortName;
  }
  return category;
}

// Re-export CategoryId for use in components
export type { CategoryId };

// ARCHIVED: Importance functions - kept for potential restoration
// See data/archived/importance-scores-backup.json for preserved data
export function getImportanceColor(score: number): string {
  if (score >= 7) return "text-blue-600 bg-blue-100";
  if (score >= 4) return "text-indigo-600 bg-indigo-100";
  return "text-gray-600 bg-gray-100";
}

export function getImportanceLabel(score: number): string {
  if (score >= 7) return "Critical";
  if (score >= 4) return "Important";
  return "Standard";
}
