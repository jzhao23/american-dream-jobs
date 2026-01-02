/**
 * Career Progression Mapping
 *
 * Maps levels.fyi job titles to O*NET codes and creates career progression data.
 * Uses BLS percentiles as fallback for occupations without external data.
 *
 * Run: npx tsx scripts/create-progression-mappings.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

// Levels.fyi job titles mapped to O*NET codes
// This is our manually curated mapping based on levels.fyi available titles
const LEVELS_FYI_MAPPINGS: { levelsFyiTitle: string; onetCodes: string[]; confidence: 'exact' | 'close' | 'approximate' }[] = [
  // Software Engineering
  { levelsFyiTitle: 'Software Engineer', onetCodes: ['15-1252.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Frontend Engineer', onetCodes: ['15-1254.00'], confidence: 'close' },
  { levelsFyiTitle: 'Backend Engineer', onetCodes: ['15-1252.00'], confidence: 'close' },
  { levelsFyiTitle: 'Full Stack Engineer', onetCodes: ['15-1252.00'], confidence: 'close' },
  { levelsFyiTitle: 'Mobile Engineer', onetCodes: ['15-1252.00'], confidence: 'close' },
  { levelsFyiTitle: 'DevOps Engineer', onetCodes: ['15-1244.00'], confidence: 'close' },
  { levelsFyiTitle: 'Site Reliability Engineer', onetCodes: ['15-1244.00'], confidence: 'close' },
  { levelsFyiTitle: 'Machine Learning Engineer', onetCodes: ['15-2051.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Data Engineer', onetCodes: ['15-1243.00'], confidence: 'close' },
  { levelsFyiTitle: 'Security Engineer', onetCodes: ['15-1212.00'], confidence: 'exact' },
  { levelsFyiTitle: 'QA Engineer', onetCodes: ['15-1253.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Embedded Engineer', onetCodes: ['15-1252.00', '17-2061.00'], confidence: 'close' },

  // Data & Analytics
  { levelsFyiTitle: 'Data Scientist', onetCodes: ['15-2051.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Data Analyst', onetCodes: ['15-2041.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Business Intelligence Analyst', onetCodes: ['15-2041.00'], confidence: 'close' },

  // Product & Design
  { levelsFyiTitle: 'Product Manager', onetCodes: ['11-2021.00', '11-1021.00'], confidence: 'approximate' },
  { levelsFyiTitle: 'Product Designer', onetCodes: ['27-1021.00'], confidence: 'close' },
  { levelsFyiTitle: 'UX Designer', onetCodes: ['27-1021.00'], confidence: 'close' },
  { levelsFyiTitle: 'UX Researcher', onetCodes: ['19-3022.00'], confidence: 'approximate' },
  { levelsFyiTitle: 'Graphic Designer', onetCodes: ['27-1024.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Industrial Designer', onetCodes: ['27-1021.00'], confidence: 'exact' },

  // Management
  { levelsFyiTitle: 'Engineering Manager', onetCodes: ['11-3021.00', '11-9041.00'], confidence: 'close' },
  { levelsFyiTitle: 'Technical Program Manager', onetCodes: ['15-1299.09'], confidence: 'close' },
  { levelsFyiTitle: 'Program Manager', onetCodes: ['11-9199.00'], confidence: 'close' },
  { levelsFyiTitle: 'Project Manager', onetCodes: ['11-9199.00'], confidence: 'exact' },

  // IT & Infrastructure
  { levelsFyiTitle: 'System Administrator', onetCodes: ['15-1244.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Network Administrator', onetCodes: ['15-1244.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Database Administrator', onetCodes: ['15-1242.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Cybersecurity Analyst', onetCodes: ['15-1212.00'], confidence: 'exact' },
  { levelsFyiTitle: 'IT Support Specialist', onetCodes: ['15-1232.00'], confidence: 'exact' },

  // Finance
  { levelsFyiTitle: 'Investment Banker', onetCodes: ['13-2051.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Financial Analyst', onetCodes: ['13-2051.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Accountant', onetCodes: ['13-2011.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Actuary', onetCodes: ['15-2011.00'], confidence: 'exact' },

  // Sales & Business
  { levelsFyiTitle: 'Account Executive', onetCodes: ['41-3031.00'], confidence: 'close' },
  { levelsFyiTitle: 'Sales Engineer', onetCodes: ['41-9031.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Business Development', onetCodes: ['11-2022.00'], confidence: 'close' },
  { levelsFyiTitle: 'Customer Success Manager', onetCodes: ['11-2022.00'], confidence: 'approximate' },

  // HR
  { levelsFyiTitle: 'Recruiter', onetCodes: ['13-1071.00'], confidence: 'exact' },
  { levelsFyiTitle: 'HR Specialist', onetCodes: ['13-1071.00'], confidence: 'exact' },

  // Legal
  { levelsFyiTitle: 'Lawyer', onetCodes: ['23-1011.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Paralegal', onetCodes: ['23-2011.00'], confidence: 'exact' },

  // Healthcare (limited on levels.fyi)
  { levelsFyiTitle: 'Physician', onetCodes: ['29-1216.00', '29-1215.00'], confidence: 'close' },
  { levelsFyiTitle: 'Pharmacist', onetCodes: ['29-1051.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Nurse', onetCodes: ['29-1141.00'], confidence: 'close' },

  // Engineering (non-software)
  { levelsFyiTitle: 'Mechanical Engineer', onetCodes: ['17-2141.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Electrical Engineer', onetCodes: ['17-2071.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Civil Engineer', onetCodes: ['17-2051.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Chemical Engineer', onetCodes: ['17-2041.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Aerospace Engineer', onetCodes: ['17-2011.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Hardware Engineer', onetCodes: ['17-2061.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Biomedical Engineer', onetCodes: ['17-2031.00'], confidence: 'exact' },

  // Marketing
  { levelsFyiTitle: 'Marketing Manager', onetCodes: ['11-2021.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Marketing Analyst', onetCodes: ['13-1161.00'], confidence: 'exact' },

  // Operations
  { levelsFyiTitle: 'Operations Manager', onetCodes: ['11-1021.00'], confidence: 'exact' },
  { levelsFyiTitle: 'Supply Chain Manager', onetCodes: ['11-3071.00'], confidence: 'exact' },
];

// Career progression levels with typical experience and compensation multipliers
// Based on levels.fyi patterns (L3-L8 or equivalent)
interface LevelTemplate {
  level_name: string;
  level_number: number;
  years_experience: { min: number; typical: number; max: number };
  salary_multiplier: number; // Multiplier on median
}

const TECH_LEVELS: LevelTemplate[] = [
  { level_name: 'Junior (L3)', level_number: 1, years_experience: { min: 0, typical: 1, max: 2 }, salary_multiplier: 0.75 },
  { level_name: 'Mid (L4)', level_number: 2, years_experience: { min: 2, typical: 3, max: 5 }, salary_multiplier: 1.0 },
  { level_name: 'Senior (L5)', level_number: 3, years_experience: { min: 4, typical: 6, max: 8 }, salary_multiplier: 1.3 },
  { level_name: 'Staff (L6)', level_number: 4, years_experience: { min: 7, typical: 10, max: 12 }, salary_multiplier: 1.6 },
  { level_name: 'Principal (L7)', level_number: 5, years_experience: { min: 10, typical: 14, max: 18 }, salary_multiplier: 2.0 },
  { level_name: 'Distinguished (L8)', level_number: 6, years_experience: { min: 15, typical: 20, max: 25 }, salary_multiplier: 2.5 },
];

const STANDARD_LEVELS: LevelTemplate[] = [
  { level_name: 'Entry', level_number: 1, years_experience: { min: 0, typical: 1, max: 2 }, salary_multiplier: 0.7 },
  { level_name: 'Early Career', level_number: 2, years_experience: { min: 2, typical: 4, max: 6 }, salary_multiplier: 0.9 },
  { level_name: 'Mid-Career', level_number: 3, years_experience: { min: 5, typical: 8, max: 12 }, salary_multiplier: 1.0 },
  { level_name: 'Senior', level_number: 4, years_experience: { min: 10, typical: 15, max: 20 }, salary_multiplier: 1.25 },
  { level_name: 'Expert', level_number: 5, years_experience: { min: 15, typical: 20, max: 30 }, salary_multiplier: 1.5 },
];

// Categories that use tech-style levels
const TECH_CATEGORIES = ['Technology', 'Science'];

interface CareerProgression {
  source: 'levels_fyi' | 'bls_percentiles';
  source_title: string | null;
  match_confidence: 'exact' | 'close' | 'approximate' | 'fallback';
  levels: {
    level_name: string;
    level_number: number;
    years_experience: { min: number; typical: number; max: number };
    compensation: {
      total: { min: number; median: number; max: number };
      breakdown: { salary: number; equity: number | null; bonus: number | null } | null;
    };
  }[];
  timeline: { year: number; level_name: string; expected_compensation: number }[];
}

function generateProgressionFromLevelsFyi(
  occ: { wages: { annual: { median: number; pct_10: number; pct_90: number } } },
  mapping: typeof LEVELS_FYI_MAPPINGS[0],
  useTechLevels: boolean
): CareerProgression {
  const levels = useTechLevels ? TECH_LEVELS : STANDARD_LEVELS;
  const median = occ.wages?.annual?.median || 60000;
  const low = occ.wages?.annual?.pct_10 || median * 0.6;
  const high = occ.wages?.annual?.pct_90 || median * 1.8;

  const progressionLevels = levels.map(level => ({
    level_name: level.level_name,
    level_number: level.level_number,
    years_experience: level.years_experience,
    compensation: {
      total: {
        min: Math.round(low * level.salary_multiplier),
        median: Math.round(median * level.salary_multiplier),
        max: Math.round(high * level.salary_multiplier),
      },
      breakdown: useTechLevels ? {
        salary: Math.round(median * level.salary_multiplier * 0.7),
        equity: Math.round(median * level.salary_multiplier * 0.2),
        bonus: Math.round(median * level.salary_multiplier * 0.1),
      } : null,
    },
  }));

  // Generate timeline (compensation at each year)
  const timeline: { year: number; level_name: string; expected_compensation: number }[] = [];
  for (let year = 0; year <= 20; year++) {
    const level = progressionLevels.find(l =>
      year >= l.years_experience.min && year <= l.years_experience.max
    ) || progressionLevels[progressionLevels.length - 1];
    timeline.push({
      year,
      level_name: level.level_name,
      expected_compensation: level.compensation.total.median,
    });
  }

  return {
    source: 'levels_fyi',
    source_title: mapping.levelsFyiTitle,
    match_confidence: mapping.confidence,
    levels: progressionLevels,
    timeline,
  };
}

/**
 * Estimates missing wage percentiles when BLS caps high earner data.
 * BLS reports null for wages exceeding ~$208,000/year.
 * This function estimates 75th and 90th percentiles using available data.
 */
function estimateMissingPercentiles(wages: {
  pct_10: number | null;
  pct_25: number | null;
  median: number | null;
  pct_75: number | null;
  pct_90: number | null;
  mean?: number | null;
}): { pct_10: number; pct_25: number; median: number; pct_75: number; pct_90: number } {
  // Use fallback defaults if lower percentiles are missing
  const pct_10 = wages.pct_10 ?? 30000;
  const pct_25 = wages.pct_25 ?? pct_10 * 1.2;
  const median = wages.median ?? pct_25 * 1.25;

  let pct_75 = wages.pct_75;
  let pct_90 = wages.pct_90;

  // If pct_75 is null, estimate from available data
  if (pct_75 === null || pct_75 === 0) {
    if (wages.mean && wages.mean > median) {
      // Use mean as indicator - if mean > median, distribution is right-skewed
      // Estimate pct_75 between median and mean, closer to mean
      pct_75 = Math.round(median + (wages.mean - median) * 0.8);
    } else if (pct_25 > 0) {
      // Use ratio between 25th and median to project 75th
      const ratio = median / pct_25;
      pct_75 = Math.round(median * Math.min(ratio, 1.5)); // Cap at 1.5x to avoid extreme values
    } else {
      // Fallback: 25% above median
      pct_75 = Math.round(median * 1.25);
    }
  }

  // If pct_90 is null, estimate from pct_75
  if (pct_90 === null || pct_90 === 0) {
    if (wages.mean && wages.mean > pct_75) {
      // If mean still exceeds 75th, use it as floor for 90th
      pct_90 = Math.round(wages.mean * 1.15);
    } else {
      // Use ratio between median and 75th to project 90th
      const ratio = pct_75 / median;
      pct_90 = Math.round(pct_75 * Math.min(ratio, 1.4)); // Cap at 1.4x to avoid extreme values
    }
  }

  return { pct_10, pct_25, median, pct_75, pct_90 };
}

function generateProgressionFromBLS(
  occ: { wages: { annual: { pct_10: number | null; pct_25: number | null; median: number | null; pct_75: number | null; pct_90: number | null; mean?: number | null } } }
): CareerProgression {
  // Use estimated wages to handle null values from BLS capping
  const rawWages = occ.wages?.annual || { pct_10: 30000, pct_25: 40000, median: 50000, pct_75: 65000, pct_90: 85000 };
  const wages = estimateMissingPercentiles(rawWages);

  const levels = [
    { level_name: 'Entry (10th %ile)', level_number: 1, years_experience: { min: 0, typical: 1, max: 2 }, value: wages.pct_10 },
    { level_name: 'Early Career (25th %ile)', level_number: 2, years_experience: { min: 2, typical: 4, max: 6 }, value: wages.pct_25 },
    { level_name: 'Mid-Career (Median)', level_number: 3, years_experience: { min: 5, typical: 10, max: 15 }, value: wages.median },
    { level_name: 'Experienced (75th %ile)', level_number: 4, years_experience: { min: 10, typical: 15, max: 20 }, value: wages.pct_75 },
    { level_name: 'Expert (90th %ile)', level_number: 5, years_experience: { min: 15, typical: 20, max: 30 }, value: wages.pct_90 },
  ];

  const progressionLevels = levels.map(level => ({
    level_name: level.level_name,
    level_number: level.level_number,
    years_experience: level.years_experience,
    compensation: {
      total: {
        min: Math.round(level.value * 0.9),
        median: Math.round(level.value),
        max: Math.round(level.value * 1.1),
      },
      breakdown: null,
    },
  }));

  // Generate timeline
  const timeline: { year: number; level_name: string; expected_compensation: number }[] = [];
  for (let year = 0; year <= 20; year++) {
    const level = progressionLevels.find(l =>
      year >= l.years_experience.min && year <= l.years_experience.max
    ) || progressionLevels[progressionLevels.length - 1];
    timeline.push({
      year,
      level_name: level.level_name,
      expected_compensation: level.compensation.total.median,
    });
  }

  return {
    source: 'bls_percentiles',
    source_title: null,
    match_confidence: 'fallback',
    levels: progressionLevels,
    timeline,
  };
}

async function main() {
  console.log('\n=== Creating Career Progression Mappings ===\n');

  // Load occupations
  const occupationsFile = path.join(PROCESSED_DIR, 'occupations_complete.json');
  const occupationsData = JSON.parse(fs.readFileSync(occupationsFile, 'utf-8'));
  const occupations = occupationsData.occupations;
  console.log(`Processing ${occupations.length} occupations...`);

  // Create O*NET code to levels.fyi mapping lookup
  const onetToLevelsFyi = new Map<string, typeof LEVELS_FYI_MAPPINGS[0]>();
  LEVELS_FYI_MAPPINGS.forEach(mapping => {
    mapping.onetCodes.forEach(code => {
      if (!onetToLevelsFyi.has(code)) {
        onetToLevelsFyi.set(code, mapping);
      }
    });
  });

  // Process each occupation
  const mappings: {
    onet_code: string;
    onet_title: string;
    mappings: { source: string; source_title: string; source_url: string; match_confidence: string; match_reasoning: string }[];
    primary_source: string;
  }[] = [];

  let levelsFyiCount = 0;
  let blsFallbackCount = 0;

  occupations.forEach((occ: {
    onet_code: string;
    title: string;
    category: string;
    wages: { annual: { pct_10: number; pct_25: number; median: number; pct_75: number; pct_90: number } };
    career_progression: CareerProgression | null;
  }) => {
    const levelsFyiMapping = onetToLevelsFyi.get(occ.onet_code);
    const useTechLevels = TECH_CATEGORIES.includes(occ.category);

    if (levelsFyiMapping) {
      occ.career_progression = generateProgressionFromLevelsFyi(occ, levelsFyiMapping, useTechLevels);
      levelsFyiCount++;

      mappings.push({
        onet_code: occ.onet_code,
        onet_title: occ.title,
        mappings: [{
          source: 'levels_fyi',
          source_title: levelsFyiMapping.levelsFyiTitle,
          source_url: `https://www.levels.fyi/t/${levelsFyiMapping.levelsFyiTitle.toLowerCase().replace(/ /g, '-')}`,
          match_confidence: levelsFyiMapping.confidence,
          match_reasoning: `Mapped from levels.fyi "${levelsFyiMapping.levelsFyiTitle}" career path`,
        }],
        primary_source: 'levels_fyi',
      });
    } else {
      occ.career_progression = generateProgressionFromBLS(occ);
      blsFallbackCount++;

      mappings.push({
        onet_code: occ.onet_code,
        onet_title: occ.title,
        mappings: [{
          source: 'bls_percentiles',
          source_title: 'BLS OES Percentile Distribution',
          source_url: 'https://www.bls.gov/oes/',
          match_confidence: 'fallback',
          match_reasoning: 'No levels.fyi equivalent found; using BLS wage percentiles as career progression proxy',
        }],
        primary_source: 'bls_percentiles',
      });
    }
  });

  // Update occupations file
  occupationsData.metadata.fields_pending = occupationsData.metadata.fields_pending.filter(
    (f: string) => f !== 'career_progression'
  );
  occupationsData.metadata.last_updated = new Date().toISOString().split('T')[0];

  fs.writeFileSync(occupationsFile, JSON.stringify(occupationsData, null, 2));
  console.log('Updated occupations with career progression data');

  // Save mappings file
  const mappingsFile = path.join(PROCESSED_DIR, 'career_progression_mappings.json');
  const mappingsOutput = {
    metadata: {
      created_at: new Date().toISOString().split('T')[0],
      total_mapped: mappings.length,
      mapping_breakdown: {
        levels_fyi: levelsFyiCount,
        bls_fallback: blsFallbackCount,
      },
    },
    mappings,
  };
  fs.writeFileSync(mappingsFile, JSON.stringify(mappingsOutput, null, 2));
  console.log('Saved career progression mappings');

  // Print summary
  console.log('\nMapping Summary:');
  console.log(`  Levels.fyi mappings: ${levelsFyiCount} (${((levelsFyiCount / occupations.length) * 100).toFixed(1)}%)`);
  console.log(`  BLS fallback: ${blsFallbackCount} (${((blsFallbackCount / occupations.length) * 100).toFixed(1)}%)`);

  // Print sample progressions
  console.log('\nSample career progressions:');

  const techExample = occupations.find((o: { onet_code: string }) => o.onet_code === '15-1252.00');
  if (techExample) {
    console.log(`\n  ${techExample.title}:`);
    (techExample.career_progression?.levels || []).slice(0, 4).forEach((l: { level_name: string; years_experience: { typical: number }; compensation: { total: { median: number } } }) => {
      console.log(`    ${l.level_name}: ~$${l.compensation.total.median.toLocaleString()} (${l.years_experience.typical} yrs)`);
    });
  }

  const nonTechExample = occupations.find((o: { onet_code: string }) => o.onet_code === '47-2111.00');
  if (nonTechExample) {
    console.log(`\n  ${nonTechExample.title}:`);
    (nonTechExample.career_progression?.levels || []).slice(0, 4).forEach((l: { level_name: string; years_experience: { typical: number }; compensation: { total: { median: number } } }) => {
      console.log(`    ${l.level_name}: ~$${l.compensation.total.median.toLocaleString()} (${l.years_experience.typical} yrs)`);
    });
  }

  console.log('\n=== Career Progression Mapping Complete ===\n');
}

main().catch(console.error);
