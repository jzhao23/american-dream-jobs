/**
 * Generate Reviews Index from Raw Reddit Data
 *
 * Maps raw Reddit posts directly to careers using subreddit mappings.
 * No AI enrichment - uses the raw testimonials as ground truth.
 *
 * Run: npx tsx scripts/generate-raw-reviews-index.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { SUBREDDIT_MAPPINGS } from './config/subreddit-mappings';

interface RawRedditPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  score: number;
  created_utc: number;
  permalink: string;
  num_comments: number;
}

interface RawReview {
  id: string;
  subreddit: string;
  soc_codes: string[];
  title: string;
  text: string;
  score: number;
  url: string;
  created_at: string;
  num_comments: number;
}

interface CareerReviewsSummary {
  slug: string;
  soc_code: string;
  total_reviews: number;
  featured_reviews: {
    id: string;
    subreddit: string;
    title: string;
    text: string;
    score: number;
    url: string;
  }[];
  last_updated: string;
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get best quote/excerpt from text (first 300 chars of meaningful content)
function getExcerpt(text: string): string {
  // Skip short texts
  if (text.length < 50) return text;

  // Find first sentence or meaningful chunk
  const cleaned = text.replace(/\n+/g, ' ').trim();
  if (cleaned.length <= 300) return cleaned;

  // Try to cut at sentence boundary
  const endIndex = cleaned.substring(0, 300).lastIndexOf('. ');
  if (endIndex > 100) {
    return cleaned.substring(0, endIndex + 1);
  }

  // Fall back to word boundary
  const spaceIndex = cleaned.substring(0, 300).lastIndexOf(' ');
  if (spaceIndex > 200) {
    return cleaned.substring(0, spaceIndex) + '...';
  }

  return cleaned.substring(0, 300) + '...';
}

async function main() {
  console.log('\n=== Generating Reviews Index from Raw Reddit Data ===\n');

  const rawPath = path.join(process.cwd(), 'data/reviews/sources/reddit-raw.json');

  if (!fs.existsSync(rawPath)) {
    console.error(`Error: Raw data file not found at ${rawPath}`);
    console.log('Run "npx tsx scripts/fetch-reddit-reviews.ts" first.\n');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  const posts: RawRedditPost[] = rawData.posts;

  console.log(`Processing ${posts.length} raw Reddit posts...\n`);

  // Convert to our review format and group by SOC code
  const bySocCode: Record<string, RawReview[]> = {};

  for (const post of posts) {
    const subredditLower = post.subreddit.toLowerCase();
    const mapping = SUBREDDIT_MAPPINGS[subredditLower] ||
                    SUBREDDIT_MAPPINGS[post.subreddit];

    if (!mapping) {
      console.warn(`  No mapping for r/${post.subreddit}`);
      continue;
    }

    const review: RawReview = {
      id: `reddit-${post.id}`,
      subreddit: post.subreddit,
      soc_codes: mapping.soc_codes,
      title: post.title,
      text: post.selftext,
      score: post.score,
      url: post.permalink,
      created_at: new Date(post.created_utc * 1000).toISOString(),
      num_comments: post.num_comments,
    };

    // Add to each SOC code
    for (const socCode of mapping.soc_codes) {
      if (!bySocCode[socCode]) {
        bySocCode[socCode] = [];
      }
      bySocCode[socCode].push(review);
    }
  }

  // Load careers to get slugs
  const careersPath = path.join(process.cwd(), 'data/careers.generated.json');
  const careers = JSON.parse(fs.readFileSync(careersPath, 'utf-8'));
  const socToSlug: Record<string, string> = {};
  for (const career of careers) {
    socToSlug[career.soc_code] = career.slug;
  }

  // Generate per-career files and summaries
  const careerDir = path.join(process.cwd(), 'data/reviews/reviews-by-career');
  fs.mkdirSync(careerDir, { recursive: true });

  const summaries: CareerReviewsSummary[] = [];
  let totalMapped = 0;

  for (const [socCode, reviews] of Object.entries(bySocCode)) {
    const slug = socToSlug[socCode];
    if (!slug) {
      console.warn(`  No career found for SOC ${socCode}`);
      continue;
    }

    // Sort by score (highest first)
    reviews.sort((a, b) => b.score - a.score);

    // Save full reviews for this career
    fs.writeFileSync(
      path.join(careerDir, `${slug}.json`),
      JSON.stringify(reviews, null, 2)
    );

    // Create summary with top 5 reviews
    const summary: CareerReviewsSummary = {
      slug,
      soc_code: socCode,
      total_reviews: reviews.length,
      featured_reviews: reviews.slice(0, 5).map(r => ({
        id: r.id,
        subreddit: r.subreddit,
        title: r.title.length > 100 ? r.title.substring(0, 100) + '...' : r.title,
        text: getExcerpt(r.text),
        score: r.score,
        url: r.url,
      })),
      last_updated: new Date().toISOString(),
    };

    summaries.push(summary);
    totalMapped += reviews.length;

    console.log(`  ${slug}: ${reviews.length} reviews`);
  }

  // Sort summaries by review count
  summaries.sort((a, b) => b.total_reviews - a.total_reviews);

  // Save index
  const indexPath = path.join(process.cwd(), 'data/reviews/reviews-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(summaries, null, 2));

  // Also save a flat all-reviews file for reference
  const allReviews: RawReview[] = [];
  for (const reviews of Object.values(bySocCode)) {
    allReviews.push(...reviews);
  }
  // Deduplicate by ID
  const uniqueReviews = [...new Map(allReviews.map(r => [r.id, r])).values()];
  uniqueReviews.sort((a, b) => b.score - a.score);

  fs.writeFileSync(
    path.join(process.cwd(), 'data/reviews/reviews-all.json'),
    JSON.stringify({
      generated_at: new Date().toISOString(),
      source: 'reddit_raw',
      total_reviews: uniqueReviews.length,
      reviews: uniqueReviews,
    }, null, 2)
  );

  console.log(`\n=== Reviews Index Generation Complete ===`);
  console.log(`Careers with reviews: ${summaries.length}`);
  console.log(`Total review mappings: ${totalMapped}`);
  console.log(`Unique reviews: ${uniqueReviews.length}`);
  console.log(`Index saved to: ${indexPath}`);
  console.log(`Per-career files: ${careerDir}\n`);

  // Print top careers by review count
  console.log('Top 15 careers by review count:');
  summaries.slice(0, 15).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.slug}: ${s.total_reviews} reviews`);
  });
}

main().catch(console.error);
