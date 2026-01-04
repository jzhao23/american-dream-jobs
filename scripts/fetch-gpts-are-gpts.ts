/**
 * Fetch GPTs are GPTs LLM Exposure Data
 *
 * This script processes the GPTs are GPTs dataset from Eloundou et al. (2023)
 * to get LLM exposure scores by occupation.
 *
 * ## Data Source
 * - Primary: OpenAI GPTs-are-GPTs GitHub repository
 * - Paper: "GPTs are GPTs: An Early Look at the Labor Market Impact Potential of LLMs"
 * - Published: Science, Vol. 384, Issue 6702 (2024)
 * - arXiv: https://arxiv.org/abs/2303.10130
 * - URL: https://github.com/openai/GPTs-are-GPTs
 *
 * ## Why This Dataset
 * The GPTs are GPTs dataset specifically measures LLM/GPT exposure using:
 * - Human annotators + GPT-4 as a classifier
 * - Task-level exposure ratings aggregated to occupations
 * - Published in 2023, post-ChatGPT era (more current than AIOE 2021)
 *
 * ## Exposure Metrics
 * - Alpha (α): Tasks that can be sped up 50% using LLM alone
 * - Beta (β): Tasks that can be sped up 50% using LLM + external tools
 * - Gamma (γ): Tasks that may be affected by any LLM-based development
 *
 * We use gpt4_beta (β) as the primary exposure metric as it reflects
 * realistic LLM capabilities with tooling support.
 *
 * ## Exposure Categories (based on percentiles)
 * - Low: Bottom 33% of exposure scores
 * - Medium: Middle 34% of exposure scores
 * - High: Top 33% of exposure scores
 *
 * ## Usage
 * ```bash
 * npx tsx scripts/fetch-gpts-are-gpts.ts          # Use cached data if available
 * npx tsx scripts/fetch-gpts-are-gpts.ts --fresh  # Force re-download
 * ```
 *
 * ## Output
 * - data/sources/gpts-are-gpts.json (exposure data by O*NET code)
 * - data/sources/gpts-are-gpts-metadata.json (source, methodology, statistics)
 *
 * @see https://github.com/openai/GPTs-are-GPTs for data
 * @see https://www.science.org/doi/10.1126/science.adj0998 for paper
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_URL = 'https://raw.githubusercontent.com/openai/GPTs-are-GPTs/main/data/occ_level.csv';
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'sources');
const RAW_FILE = path.join(OUTPUT_DIR, 'gpts-are-gpts-raw.csv');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'gpts-are-gpts.json');
const METADATA_FILE = path.join(OUTPUT_DIR, 'gpts-are-gpts-metadata.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Task exposure category (aligned with AI Resilience classification)
 */
type TaskExposure = 'Low' | 'Medium' | 'High';

/**
 * LLM exposure data for a single occupation
 */
interface OccupationExposure {
  onet_code: string;
  title: string;
  llm_exposure_score: number;  // gpt4_beta score (0-1)
  task_exposure: TaskExposure;
  percentile: number;
  source: 'GPTs are GPTs';
  // Additional metrics for reference
  gpt4_alpha: number;
  gpt4_beta: number;
  gpt4_gamma: number;
  human_alpha: number;
  human_beta: number;
  human_gamma: number;
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
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
 * Using 33/67 percentile thresholds for tercile split
 */
function getTaskExposure(percentile: number): TaskExposure {
  if (percentile < 33) return 'Low';
  if (percentile < 67) return 'Medium';
  return 'High';
}

/**
 * Download GPTs are GPTs dataset from OpenAI GitHub
 */
async function downloadData(): Promise<void> {
  if (fs.existsSync(RAW_FILE)) {
    const stats = fs.statSync(RAW_FILE);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    if (ageHours < 24 * 7) { // Cache for 1 week
      console.log('Using cached GPTs are GPTs data (less than 1 week old)');
      return;
    }
  }

  console.log('Downloading GPTs are GPTs dataset from OpenAI GitHub...');
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to download data: ${response.status}`);
  }

  const text = await response.text();
  fs.writeFileSync(RAW_FILE, text);
  console.log('Downloaded GPTs are GPTs dataset');
}

/**
 * Parse CSV file and extract occupation exposure data
 */
function parseData(): OccupationExposure[] {
  console.log('Parsing GPTs are GPTs CSV file...');

  const text = fs.readFileSync(RAW_FILE, 'utf-8');
  const lines = text.split('\n').filter(l => l.trim());

  // Skip header
  const dataLines = lines.slice(1);
  console.log(`Found ${dataLines.length} occupations in GPTs are GPTs data`);

  // Parse all rows
  const rawData: {
    onet_code: string;
    title: string;
    gpt4_alpha: number;
    gpt4_beta: number;
    gpt4_gamma: number;
    human_alpha: number;
    human_beta: number;
    human_gamma: number;
  }[] = [];

  for (const line of dataLines) {
    const cols = parseCSVLine(line);
    if (cols.length < 8) continue;

    const gpt4_beta = parseFloat(cols[3]);
    if (isNaN(gpt4_beta)) continue;

    rawData.push({
      onet_code: cols[0],
      title: cols[1],
      gpt4_alpha: parseFloat(cols[2]) || 0,
      gpt4_beta: gpt4_beta,
      gpt4_gamma: parseFloat(cols[4]) || 0,
      human_alpha: parseFloat(cols[5]) || 0,
      human_beta: parseFloat(cols[6]) || 0,
      human_gamma: parseFloat(cols[7]) || 0,
    });
  }

  // Sort scores for percentile calculation (using gpt4_beta)
  const sortedScores = rawData
    .map(row => row.gpt4_beta)
    .sort((a, b) => a - b);

  // Convert to our format
  const exposures: OccupationExposure[] = rawData.map(row => {
    const percentile = calculatePercentile(row.gpt4_beta, sortedScores);

    return {
      onet_code: row.onet_code,
      title: row.title,
      llm_exposure_score: row.gpt4_beta,
      task_exposure: getTaskExposure(percentile),
      percentile,
      source: 'GPTs are GPTs' as const,
      gpt4_alpha: row.gpt4_alpha,
      gpt4_beta: row.gpt4_beta,
      gpt4_gamma: row.gpt4_gamma,
      human_alpha: row.human_alpha,
      human_beta: row.human_beta,
      human_gamma: row.human_gamma,
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
  console.log('\n=== Fetching GPTs are GPTs LLM Exposure Data ===\n');

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
  await downloadData();
  const exposures = parseData();

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
  const scores = exposures.map(e => e.llm_exposure_score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Calculate tercile thresholds
  const sortedScores = [...scores].sort((a, b) => a - b);
  const p33 = sortedScores[Math.floor(sortedScores.length * 0.33)];
  const p67 = sortedScores[Math.floor(sortedScores.length * 0.67)];

  // Save metadata
  const metadata = {
    source: 'GPTs are GPTs (Eloundou et al. 2023)',
    paper_title: 'GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models',
    paper_doi: '10.1126/science.adj0998',
    arxiv: '2303.10130',
    data_url: 'https://github.com/openai/GPTs-are-GPTs',
    authors: [
      'Tyna Eloundou',
      'Sam Manning',
      'Pamela Mishkin',
      'Daniel Rock'
    ],
    publication: 'Science, Vol. 384, Issue 6702 (2024)',
    generated_at: new Date().toISOString(),
    statistics: {
      total_occupations: exposures.length,
      by_exposure_level: byCategory,
      score_range: {
        min: minScore.toFixed(3),
        max: maxScore.toFixed(3),
        mean: avgScore.toFixed(3)
      },
      tercile_thresholds: {
        low_medium_boundary: p33.toFixed(3),
        medium_high_boundary: p67.toFixed(3)
      }
    },
    category_thresholds: {
      'Low': `Bottom 33% of exposure scores (beta < ${p33.toFixed(2)})`,
      'Medium': `Middle 34% of exposure scores (beta ${p33.toFixed(2)}-${p67.toFixed(2)})`,
      'High': `Top 33% of exposure scores (beta > ${p67.toFixed(2)})`
    },
    exposure_metrics: {
      gpt4_alpha: 'Tasks that can be sped up 50% using LLM alone',
      gpt4_beta: 'Tasks that can be sped up 50% using LLM + external tools (PRIMARY METRIC)',
      gpt4_gamma: 'Tasks that may be affected by any LLM-based development',
      human_variants: 'Human annotator versions of the same metrics'
    },
    methodology: `
The GPTs are GPTs dataset measures occupation exposure to Large Language Models (LLMs)
like GPT-4. It was created by:

1. Defining exposure rubrics for individual work tasks
2. Using both human annotators and GPT-4 itself to classify tasks
3. Aggregating task-level scores to occupation-level statistics

We use the gpt4_beta metric as the primary exposure score because it measures
practical LLM impact: tasks that can be completed 50% faster using LLMs with
access to external tools (code execution, web browsing, etc.).

Higher scores indicate greater LLM exposure (more text/analytical work).
Lower scores indicate less LLM exposure (more physical/manual work).

For the AI Resilience classification, we convert continuous scores to
three categories using tercile splits (33rd and 67th percentiles).

This dataset is used as the PRIMARY exposure source, with AIOE (2021)
as a fallback for occupations not covered.
    `.trim()
  };

  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  console.log(`Saved metadata to ${METADATA_FILE}`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total occupations: ${exposures.length}`);
  console.log(`Tercile thresholds: Low < ${p33.toFixed(2)}, Medium ${p33.toFixed(2)}-${p67.toFixed(2)}, High > ${p67.toFixed(2)}`);
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
    console.log(`    Beta: ${exp.llm_exposure_score.toFixed(3)} | Percentile: ${exp.percentile}`);
  }

  console.log('\n--- Sample High Exposure ---');
  const highExposure = exposures.filter(e => e.task_exposure === 'High').slice(-3);
  for (const exp of highExposure) {
    console.log(`  ${exp.title} (${exp.onet_code})`);
    console.log(`    Beta: ${exp.llm_exposure_score.toFixed(3)} | Percentile: ${exp.percentile}`);
  }

  console.log('\n=== GPTs are GPTs Fetch Complete ===\n');
}

main().catch(console.error);
