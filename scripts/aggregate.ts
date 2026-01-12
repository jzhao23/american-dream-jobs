/**
 * Aggregate Script
 *
 * Combines all normalized data sources into final career files.
 * Preserves the original O*NET structure and enriches with AI resilience.
 *
 * Input:
 *   - data/sources/onet/normalized.json (preserves original structure)
 *   - data/sources/aioe/normalized.json
 *   - data/sources/bls/normalized.json
 *   - data/sources/epoch/normalized.json
 *   - data/sources/videos/normalized.json
 *
 * Output:
 *   - data/output/careers.json (full data for detail pages)
 *   - data/output/careers-index.json (lightweight for explorer)
 *
 * Run: npx tsx scripts/aggregate.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  calculateAIResilience,
  calculateEPOCHSum,
  getAIResilienceTier,
  type EPOCHScores,
  type CareerAIAssessment,
} from '../src/lib/ai-resilience';
import { loadManualCareers } from './load-manual-careers';
import { consolidateCareers, loadCareerDefinitions } from './consolidate-careers';

// Paths
const SOURCES_DIR = path.join(process.cwd(), 'data/sources');
const OUTPUT_DIR = path.join(process.cwd(), 'data/output');

// Source files
const ONET_FILE = path.join(SOURCES_DIR, 'onet/normalized.json');
const AIOE_FILE = path.join(SOURCES_DIR, 'aioe/normalized.json');
const BLS_FILE = path.join(SOURCES_DIR, 'bls/normalized.json');
const EPOCH_FILE = path.join(SOURCES_DIR, 'epoch/normalized.json');
const VIDEOS_FILE = path.join(SOURCES_DIR, 'videos/normalized.json');
const SEED_DIR = path.join(process.cwd(), 'data/seed');
const TRAINING_PROGRAMS_FILE = path.join(SEED_DIR, 'training-programs.json');
const FINANCIAL_AID_FILE = path.join(SEED_DIR, 'scholarships.json');

// Legacy files (for backwards compatibility)
const OXFORD_FILE = path.join(process.cwd(), 'data/processed/oxford_ai_risk_mapping.json');
const INSIDE_CAREER_FILE = path.join(process.cwd(), 'data/inside-career/inside-career.json');

// Output files
const CAREERS_OUTPUT = path.join(OUTPUT_DIR, 'careers.json');
const INDEX_OUTPUT = path.join(OUTPUT_DIR, 'careers-index.json');
const SPECIALIZATIONS_OUTPUT = path.join(OUTPUT_DIR, 'specializations.json');
const CAREER_TO_SPEC_MAP_OUTPUT = path.join(OUTPUT_DIR, 'career-to-spec-map.json');
const CONSOLIDATION_DEFS_PATH = path.join(process.cwd(), 'data/consolidation/career-definitions.json');

/**
 * Load JSON file safely
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadJson(filePath: string, description: string): any {
  if (!fs.existsSync(filePath)) {
    console.warn(`  Warning: ${description} not found: ${filePath}`);
    return null;
  }
  console.log(`  Loading ${description}...`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Get training time category from years
 */
function getTrainingTimeCategory(years: number): string {
  if (years < 0.5) return '<6mo';
  if (years < 2) return '6-24mo';
  if (years < 4) return '2-4yr';
  return '4+yr';
}

async function main() {
  console.log('\n=== Career Data Aggregator ===\n');

  // Load all normalized sources
  console.log('Loading normalized data sources...');
  const onetData = loadJson(ONET_FILE, 'O*NET data');
  const aioeData = loadJson(AIOE_FILE, 'AI exposure data');
  const blsData = loadJson(BLS_FILE, 'BLS projections');
  const epochData = loadJson(EPOCH_FILE, 'EPOCH scores');
  const videosData = loadJson(VIDEOS_FILE, 'Videos data');
  const oxfordData = loadJson(OXFORD_FILE, 'Oxford AI risk');
  const insideCareerData = loadJson(INSIDE_CAREER_FILE, 'Inside career content');
  const trainingProgramsData = loadJson(TRAINING_PROGRAMS_FILE, 'Training programs');
  const financialAidData = loadJson(FINANCIAL_AID_FILE, 'Financial aid/scholarships');

  if (!onetData) {
    console.error('\nError: O*NET data is required. Run: npm run data:normalize:onet');
    process.exit(1);
  }

  const occupations = onetData.occupations;
  const onetCodes = Object.keys(occupations);
  console.log(`\nProcessing ${onetCodes.length} occupations...\n`);

  // Create lookup maps
  const exposures = aioeData?.exposures || {};
  const projections = blsData?.projections || {};
  const epochs = epochData?.scores || {};
  const videos = videosData?.videos || {};

  // Oxford AI risk mapping
  interface OxfordMapping {
    onet_code: string;
    ai_risk: number;
    ai_risk_label: string;
    oxford_probability: number | null;
    match_type: string;
  }
  const oxfordMap = new Map<string, OxfordMapping>();
  if (oxfordData?.mappings) {
    for (const mapping of oxfordData.mappings) {
      oxfordMap.set(mapping.onet_code, mapping);
    }
    console.log(`  Loaded ${oxfordMap.size} Oxford AI risk mappings`);
  }

  // Inside career content mapping (keyed by SOC code)
  interface InsideCareer {
    content: string;
    generated_at: string;
  }
  const insideCareerMap = new Map<string, InsideCareer>();
  if (insideCareerData?.careers) {
    for (const [socCode, content] of Object.entries(insideCareerData.careers)) {
      insideCareerMap.set(socCode, content as InsideCareer);
    }
    console.log(`  Loaded ${insideCareerMap.size} inside career entries`);
  }

  // Training programs mapping (keyed by career slug)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trainingProgramsMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trainingCategoryResources = new Map<string, any[]>();
  if (trainingProgramsData) {
    const programs = trainingProgramsData.programs || [];
    const programsById = new Map(programs.map((p: { id: string }) => [p.id, p]));
    const mappings = trainingProgramsData.career_mappings || {};
    for (const [careerSlug, programIds] of Object.entries(mappings)) {
      const careerPrograms = (programIds as string[])
        .map(id => programsById.get(id))
        .filter(Boolean);
      if (careerPrograms.length > 0) {
        trainingProgramsMap.set(careerSlug, {
          programs: careerPrograms,
          last_updated: trainingProgramsData.last_updated,
        });
      }
    }
    // Category resources
    const catResources = trainingProgramsData.category_resources || {};
    for (const [category, resources] of Object.entries(catResources)) {
      trainingCategoryResources.set(category, resources as any[]);
    }
    console.log(`  Loaded ${trainingProgramsMap.size} career training program mappings`);
  }

  // Financial aid mapping (keyed by career slug)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const financialAidMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const financialCategoryResources = new Map<string, any[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const federalAidRules = new Map<string, any>();
  if (financialAidData) {
    const scholarships = financialAidData.scholarships || [];
    const scholarshipsById = new Map(scholarships.map((s: { id: string }) => [s.id, s]));
    const mappings = financialAidData.career_mappings || {};
    for (const [careerSlug, scholarshipIds] of Object.entries(mappings)) {
      const careerScholarships = (scholarshipIds as string[])
        .map(id => scholarshipsById.get(id))
        .filter(Boolean);
      if (careerScholarships.length > 0) {
        financialAidMap.set(careerSlug, {
          scholarships: careerScholarships,
          last_updated: financialAidData.last_updated,
        });
      }
    }
    // Category resources
    const catResources = financialAidData.category_resources || {};
    for (const [category, resources] of Object.entries(catResources)) {
      financialCategoryResources.set(category, resources as any[]);
    }
    // Federal aid rules by education level
    const aidRules = financialAidData.federal_aid_rules || {};
    for (const [eduLevel, rules] of Object.entries(aidRules)) {
      federalAidRules.set(eduLevel, rules);
    }
    console.log(`  Loaded ${financialAidMap.size} career financial aid mappings`);
  }

  // Track stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aggregated: any[] = [];
  const classificationCounts: Record<string, number> = {
    'AI-Resilient': 0,
    'AI-Augmented': 0,
    'In Transition': 0,
    'High Disruption Risk': 0,
  };
  let aiResilienceApplied = 0;
  let gptsUsed = 0;
  let aioeFallbackUsed = 0;

  for (const code of onetCodes) {
    // Start with the original O*NET data (preserves all fields)
    const career = { ...occupations[code] };

    // Get enrichment data
    const exposure = exposures[code];
    const bls = projections[code];
    const epoch = epochs[code];
    const video = videos[code];
    const oxford = oxfordMap.get(code);

    // Apply Oxford AI risk if available and not already present
    if (oxford && !career.ai_risk) {
      career.ai_risk = {
        score: oxford.ai_risk,
        label: oxford.ai_risk_label,
        confidence: oxford.match_type === 'exact' || oxford.match_type === 'parent_soc' ? 'high' : 'medium',
        rationale: {
          summary: oxford.oxford_probability !== null
            ? `Based on Frey & Osborne (2013) probability of ${(oxford.oxford_probability * 100).toFixed(1)}%`
            : `Based on category median from Frey & Osborne (2013) data`,
          factors_increasing_risk: oxford.oxford_probability !== null && oxford.oxford_probability > 0.5
            ? ['Routine cognitive or manual tasks', 'Structured work environment']
            : [],
          factors_decreasing_risk: oxford.oxford_probability !== null && oxford.oxford_probability < 0.5
            ? ['Complex decision-making', 'Human interaction required', 'Creative problem-solving']
            : [],
        },
        last_assessed: new Date().toISOString().split('T')[0],
        assessor: 'claude' as const,
        oxford_source: {
          probability: oxford.oxford_probability,
          match_type: oxford.match_type,
          paper: 'Frey & Osborne (2013) "The Future of Employment"',
        },
      };
    }

    // Add video data if available (overrides existing)
    if (video) {
      career.video = {
        source: video.source,
        videoUrl: video.videoUrl,
        posterUrl: video.posterUrl,
        title: video.title,
        lastVerified: video.lastVerified,
      };
    }

    // Add inside career content if available (lookup by SOC code)
    const socCode = career.soc_code;
    const insideLook = insideCareerMap.get(socCode);
    if (insideLook) {
      career.inside_look = insideLook;
    }

    // Add training programs if available (lookup by slug)
    const trainingPrograms = trainingProgramsMap.get(career.slug);
    if (trainingPrograms) {
      career.training_programs = {
        ...trainingPrograms,
        category_resources: trainingCategoryResources.get(career.category) || [],
      };
    } else if (trainingCategoryResources.has(career.category)) {
      // Add category resources even if no specific programs
      career.training_programs = {
        programs: [],
        category_resources: trainingCategoryResources.get(career.category),
        last_updated: trainingProgramsData?.last_updated || new Date().toISOString().split('T')[0],
      };
    }

    // Add financial aid if available (lookup by slug)
    const financialAid = financialAidMap.get(career.slug);
    const eduLevel = career.education?.typical_entry_education;
    const federalAidInfo = eduLevel ? federalAidRules.get(eduLevel) : null;
    if (financialAid || federalAidInfo || financialCategoryResources.has(career.category)) {
      career.financial_aid = {
        scholarships: financialAid?.scholarships || [],
        federal_aid_eligible: federalAidInfo?.federal_aid_eligible ?? false,
        typical_aid_sources: federalAidInfo?.typical_aid_sources || [],
        category_resources: financialCategoryResources.get(career.category) || [],
        last_updated: financialAidData?.last_updated || new Date().toISOString().split('T')[0],
      };
    }

    // Calculate AI Resilience if we have the required data
    let exposureBeta: number | null = null;
    let exposureSource: 'gpts' | 'aioe' = 'gpts';

    if (exposure) {
      exposureBeta = exposure.exposureScore;
      exposureSource = exposure.source;
      if (exposure.source === 'gpts') gptsUsed++;
      else aioeFallbackUsed++;
    }

    if (exposureBeta !== null && bls && epoch) {
      const epochScores: EPOCHScores = {
        empathy: epoch.epochScores?.empathy || 3,
        presence: epoch.epochScores?.presence || 3,
        opinion: epoch.epochScores?.opinion || 3,
        creativity: epoch.epochScores?.creativity || 3,
        hope: epoch.epochScores?.hope || 3,
      };
      const epochSum = calculateEPOCHSum(epochScores);

      const result = calculateAIResilience({
        gptsExposureBeta: exposureSource === 'gpts' ? exposureBeta : null,
        aioeExposure: exposureSource === 'aioe' ? exposureBeta : null,
        blsGrowthPercent: bls.percentChange || 0,
        epochSum,
      });

      career.ai_assessment = {
        aiExposure: {
          score: exposureBeta,
          label: result.exposureLabel,
          source: exposureSource,
        },
        jobGrowth: {
          label: result.growthLabel,
          percentChange: bls.percentChange || 0,
          source: 'BLS Employment Projections 2024-2034',
        },
        humanAdvantage: {
          category: result.humanAdvantageLabel,
          epochScores,
        },
        scoring: {
          exposurePoints: result.exposurePoints,
          growthPoints: result.growthPoints,
          humanAdvantagePoints: result.humanAdvantagePoints,
          totalScore: result.totalScore,
        },
        classification: result.classification,
        classificationRationale: result.rationale,
        lastUpdated: new Date().toISOString().split('T')[0],
        methodology: 'v2.0 - GPTs/BLS/EPOCH Additive',
      } as CareerAIAssessment;

      career.ai_resilience = result.classification;
      career.ai_resilience_tier = getAIResilienceTier(result.classification);

      classificationCounts[result.classification]++;
      aiResilienceApplied++;
    } else if (epoch) {
      // Fallback with just EPOCH data
      const epochScores: EPOCHScores = {
        empathy: epoch.epochScores?.empathy || 3,
        presence: epoch.epochScores?.presence || 3,
        opinion: epoch.epochScores?.opinion || 3,
        creativity: epoch.epochScores?.creativity || 3,
        hope: epoch.epochScores?.hope || 3,
      };
      const epochSum = calculateEPOCHSum(epochScores);
      const legacyAIRisk = career.ai_risk?.score || 5;
      const estimatedBeta = legacyAIRisk / 10;

      const result = calculateAIResilience({
        gptsExposureBeta: null,
        aioeExposure: estimatedBeta,
        blsGrowthPercent: bls?.percentChange || 2,
        epochSum,
      });

      career.ai_assessment = {
        aiExposure: {
          score: estimatedBeta,
          label: result.exposureLabel,
          source: 'aioe',
        },
        jobGrowth: {
          label: result.growthLabel,
          percentChange: bls?.percentChange || 0,
          source: bls ? 'BLS Employment Projections 2024-2034' : 'Estimated',
        },
        humanAdvantage: {
          category: result.humanAdvantageLabel,
          epochScores,
        },
        scoring: {
          exposurePoints: result.exposurePoints,
          growthPoints: result.growthPoints,
          humanAdvantagePoints: result.humanAdvantagePoints,
          totalScore: result.totalScore,
        },
        classification: result.classification,
        classificationRationale: `${result.rationale} (estimated from legacy data)`,
        lastUpdated: new Date().toISOString().split('T')[0],
        methodology: 'v2.0-fallback - EPOCH/Legacy',
      } as CareerAIAssessment;

      career.ai_resilience = result.classification;
      career.ai_resilience_tier = getAIResilienceTier(result.classification);

      classificationCounts[result.classification]++;
      aiResilienceApplied++;
    }

    aggregated.push(career);
  }

  // Load and merge manual careers (v2.1)
  console.log('\nLoading manual careers...');
  const { careers: manualCareers, errors: manualErrors } = loadManualCareers();
  if (manualErrors.length > 0) {
    console.log('  Warning - Manual career errors:');
    manualErrors.forEach(e => console.log(`    ${e}`));
  }

  // Add manual careers to aggregated array
  // Manual careers already have all their data (AI resilience, etc.) from YAML
  for (const manualCareer of manualCareers) {
    aggregated.push(manualCareer);
    // Count manual careers in AI resilience breakdown
    if (manualCareer.ai_resilience) {
      classificationCounts[manualCareer.ai_resilience]++;
      aiResilienceApplied++;
    }
  }
  console.log(`  Loaded ${manualCareers.length} manual careers`);
  console.log(`  Total careers: ${aggregated.length} (${onetCodes.length} O*NET + ${manualCareers.length} manual)`);

  // Sort by title for consistent ordering
  aggregated.sort((a, b) => a.title.localeCompare(b.title));

  console.log('AI Resilience Classification Applied:');
  console.log(`  Total: ${aiResilienceApplied}`);
  console.log(`  GPTs (primary): ${gptsUsed}`);
  console.log(`  AIOE (fallback): ${aioeFallbackUsed}`);
  console.log('  Breakdown:');
  for (const [classification, count] of Object.entries(classificationCounts)) {
    console.log(`    ${classification}: ${count}`);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ============================================================================
  // CAREER CONSOLIDATION (v2.2)
  // ============================================================================

  // Check if consolidation definitions exist
  let finalCareers = aggregated;
  let specializations: typeof aggregated = [];
  let careerToSpecMap: Record<string, string[]> = {};

  if (fs.existsSync(CONSOLIDATION_DEFS_PATH)) {
    console.log('\n--- Career Consolidation ---');
    try {
      const definitions = loadCareerDefinitions();
      console.log(`  Loading definitions from: ${CONSOLIDATION_DEFS_PATH}`);
      console.log(`  Categories to consolidate: ${definitions.categories.join(', ')}`);

      const result = consolidateCareers(aggregated, definitions);

      console.log(`  Consolidated careers: ${result.stats.totalConsolidated}`);
      console.log(`  Specializations linked: ${result.stats.totalSpecializations}`);
      console.log(`  Pass-through careers: ${result.stats.passThrough}`);
      console.log(`  Total output careers: ${result.consolidatedCareers.length}`);

      finalCareers = result.consolidatedCareers;
      specializations = result.specializations;
      careerToSpecMap = result.careerToSpecMap;
    } catch (error) {
      console.warn(`  Warning: Consolidation failed, using raw aggregated data`);
      console.warn(`  Error: ${error}`);
    }
  } else {
    console.log('\n  Skipping consolidation (no career-definitions.json found)');
  }

  // Sort by title for consistent ordering
  finalCareers.sort((a, b) => a.title.localeCompare(b.title));

  // Write full careers.json (consolidated if available)
  console.log('\nWriting output files...');
  fs.writeFileSync(CAREERS_OUTPUT, JSON.stringify(finalCareers, null, 2));
  console.log(`  Written: ${CAREERS_OUTPUT}`);
  console.log(`    Size: ${(fs.statSync(CAREERS_OUTPUT).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Careers: ${finalCareers.length}`);

  // Write specializations.json if consolidation was run
  if (specializations.length > 0) {
    specializations.sort((a, b) => a.title.localeCompare(b.title));
    fs.writeFileSync(SPECIALIZATIONS_OUTPUT, JSON.stringify(specializations, null, 2));
    console.log(`  Written: ${SPECIALIZATIONS_OUTPUT}`);
    console.log(`    Size: ${(fs.statSync(SPECIALIZATIONS_OUTPUT).size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`    Specializations: ${specializations.length}`);

    // Write career-to-spec mapping
    fs.writeFileSync(CAREER_TO_SPEC_MAP_OUTPUT, JSON.stringify(careerToSpecMap, null, 2));
    console.log(`  Written: ${CAREER_TO_SPEC_MAP_OUTPUT}`);
  }

  // Generate lightweight index for explorer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const careerIndex = finalCareers.map((occ: any) => {
    const eduDuration = occ.education?.education_duration || occ.education?.time_to_job_ready || occ.training_years;

    return {
      title: occ.title,
      slug: occ.slug,
      category: occ.category,
      subcategory: occ.subcategory,
      median_pay: occ.wages?.annual?.median || 0,
      training_time: occ.training_time || getTrainingTimeCategory(eduDuration?.typical_years ?? 2),
      training_years: eduDuration ? {
        min: eduDuration.min_years || eduDuration.min,
        typical: eduDuration.typical_years || eduDuration.typical,
        max: eduDuration.max_years || eduDuration.max,
      } : null,
      typical_education: occ.education?.typical_entry_education || 'High school diploma',
      // Legacy AI Risk fields
      ai_risk: occ.ai_risk?.score || 5,
      ai_risk_label: occ.ai_risk?.label || 'medium',
      // New AI Resilience fields
      ai_resilience: occ.ai_resilience || undefined,
      ai_resilience_tier: occ.ai_resilience_tier || undefined,
      // Data source discriminator (v2.1)
      data_source: occ.data_source || 'onet',
      description: occ.description?.substring(0, 200) || '',
      // Consolidation fields (v2.2)
      specialization_count: occ.specialization_count || undefined,
      display_strategy: occ.display_strategy || undefined,
      pay_range: occ.pay_range || undefined,
      is_consolidated: occ.is_consolidated || undefined,
    };
  });

  fs.writeFileSync(INDEX_OUTPUT, JSON.stringify(careerIndex, null, 2));
  console.log(`  Written: ${INDEX_OUTPUT}`);
  console.log(`    Size: ${(fs.statSync(INDEX_OUTPUT).size / 1024).toFixed(0)} KB`);

  // Print category breakdown
  const categoryStats: Record<string, { count: number; avgPay: number }> = {};
  for (const career of finalCareers) {
    if (!categoryStats[career.category]) {
      categoryStats[career.category] = { count: 0, avgPay: 0 };
    }
    categoryStats[career.category].count++;
    categoryStats[career.category].avgPay += career.wages?.annual?.median || 0;
  }

  console.log('\nCategory Statistics:');
  Object.entries(categoryStats)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([cat, stats]) => {
      const avgPay = Math.round(stats.avgPay / stats.count);
      console.log(`  ${cat.padEnd(20)} ${stats.count.toString().padStart(4)} jobs | Avg: $${avgPay.toLocaleString().padStart(7)}`);
    });

  console.log('\n=== Aggregation Complete ===\n');
}

main().catch(console.error);
