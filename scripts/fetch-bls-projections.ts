/**
 * Fetch BLS Employment Projections via CareerOneStop API
 *
 * This script fetches employment projections data (2024-2034) from the CareerOneStop API
 * which aggregates data from the Bureau of Labor Statistics Employment Projections program.
 *
 * ## Data Source
 * - Primary: CareerOneStop API (https://api.careeronestop.org)
 * - Underlying source: BLS Employment Projections 2024-2034
 * - URL: https://www.bls.gov/emp/
 *
 * ## How It Works
 * 1. Fetches "Fastest Growing" occupations report (growth > 0%)
 * 2. Fetches "Declining Employment" occupations report (growth < 0%)
 * 3. Combines and deduplicates by SOC code
 * 4. Maps SOC codes to O*NET codes
 * 5. Saves to data/sources/bls-projections.json with metadata
 *
 * ## Job Growth Categories (for AI Resilience classification)
 * Based on percent change 2024-2034:
 * - Declining Quickly: < -10%
 * - Declining Slowly: -10% to 0%
 * - Stable: 0% to 5%
 * - Growing Slowly: 5% to 15%
 * - Growing Quickly: > 15%
 *
 * ## Usage
 * ```bash
 * npx tsx scripts/fetch-bls-projections.ts          # Use cached data if available
 * npx tsx scripts/fetch-bls-projections.ts --fresh  # Force refresh from API
 * ```
 *
 * ## Output
 * - data/sources/bls-projections.json (projection data by O*NET code)
 * - data/sources/bls-projections-metadata.json (source, dates, statistics)
 *
 * ## Environment Variables
 * - CAREERONESTOP_USER_ID: API user ID
 * - CAREERONESTOP_TOKEN: API bearer token
 *
 * @see https://www.bls.gov/emp/ for BLS methodology
 * @see https://www.careeronestop.org/Developers/WebAPI/web-api.aspx for API docs
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
function loadEnvFile(filepath: string): void {
  if (!fs.existsSync(filepath)) return;
  const content = fs.readFileSync(filepath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex);
      const value = trimmed.slice(eqIndex + 1);
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));

const COS_BASE_URL = 'https://api.careeronestop.org';
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'sources');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'bls-projections.json');
const METADATA_FILE = path.join(OUTPUT_DIR, 'bls-projections-metadata.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Job growth category based on percent change
 */
type JobGrowthCategory =
  | 'Declining Quickly'   // < -10%
  | 'Declining Slowly'    // -10% to 0%
  | 'Stable'              // 0% to 5%
  | 'Growing Slowly'      // 5% to 15%
  | 'Growing Quickly';    // > 15%

/**
 * Projection data for a single occupation
 */
interface OccupationProjection {
  soc_code: string;
  onet_code: string | null;
  title: string;
  percent_change: number;
  job_growth_category: JobGrowthCategory;
  estimated_employment_2024: number | null;
  projected_employment_2034: number | null;
  annual_job_openings: number | null;
  typical_education: string | null;
}

/**
 * Raw API response structure
 */
interface COSProjectionRecord {
  SocCode: string;
  OccupationTitle: string;
  PercentChange: string;
  EstimatedEmployment: string;
  ProjectedEmployment: string;
  ProjectedAnnualJobOpening: string;
  TypicalEducation: string;
  EstYear: string;
  ProjYear: string;
}

/**
 * Determine job growth category from percent change
 */
function getJobGrowthCategory(percentChange: number): JobGrowthCategory {
  if (percentChange < -10) return 'Declining Quickly';
  if (percentChange < 0) return 'Declining Slowly';
  if (percentChange <= 5) return 'Stable';
  if (percentChange <= 15) return 'Growing Slowly';
  return 'Growing Quickly';
}

/**
 * Parse numeric value from string, handling commas
 */
function parseNumber(value: string | undefined | null): number | null {
  if (!value || value === 'N/A') return null;
  const num = parseFloat(value.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Convert SOC code (6 digit) to O*NET code format (XX-XXXX.00)
 * SOC codes from API are 6 digits without hyphen (e.g., "291141")
 * O*NET codes are formatted as "XX-XXXX.00" (e.g., "29-1141.00")
 */
function socToOnetCode(socCode: string): string | null {
  if (!socCode || socCode.length !== 6) return null;

  // Format: first 2 digits, hyphen, next 4 digits, .00 suffix
  return `${socCode.slice(0, 2)}-${socCode.slice(2, 6)}.00`;
}

/**
 * Fetch occupations report from CareerOneStop API
 */
async function fetchOccupationsReport(
  userId: string,
  token: string,
  reportType: 'FG' | 'DE',
  limit: number = 1000
): Promise<COSProjectionRecord[]> {
  const url = `${COS_BASE_URL}/v1/occupationsreports/${userId}/${reportType}/US/0/0/0/0/${limit}`;

  console.log(`Fetching ${reportType === 'FG' ? 'Fastest Growing' : 'Declining'} occupations...`);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const occupations = data.OccupationsList?.Occupations || [];

  console.log(`  Found ${occupations.length} occupations`);

  return occupations;
}

/**
 * Load existing projections data if available
 */
function loadExistingData(): Map<string, OccupationProjection> | null {
  if (!fs.existsSync(OUTPUT_FILE)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    const map = new Map<string, OccupationProjection>();

    for (const [code, projection] of Object.entries(data)) {
      map.set(code, projection as OccupationProjection);
    }

    console.log(`Loaded ${map.size} existing projections from cache`);
    return map;
  } catch {
    return null;
  }
}

async function main() {
  console.log('\n=== Fetching BLS Employment Projections ===\n');

  const freshMode = process.argv.includes('--fresh');
  if (freshMode) {
    console.log('Fresh mode: ignoring cache, will re-fetch from API\n');
  }

  // Check for cached data
  if (!freshMode) {
    const existing = loadExistingData();
    if (existing && existing.size > 0) {
      console.log('Using cached projections data. Run with --fresh to update.\n');
      return;
    }
  }

  // Get API credentials
  const userId = process.env.CAREERONESTOP_USER_ID;
  const token = process.env.CAREERONESTOP_TOKEN;

  if (!userId || !token) {
    console.error('Error: Missing CAREERONESTOP_USER_ID or CAREERONESTOP_TOKEN');
    console.error('Please set these in .env.local');
    process.exit(1);
  }

  // Fetch from API
  const [growingOccs, decliningOccs] = await Promise.all([
    fetchOccupationsReport(userId, token, 'FG', 1000),
    fetchOccupationsReport(userId, token, 'DE', 1000)
  ]);

  console.log(`\nTotal records: ${growingOccs.length + decliningOccs.length}`);

  // Combine and deduplicate by SOC code
  const projections = new Map<string, OccupationProjection>();
  const allRecords = [...growingOccs, ...decliningOccs];

  for (const record of allRecords) {
    const socCode = record.SocCode;
    if (!socCode) continue;

    // Skip if already processed (prefer first occurrence)
    if (projections.has(socCode)) continue;

    const percentChange = parseNumber(record.PercentChange) || 0;
    const onetCode = socToOnetCode(socCode);

    projections.set(socCode, {
      soc_code: socCode,
      onet_code: onetCode,
      title: record.OccupationTitle,
      percent_change: percentChange,
      job_growth_category: getJobGrowthCategory(percentChange),
      estimated_employment_2024: parseNumber(record.EstimatedEmployment),
      projected_employment_2034: parseNumber(record.ProjectedEmployment),
      annual_job_openings: parseNumber(record.ProjectedAnnualJobOpening),
      typical_education: record.TypicalEducation || null
    });
  }

  console.log(`Unique occupations after deduplication: ${projections.size}`);

  // Convert to object keyed by O*NET code (for easy lookup)
  const projectionsObj: Record<string, OccupationProjection> = {};
  const byCategory: Record<JobGrowthCategory, number> = {
    'Declining Quickly': 0,
    'Declining Slowly': 0,
    'Stable': 0,
    'Growing Slowly': 0,
    'Growing Quickly': 0
  };

  for (const projection of projections.values()) {
    const key = projection.onet_code || projection.soc_code;
    projectionsObj[key] = projection;
    byCategory[projection.job_growth_category]++;
  }

  // Save projections data
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(projectionsObj, null, 2));
  console.log(`\nSaved projections to ${OUTPUT_FILE}`);

  // Save metadata
  const metadata = {
    source: 'CareerOneStop API (BLS Employment Projections)',
    source_url: 'https://www.bls.gov/emp/',
    api_url: 'https://api.careeronestop.org',
    projection_period: '2024-2034',
    generated_at: new Date().toISOString(),
    statistics: {
      total_occupations: projections.size,
      by_category: byCategory
    },
    job_growth_thresholds: {
      'Declining Quickly': '< -10%',
      'Declining Slowly': '-10% to 0%',
      'Stable': '0% to 5%',
      'Growing Slowly': '5% to 15%',
      'Growing Quickly': '> 15%'
    },
    methodology: `
Employment projections are from the Bureau of Labor Statistics Employment Projections program,
accessed via the CareerOneStop API. Projections cover the 2024-2034 period and include:
- Percent change in employment
- Estimated employment (2024 baseline)
- Projected employment (2034 target)
- Annual job openings

Job growth categories are derived from percent change thresholds designed for the
AI Resilience classification system.
    `.trim()
  };

  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  console.log(`Saved metadata to ${METADATA_FILE}`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total occupations: ${projections.size}`);
  console.log('\nBy Job Growth Category:');
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${count}`);
  }

  // Sample data
  console.log('\n--- Sample Projections ---');
  const samples = Array.from(projections.values()).slice(0, 3);
  for (const sample of samples) {
    console.log(`  ${sample.title} (${sample.onet_code})`);
    console.log(`    Growth: ${sample.percent_change}% (${sample.job_growth_category})`);
  }

  console.log('\n=== BLS Projections Fetch Complete ===\n');
}

main().catch(console.error);
