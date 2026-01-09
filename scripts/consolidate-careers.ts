/**
 * Career Consolidation Script
 *
 * Consolidates O*NET occupations into unified Careers based on career-definitions.json.
 * Creates both consolidated careers and specializations with proper linking.
 *
 * Aggregation Rules:
 * - median_pay: Employment-weighted median
 * - pay_range: [Min 10th percentile, Max 90th percentile] across specs
 * - training_time: Mode (most common), or range if high variance
 * - ai_resilience: Employment-weighted classification
 * - tasks: Union top tasks (deduplicated, max 15)
 * - technology_skills: Union (deduplicated, max 20)
 * - abilities: Union (deduplicated, max 10)
 * - description: Use primary O*NET code's description
 * - alternate_titles: Union from all specs
 *
 * Input:
 *   - data/consolidation/career-definitions.json
 *   - Aggregated careers from aggregate.ts
 *
 * Output:
 *   - Consolidated careers array
 *   - Specializations array (with parent_career_slug)
 *   - Career-to-spec mapping
 *
 * Run: npx tsx scripts/consolidate-careers.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { AIResilienceClassification } from '../src/types/career';

// Paths
const DEFINITIONS_FILE = path.join(process.cwd(), 'data/consolidation/career-definitions.json');
const MANUAL_CAREERS_DIR = path.join(process.cwd(), 'data/manual/careers');
const CAREER_CONTENT_FILE = path.join(process.cwd(), 'data/consolidation/career-content.json');

// Types
interface CareerDefinition {
  id: string;
  title: string;
  category: string;
  groupingStrategy: 'soc-based' | 'functional' | 'singleton' | 'catchall';
  displayStrategy: 'career-only' | 'show-specializations';
  specializationLabel?: string;
  primaryOnetCode: string;
  onetCodes: string[];
  description?: string;
  keywords?: string[];
}

interface CareerDefinitionsFile {
  version: string;
  description: string;
  lastUpdated: string;
  categories: string[];
  careers: Record<string, CareerDefinition>;
}

interface CareerContent {
  description: string;
  inside_look: {
    content: string;
  };
  generated_at: string;
  specialization_count: number;
  model: string;
}

interface CareerContentFile {
  version: string;
  description: string;
  lastUpdated: string;
  careers: Record<string, CareerContent>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Career = any; // Using any for flexibility with existing career data

interface ConsolidationResult {
  consolidatedCareers: Career[];
  specializations: Career[];
  careerToSpecMap: Record<string, string[]>;
  stats: {
    totalConsolidated: number;
    totalSpecializations: number;
    passThrough: number;
    categoriesConsolidated: string[];
  };
}

/**
 * Load career definitions from JSON file
 */
function loadCareerDefinitions(): CareerDefinitionsFile {
  if (!fs.existsSync(DEFINITIONS_FILE)) {
    throw new Error(`Career definitions file not found: ${DEFINITIONS_FILE}`);
  }
  return JSON.parse(fs.readFileSync(DEFINITIONS_FILE, 'utf-8'));
}

/**
 * Load AI-generated career content from JSON file
 */
function loadCareerContent(): CareerContentFile | null {
  if (!fs.existsSync(CAREER_CONTENT_FILE)) {
    console.warn('  Warning: Career content file not found, using primary career content');
    return null;
  }
  return JSON.parse(fs.readFileSync(CAREER_CONTENT_FILE, 'utf-8'));
}

/**
 * Load manual careers from YAML files
 */
function loadManualCareers(): Career[] {
  if (!fs.existsSync(MANUAL_CAREERS_DIR)) {
    return [];
  }

  const manualCareers: Career[] = [];
  const files = fs.readdirSync(MANUAL_CAREERS_DIR);

  for (const file of files) {
    if (file.endsWith('.yaml') && !file.startsWith('_')) {
      const filePath = path.join(MANUAL_CAREERS_DIR, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const career = yaml.load(content) as Career;
        if (career && career.slug) {
          career.data_source = 'manual';
          // Normalize title field (manual careers may use 'name' instead of 'title')
          if (!career.title && career.name) {
            career.title = career.name;
          }
          // Ensure required fields have defaults
          career.tasks = career.tasks || [];
          career.technology_skills = career.technology_skills || [];
          career.abilities = career.abilities || [];
          career.alternate_titles = career.alternate_titles || [];
          manualCareers.push(career);
        }
      } catch (err) {
        console.warn(`  Warning: Failed to load ${file}: ${err}`);
      }
    }
  }

  return manualCareers;
}

/**
 * Create a URL-friendly slug from a title
 */
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Calculate employment-weighted median pay
 */
function calculateWeightedMedianPay(specs: Career[]): number {
  const validSpecs = specs.filter(s => s.wages?.annual?.median && s.wages?.employment_count);

  if (validSpecs.length === 0) {
    // Fallback to simple average if no employment data
    const medians = specs
      .filter(s => s.wages?.annual?.median)
      .map(s => s.wages.annual.median);
    return medians.length > 0 ? Math.round(medians.reduce((a, b) => a + b, 0) / medians.length) : 0;
  }

  const totalEmployment = validSpecs.reduce((sum, s) => sum + s.wages.employment_count, 0);
  let weightedSum = 0;

  validSpecs.forEach(s => {
    const weight = s.wages.employment_count / totalEmployment;
    weightedSum += weight * s.wages.annual.median;
  });

  return Math.round(weightedSum);
}

/**
 * Calculate pay range across all specializations
 */
function calculatePayRange(specs: Career[]): { min: number; max: number } {
  const pct10Values = specs
    .filter(s => s.wages?.annual?.pct_10)
    .map(s => s.wages.annual.pct_10);
  const pct90Values = specs
    .filter(s => s.wages?.annual?.pct_90)
    .map(s => s.wages.annual.pct_90);

  return {
    min: pct10Values.length > 0 ? Math.min(...pct10Values) : 0,
    max: pct90Values.length > 0 ? Math.max(...pct90Values) : 0,
  };
}

/**
 * Calculate total employment across specializations
 */
function calculateTotalEmployment(specs: Career[]): number {
  return specs.reduce((sum, s) => sum + (s.wages?.employment_count || 0), 0);
}

/**
 * Calculate employment-weighted AI Resilience classification
 */
function calculateWeightedAIResilience(specs: Career[]): {
  classification: AIResilienceClassification;
  tier: number;
} {
  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const tierLabels: Record<number, AIResilienceClassification> = {
    1: 'AI-Resilient',
    2: 'AI-Augmented',
    3: 'In Transition',
    4: 'High Disruption Risk',
  };

  const validSpecs = specs.filter(s => s.ai_resilience_tier && s.wages?.employment_count);

  if (validSpecs.length === 0) {
    // Fallback to simple mode if no employment data
    specs.forEach(s => {
      const tier = s.ai_resilience_tier || 2;
      tierCounts[tier]++;
    });
  } else {
    const totalEmployment = validSpecs.reduce((sum, s) => sum + s.wages.employment_count, 0);
    validSpecs.forEach(s => {
      const weight = s.wages.employment_count / totalEmployment;
      tierCounts[s.ai_resilience_tier] += weight;
    });
  }

  // Find tier with highest count/weight
  const maxTier = Object.entries(tierCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
  const tier = parseInt(maxTier);

  return {
    classification: tierLabels[tier],
    tier,
  };
}

/**
 * Determine training time category from years
 */
function getTrainingTimeCategory(years: number): '<6mo' | '6-24mo' | '2-4yr' | '4+yr' {
  if (years < 0.5) return '<6mo';
  if (years < 2) return '6-24mo';
  if (years < 4) return '2-4yr';
  return '4+yr';
}

/**
 * Calculate aggregated training time
 */
function calculateTrainingTime(specs: Career[]): {
  category: '<6mo' | '6-24mo' | '2-4yr' | '4+yr';
  years: { min: number; typical: number; max: number };
} {
  const years = specs
    .map(s => s.education?.time_to_job_ready?.typical_years || s.education?.education_duration?.typical_years)
    .filter((y): y is number => y !== undefined && y !== null);

  if (years.length === 0) {
    return {
      category: '2-4yr',
      years: { min: 2, typical: 3, max: 4 },
    };
  }

  const minYears = Math.min(...years);
  const maxYears = Math.max(...years);
  const avgYears = years.reduce((a, b) => a + b, 0) / years.length;

  return {
    category: getTrainingTimeCategory(avgYears),
    years: {
      min: minYears,
      typical: Math.round(avgYears * 10) / 10,
      max: maxYears,
    },
  };
}

/**
 * Union arrays with deduplication
 */
function unionArrays(specs: Career[], field: string, maxItems: number): string[] {
  const allItems = specs.flatMap(s => s[field] || []);
  const unique = [...new Set(allItems)];
  return unique.slice(0, maxItems);
}

/**
 * Get primary career's education data
 */
function getPrimaryEducation(specs: Career[], primaryCode: string): Career['education'] | null {
  const primary = specs.find(s => s.onet_code === primaryCode);
  return primary?.education || specs[0]?.education || null;
}

/**
 * Consolidate careers based on definitions
 */
export function consolidateCareers(
  allCareers: Career[],
  definitions: CareerDefinitionsFile,
  careerContent?: CareerContentFile | null
): ConsolidationResult {
  const consolidatedCareers: Career[] = [];
  const specializations: Career[] = [];
  const careerToSpecMap: Record<string, string[]> = {};
  const processedOnetCodes = new Set<string>();
  const categoriesConsolidated = new Set<string>();

  // Create lookup map for quick access
  const careerByOnetCode = new Map<string, Career>();
  allCareers.forEach(c => {
    if (c.onet_code) {
      careerByOnetCode.set(c.onet_code, c);
    }
  });

  // Process each career definition
  for (const [careerId, definition] of Object.entries(definitions.careers)) {
    const specs = definition.onetCodes
      .map(code => careerByOnetCode.get(code))
      .filter((c): c is Career => c !== undefined);

    if (specs.length === 0) {
      console.warn(`  Warning: No matching careers found for ${careerId}`);
      continue;
    }

    // Mark these codes as processed
    definition.onetCodes.forEach(code => processedOnetCodes.add(code));
    categoriesConsolidated.add(definition.category);

    // Get primary career for reference data
    const primaryCareer = specs.find(s => s.onet_code === definition.primaryOnetCode) || specs[0];

    // Calculate aggregations
    const medianPay = calculateWeightedMedianPay(specs);
    const payRange = calculatePayRange(specs);
    const totalEmployment = calculateTotalEmployment(specs);
    const aiResilience = calculateWeightedAIResilience(specs);
    const trainingTime = calculateTrainingTime(specs);
    const education = getPrimaryEducation(specs, definition.primaryOnetCode);

    // Create specialization slugs
    const specSlugs = specs.map(s => s.slug);

    // Get AI-generated content if available for consolidated careers with multiple specs
    const aiContent = careerContent?.careers[careerId];
    const useAIContent = aiContent && specs.length > 1;

    // Create consolidated career
    const consolidatedCareer: Career = {
      // Core identity
      title: definition.title,
      slug: careerId,
      description: useAIContent ? aiContent.description : (definition.description || primaryCareer.description),
      category: definition.category,
      subcategory: primaryCareer.subcategory || '',

      // Consolidation metadata
      is_consolidated: true,
      data_source: 'onet',
      specialization_count: specs.length,
      specialization_slugs: specSlugs,
      display_strategy: definition.displayStrategy,
      grouping_strategy: definition.groupingStrategy,
      specialization_label: definition.specializationLabel,
      primary_onet_code: definition.primaryOnetCode,

      // Aggregated data
      wages: {
        source: 'BLS OES (aggregated)',
        year: primaryCareer.wages?.year || 2023,
        annual: {
          pct_10: payRange.min,
          pct_25: null, // Not aggregated
          median: medianPay,
          pct_75: null, // Not aggregated
          pct_90: payRange.max,
          mean: null,
        },
        hourly: primaryCareer.wages?.hourly || null,
        employment_count: totalEmployment,
      },
      pay_range: payRange,

      // Education - use primary career's education
      education: education,

      // Training time
      training_time: trainingTime.category,
      training_years: trainingTime.years,

      // AI Resilience
      ai_resilience: aiResilience.classification,
      ai_resilience_tier: aiResilience.tier,
      ai_assessment: primaryCareer.ai_assessment,
      ai_risk: primaryCareer.ai_risk,

      // Content - union from all specs
      tasks: unionArrays(specs, 'tasks', 15),
      technology_skills: unionArrays(specs, 'technology_skills', 20),
      abilities: unionArrays(specs, 'abilities', 10),
      alternate_titles: [
        ...new Set([
          definition.title,
          ...unionArrays(specs, 'alternate_titles', 30),
          ...(definition.keywords || []),
        ])
      ].slice(0, 30),

      // Outlook
      outlook: primaryCareer.outlook,
      national_importance: primaryCareer.national_importance,

      // Media
      video: primaryCareer.video,
      inside_look: useAIContent ? aiContent.inside_look : primaryCareer.inside_look,
      career_progression: primaryCareer.career_progression,

      // Data provenance
      data_sources: [
        {
          source: 'O*NET 30.1 (consolidated)',
          url: 'https://www.onetcenter.org/',
          retrieved_at: new Date().toISOString().split('T')[0],
        },
        {
          source: 'BLS OES',
          url: 'https://www.bls.gov/oes/',
          retrieved_at: new Date().toISOString().split('T')[0],
        },
      ],
      last_updated: new Date().toISOString().split('T')[0],
      data_completeness: {
        has_wages: medianPay > 0,
        has_education: !!education,
        has_outlook: !!primaryCareer.outlook,
        has_tasks: specs.some(s => s.tasks?.length > 0),
        completeness_score: 0.9,
      },
    };

    consolidatedCareers.push(consolidatedCareer);

    // Add specializations with parent reference
    specs.forEach(spec => {
      specializations.push({
        ...spec,
        parent_career_slug: careerId,
        is_consolidated: false,
      });
    });

    // Build mapping
    careerToSpecMap[careerId] = definition.onetCodes;
  }

  // Pass through careers that weren't consolidated
  // Track slugs to prevent duplicates
  const processedSlugs = new Set<string>(consolidatedCareers.map(c => c.slug));
  let passThrough = 0;
  let skippedDuplicates = 0;

  allCareers.forEach(career => {
    const onetCode = career.onet_code;

    // Skip if already processed by O*NET code
    if (onetCode && processedOnetCodes.has(onetCode)) {
      return;
    }

    // Skip if slug already exists (prevents duplicate manual careers)
    if (processedSlugs.has(career.slug)) {
      skippedDuplicates++;
      return;
    }

    // Check if this career's category is being consolidated
    const isInConsolidatedCategory = categoriesConsolidated.has(career.category);

    if (!isInConsolidatedCategory) {
      // Pass through as-is for non-consolidated categories
      consolidatedCareers.push({
        ...career,
        is_consolidated: false,
        specialization_count: 1,
        display_strategy: 'career-only',
        grouping_strategy: 'singleton',
      });
      processedSlugs.add(career.slug);
      passThrough++;
    } else if (onetCode) {
      // This is an O*NET career in a consolidated category but not in definitions
      // Treat as singleton
      consolidatedCareers.push({
        ...career,
        is_consolidated: false,
        specialization_count: 1,
        display_strategy: 'career-only',
        grouping_strategy: 'singleton',
      });
      processedSlugs.add(career.slug);
      passThrough++;
    } else if (career.data_source === 'manual') {
      // Manual career - pass through
      consolidatedCareers.push({
        ...career,
        is_consolidated: false,
        specialization_count: 1,
        display_strategy: 'career-only',
        grouping_strategy: 'singleton',
      });
      processedSlugs.add(career.slug);
      passThrough++;
    }
  });

  if (skippedDuplicates > 0) {
    console.log(`  ⚠ Skipped ${skippedDuplicates} duplicate slugs`);
  }

  return {
    consolidatedCareers,
    specializations,
    careerToSpecMap,
    stats: {
      totalConsolidated: Object.keys(definitions.careers).length,
      totalSpecializations: specializations.length,
      passThrough,
      categoriesConsolidated: Array.from(categoriesConsolidated),
    },
  };
}

/**
 * Main execution (for standalone use)
 */
async function main() {
  console.log('\n=== Career Consolidation Script ===\n');

  // Load definitions
  console.log('Loading career definitions...');
  const definitions = loadCareerDefinitions();
  console.log(`  Version: ${definitions.version}`);
  console.log(`  Categories: ${definitions.categories.join(', ')}`);
  console.log(`  Career definitions: ${Object.keys(definitions.careers).length}`);

  // Load existing careers - use raw generated data (has onet_code for all careers)
  const careersPath = path.join(process.cwd(), 'data/careers.generated.json');
  if (!fs.existsSync(careersPath)) {
    console.error(`\nError: Careers file not found: ${careersPath}`);
    console.error('Run npm run data:generate first.');
    process.exit(1);
  }

  console.log('\nLoading existing careers...');
  const onetCareers = JSON.parse(fs.readFileSync(careersPath, 'utf-8'));
  console.log(`  O*NET careers: ${onetCareers.length}`);

  // Load manual careers
  const manualCareers = loadManualCareers();
  console.log(`  Manual careers: ${manualCareers.length}`);

  // Merge - manual careers add to the pool
  const allCareers = [...onetCareers, ...manualCareers];
  console.log(`  Total careers: ${allCareers.length}`);

  // Load AI-generated career content
  console.log('\nLoading AI-generated content...');
  const careerContent = loadCareerContent();
  if (careerContent) {
    console.log(`  Content available for: ${Object.keys(careerContent.careers).length} careers`);
  }

  // Run consolidation
  console.log('\nConsolidating careers...');
  const result = consolidateCareers(allCareers, definitions, careerContent);

  console.log('\nConsolidation Results:');
  console.log(`  Consolidated careers created: ${result.stats.totalConsolidated}`);
  console.log(`  Specializations linked: ${result.stats.totalSpecializations}`);
  console.log(`  Pass-through careers: ${result.stats.passThrough}`);
  console.log(`  Categories consolidated: ${result.stats.categoriesConsolidated.join(', ')}`);
  console.log(`  Total output careers: ${result.consolidatedCareers.length}`);

  // Sort by title (with null checks)
  result.consolidatedCareers.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  result.specializations.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  // Save outputs
  const outputDir = path.join(process.cwd(), 'data/output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save consolidated careers
  const careersOutputPath = path.join(outputDir, 'careers.json');
  fs.writeFileSync(careersOutputPath, JSON.stringify(result.consolidatedCareers, null, 2));
  console.log(`📁 Saved ${result.consolidatedCareers.length} careers to: ${careersOutputPath}`);

  // Save specializations
  const specsOutputPath = path.join(outputDir, 'specializations.json');
  fs.writeFileSync(specsOutputPath, JSON.stringify(result.specializations, null, 2));
  console.log(`📁 Saved ${result.specializations.length} specializations to: ${specsOutputPath}`);

  // Save career-to-spec mapping
  const mapOutputPath = path.join(outputDir, 'career-to-spec-map.json');
  fs.writeFileSync(mapOutputPath, JSON.stringify(result.careerToSpecMap, null, 2));
  console.log(`📁 Saved career-to-spec mapping to: ${mapOutputPath}`);

  // Update careers-index.json with all required fields
  const indexData = result.consolidatedCareers.map(c => {
    // Handle ai_risk which can be object or number
    const aiRiskScore = typeof c.ai_risk === 'object' ? c.ai_risk?.score : c.ai_risk;
    const aiRiskLabel = typeof c.ai_risk === 'object' ? c.ai_risk?.label : c.ai_risk_label;

    // Ensure training_time is a valid enum value
    const validTrainingTimes = ['<6mo', '6-24mo', '2-4yr', '4+yr'];
    const trainingTime = validTrainingTimes.includes(c.training_time) ? c.training_time : '2-4yr';

    return {
      title: c.title,
      slug: c.slug,
      category: c.category,
      subcategory: c.subcategory || undefined,
      median_pay: c.wages?.annual?.median || 0,
      training_time: trainingTime,
      training_years: c.training_years || null,
      typical_education: c.education?.typical_entry_education || undefined,
      ai_risk: aiRiskScore || 50,
      ai_risk_label: aiRiskLabel || 'medium',
      ai_resilience: c.ai_resilience || undefined,
      ai_resilience_tier: c.ai_resilience_tier || undefined,
      data_source: c.data_source || 'onet',
      description: c.description || undefined,
      // Consolidation fields
      is_consolidated: c.is_consolidated || false,
      specialization_count: c.specialization_count || 1,
    };
  });
  const indexOutputPath = path.join(outputDir, 'careers-index.json');
  fs.writeFileSync(indexOutputPath, JSON.stringify(indexData, null, 2));
  console.log(`📁 Saved careers index to: ${indexOutputPath}`);

  console.log('\n=== Consolidation Complete ===\n');

  return result;
}

// Export for use in aggregate.ts
export { loadCareerDefinitions, type CareerDefinition, type CareerDefinitionsFile };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
