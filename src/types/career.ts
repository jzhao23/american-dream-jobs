import { z } from "zod";
import { type CategoryId, getCategoryColor as getCategoryColorFromMetadata, getCategoryMetadata, isCategoryId } from "@/lib/categories";

// Training time categories
export const TrainingTimeEnum = z.enum(["<6mo", "6-24mo", "2-4yr", "4+yr"]);

// AI Risk labels
export const AIRiskLabelEnum = z.enum(["very_low", "low", "medium", "high", "very_high"]);

// Importance labels
export const ImportanceLabelEnum = z.enum(["standard", "important", "critical"]);

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
  ai_risk: z.number(),
  ai_risk_label: AIRiskLabelEnum,
  importance: z.number(),
  importance_label: ImportanceLabelEnum,
  flag_count: z.number(),
  description: z.string().optional(),
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

// AI Risk Assessment
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
  onet_code: z.string(),
  soc_code: z.string(),
  title: z.string(),
  slug: z.string(),
  alternate_titles: z.array(z.string()),
  description: z.string(),
  category: z.string(),
  subcategory: z.string(),
  job_zone: z.number(),
  job_family: z.string(),
  wages: WagesSchema.nullable(),
  education: EducationSchema,
  outlook: z.any().nullable(),
  tasks: z.array(z.string()),
  technology_skills: z.array(z.string()),
  abilities: z.array(z.string()),
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
  ai_risk: AIRiskSchema.nullable(),
  national_importance: NationalImportanceSchema.nullable(),
  career_progression: CareerProgressionSchema.nullable(),
  video: z.object({
    source: z.enum(["careeronestop", "practitioner"]),
    youtubeId: z.string(),
    title: z.string(),
    thumbnailUrl: z.string().url(),
    lastVerified: z.string(),
  }).nullable().optional(),
});

// Career Video schema (standalone for component use)
export const CareerVideoSchema = z.object({
  source: z.enum(["careeronestop", "practitioner"]),
  youtubeId: z.string(),
  title: z.string(),
  thumbnailUrl: z.string().url(),
  lastVerified: z.string(),
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

// Legacy function - kept for backwards compatibility
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
    return getCategoryMetadata(category).name;
  }
  return category;
}

// Re-export CategoryId for use in components
export type { CategoryId };

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
