/**
 * Generate Final Dataset
 *
 * Creates the final occupations_final.json and priority_occupations.json files.
 * Also generates website-ready data files.
 *
 * Run: npx tsx scripts/generate-final.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { getCategory } from '../src/lib/categories';
import {
  calculateAIResilience,
  calculateEPOCHSum,
  getAIResilienceTier,
  getAIExposureLabel,
  getJobGrowthLabel,
  type EPOCHScores,
  type CareerAIAssessment,
  type AIResilienceClassification,
  type AIExposureLabel,
  type JobGrowthLabel,
} from '../src/lib/ai-resilience';
import { loadManualCareers } from './load-manual-careers';

const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');
const DATA_DIR = path.join(process.cwd(), 'data');
const SOURCES_DIR = path.join(DATA_DIR, 'sources');
const OXFORD_MAPPING_FILE = path.join(PROCESSED_DIR, 'oxford_ai_risk_mapping.json');

// AI Resilience data source files (v2.0)
const GPTS_EXPOSURE_FILE = path.join(SOURCES_DIR, 'gpts-are-gpts.json');     // Primary: GPTs are GPTs β scores
const AIOE_EXPOSURE_FILE = path.join(SOURCES_DIR, 'ai-exposure.json');       // Fallback: AIOE dataset
const BLS_PROJECTIONS_FILE = path.join(SOURCES_DIR, 'bls-projections.json');
const EPOCH_SCORES_FILE = path.join(SOURCES_DIR, 'epoch-scores.json');

// Type for Oxford mapping
interface OxfordMapping {
  onet_code: string;
  ai_risk: number;
  ai_risk_label: string;
  oxford_probability: number | null;
  match_type: string;
}

// Type for career video
interface CareerVideo {
  source: 'careeronestop' | 'practitioner';
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  lastVerified: string;
}

// Type for inside career content
interface InsideCareer {
  content: string;
  generated_at: string;
}

// Types for AI Resilience data sources (v2.0)
interface GPTsExposureEntry {
  onet_code: string;
  title: string;
  gpt4_beta: number;           // The β score (0-1) from GPTs are GPTs paper
  llm_exposure_score: number;  // Same as gpt4_beta
  task_exposure: string;       // Low/Medium/High label
  percentile: number;
  source: string;
}

interface AIOEExposureEntry {
  onet_code: string;
  title: string;
  aioe_score: number;
  task_exposure: string;
  percentile: number;
}

interface BLSProjectionEntry {
  onet_code: string;
  title: string;
  soc_code: string;
  employment_2024: number;
  employment_2034: number;
  percent_change: number;
  job_growth_category: string;
}

interface EPOCHScoreEntry {
  onet_code: string;
  title: string;
  epochScores: EPOCHScores;
  sum: number;
  category: string;
  rationale: string;
}

async function main() {
  console.log('\n=== Generating Final Dataset ===\n');

  // Load completed occupations (O*NET-based)
  const occupationsFile = path.join(PROCESSED_DIR, 'occupations_complete.json');
  const occupationsData = JSON.parse(fs.readFileSync(occupationsFile, 'utf-8'));
  const onetOccupations = occupationsData.occupations;
  console.log(`Processing ${onetOccupations.length} O*NET occupations...`);

  // Load manual careers (v2.1)
  console.log('\nLoading manual careers...');
  const { careers: manualCareers, errors: manualErrors } = loadManualCareers();
  if (manualErrors.length > 0) {
    console.log('⚠️  Manual career errors:');
    manualErrors.forEach(e => console.log(`  ${e}`));
  }
  console.log(`Loaded ${manualCareers.length} manual careers`);

  // Merge O*NET and manual careers
  const occupations = [...onetOccupations, ...manualCareers];
  console.log(`Total careers: ${occupations.length} (${onetOccupations.length} O*NET + ${manualCareers.length} manual)\n`);

  // Re-apply category mapping (to pick up any overrides from career-overrides.ts)
  // Skip manual careers - they already have their category set
  let categoryOverrides = 0;
  for (const occ of occupations) {
    // Skip manual careers - no O*NET code to map
    if (occ.data_source === 'manual' || !occ.onet_code) {
      continue;
    }
    const newCategory = getCategory(occ.onet_code);
    if (newCategory !== occ.category) {
      console.log(`  Category override: ${occ.title} (${occ.onet_code}): ${occ.category} → ${newCategory}`);
      occ.category = newCategory;
      categoryOverrides++;
    }
  }
  if (categoryOverrides > 0) {
    console.log(`Applied ${categoryOverrides} category override(s)`);
  }

  // Load curated technology skills (if available)
  // First check the docs location (generated from markdown), then fall back to processed dir
  const curatedDocsFile = path.join(process.cwd(), 'docs', 'curated-tech-skills', '_combined.json');
  const curatedProcessedFile = path.join(PROCESSED_DIR, 'curated-tech-skills.json');
  const curatedTechSkillsFile = fs.existsSync(curatedDocsFile) ? curatedDocsFile : curatedProcessedFile;
  let techSkillOverrides = 0;
  if (fs.existsSync(curatedTechSkillsFile)) {
    const curatedData = JSON.parse(fs.readFileSync(curatedTechSkillsFile, 'utf-8'));
    const curatedSkills = curatedData.skills as Record<string, string[]>;
    console.log(`Loading curated tech skills for ${Object.keys(curatedSkills).length} careers...`);

    for (const occ of occupations) {
      if (curatedSkills[occ.onet_code]) {
        occ.technology_skills = curatedSkills[occ.onet_code];
        techSkillOverrides++;
      }
    }
    console.log(`Applied ${techSkillOverrides} curated technology skill sets`);
  }

  // Load Oxford AI risk mapping
  console.log('Loading Oxford AI risk mapping...');
  const oxfordData = JSON.parse(fs.readFileSync(OXFORD_MAPPING_FILE, 'utf-8'));
  const oxfordMappings = new Map<string, OxfordMapping>();
  for (const mapping of oxfordData.mappings) {
    oxfordMappings.set(mapping.onet_code, mapping);
  }
  console.log(`Loaded ${oxfordMappings.size} Oxford AI risk mappings`);

  // Load career videos
  const videosFile = path.join(DATA_DIR, 'videos/career-videos.json');
  const videosMap = new Map<string, CareerVideo>();
  if (fs.existsSync(videosFile)) {
    const videosData = JSON.parse(fs.readFileSync(videosFile, 'utf-8'));
    if (videosData.videos) {
      for (const [socCode, video] of Object.entries(videosData.videos)) {
        videosMap.set(socCode, video as CareerVideo);
      }
    }
    console.log(`Loaded ${videosMap.size} career videos`);
  } else {
    console.log('No career videos file found (data/videos/career-videos.json)');
  }

  // Load inside career content
  const insideCareerFile = path.join(DATA_DIR, 'inside-career/inside-career.json');
  const insideCareerMap = new Map<string, InsideCareer>();
  if (fs.existsSync(insideCareerFile)) {
    const insideCareerData = JSON.parse(fs.readFileSync(insideCareerFile, 'utf-8'));
    if (insideCareerData.careers) {
      for (const [socCode, content] of Object.entries(insideCareerData.careers)) {
        insideCareerMap.set(socCode, content as InsideCareer);
      }
    }
    console.log(`Loaded ${insideCareerMap.size} inside career entries`);
  } else {
    console.log('No inside career file found (data/inside-career/inside-career.json)');
  }

  // ============================================================================
  // Load AI Resilience Data Sources (v2.0)
  // ============================================================================

  // Load GPTs are GPTs exposure data (PRIMARY source)
  const gptsExposureMap = new Map<string, GPTsExposureEntry>();
  if (fs.existsSync(GPTS_EXPOSURE_FILE)) {
    const gptsData = JSON.parse(fs.readFileSync(GPTS_EXPOSURE_FILE, 'utf-8'));
    for (const [onetCode, entry] of Object.entries(gptsData)) {
      gptsExposureMap.set(onetCode, entry as GPTsExposureEntry);
    }
    console.log(`Loaded ${gptsExposureMap.size} GPTs are GPTs exposure entries (PRIMARY)`);
  } else {
    console.log('⚠️  No GPTs data found - run: npx tsx scripts/fetch-gpts-exposure.ts');
  }

  // Load AIOE exposure data (FALLBACK source)
  const aioeExposureMap = new Map<string, AIOEExposureEntry>();
  if (fs.existsSync(AIOE_EXPOSURE_FILE)) {
    const aioeData = JSON.parse(fs.readFileSync(AIOE_EXPOSURE_FILE, 'utf-8'));
    for (const [onetCode, entry] of Object.entries(aioeData)) {
      aioeExposureMap.set(onetCode, entry as AIOEExposureEntry);
    }
    console.log(`Loaded ${aioeExposureMap.size} AIOE exposure entries (FALLBACK)`);
  } else {
    console.log('⚠️  No AIOE data found - will use GPTs data only');
  }

  // Load BLS Employment Projections
  const blsProjectionsMap = new Map<string, BLSProjectionEntry>();
  if (fs.existsSync(BLS_PROJECTIONS_FILE)) {
    const blsData = JSON.parse(fs.readFileSync(BLS_PROJECTIONS_FILE, 'utf-8'));
    // File is a dictionary with onet_code as keys
    for (const [onetCode, entry] of Object.entries(blsData)) {
      const typedEntry = entry as {
        onet_code: string;
        soc_code: string;
        title: string;
        percent_change: number;
        job_growth_category: string;
        estimated_employment_2024?: number;
        projected_employment_2034?: number;
      };
      blsProjectionsMap.set(onetCode, {
        onet_code: typedEntry.onet_code,
        title: typedEntry.title,
        soc_code: typedEntry.soc_code,
        employment_2024: typedEntry.estimated_employment_2024 || 0,
        employment_2034: typedEntry.projected_employment_2034 || 0,
        percent_change: typedEntry.percent_change,
        job_growth_category: typedEntry.job_growth_category,
      });
    }
    console.log(`Loaded ${blsProjectionsMap.size} BLS projection entries`);
  } else {
    console.log('⚠️  No BLS projections file found - run: npx tsx scripts/fetch-bls-projections.ts');
  }

  // Load EPOCH scores (Human Advantage)
  const epochScoresMap = new Map<string, EPOCHScoreEntry>();
  if (fs.existsSync(EPOCH_SCORES_FILE)) {
    const epochData = JSON.parse(fs.readFileSync(EPOCH_SCORES_FILE, 'utf-8'));
    for (const [onetCode, entry] of Object.entries(epochData.scores)) {
      epochScoresMap.set(onetCode, entry as EPOCHScoreEntry);
    }
    console.log(`Loaded ${epochScoresMap.size} EPOCH score entries`);
  } else {
    console.log('⚠️  No EPOCH scores file found - needs manual curation');
  }

  // Apply Oxford AI risk scores to occupations (O*NET only)
  // Manual careers already have their AI risk, video, and inside_look set
  let oxfordApplied = 0;
  for (const occ of occupations) {
    // Skip manual careers - they already have all their data set
    if (occ.data_source === 'manual') {
      continue;
    }

    const oxfordMapping = oxfordMappings.get(occ.onet_code);
    if (oxfordMapping) {
      // Update AI risk with Oxford data (maintaining schema compatibility)
      occ.ai_risk = {
        score: oxfordMapping.ai_risk,
        label: oxfordMapping.ai_risk_label,
        confidence: oxfordMapping.match_type === 'exact' || oxfordMapping.match_type === 'parent_soc' ? 'high' : 'medium',
        rationale: {
          summary: oxfordMapping.oxford_probability !== null
            ? `Based on Frey & Osborne (2013) probability of ${(oxfordMapping.oxford_probability * 100).toFixed(1)}%`
            : `Based on category median from Frey & Osborne (2013) data`,
          factors_increasing_risk: oxfordMapping.oxford_probability !== null && oxfordMapping.oxford_probability > 0.5
            ? ['Routine cognitive or manual tasks', 'Structured work environment']
            : [],
          factors_decreasing_risk: oxfordMapping.oxford_probability !== null && oxfordMapping.oxford_probability < 0.5
            ? ['Complex decision-making', 'Human interaction required', 'Creative problem-solving']
            : [],
        },
        last_assessed: new Date().toISOString().split('T')[0],
        assessor: 'claude' as const,
        // Additional Oxford metadata
        oxford_source: {
          probability: oxfordMapping.oxford_probability,
          match_type: oxfordMapping.match_type,
          paper: 'Frey & Osborne (2013) "The Future of Employment"',
        },
      };
      oxfordApplied++;
    }

    // Add video data if available
    const video = videosMap.get(occ.soc_code);
    if (video) {
      occ.video = video;
    } else {
      occ.video = null;
    }

    // Add inside career content if available
    const insideLook = insideCareerMap.get(occ.soc_code);
    if (insideLook) {
      occ.inside_look = insideLook;
    } else {
      occ.inside_look = null;
    }
  }
  console.log(`Applied Oxford AI risk to ${oxfordApplied} occupations`);
  console.log(`Applied videos to ${videosMap.size} occupations`);
  console.log(`Applied inside career content to ${insideCareerMap.size} occupations`);

  // ============================================================================
  // Apply AI Resilience Classifications (v2.0 - Additive Scoring)
  // ============================================================================

  let aiResilienceApplied = 0;
  let aiResilienceSkipped = 0;
  let gptsUsed = 0;
  let aioeFallbackUsed = 0;
  const classificationCounts: Record<string, number> = {
    'AI-Resilient': 0,
    'AI-Augmented': 0,
    'In Transition': 0,
    'High Disruption Risk': 0,
  };

  for (const occ of occupations) {
    // Skip manual careers - they already have AI Resilience data
    if (occ.data_source === 'manual') {
      if (occ.ai_resilience) {
        classificationCounts[occ.ai_resilience]++;
        aiResilienceApplied++;
      }
      continue;
    }

    // Get data from all sources (O*NET careers only)
    const gptsExposure = gptsExposureMap.get(occ.onet_code);
    const aioeExposure = aioeExposureMap.get(occ.onet_code);
    const blsProjection = blsProjectionsMap.get(occ.onet_code);
    const epochScore = epochScoresMap.get(occ.onet_code);

    // Determine AI Exposure value (GPTs primary, AIOE fallback)
    let exposureBeta: number | null = null;
    let exposureSource: 'gpts' | 'aioe' = 'gpts';

    if (gptsExposure) {
      exposureBeta = gptsExposure.gpt4_beta;
      exposureSource = 'gpts';
      gptsUsed++;
    } else if (aioeExposure) {
      // Convert AIOE score to 0-1 range (AIOE scores are typically 0-2+)
      // Normalize: assume AIOE max is around 2.5, map to 0-1
      exposureBeta = Math.min(aioeExposure.aioe_score / 2.5, 1);
      exposureSource = 'aioe';
      aioeFallbackUsed++;
    }

    // Classification requires at least exposure data, BLS projections, and EPOCH scores
    if (exposureBeta !== null && blsProjection && epochScore) {
      const epochSum = calculateEPOCHSum(epochScore.epochScores);

      // Use new additive scoring algorithm
      const result = calculateAIResilience({
        gptsExposureBeta: exposureSource === 'gpts' ? exposureBeta : null,
        aioeExposure: exposureSource === 'aioe' ? exposureBeta : null,
        blsGrowthPercent: blsProjection.percent_change,
        epochSum,
      });

      // Create new v2.0 ai_assessment structure
      occ.ai_assessment = {
        aiExposure: {
          score: exposureBeta,
          label: result.exposureLabel,
          source: exposureSource,
        },
        jobGrowth: {
          label: result.growthLabel,
          percentChange: blsProjection.percent_change,
          source: 'BLS Employment Projections 2024-2034',
        },
        humanAdvantage: {
          category: result.humanAdvantageLabel,
          epochScores: epochScore.epochScores,
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

      // Add convenience fields for indexing
      occ.ai_resilience = result.classification;
      occ.ai_resilience_tier = getAIResilienceTier(result.classification);

      classificationCounts[result.classification]++;
      aiResilienceApplied++;
    } else if (epochScore) {
      // FALLBACK: Use EPOCH scores + legacy AI Risk to estimate
      // When we don't have exposure or BLS data
      const epochSum = calculateEPOCHSum(epochScore.epochScores);
      const legacyAIRisk = occ.ai_risk?.score || 5;

      // Estimate exposure from legacy AI risk (higher risk = higher exposure)
      const estimatedBeta = legacyAIRisk / 10; // Convert 0-10 to 0-1
      // Estimate growth as stable if we don't have BLS data
      const estimatedGrowth = 2; // Stable = 0-5%

      const result = calculateAIResilience({
        gptsExposureBeta: null,
        aioeExposure: estimatedBeta,
        blsGrowthPercent: estimatedGrowth,
        epochSum,
      });

      // Create fallback ai_assessment
      occ.ai_assessment = {
        aiExposure: {
          score: estimatedBeta,
          label: result.exposureLabel,
          source: 'aioe', // Mark as fallback
        },
        jobGrowth: {
          label: 'Stable' as JobGrowthLabel,
          percentChange: 0,
          source: 'Estimated - BLS data unavailable',
        },
        humanAdvantage: {
          category: result.humanAdvantageLabel,
          epochScores: epochScore.epochScores,
        },
        scoring: {
          exposurePoints: result.exposurePoints,
          growthPoints: 1, // Stable = 1 point
          humanAdvantagePoints: result.humanAdvantagePoints,
          totalScore: result.totalScore,
        },
        classification: result.classification,
        classificationRationale: `${result.rationale} (estimated from legacy data)`,
        lastUpdated: new Date().toISOString().split('T')[0],
        methodology: 'v2.0-fallback - EPOCH/Legacy',
      } as CareerAIAssessment;

      // Add convenience fields for indexing
      occ.ai_resilience = result.classification;
      occ.ai_resilience_tier = getAIResilienceTier(result.classification);

      classificationCounts[result.classification]++;
      aiResilienceApplied++;
    } else {
      aiResilienceSkipped++;
    }
  }

  console.log(`Applied AI Resilience to ${aiResilienceApplied} occupations`);
  console.log(`  Data sources: ${gptsUsed} GPTs (primary), ${aioeFallbackUsed} AIOE (fallback)`);
  console.log('  Classification breakdown:');
  for (const [classification, count] of Object.entries(classificationCounts)) {
    console.log(`    ${classification}: ${count}`);
  }

  // Validate all occupations have required fields
  let validCount = 0;
  let incompleteCount = 0;

  occupations.forEach((occ: {
    data_completeness: { completeness_score: number; has_wages: boolean; has_tasks: boolean };
    wages: unknown;
    ai_risk: unknown;
    national_importance: unknown;
    career_progression: unknown;
  }) => {
    // Update completeness score
    let score = 0;
    if (occ.wages) score += 25;
    if (occ.ai_risk) score += 25;
    if (occ.national_importance) score += 25;
    if (occ.career_progression) score += 25;
    occ.data_completeness.completeness_score = score;
    occ.data_completeness.has_wages = !!occ.wages;
    occ.data_completeness.has_tasks = true;

    if (score >= 75) {
      validCount++;
    } else {
      incompleteCount++;
    }
  });

  console.log(`Complete occupations: ${validCount}`);
  console.log(`Incomplete occupations: ${incompleteCount}`);

  // Validate: Check for zeros in career progression timeline (indicates BLS null handling bug)
  const careersWithZeros = occupations.filter((o: {
    title: string;
    career_progression?: { timeline?: { expected_compensation: number }[] };
  }) =>
    o.career_progression?.timeline?.some(t => t.expected_compensation === 0)
  );

  if (careersWithZeros.length > 0) {
    console.error(`\n⚠️  WARNING: Found ${careersWithZeros.length} careers with $0 in timeline:`);
    careersWithZeros.slice(0, 10).forEach((c: { title: string }) => {
      console.error(`    - ${c.title}`);
    });
    if (careersWithZeros.length > 10) {
      console.error(`    ... and ${careersWithZeros.length - 10} more`);
    }
    console.error(`\n   This usually means BLS percentile data has nulls that weren't estimated.`);
    console.error(`   Run 'npx tsx scripts/create-progression-mappings.ts' to fix.\n`);
    // Don't fail the build, but warn loudly
  } else {
    console.log('✓ All career progressions have valid (non-zero) compensation data');
  }

  // Generate final dataset
  const finalOutput = {
    metadata: {
      version: '2.1',
      generated_at: new Date().toISOString(),
      total_occupations: occupations.length,
      career_sources: {
        onet: onetOccupations.length,
        manual: manualCareers.length,
      },
      data_sources: [
        { name: 'O*NET 30.1', url: 'https://www.onetcenter.org' },
        { name: 'BLS OES', url: 'https://www.bls.gov/oes/' },
        { name: 'Levels.fyi (mapped)', url: 'https://www.levels.fyi' },
        { name: 'Frey & Osborne (2013) - AI Risk', url: 'https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment' },
        { name: 'CareerOneStop Videos', url: 'https://www.careeronestop.org/Videos/' },
        { name: 'GPTs are GPTs (Eloundou et al. 2023) - AI Exposure', url: 'https://arxiv.org/abs/2303.10130' },
        { name: 'AIOE Dataset (Felten et al. 2021) - AI Exposure Fallback', url: 'https://github.com/AIOE-Data/AIOE' },
        { name: 'BLS Employment Projections 2024-2034', url: 'https://www.bls.gov/emp/' },
        { name: 'EPOCH Framework - Human Advantage', url: 'Manual curation' },
        { name: 'Manual Career Research', url: 'Glassdoor, LinkedIn, Indeed (Jan 2026)' },
      ],
      completeness: {
        wages: occupations.filter((o: { wages: unknown }) => o.wages).length,
        ai_risk: occupations.filter((o: { ai_risk: unknown }) => o.ai_risk).length,
        ai_resilience: occupations.filter((o: { ai_resilience: unknown }) => o.ai_resilience).length,
        national_importance: occupations.filter((o: { national_importance: unknown }) => o.national_importance).length,
        career_progression: occupations.filter((o: { career_progression: unknown }) => o.career_progression).length,
        videos: occupations.filter((o: { video: unknown }) => o.video).length,
        inside_look: occupations.filter((o: { inside_look: unknown }) => o.inside_look).length,
      },
      ai_resilience_breakdown: classificationCounts,
    },
    occupations,
  };

  fs.writeFileSync(
    path.join(PROCESSED_DIR, 'occupations_final.json'),
    JSON.stringify(finalOutput, null, 2)
  );
  console.log('Generated: occupations_final.json');

  // Generate priority occupations (200 most important/interesting)
  // ARCHIVED: national_importance removed from priority scoring - see data/archived/importance-scores-backup.json
  const priorityOccupations = occupations
    .map((occ: {
      onet_code: string;
      title: string;
      category: string;
      wages: { annual: { median: number } };
      // national_importance: { score: number }; // ARCHIVED
      ai_risk: { score: number };
    }) => ({
      ...occ,
      priority_score: (
        // (occ.national_importance?.score || 0) * 2 + // ARCHIVED
        (10 - (occ.ai_risk?.score || 5)) * 2 +
        (occ.wages?.annual?.median || 0) / 10000
      ),
    }))
    .sort((a: { priority_score: number }, b: { priority_score: number }) => b.priority_score - a.priority_score)
    .slice(0, 200)
    .map(({ priority_score, ...occ }: { priority_score: number; [key: string]: unknown }) => occ);

  fs.writeFileSync(
    path.join(PROCESSED_DIR, 'priority_occupations.json'),
    JSON.stringify({
      metadata: {
        generated_at: new Date().toISOString(),
        total: priorityOccupations.length,
        selection_criteria: 'Low AI risk + Good wages', // ARCHIVED: was 'High national importance + Low AI risk + Good wages'
      },
      occupations: priorityOccupations,
    }, null, 2)
  );
  console.log('Generated: priority_occupations.json (200 priority occupations)');

  // Generate website-ready index file (lightweight version for explorer)
  const careerIndex = occupations.map((occ: {
    title: string;
    slug: string;
    category: string;
    subcategory: string;
    wages: { annual: { median: number } };
    education: {
      education_duration?: { min_years: number; typical_years: number; max_years: number };
      time_to_job_ready: { min_years: number; typical_years: number; max_years: number };
      typical_entry_education: string;
    };
    ai_risk: { score: number; label: string };
    // NEW: AI Resilience fields
    ai_resilience?: string;
    ai_resilience_tier?: number;
    // Data source discriminator (v2.1)
    data_source?: 'onet' | 'manual';
    // ARCHIVED: national_importance removed from UI - see data/archived/importance-scores-backup.json
    // national_importance: { score: number; label: string; flag_count: number };
    description: string;
  }) => {
    // Use education_duration (ground truth) if available, fall back to time_to_job_ready
    const eduDuration = occ.education?.education_duration || occ.education?.time_to_job_ready;

    return {
      title: occ.title,
      slug: occ.slug,
      category: occ.category,
      subcategory: occ.subcategory,
      median_pay: occ.wages?.annual?.median || 0,
      training_time: getTrainingTimeCategory(eduDuration?.typical_years ?? 2),
      training_years: eduDuration ? {
        min: eduDuration.min_years,
        typical: eduDuration.typical_years,
        max: eduDuration.max_years,
      } : null,
      typical_education: occ.education?.typical_entry_education || 'High school diploma',
      // LEGACY: AI Risk fields kept for backwards compatibility
      ai_risk: occ.ai_risk?.score || 5,
      ai_risk_label: occ.ai_risk?.label || 'medium',
      // NEW: AI Resilience classification (4-tier system)
      ai_resilience: occ.ai_resilience || undefined,
      ai_resilience_tier: occ.ai_resilience_tier || undefined,
      // Data source discriminator (v2.1)
      data_source: occ.data_source || 'onet',
      // ARCHIVED: importance fields removed from UI - see data/archived/importance-scores-backup.json
      // importance: occ.national_importance?.score || 5,
      // importance_label: occ.national_importance?.label || 'important',
      // flag_count: occ.national_importance?.flag_count || 2,
      description: occ.description?.substring(0, 200) || '',
    };
  });

  fs.writeFileSync(
    path.join(DATA_DIR, 'careers-index.json'),
    JSON.stringify(careerIndex, null, 2)
  );
  console.log('Generated: careers-index.json (website index)');

  // Generate careers.generated.json (full data for detail pages)
  fs.writeFileSync(
    path.join(DATA_DIR, 'careers.generated.json'),
    JSON.stringify(occupations, null, 2)
  );
  console.log('Generated: careers.generated.json (full career data)');

  // Print category breakdown
  const categoryStats: Record<string, { count: number; avgPay: number; avgAIRisk: number }> = {};
  occupations.forEach((occ: {
    category: string;
    wages: { annual: { median: number } };
    ai_risk: { score: number };
  }) => {
    if (!categoryStats[occ.category]) {
      categoryStats[occ.category] = { count: 0, avgPay: 0, avgAIRisk: 0 };
    }
    categoryStats[occ.category].count++;
    categoryStats[occ.category].avgPay += occ.wages?.annual?.median || 0;
    categoryStats[occ.category].avgAIRisk += occ.ai_risk?.score || 5;
  });

  console.log('\nCategory Statistics:');
  Object.entries(categoryStats)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([cat, stats]) => {
      const avgPay = Math.round(stats.avgPay / stats.count);
      const avgRisk = (stats.avgAIRisk / stats.count).toFixed(1);
      console.log(`  ${cat.padEnd(20)} ${stats.count.toString().padStart(4)} jobs | Avg: $${avgPay.toLocaleString().padStart(7)} | AI Risk: ${avgRisk}`);
    });

  // Print top priority occupations
  console.log('\nTop 10 Priority Occupations:');
  priorityOccupations.slice(0, 10).forEach((occ: {
    title: string;
    // national_importance: { flag_count: number }; // ARCHIVED
    wages: { annual: { median: number } };
    ai_risk: { score: number };
  }, i: number) => {
    // ARCHIVED: flags removed - see data/archived/importance-scores-backup.json
    // const flags = '🇺🇸'.repeat(occ.national_importance?.flag_count || 1);
    console.log(`  ${i + 1}. ${occ.title} - $${(occ.wages?.annual?.median || 0).toLocaleString()} (AI Risk: ${occ.ai_risk?.score})`);
  });

  console.log('\n=== Final Dataset Generation Complete ===\n');
}

function getTrainingTimeCategory(years: number): string {
  if (years < 0.5) return '<6mo';
  if (years < 2) return '6-24mo';
  if (years < 4) return '2-4yr';
  return '4+yr';
}

main().catch(console.error);
