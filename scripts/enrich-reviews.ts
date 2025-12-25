/**
 * Enrich Reviews with AI
 *
 * Uses Claude to extract structured data from raw testimonials.
 *
 * Run: npx tsx scripts/enrich-reviews.ts
 * Options:
 *   --limit=100        Max reviews to process
 *   --skip-existing    Skip reviews already enriched
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { SUBREDDIT_MAPPINGS } from './config/subreddit-mappings';

const anthropic = new Anthropic();

interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  score: number;
  created_utc: number;
  permalink: string;
  num_comments: number;
}

interface OccupationMatch {
  title: string;
  soc_code: string | null;
  confidence: number;
}

interface EnrichmentResult {
  occupations: OccupationMatch[];
  summary: string;
  best_quote: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  topics: string[];
  author_info: {
    years_experience: number | null;
    region: string | null;
    union_status: 'union' | 'non_union' | 'unknown';
    employment_type: 'employee' | 'self_employed' | 'contractor' | null;
  };
  is_actionable_advice: boolean;
  quality_score: number;
}

const ENRICHMENT_PROMPT = `Analyze this worker testimonial from r/{subreddit}:

"{text}"

Extract the following as JSON (no markdown, just pure JSON):
{
  "occupations": [
    {
      "title": "Primary BLS occupation title (e.g., 'Electricians', 'Software Developers')",
      "soc_code": "SOC code if known (e.g., '47-2111'), otherwise null",
      "confidence": 0.0-1.0 (how confident this testimonial applies to this occupation)
    }
    // Include 1-3 occupations if the testimonial could apply to multiple related careers
    // Example: A post about "software engineering" could match both "Software Developers" and "Web Developers"
  ],
  "summary": "1-2 sentence summary suitable for display",
  "best_quote": "The most insightful/quotable sentence from the original text (verbatim, max 200 chars)",
  "sentiment": "positive|negative|neutral|mixed",
  "topics": ["array of applicable topics from: salary_transparency, work_life_balance, career_progression, training_path, day_to_day, physical_demands, job_security, union_experience, management_quality, entry_advice, regrets_lessons"],
  "author_info": {
    "years_experience": number or null,
    "region": "US State name or null",
    "union_status": "union|non_union|unknown",
    "employment_type": "employee|self_employed|contractor" or null
  },
  "is_actionable_advice": true or false,
  "quality_score": 1-10 (how useful is this for someone researching this career?)
}

Important:
- Include multiple occupations if the advice applies broadly (e.g., general software engineering advice applies to multiple dev roles)
- Primary occupation should have highest confidence, related occupations lower
- Extract years of experience from phrases like "15 years in", "been doing this for 5 years", etc.
- Identify union status from mentions of "IBEW", "local ###", "union", "non-union", etc.
- For topics, only include those that are actually discussed
- The quote should be a complete, meaningful sentence
- Be conservative with confidence scores`;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function enrichReview(text: string, subreddit: string): Promise<EnrichmentResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: ENRICHMENT_PROMPT
        .replace('{subreddit}', subreddit)
        .replace('{text}', text.slice(0, 3000))
    }],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in response');
  }

  return JSON.parse(jsonMatch[0]) as EnrichmentResult;
}

function parseArgs(): { limit: number; skipExisting: boolean } {
  const args = process.argv.slice(2);
  let limit = Infinity;
  let skipExisting = false;

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--skip-existing') {
      skipExisting = true;
    }
  }

  return { limit, skipExisting };
}

async function main() {
  console.log('\n=== Enriching Reviews with Claude ===\n');

  const { limit, skipExisting } = parseArgs();

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set.');
    console.log('\nTo use this script:');
    console.log('1. Get an API key from https://console.anthropic.com');
    console.log('2. Set the environment variable:');
    console.log('   export ANTHROPIC_API_KEY=your_api_key\n');
    process.exit(1);
  }

  // Load raw Reddit data
  const rawPath = path.join(process.cwd(), 'data/reviews/sources/reddit-raw.json');
  if (!fs.existsSync(rawPath)) {
    console.error(`Error: Raw data file not found at ${rawPath}`);
    console.log('Run "npx tsx scripts/fetch-reddit-reviews.ts" first.\n');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  console.log(`Loaded ${rawData.posts.length} raw posts\n`);

  // Load existing enriched reviews if skipping
  const outputPath = path.join(process.cwd(), 'data/reviews/reviews-all.json');
  let existingReviews: Array<{ id: string }> = [];
  const existingIds = new Set<string>();

  if (skipExisting && fs.existsSync(outputPath)) {
    const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    existingReviews = existing.reviews || [];
    existingReviews.forEach(r => existingIds.add(r.id));
    console.log(`Found ${existingReviews.length} existing enriched reviews\n`);
  }

  const enrichedReviews: unknown[] = [...existingReviews];
  let processedCount = 0;
  let errorCount = 0;

  // Filter posts to process
  const postsToProcess = rawData.posts.filter((post: RedditPost) => {
    const id = `reddit-${post.id}`;
    return !existingIds.has(id);
  }).slice(0, limit);

  console.log(`Processing ${postsToProcess.length} posts...\n`);

  for (const post of postsToProcess) {
    const postId = `reddit-${post.id}`;

    try {
      processedCount++;
      const progress = `[${processedCount}/${postsToProcess.length}]`;
      console.log(`${progress} Enriching: ${post.title.slice(0, 50)}...`);

      const text = post.title + '\n\n' + post.selftext;
      const enriched = await enrichReview(text, post.subreddit);

      // Get fallback SOC codes from subreddit mapping
      const subredditLower = post.subreddit.toLowerCase();
      const fallbackSocCodes = SUBREDDIT_MAPPINGS[subredditLower]?.soc_codes ||
                               SUBREDDIT_MAPPINGS[post.subreddit]?.soc_codes ||
                               [];

      // Map occupations to our schema (with fallback)
      let occupations = enriched.occupations.map(occ => ({
        soc_code: occ.soc_code || fallbackSocCodes[0] || 'unknown',
        slug: titleToSlug(occ.title),
        title: occ.title,
        confidence: occ.confidence,
      }));

      // If no occupations returned, use fallback from subreddit mapping
      if (occupations.length === 0 && fallbackSocCodes.length > 0) {
        occupations = [{
          soc_code: fallbackSocCodes[0],
          slug: post.subreddit.toLowerCase(),
          title: post.subreddit,
          confidence: 0.5,
        }];
      }

      // Map to our schema
      const review = {
        id: postId,
        occupations,
        source: {
          type: 'reddit' as const,
          platform: `r/${post.subreddit}`,
          url: post.permalink,
          original_id: post.id,
          retrieved_at: rawData.fetched_at,
        },
        content: {
          raw_text: post.selftext,
          summary: enriched.summary,
          quote: enriched.best_quote,
          sentiment: enriched.sentiment,
          topics: enriched.topics,
        },
        author: {
          years_experience: enriched.author_info.years_experience,
          region: enriched.author_info.region,
          union_status: enriched.author_info.union_status,
          employment_type: enriched.author_info.employment_type,
          verified: false,
        },
        quality: {
          source_upvotes: post.score,
          helpful_votes: 0,
          report_count: 0,
          moderator_approved: enriched.quality_score >= 6,
        },
        enrichment: {
          enriched_by: 'claude' as const,
          enriched_at: new Date().toISOString(),
          confidence: occupations[0]?.confidence > 0.8 ? 'high' as const :
                      occupations[0]?.confidence > 0.5 ? 'medium' as const : 'low' as const,
        },
        created_at: new Date(post.created_utc * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      enrichedReviews.push(review);

      // Save progress periodically
      if (processedCount % 10 === 0) {
        fs.writeFileSync(outputPath, JSON.stringify({
          generated_at: new Date().toISOString(),
          total_reviews: enrichedReviews.length,
          reviews: enrichedReviews,
        }, null, 2));
        console.log(`  Saved progress: ${enrichedReviews.length} reviews`);
      }

      // Rate limit for Claude API (avoid hitting limits)
      await sleep(500);

    } catch (error) {
      errorCount++;
      console.error(`  Error enriching ${postId}:`, error instanceof Error ? error.message : error);
    }
  }

  // Final save
  fs.writeFileSync(outputPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    total_reviews: enrichedReviews.length,
    reviews: enrichedReviews,
  }, null, 2));

  console.log(`\n=== Enrichment Complete ===`);
  console.log(`Total enriched reviews: ${enrichedReviews.length}`);
  console.log(`Newly processed: ${processedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Output saved to: ${outputPath}\n`);
}

main().catch(console.error);
