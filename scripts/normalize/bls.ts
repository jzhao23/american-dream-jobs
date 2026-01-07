/**
 * BLS Projections Normalizer
 *
 * Normalizes BLS employment projections data.
 * Input: data/sources/bls-projections.json
 * Output: data/sources/bls/normalized.json
 *
 * Run: npx tsx scripts/normalize/bls.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Input/Output paths
const INPUT_FILE = path.join(process.cwd(), 'data/sources/bls-projections.json');
const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/bls');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'normalized.json');

// Types
interface BLSNormalized {
  code: string;
  socCode: string;
  title: string;
  percentChange: number;          // Job growth percentage
  jobGrowthCategory: string;      // "Growing Quickly", "Growing", "Stable", "Declining"
  employmentCurrent: number;      // 2024 employment
  employmentProjected: number;    // 2034 employment
  annualJobOpenings: number;
  typicalEducation: string;
}

async function main() {
  console.log('\n=== BLS Projections Normalizer ===\n');

  // Check input exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Input file not found: ${INPUT_FILE}`);
    console.error('Run: npx tsx scripts/fetch-bls-projections.ts');
    process.exit(1);
  }

  // Load data
  console.log('Loading BLS projections data...');
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`Found ${Object.keys(rawData).length} entries`);

  // Normalize
  const normalized: Record<string, BLSNormalized> = {};

  for (const [onetCode, entry] of Object.entries(rawData)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = entry as any;
    normalized[onetCode] = {
      code: onetCode,
      socCode: e.soc_code || '',
      title: e.title || '',
      percentChange: e.percent_change || 0,
      jobGrowthCategory: e.job_growth_category || 'Stable',
      employmentCurrent: e.estimated_employment_2024 || e.employment_2024 || 0,
      employmentProjected: e.projected_employment_2034 || e.employment_2034 || 0,
      annualJobOpenings: e.annual_job_openings || 0,
      typicalEducation: e.typical_education || '',
    };
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write output
  const output = {
    metadata: {
      source: 'BLS Employment Projections 2024-2034',
      url: 'https://www.bls.gov/emp/',
      normalizedAt: new Date().toISOString(),
      totalEntries: Object.keys(normalized).length,
    },
    projections: normalized,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWritten: ${OUTPUT_FILE}`);
  console.log(`  Total entries: ${Object.keys(normalized).length}`);
  console.log('\n=== BLS Normalization Complete ===\n');
}

main().catch(console.error);
