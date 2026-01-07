/**
 * Videos Normalizer
 *
 * Normalizes CareerOneStop video data.
 * PRESERVES original data - this is scraped content.
 *
 * Input: data/videos/career-videos.json (PRESERVED)
 * Output: data/sources/videos/normalized.json
 *
 * Run: npx tsx scripts/normalize/videos.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Input/Output paths
const INPUT_FILE = path.join(process.cwd(), 'data/videos/career-videos.json');
const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/videos');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'normalized.json');

// Types
interface VideoNormalized {
  socCode: string;
  source: 'careeronestop';
  videoUrl: string;
  posterUrl: string;
  title: string;
  lastVerified: string;
}

/**
 * Convert SOC code format to O*NET code format
 * "11-1011" -> "11-1011.00"
 * "11-1011-03" -> "11-1011.03"
 */
function socToOnet(socCode: string): string {
  // Handle format like "11-1011-03" -> "11-1011.03"
  const parts = socCode.split('-');
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1]}.${parts[2]}`;
  }
  // Handle format like "11-1011" -> "11-1011.00"
  return `${socCode}.00`;
}

async function main() {
  console.log('\n=== Videos Normalizer ===\n');

  // Check input exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.warn(`Warning: Videos file not found: ${INPUT_FILE}`);
    console.warn('This is optional - skipping video normalization');

    // Create empty output
    const output = {
      metadata: {
        source: 'CareerOneStop',
        normalizedAt: new Date().toISOString(),
        totalVideos: 0,
        warning: 'No source file found',
      },
      videos: {},
    };

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\nWritten empty: ${OUTPUT_FILE}`);
    return;
  }

  // Load data
  console.log('Loading career videos data...');
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const videos = rawData.videos || {};
  console.log(`Found ${Object.keys(videos).length} videos`);

  // Normalize - map SOC codes to O*NET codes
  const normalized: Record<string, VideoNormalized> = {};

  for (const [socCode, video] of Object.entries(videos)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = video as any;
    const onetCode = socToOnet(socCode);

    normalized[onetCode] = {
      socCode,
      source: 'careeronestop',
      videoUrl: v.videoUrl,
      posterUrl: v.posterUrl,
      title: v.title,
      lastVerified: v.lastVerified,
    };
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write output
  const output = {
    metadata: {
      source: 'CareerOneStop CDN',
      url: 'https://cdn.careeronestop.org/OccVids/OccupationVideos/',
      normalizedAt: new Date().toISOString(),
      totalVideos: Object.keys(normalized).length,
      originalMetadata: rawData.metadata,
    },
    videos: normalized,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWritten: ${OUTPUT_FILE}`);
  console.log(`  Total videos: ${Object.keys(normalized).length}`);
  console.log('\n=== Videos Normalization Complete ===\n');
}

main().catch(console.error);
