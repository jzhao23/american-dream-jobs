/**
 * AI Exposure Normalizer
 *
 * Normalizes AI exposure data from GPTs are GPTs (primary) and AIOE (fallback).
 * Input: data/sources/gpts-are-gpts.json, data/sources/ai-exposure.json
 * Output: data/sources/aioe/normalized.json
 *
 * Run: npx tsx scripts/normalize/aioe.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Input/Output paths
const GPTS_FILE = path.join(process.cwd(), 'data/sources/gpts-are-gpts.json');
const AIOE_FILE = path.join(process.cwd(), 'data/sources/ai-exposure.json');
const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/aioe');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'normalized.json');

// Types
interface AIExposureNormalized {
  code: string;
  title: string;
  exposureScore: number;        // 0-1, primary β score
  taskExposure: string;         // Low/Medium/High label
  percentile: number;           // 0-100
  source: 'gpts' | 'aioe';
  // Additional GPTs scores if available
  gpt4Alpha?: number;           // α score (software only)
  gpt4Beta?: number;            // β score (software + human)
  gpt4Gamma?: number;           // γ score (full exposure)
  humanAlpha?: number;
  humanBeta?: number;
  humanGamma?: number;
}

async function main() {
  console.log('\n=== AI Exposure Normalizer ===\n');

  const normalized: Record<string, AIExposureNormalized> = {};
  let gptsCount = 0;
  let aioeCount = 0;

  // Load GPTs are GPTs data (PRIMARY source)
  if (fs.existsSync(GPTS_FILE)) {
    console.log('Loading GPTs are GPTs exposure data (PRIMARY)...');
    const gptsData = JSON.parse(fs.readFileSync(GPTS_FILE, 'utf-8'));

    for (const [onetCode, entry] of Object.entries(gptsData)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = entry as any;
      normalized[onetCode] = {
        code: onetCode,
        title: e.title,
        exposureScore: e.gpt4_beta || e.llm_exposure_score || 0,
        taskExposure: e.task_exposure || 'Medium',
        percentile: e.percentile || 50,
        source: 'gpts',
        gpt4Alpha: e.gpt4_alpha,
        gpt4Beta: e.gpt4_beta,
        gpt4Gamma: e.gpt4_gamma,
        humanAlpha: e.human_alpha,
        humanBeta: e.human_beta,
        humanGamma: e.human_gamma,
      };
      gptsCount++;
    }
    console.log(`  Loaded ${gptsCount} GPTs entries`);
  } else {
    console.log('  No GPTs data found');
  }

  // Load AIOE data (FALLBACK source - only for codes not in GPTs)
  if (fs.existsSync(AIOE_FILE)) {
    console.log('Loading AIOE exposure data (FALLBACK)...');
    const aioeData = JSON.parse(fs.readFileSync(AIOE_FILE, 'utf-8'));

    for (const [onetCode, entry] of Object.entries(aioeData)) {
      // Only use AIOE as fallback if not already in GPTs
      if (!normalized[onetCode]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = entry as any;
        // AIOE scores are typically 0-2+, normalize to 0-1
        const normalizedScore = Math.min(e.aioe_score / 2.5, 1);

        normalized[onetCode] = {
          code: onetCode,
          title: e.title,
          exposureScore: normalizedScore,
          taskExposure: e.task_exposure || 'Medium',
          percentile: e.percentile || 50,
          source: 'aioe',
        };
        aioeCount++;
      }
    }
    console.log(`  Loaded ${aioeCount} AIOE fallback entries`);
  } else {
    console.log('  No AIOE data found');
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write output
  const output = {
    metadata: {
      sources: [
        { name: 'GPTs are GPTs (Eloundou et al. 2023)', url: 'https://arxiv.org/abs/2303.10130', count: gptsCount },
        { name: 'AIOE Dataset (Felten et al. 2021)', url: 'https://github.com/AIOE-Data/AIOE', count: aioeCount },
      ],
      normalizedAt: new Date().toISOString(),
      totalEntries: Object.keys(normalized).length,
      gptsCount,
      aioeCount,
    },
    exposures: normalized,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWritten: ${OUTPUT_FILE}`);
  console.log(`  Total entries: ${Object.keys(normalized).length}`);
  console.log(`  GPTs (primary): ${gptsCount}`);
  console.log(`  AIOE (fallback): ${aioeCount}`);
  console.log('\n=== AI Exposure Normalization Complete ===\n');
}

main().catch(console.error);
