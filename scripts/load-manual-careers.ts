/**
 * Manual Career Loader
 *
 * Loads manually-sourced careers from YAML files in data/manual/careers/
 * Validates them against the schema and transforms them for use in the data pipeline.
 *
 * Run directly: npx tsx scripts/load-manual-careers.ts
 * Or import: import { loadManualCareers } from './load-manual-careers';
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { z } from 'zod';

const MANUAL_CAREERS_DIR = path.join(process.cwd(), 'data/manual/careers');

// =============================================================================
// YAML Schema Validation
// =============================================================================

// Wages schema matching the main Career schema structure
const ManualWagesSchema = z.object({
  source: z.string(),
  year: z.number(),
  annual: z.object({
    pct_10: z.number().nullable(),
    pct_25: z.number().nullable(),
    median: z.number().nullable(),
    pct_75: z.number().nullable(),
    pct_90: z.number().nullable(),
    mean: z.number().nullable().optional(),
  }),
  hourly: z.object({
    pct_10: z.number().nullable(),
    pct_25: z.number().nullable(),
    median: z.number().nullable(),
    pct_75: z.number().nullable(),
    pct_90: z.number().nullable(),
    mean: z.number().nullable().optional(),
  }).optional(),
  employment_count: z.number().nullable().optional(),
});

// Education schema
const ManualEducationSchema = z.object({
  typical_entry_education: z.string(),
  work_experience_required: z.string().optional(),
  on_the_job_training: z.string().optional(),
  time_to_job_ready: z.object({
    min_years: z.number(),
    typical_years: z.number(),
    max_years: z.number(),
    earning_while_learning: z.boolean().optional(),
    notes: z.string().optional(),
  }).optional(),
  // Boolean flags
  requires_high_school: z.boolean().optional(),
  requires_bachelors: z.boolean().optional(),
  requires_masters: z.boolean().optional(),
  requires_doctoral: z.boolean().optional(),
  requires_certificate: z.boolean().optional(),
  requires_associate: z.boolean().optional(),
  requires_apprenticeship: z.boolean().optional(),
  requires_license: z.boolean().optional(),
  alternative_pathways: z.array(z.string()).optional(),
});

// EPOCH scores schema
const EPOCHScoresSchema = z.object({
  empathy: z.number().min(0).max(5),
  presence: z.number().min(0).max(5),
  opinion: z.number().min(0).max(5),
  creativity: z.number().min(0).max(5),
  hope: z.number().min(0).max(5),
});

// AI Assessment schema
const ManualAIAssessmentSchema = z.object({
  aiExposure: z.object({
    score: z.number().min(0).max(1),
    label: z.enum(['Low', 'Medium', 'High']),
    source: z.literal('editorial'),
  }),
  jobGrowth: z.object({
    label: z.enum(['Declining', 'Stable', 'Growing', 'Rapid Growth']),
    percentChange: z.number(),
    source: z.string(),
  }),
  humanAdvantage: z.object({
    category: z.enum(['Low', 'Moderate', 'High', 'Essential']),
    epochScores: EPOCHScoresSchema,
  }),
  scoring: z.object({
    exposurePoints: z.number().min(0).max(2),
    growthPoints: z.number().min(0).max(2),
    humanAdvantagePoints: z.number().min(0).max(2),
    totalScore: z.number().min(0).max(6),
  }),
  classification: z.enum(['AI-Resilient', 'AI-Augmented', 'In Transition', 'High Disruption Risk']),
  classificationRationale: z.string(),
});

// Source citations schema
const SourceCitationsSchema = z.object({
  wages: z.string(),
  skills: z.string(),
  outlook: z.string(),
  ai_assessment: z.string(),
});

// LinkedIn data schema (optional)
const LinkedInDataSchema = z.object({
  industries: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  remote_availability: z.string().optional(),
  median_experience_years: z.number().optional(),
  top_transitions_from: z.array(z.string()).optional(),
  gender_distribution: z.object({
    female: z.number(),
    male: z.number(),
  }).optional(),
}).optional();

// Video schema (optional)
const ManualVideoSchema = z.object({
  source: z.enum(['youtube', 'careeronestop']),
  id: z.string(),
  title: z.string().optional(),
  duration: z.string().optional(),
}).optional();

// Related careers schema (optional)
const RelatedCareerSchema = z.object({
  slug: z.string(),
  relationship: z.enum(['similar', 'advancement', 'pivot']),
}).optional();

// Main manual career YAML schema
const ManualCareerYAMLSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: z.string(),
  data_source: z.literal('manual'),
  last_updated: z.string(),

  // Description
  description: z.string(),

  // Wages
  wages: ManualWagesSchema,

  // Education
  education: ManualEducationSchema,

  // AI Resilience
  ai_resilience: z.enum(['AI-Resilient', 'AI-Augmented', 'In Transition', 'High Disruption Risk']),
  ai_resilience_tier: z.number().min(1).max(4),
  ai_assessment: ManualAIAssessmentSchema,

  // Content
  tasks: z.array(z.string()),
  technology_skills: z.array(z.string()),
  abilities: z.array(z.string()),
  alternate_titles: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),

  // Source citations (required for manual)
  source_citations: SourceCitationsSchema,

  // Optional fields
  linkedin_data: LinkedInDataSchema,
  video: ManualVideoSchema,
  related_careers: z.array(RelatedCareerSchema).optional(),
});

export type ManualCareerYAML = z.infer<typeof ManualCareerYAMLSchema>;

// =============================================================================
// Career Progression Generation
// =============================================================================

/**
 * Generate career progression data from wage percentiles
 *
 * Uses the same methodology as O*NET careers (create-progression-mappings.ts):
 * - Maps wage percentiles to 5 career levels (Entry, Early Career, Mid-Career, Experienced, Expert)
 * - Generates year-by-year timeline from year 0 to 20
 *
 * Percentile to Level Mapping:
 * - 10th percentile → Entry level (0-2 years experience)
 * - 25th percentile → Early Career (2-6 years)
 * - 50th percentile (median) → Mid-Career (5-15 years)
 * - 75th percentile → Experienced (10-20 years)
 * - 90th percentile → Expert (15-30 years)
 *
 * @see docs/MANUAL_CAREER_PROGRESSION.md for full methodology
 */
function generateCareerProgression(wages: z.infer<typeof ManualWagesSchema>) {
  const { pct_10, pct_25, median, pct_75, pct_90 } = wages.annual;

  // Require at least entry-level and expert-level wages to generate progression
  if (!pct_10 || !median || !pct_90) {
    return null;
  }

  // Use provided percentiles or interpolate missing ones
  const entry = pct_10;
  const earlyCareer = pct_25 || Math.round(pct_10 + (median - pct_10) * 0.4);
  const midCareer = median;
  const experienced = pct_75 || Math.round(median + (pct_90 - median) * 0.5);
  const expert = pct_90;

  // Define 5 career levels from percentiles
  const levels = [
    {
      level_name: "Entry",
      level_number: 1,
      years_experience: { min: 0, typical: 1, max: 2 },
      compensation: {
        total: {
          min: Math.round(entry * 0.9),
          median: entry,
          max: Math.round(entry * 1.1),
        },
        breakdown: null,
      },
    },
    {
      level_name: "Early Career",
      level_number: 2,
      years_experience: { min: 2, typical: 4, max: 6 },
      compensation: {
        total: {
          min: Math.round(earlyCareer * 0.9),
          median: earlyCareer,
          max: Math.round(earlyCareer * 1.1),
        },
        breakdown: null,
      },
    },
    {
      level_name: "Mid-Career",
      level_number: 3,
      years_experience: { min: 5, typical: 10, max: 15 },
      compensation: {
        total: {
          min: Math.round(midCareer * 0.9),
          median: midCareer,
          max: Math.round(midCareer * 1.1),
        },
        breakdown: null,
      },
    },
    {
      level_name: "Experienced",
      level_number: 4,
      years_experience: { min: 10, typical: 15, max: 20 },
      compensation: {
        total: {
          min: Math.round(experienced * 0.9),
          median: experienced,
          max: Math.round(experienced * 1.1),
        },
        breakdown: null,
      },
    },
    {
      level_name: "Expert",
      level_number: 5,
      years_experience: { min: 15, typical: 20, max: 30 },
      compensation: {
        total: {
          min: Math.round(expert * 0.9),
          median: expert,
          max: Math.round(expert * 1.1),
        },
        breakdown: null,
      },
    },
  ];

  // Generate year-by-year timeline (0-20)
  // Timeline year ranges:
  // - Years 0-2: Entry (10th percentile)
  // - Years 3-5: Early Career (25th percentile)
  // - Years 6-12: Mid-Career (median)
  // - Years 13-17: Experienced (75th percentile)
  // - Years 18-20: Expert (90th percentile)
  const timeline: { year: number; level_name: string; expected_compensation: number }[] = [];

  for (let year = 0; year <= 20; year++) {
    let level_name: string;
    let expected_compensation: number;

    if (year <= 2) {
      level_name = "Entry";
      expected_compensation = entry;
    } else if (year <= 5) {
      level_name = "Early Career";
      expected_compensation = earlyCareer;
    } else if (year <= 12) {
      level_name = "Mid-Career";
      expected_compensation = midCareer;
    } else if (year <= 17) {
      level_name = "Experienced";
      expected_compensation = experienced;
    } else {
      level_name = "Expert";
      expected_compensation = expert;
    }

    timeline.push({ year, level_name, expected_compensation });
  }

  return {
    source: "manual_percentiles" as const,
    source_title: null,
    match_confidence: "approximate" as const,
    levels,
    timeline,
  };
}

// =============================================================================
// Education Cost Generation
// =============================================================================

/**
 * College Board 2024-25 Annual Tuition & Fees
 * Source: https://research.collegeboard.org/trends/college-pricing
 */
const TUITION_RATES = {
  community_college: 3990,      // Public 2-year (in-district)
  public_in_state: 11610,       // Public 4-year (in-state)
  public_out_of_state: 24030,   // Public 4-year (out-of-state)
  private_nonprofit: 43350,     // Private nonprofit 4-year
};

/**
 * Field multipliers for tech-related careers
 * Computer Science (CIP 11) = 1.15x
 */
const TECH_FIELD_MULTIPLIER = 1.15;

/**
 * Program durations by credential type
 * Keys match BLS/O*NET education level terminology
 */
const PROGRAM_DURATIONS: Record<string, number> = {
  // No formal education
  "No formal educational credential": 0,
  "High school diploma": 0,
  "High school diploma or equivalent": 0,
  // Some college / certificates
  "Some college, no degree": 1,
  "Postsecondary nondegree award": 1,
  // Associate's
  "Associate's degree": 2,
  // Bachelor's
  "Bachelor's degree": 4,
  // Master's
  "Master's degree": 6,  // 4 years bachelor's + 2 years master's
  // Doctoral
  "Doctoral or professional degree": 8,  // 4 years bachelor's + 4 years doctoral
};

/**
 * Generate education cost data from education requirements
 *
 * Uses College Board 2024-25 tuition data to estimate costs by institution type.
 * Applies tech field multiplier (1.15x) for technology careers.
 *
 * @see docs/education-cost-methodology.md for full methodology
 */
function generateEducationCost(
  education: z.infer<typeof ManualEducationSchema>,
  category: string
) {
  const entryEducation = education.typical_entry_education;
  const years = PROGRAM_DURATIONS[entryEducation] ?? 4;

  // No cost for high school only
  if (years === 0) {
    return {
      estimated_cost: null,
      cost_by_institution_type: null,
      cost_data_source: null,
    };
  }

  // Apply tech field multiplier for technology category
  const isTechField = category === 'technology';
  const multiplier = isTechField ? TECH_FIELD_MULTIPLIER : 1.0;

  // Calculate costs for each institution type
  const publicInState = Math.round(TUITION_RATES.public_in_state * years * multiplier);
  const publicOutOfState = Math.round(TUITION_RATES.public_out_of_state * years * multiplier);
  const privateNonprofit = Math.round(TUITION_RATES.private_nonprofit * years * multiplier);

  // For associate's degree, also include community college option
  const communityCollege = years <= 2
    ? Math.round(TUITION_RATES.community_college * years * multiplier)
    : null;

  // Build cost breakdown based on education level
  const costBreakdown: { item: string; min: number; max: number; typical: number }[] = [];

  if (entryEducation === "Associate's degree") {
    costBreakdown.push({
      item: "Associate's degree",
      min: communityCollege || publicInState,
      max: privateNonprofit,
      typical: publicOutOfState,
    });
  } else if (entryEducation === "Bachelor's degree") {
    costBreakdown.push({
      item: "Bachelor's degree",
      min: publicInState,
      max: privateNonprofit,
      typical: publicOutOfState,
    });
  } else if (entryEducation === "Master's degree") {
    // Bachelor's + Master's
    const bachelorCost = Math.round(TUITION_RATES.public_in_state * 4 * multiplier);
    const masterCost = Math.round(TUITION_RATES.public_in_state * 2 * multiplier);
    costBreakdown.push({
      item: "Bachelor's degree",
      min: bachelorCost,
      max: Math.round(TUITION_RATES.private_nonprofit * 4 * multiplier),
      typical: Math.round(TUITION_RATES.public_out_of_state * 4 * multiplier),
    });
    costBreakdown.push({
      item: "Master's degree",
      min: masterCost,
      max: Math.round(TUITION_RATES.private_nonprofit * 2 * multiplier),
      typical: Math.round(TUITION_RATES.public_out_of_state * 2 * multiplier),
    });
  } else if (entryEducation === "Doctoral or professional degree") {
    costBreakdown.push({
      item: "Bachelor's degree",
      min: Math.round(TUITION_RATES.public_in_state * 4 * multiplier),
      max: Math.round(TUITION_RATES.private_nonprofit * 4 * multiplier),
      typical: Math.round(TUITION_RATES.public_out_of_state * 4 * multiplier),
    });
    costBreakdown.push({
      item: "Doctoral/Professional degree",
      min: Math.round(TUITION_RATES.public_in_state * 4 * multiplier),
      max: Math.round(TUITION_RATES.private_nonprofit * 4 * multiplier),
      typical: Math.round(TUITION_RATES.public_out_of_state * 4 * multiplier),
    });
  } else {
    // Certificate or other
    costBreakdown.push({
      item: entryEducation,
      min: publicInState,
      max: privateNonprofit,
      typical: publicOutOfState,
    });
  }

  return {
    estimated_cost: {
      min_cost: publicInState,
      max_cost: privateNonprofit,
      typical_cost: publicOutOfState,
      cost_breakdown: costBreakdown,
      notes: `Based on College Board 2024-25 tuition data.${isTechField ? ' Field adjustment: 115%.' : ''}`,
    },
    cost_by_institution_type: {
      public_in_state: {
        total: publicInState,
        per_year: Math.round(publicInState / years),
      },
      public_out_of_state: {
        total: publicOutOfState,
        per_year: Math.round(publicOutOfState / years),
      },
      private_nonprofit: {
        total: privateNonprofit,
        per_year: Math.round(privateNonprofit / years),
      },
      community_college: communityCollege ? {
        total: communityCollege,
        per_year: Math.round(communityCollege / years),
      } : null,
      trade_school: null,
      apprenticeship: null,
    },
    cost_data_source: {
      primary: 'college_board' as const,
      year: 2024,
      confidence: 'medium' as const,
    },
  };
}

// =============================================================================
// Loader Functions
// =============================================================================

/**
 * Transform a manual career YAML into the Career structure used by the data pipeline
 */
function transformManualCareer(yaml: ManualCareerYAML): Record<string, unknown> {
  // Build the career object matching the O*NET career structure
  return {
    // O*NET-specific fields are undefined for manual careers
    onet_code: undefined,
    soc_code: undefined,
    job_zone: undefined,
    job_family: undefined,

    // Core identity
    title: yaml.name,
    slug: yaml.slug,
    category: yaml.category,
    subcategory: yaml.category, // For manual careers, subcategory = category
    data_source: 'manual',

    // Description
    description: yaml.description,

    // Wages - transform to match O*NET structure
    wages: {
      source: yaml.wages.source,
      year: yaml.wages.year,
      annual: {
        pct_10: yaml.wages.annual.pct_10,
        pct_25: yaml.wages.annual.pct_25,
        median: yaml.wages.annual.median,
        pct_75: yaml.wages.annual.pct_75,
        pct_90: yaml.wages.annual.pct_90,
        mean: yaml.wages.annual.mean || null,
      },
      hourly: yaml.wages.hourly || {
        pct_10: null,
        pct_25: null,
        median: null,
        pct_75: null,
        pct_90: null,
        mean: null,
      },
      employment_count: yaml.wages.employment_count || null,
    },

    // Education - with generated cost data
    education: (() => {
      const educationCosts = generateEducationCost(yaml.education, yaml.category);
      return {
        typical_entry_education: yaml.education.typical_entry_education,
        work_experience_required: yaml.education.work_experience_required || 'None',
        on_the_job_training: yaml.education.on_the_job_training || 'None',
        time_to_job_ready: yaml.education.time_to_job_ready || {
          min_years: 0,
          typical_years: 0,
          max_years: 0,
        },
        education_duration: yaml.education.time_to_job_ready || {
          min_years: 0,
          typical_years: 0,
          max_years: 0,
        },
        // Generated education costs
        estimated_cost: educationCosts.estimated_cost,
        cost_by_institution_type: educationCosts.cost_by_institution_type,
        cost_data_source: educationCosts.cost_data_source,
        // Boolean flags
        requires_high_school: yaml.education.requires_high_school || false,
        requires_bachelors: yaml.education.requires_bachelors || false,
        requires_masters: yaml.education.requires_masters || false,
        requires_doctoral: yaml.education.requires_doctoral || false,
        requires_certificate: yaml.education.requires_certificate || false,
        requires_associate: yaml.education.requires_associate || false,
        requires_apprenticeship: yaml.education.requires_apprenticeship || false,
        requires_license: yaml.education.requires_license || false,
        alternative_pathways: yaml.education.alternative_pathways || [],
      };
    })(),

    // AI Resilience
    ai_resilience: yaml.ai_resilience,
    ai_resilience_tier: yaml.ai_resilience_tier,
    ai_assessment: {
      ...yaml.ai_assessment,
      lastUpdated: yaml.last_updated,
      methodology: 'v2.1 - Editorial Manual',
    },

    // Legacy AI Risk (estimated from AI Resilience for backwards compatibility)
    ai_risk: {
      score: Math.round(yaml.ai_assessment.aiExposure.score * 10),
      label: yaml.ai_assessment.aiExposure.label.toLowerCase(),
      confidence: 'high',
      rationale: {
        summary: yaml.ai_assessment.classificationRationale.split('\n')[0],
        factors_increasing_risk: [],
        factors_decreasing_risk: [],
      },
      last_assessed: yaml.last_updated,
      assessor: 'editorial' as const,
    },

    // Content
    tasks: yaml.tasks,
    technology_skills: yaml.technology_skills,
    abilities: yaml.abilities,
    alternate_titles: yaml.alternate_titles || [],
    keywords: yaml.keywords || [],

    // Source citations
    source_citations: yaml.source_citations,

    // LinkedIn data
    linkedin_data: yaml.linkedin_data || null,

    // Video
    video: yaml.video ? {
      source: yaml.video.source,
      youtubeId: yaml.video.id,
      title: yaml.video.title || `What does a ${yaml.name} do?`,
      thumbnailUrl: `https://img.youtube.com/vi/${yaml.video.id}/hqdefault.jpg`,
      lastVerified: yaml.last_updated,
    } : null,

    // Inside look (none for manual careers initially)
    inside_look: null,

    // Career progression - generated from wage percentiles
    career_progression: generateCareerProgression(yaml.wages),

    // National importance (not applicable for manual careers)
    national_importance: null,

    // Data completeness
    data_completeness: {
      completeness_score: 100,
      has_wages: true,
      has_tasks: true,
    },

    // Metadata
    last_updated: yaml.last_updated,
  };
}

/**
 * Load all manual careers from the YAML files
 */
export function loadManualCareers(): { careers: Record<string, unknown>[]; errors: string[] } {
  const careers: Record<string, unknown>[] = [];
  const errors: string[] = [];

  if (!fs.existsSync(MANUAL_CAREERS_DIR)) {
    console.log('Manual careers directory not found, creating...');
    fs.mkdirSync(MANUAL_CAREERS_DIR, { recursive: true });
    return { careers, errors };
  }

  const files = fs.readdirSync(MANUAL_CAREERS_DIR).filter(
    f => f.endsWith('.yaml') || f.endsWith('.yml')
  );

  // Skip template file
  const careerFiles = files.filter(f => !f.startsWith('_'));

  console.log(`Found ${careerFiles.length} manual career files`);

  for (const file of careerFiles) {
    const filePath = path.join(MANUAL_CAREERS_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = yaml.parse(content);

      // Validate against schema
      const result = ManualCareerYAMLSchema.safeParse(parsed);
      if (!result.success) {
        const errorMessages = result.error.issues.map(
          issue => `  - ${issue.path.join('.')}: ${issue.message}`
        ).join('\n');
        errors.push(`${file}: Validation failed:\n${errorMessages}`);
        continue;
      }

      // Transform and add
      const career = transformManualCareer(result.data);
      careers.push(career);
      console.log(`  ✓ Loaded: ${result.data.name} (${result.data.slug})`);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${file}: Parse error - ${message}`);
    }
  }

  return { careers, errors };
}

// =============================================================================
// CLI Entry Point
// =============================================================================

if (require.main === module) {
  console.log('\n=== Loading Manual Careers ===\n');

  const { careers, errors } = loadManualCareers();

  if (errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    errors.forEach(e => console.log(`  ${e}`));
  }

  console.log(`\nLoaded ${careers.length} manual careers`);

  // Output summary
  if (careers.length > 0) {
    console.log('\nManual Careers:');
    careers.forEach(c => {
      console.log(`  - ${c.title} (${c.category})`);
    });
  }
}
