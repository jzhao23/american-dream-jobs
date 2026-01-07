/**
 * EPOCH Scores Normalizer
 *
 * Normalizes EPOCH (Human Advantage) scores.
 * Input: data/sources/epoch-scores.json
 * Output: data/sources/epoch/normalized.json
 *
 * Run: npx tsx scripts/normalize/epoch.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Input/Output paths
const INPUT_FILE = path.join(process.cwd(), 'data/sources/epoch-scores.json');
const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/epoch');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'normalized.json');

// Types
interface EPOCHScores {
  empathy: number;     // 1-5
  presence: number;    // 1-5
  opinion: number;     // 1-5
  creativity: number;  // 1-5
  hope: number;        // 1-5
}

interface EPOCHNormalized {
  code: string;
  title: string;
  epochScores: EPOCHScores;
  sum: number;                 // 5-25
  category: string;            // "Strong", "Moderate", "Weak"
  rationale: string;
  source: 'manual' | 'generated';
}

async function main() {
  console.log('\n=== EPOCH Scores Normalizer ===\n');

  // Check input exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Input file not found: ${INPUT_FILE}`);
    console.error('EPOCH scores need manual curation');
    process.exit(1);
  }

  // Load data
  console.log('Loading EPOCH scores data...');
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const scores = rawData.scores || {};
  console.log(`Found ${Object.keys(scores).length} entries`);

  // Count categories
  let manualCount = 0;
  let generatedCount = 0;
  const categoryCounts: Record<string, number> = { Strong: 0, Moderate: 0, Weak: 0 };

  // Normalize
  const normalized: Record<string, EPOCHNormalized> = {};

  for (const [onetCode, entry] of Object.entries(scores)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = entry as any;
    const epochScores: EPOCHScores = {
      empathy: e.epochScores?.empathy || 3,
      presence: e.epochScores?.presence || 3,
      opinion: e.epochScores?.opinion || 3,
      creativity: e.epochScores?.creativity || 3,
      hope: e.epochScores?.hope || 3,
    };

    const sum = epochScores.empathy + epochScores.presence + epochScores.opinion +
                epochScores.creativity + epochScores.hope;

    let category = 'Moderate';
    if (sum >= 20) category = 'Strong';
    else if (sum < 12) category = 'Weak';

    normalized[onetCode] = {
      code: onetCode,
      title: e.title || '',
      epochScores,
      sum,
      category,
      rationale: e.rationale || '',
      source: e.source === 'manual' ? 'manual' : 'generated',
    };

    if (e.source === 'manual') manualCount++;
    else generatedCount++;
    categoryCounts[category]++;
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write output
  const output = {
    metadata: {
      framework: {
        E: 'Empathy - Emotional intelligence, patient/customer care',
        P: 'Presence - Physical presence, hands-on work',
        O: 'Opinion - Judgment, decision-making, expertise',
        C: 'Creativity - Innovation, problem-solving, artistic expression',
        H: 'Hope - Mentorship, motivation, counseling',
      },
      scoring: {
        range: '1-5 per dimension',
        categories: {
          Strong: 'sum >= 20',
          Moderate: 'sum >= 12 and sum < 20',
          Weak: 'sum < 12',
        },
      },
      normalizedAt: new Date().toISOString(),
      totalEntries: Object.keys(normalized).length,
      manualScores: manualCount,
      generatedScores: generatedCount,
      categoryCounts,
    },
    scores: normalized,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWritten: ${OUTPUT_FILE}`);
  console.log(`  Total entries: ${Object.keys(normalized).length}`);
  console.log(`  Manual: ${manualCount}, Generated: ${generatedCount}`);
  console.log(`  Categories: Strong=${categoryCounts.Strong}, Moderate=${categoryCounts.Moderate}, Weak=${categoryCounts.Weak}`);
  console.log('\n=== EPOCH Normalization Complete ===\n');
}

main().catch(console.error);
