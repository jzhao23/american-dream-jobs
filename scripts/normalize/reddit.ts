/**
 * Reddit Reviews Normalizer
 *
 * Normalizes Reddit review data.
 * PRESERVES original data - this is scraped content from 40+ subreddits.
 *
 * Input:
 *   - data/reviews/reviews-index.json (summary)
 *   - data/reviews/reviews-by-career/*.json (detailed reviews)
 *   - data/reviews/sources/reddit-raw.json (NEVER DELETE)
 *
 * Output: data/sources/reddit/normalized.json
 *
 * Run: npx tsx scripts/normalize/reddit.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Input/Output paths
const REVIEWS_INDEX_FILE = path.join(process.cwd(), 'data/reviews/reviews-index.json');
const REVIEWS_BY_CAREER_DIR = path.join(process.cwd(), 'data/reviews/reviews-by-career');
const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/reddit');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'normalized.json');

// Types
interface FeaturedReview {
  id: string;
  subreddit: string;
  title: string;
  text: string;
  score: number;
  url: string;
}

interface ReviewSummary {
  slug: string;
  socCode: string;
  totalReviews: number;
  featuredReviews: FeaturedReview[];
  lastUpdated: string;
}

async function main() {
  console.log('\n=== Reddit Reviews Normalizer ===\n');

  // Check input exists
  if (!fs.existsSync(REVIEWS_INDEX_FILE)) {
    console.warn(`Warning: Reviews index not found: ${REVIEWS_INDEX_FILE}`);
    console.warn('This is optional - skipping Reddit normalization');

    // Create empty output
    const output = {
      metadata: {
        source: 'Reddit',
        normalizedAt: new Date().toISOString(),
        totalCareers: 0,
        warning: 'No source file found',
      },
      reviews: {},
    };

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\nWritten empty: ${OUTPUT_FILE}`);
    return;
  }

  // Load reviews index
  console.log('Loading reviews index data...');
  const rawIndex = JSON.parse(fs.readFileSync(REVIEWS_INDEX_FILE, 'utf-8'));
  console.log(`Found ${rawIndex.length} career entries`);

  // Count per-career files
  let perCareerFiles = 0;
  if (fs.existsSync(REVIEWS_BY_CAREER_DIR)) {
    perCareerFiles = fs.readdirSync(REVIEWS_BY_CAREER_DIR).filter(f => f.endsWith('.json')).length;
    console.log(`Found ${perCareerFiles} per-career review files`);
  }

  // Normalize - keyed by slug
  const normalized: Record<string, ReviewSummary> = {};
  let totalReviews = 0;
  const subreddits = new Set<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const entry of rawIndex as any[]) {
    const featuredReviews: FeaturedReview[] = (entry.featured_reviews || []).map((r: {
      id: string;
      subreddit: string;
      title: string;
      text: string;
      score: number;
      url: string;
    }) => {
      subreddits.add(r.subreddit);
      return {
        id: r.id,
        subreddit: r.subreddit,
        title: r.title,
        text: r.text,
        score: r.score,
        url: r.url,
      };
    });

    normalized[entry.slug] = {
      slug: entry.slug,
      socCode: entry.soc_code,
      totalReviews: entry.total_reviews || 0,
      featuredReviews,
      lastUpdated: entry.last_updated,
    };

    totalReviews += entry.total_reviews || 0;
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write output
  const output = {
    metadata: {
      source: 'Reddit',
      description: 'Career discussions scraped from 40+ career-related subreddits',
      normalizedAt: new Date().toISOString(),
      totalCareers: Object.keys(normalized).length,
      totalReviews,
      uniqueSubreddits: subreddits.size,
      subreddits: Array.from(subreddits).sort(),
      perCareerFilesPath: 'data/reviews/reviews-by-career/',
      perCareerFilesCount: perCareerFiles,
      rawDataPath: 'data/reviews/sources/reddit-raw.json',
      note: 'Per-career detailed reviews are loaded directly from reviews-by-career/*.json',
    },
    reviews: normalized,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWritten: ${OUTPUT_FILE}`);
  console.log(`  Total careers: ${Object.keys(normalized).length}`);
  console.log(`  Total reviews: ${totalReviews}`);
  console.log(`  Unique subreddits: ${subreddits.size}`);
  console.log('\n=== Reddit Normalization Complete ===\n');
}

main().catch(console.error);
