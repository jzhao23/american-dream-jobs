/**
 * Fetch AI Exposure Data (AIOE Dataset)
 *
 * This script processes the AIOE (AI Occupational Exposure) dataset from
 * Felten, Raj, and Seamans (2021) to get AI exposure scores by occupation.
 *
 * ## Data Source
 * - Primary: AIOE Dataset from GitHub (AIOE-Data/AIOE)
 * - Paper: "Occupational, Industry, and Geographic Exposure to AI: A Novel Dataset"
 * - Published: Strategic Management Journal (2021)
 * - URL: https://github.com/AIOE-Data/AIOE
 *
 * ## Alternative to Pew Research
 * The Pew Research 2023 study used a similar approach (rating work activities for AI exposure)
 * but doesn't provide downloadable occupation-level data. AIOE provides standardized
 * exposure scores by 6-digit SOC code with published methodology.
 *
 * ## How It Works
 * 1. Downloads AIOE_DataAppendix.xlsx from GitHub
 * 2. Parses Appendix A (AIOE by SOC code)
 * 3. Converts continuous scores to Low/Medium/High categories
 * 4. Maps SOC codes to O*NET codes
 * 5. Saves to data/sources/ai-exposure.json
 *
 * ## Exposure Categories (based on percentiles)
 * - Low: Bottom 33% of AIOE scores (physically oriented jobs)
 * - Medium: Middle 34% of AIOE scores (mixed cognitive/physical)
 * - High: Top 33% of AIOE scores (cognitive/analytical jobs)
 *
 * ## Usage
 * ```bash
 * npx tsx scripts/fetch-ai-exposure.ts          # Use cached data if available
 * npx tsx scripts/fetch-ai-exposure.ts --fresh  # Force re-download
 * ```
 *
 * ## Output
 * - data/sources/ai-exposure.json (exposure data by O*NET code)
 * - data/sources/ai-exposure-metadata.json (source, methodology, statistics)
 *
 * @see https://github.com/AIOE-Data/AIOE for data
 * @see https://doi.org/10.1002/smj.3286 for paper
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const AIOE_URL = 'https://github.com/AIOE-Data/AIOE/raw/main/AIOE_DataAppendix.xlsx';
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'sources');
const RAW_FILE = path.join(OUTPUT_DIR, 'aioe-raw.xlsx');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'ai-exposure.json');
const METADATA_FILE = path.join(OUTPUT_DIR, 'ai-exposure-metadata.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Task exposure category (aligned with AI Resilience classification)
 */
type TaskExposure = 'Low' | 'Medium' | 'High';

/**
 * AI exposure data for a single occupation
 */
interface OccupationExposure {
  soc_code: string;
  onet_code: string;
  title: string;
  aioe_score: number;
  task_exposure: TaskExposure;
  percentile: number;
}

/**
 * Raw row from AIOE Excel file
 */
interface AIOERow {
  'SOC Code': string;
  'Occupation Title': string;
  'AIOE': number;
}

/**
 * Convert SOC code to O*NET format
 * SOC: "11-1011" -> O*NET: "11-1011.00"
 */
function socToOnetCode(socCode: string): string {
  if (!socCode) return '';
  // Already formatted
  if (socCode.includes('.')) return socCode;
  // Add .00 suffix
  return `${socCode}.00`;
}

/**
 * Calculate percentile rank for a value in sorted array
 */
function calculatePercentile(value: number, sortedScores: number[]): number {
  const belowCount = sortedScores.filter(s => s < value).length;
  return Math.round((belowCount / sortedScores.length) * 100);
}

/**
 * Determine exposure category based on percentile
 * Using 33/66 percentile thresholds for tercile split
 */
function getTaskExposure(percentile: number): TaskExposure {
  if (percentile < 33) return 'Low';
  if (percentile < 67) return 'Medium';
  return 'High';
}

/**
 * Download AIOE dataset from GitHub
 */
async function downloadAIOEData(): Promise<void> {
  if (fs.existsSync(RAW_FILE)) {
    const stats = fs.statSync(RAW_FILE);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    if (ageHours < 24 * 7) { // Cache for 1 week
      console.log('Using cached AIOE data (less than 1 week old)');
      return;
    }
  }

  console.log('Downloading AIOE dataset from GitHub...');
  const response = await fetch(AIOE_URL);
  if (!response.ok) {
    throw new Error(`Failed to download AIOE data: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(RAW_FILE, Buffer.from(buffer));
  console.log('Downloaded AIOE dataset');
}

/**
 * Parse AIOE Excel file and extract occupation exposure data
 */
function parseAIOEData(): OccupationExposure[] {
  console.log('Parsing AIOE Excel file...');

  const workbook = XLSX.readFile(RAW_FILE);
  const sheet = workbook.Sheets['Appendix A'];

  if (!sheet) {
    throw new Error('Could not find Appendix A in AIOE workbook');
  }

  const rawData = XLSX.utils.sheet_to_json(sheet) as AIOERow[];
  console.log(`Found ${rawData.length} occupations in AIOE data`);

  // Extract and sort scores for percentile calculation
  const validRows = rawData.filter(row =>
    row['SOC Code'] &&
    typeof row['AIOE'] === 'number' &&
    !isNaN(row['AIOE'])
  );

  const sortedScores = validRows
    .map(row => row['AIOE'])
    .sort((a, b) => a - b);

  // Convert to our format
  const exposures: OccupationExposure[] = validRows.map(row => {
    const percentile = calculatePercentile(row['AIOE'], sortedScores);

    return {
      soc_code: row['SOC Code'],
      onet_code: socToOnetCode(row['SOC Code']),
      title: row['Occupation Title'],
      aioe_score: row['AIOE'],
      task_exposure: getTaskExposure(percentile),
      percentile
    };
  });

  return exposures;
}

/**
 * Load existing exposure data if available
 */
function loadExistingData(): Map<string, OccupationExposure> | null {
  if (!fs.existsSync(OUTPUT_FILE)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    const map = new Map<string, OccupationExposure>();

    for (const [code, exposure] of Object.entries(data)) {
      map.set(code, exposure as OccupationExposure);
    }

    console.log(`Loaded ${map.size} existing exposure records from cache`);
    return map;
  } catch {
    return null;
  }
}

async function main() {
  console.log('\n=== Fetching AI Exposure Data (AIOE) ===\n');

  const freshMode = process.argv.includes('--fresh');
  if (freshMode) {
    console.log('Fresh mode: ignoring cache, will re-download\n');
  }

  // Check for cached data
  if (!freshMode) {
    const existing = loadExistingData();
    if (existing && existing.size > 0) {
      console.log('Using cached exposure data. Run with --fresh to update.\n');
      return;
    }
  }

  // Download and parse data
  await downloadAIOEData();
  const exposures = parseAIOEData();

  // Convert to object keyed by O*NET code
  const exposuresObj: Record<string, OccupationExposure> = {};
  const byCategory: Record<TaskExposure, number> = {
    'Low': 0,
    'Medium': 0,
    'High': 0
  };

  for (const exposure of exposures) {
    exposuresObj[exposure.onet_code] = exposure;
    byCategory[exposure.task_exposure]++;
  }

  // Save exposure data
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(exposuresObj, null, 2));
  console.log(`\nSaved exposure data to ${OUTPUT_FILE}`);

  // Calculate statistics
  const scores = exposures.map(e => e.aioe_score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Save metadata
  const metadata = {
    source: 'AIOE Dataset (Felten, Raj, Seamans 2021)',
    paper_title: 'Occupational, Industry, and Geographic Exposure to Artificial Intelligence: A Novel Dataset and Its Potential Uses',
    paper_doi: '10.1002/smj.3286',
    data_url: 'https://github.com/AIOE-Data/AIOE',
    generated_at: new Date().toISOString(),
    statistics: {
      total_occupations: exposures.length,
      by_exposure_level: byCategory,
      score_range: {
        min: minScore.toFixed(3),
        max: maxScore.toFixed(3),
        mean: avgScore.toFixed(3)
      }
    },
    category_thresholds: {
      'Low': 'Bottom 33% of AIOE scores (percentile < 33)',
      'Medium': 'Middle 34% of AIOE scores (percentile 33-66)',
      'High': 'Top 33% of AIOE scores (percentile >= 67)'
    },
    methodology: `
The AIOE (AI Occupational Exposure) index measures the degree to which occupations
are exposed to artificial intelligence. It is computed by:

1. Identifying 10 AI applications (from patents/literature)
2. Surveying relatedness between AI applications and 52 occupational abilities
3. Weighting by ability importance (from O*NET data)
4. Aggregating across applications to produce occupation-level scores

Higher AIOE scores indicate greater exposure to AI (more cognitive/analytical work).
Lower scores indicate less AI exposure (more physical/manual work).

For the AI Resilience classification, we convert continuous AIOE scores to
three categories using tercile splits (33rd and 66th percentiles).
    `.trim()
  };

  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  console.log(`Saved metadata to ${METADATA_FILE}`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total occupations: ${exposures.length}`);
  console.log('\nBy Exposure Level:');
  for (const [level, count] of Object.entries(byCategory)) {
    const pct = Math.round((count / exposures.length) * 100);
    console.log(`  ${level}: ${count} (${pct}%)`);
  }

  // Sample data
  console.log('\n--- Sample Low Exposure (AI-Resilient) ---');
  const lowExposure = exposures.filter(e => e.task_exposure === 'Low').slice(0, 3);
  for (const exp of lowExposure) {
    console.log(`  ${exp.title} (${exp.onet_code})`);
    console.log(`    AIOE: ${exp.aioe_score.toFixed(3)} | Percentile: ${exp.percentile}`);
  }

  console.log('\n--- Sample High Exposure ---');
  const highExposure = exposures.filter(e => e.task_exposure === 'High').slice(-3);
  for (const exp of highExposure) {
    console.log(`  ${exp.title} (${exp.onet_code})`);
    console.log(`    AIOE: ${exp.aioe_score.toFixed(3)} | Percentile: ${exp.percentile}`);
  }

  console.log('\n=== AI Exposure Fetch Complete ===\n');
}

main().catch(console.error);
