/**
 * Fetch Reddit Reviews (Public JSON API)
 *
 * Collects career-related posts from target subreddits.
 * Uses Reddit's public .json endpoints (no OAuth needed).
 *
 * Run: npx tsx scripts/fetch-reddit-reviews.ts
 * Options:
 *   --subreddit=electricians   Fetch from specific subreddit
 *   --limit=100                Max posts per subreddit
 *   --min-score=10             Minimum upvotes (default: 10)
 *   --min-length=200           Minimum text length (default: 200)
 *   --career-search="Software Engineer"  Search across Reddit for job title
 *   --time=year                Time range: hour, day, week, month, year, all
 */

import * as fs from 'fs';
import * as path from 'path';
import { SUBREDDIT_MAPPINGS, CAREER_KEYWORDS } from './config/subreddit-mappings';

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

interface RedditApiResponse {
  data?: {
    children?: Array<{
      data: {
        id: string;
        subreddit: string;
        title: string;
        selftext: string;
        score: number;
        created_utc: number;
        permalink: string;
        num_comments: number;
      };
    }>;
    after?: string;
  };
}

// Quality filter settings (can be overridden via CLI)
let MIN_SCORE = 10;
let MIN_LENGTH = 200;
let MIN_KEYWORDS = 2;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isCareerRelevant(text: string, score: number = 0): boolean {
  const lower = text.toLowerCase();
  const matchCount = CAREER_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase())).length;
  // Require minimum keywords, text length, and score
  return matchCount >= MIN_KEYWORDS && text.length >= MIN_LENGTH && score >= MIN_SCORE;
}

function isHighQuality(text: string, score: number): boolean {
  // High quality = 50+ upvotes and 500+ characters
  return score >= 50 && text.length >= 500;
}

function deduplicateById(posts: RedditPost[]): RedditPost[] {
  const seen = new Set<string>();
  return posts.filter(post => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AmericanDreamJobs/1.0 (Career research tool)',
        },
      });

      if (response.status === 429) {
        // Rate limited - wait longer
        console.log('  Rate limited, waiting 10s...');
        await sleep(10000);
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(2000);
    }
  }
  throw new Error('Max retries exceeded');
}

async function searchSubreddit(
  subreddit: string,
  keywords: string[],
  limit: number = 100
): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];

  for (const keyword of keywords.slice(0, 3)) { // Limit keywords to reduce requests
    // Rate limit: 2 seconds between requests (be respectful)
    await sleep(2000);

    try {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(keyword)}&restrict_sr=1&sort=top&t=year&limit=25`;
      const response = await fetchWithRetry(url);

      if (!response.ok) {
        console.warn(`  Warning: Failed to search r/${subreddit} for "${keyword}": ${response.status}`);
        continue;
      }

      const data: RedditApiResponse = await response.json();

      for (const child of data.data?.children || []) {
        const post = child.data;
        const fullText = post.title + ' ' + post.selftext;

        if (isCareerRelevant(fullText, post.score)) {
          posts.push({
            id: post.id,
            subreddit: post.subreddit,
            title: post.title,
            selftext: post.selftext,
            score: post.score,
            created_utc: post.created_utc,
            permalink: `https://reddit.com${post.permalink}`,
            num_comments: post.num_comments,
          });
        }
      }

      if (posts.length >= limit) break;
    } catch (error) {
      console.warn(`  Warning: Error searching r/${subreddit}: ${error}`);
    }
  }

  return deduplicateById(posts).slice(0, limit);
}

async function fetchTopPosts(
  subreddit: string,
  limit: number = 50
): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];

  try {
    await sleep(2000);

    const url = `https://www.reddit.com/r/${subreddit}/top.json?t=year&limit=${limit}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      console.warn(`  Warning: Failed to fetch top posts from r/${subreddit}: ${response.status}`);
      return posts;
    }

    const data: RedditApiResponse = await response.json();

    for (const child of data.data?.children || []) {
      const post = child.data;
      const fullText = post.title + ' ' + post.selftext;

      if (isCareerRelevant(fullText, post.score)) {
        posts.push({
          id: post.id,
          subreddit: post.subreddit,
          title: post.title,
          selftext: post.selftext,
          score: post.score,
          created_utc: post.created_utc,
          permalink: `https://reddit.com${post.permalink}`,
          num_comments: post.num_comments,
        });
      }
    }
  } catch (error) {
    console.warn(`  Warning: Error fetching top from r/${subreddit}: ${error}`);
  }

  return posts;
}

interface ParsedArgs {
  subreddit?: string;
  limit: number;
  careerSearch?: string;
  time: string;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  let subreddit: string | undefined;
  let limit = 50; // Lower default for public API
  let careerSearch: string | undefined;
  let time = 'year';

  for (const arg of args) {
    if (arg.startsWith('--subreddit=')) {
      subreddit = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--min-score=')) {
      MIN_SCORE = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--min-length=')) {
      MIN_LENGTH = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--career-search=')) {
      careerSearch = arg.split('=')[1];
    } else if (arg.startsWith('--time=')) {
      time = arg.split('=')[1];
    }
  }

  return { subreddit, limit, careerSearch, time };
}

// Search across Reddit for a specific job title
async function searchRedditForCareer(
  jobTitle: string,
  limit: number = 100,
  time: string = 'year'
): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];

  // Career-related subreddits to search across
  const generalSubs = [
    'jobs', 'careerguidance', 'careeradvice', 'AskReddit',
    'personalfinance', 'LifeProTips', 'antiwork', 'work'
  ];

  // Search queries that tend to find testimonials
  const searchQueries = [
    `"I work as a ${jobTitle}"`,
    `"I'm a ${jobTitle}"`,
    `"${jobTitle}" salary career`,
    `"${jobTitle}" "worth it"`,
    `"${jobTitle}" "day in the life"`,
  ];

  console.log(`\nSearching Reddit for "${jobTitle}"...`);

  for (const sub of generalSubs) {
    for (const query of searchQueries.slice(0, 2)) {
      await sleep(2500);

      try {
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&t=${time}&limit=25`;
        const response = await fetchWithRetry(url);

        if (!response.ok) continue;

        const data: RedditApiResponse = await response.json();

        for (const child of data.data?.children || []) {
          const post = child.data;
          const fullText = post.title + ' ' + post.selftext;

          // For career search, check if job title is mentioned
          if (fullText.toLowerCase().includes(jobTitle.toLowerCase()) &&
              post.score >= MIN_SCORE &&
              fullText.length >= MIN_LENGTH) {
            posts.push({
              id: post.id,
              subreddit: post.subreddit,
              title: post.title,
              selftext: post.selftext,
              score: post.score,
              created_utc: post.created_utc,
              permalink: `https://reddit.com${post.permalink}`,
              num_comments: post.num_comments,
            });
          }
        }

        if (posts.length >= limit) break;
      } catch (error) {
        // Silently continue on errors
      }
    }
    if (posts.length >= limit) break;
  }

  // Also search all of Reddit (r/all)
  for (const query of searchQueries.slice(0, 3)) {
    if (posts.length >= limit) break;
    await sleep(2500);

    try {
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=${time}&limit=50`;
      const response = await fetchWithRetry(url);

      if (!response.ok) continue;

      const data: RedditApiResponse = await response.json();

      for (const child of data.data?.children || []) {
        const post = child.data;
        const fullText = post.title + ' ' + post.selftext;

        if (fullText.toLowerCase().includes(jobTitle.toLowerCase()) &&
            post.score >= MIN_SCORE &&
            fullText.length >= MIN_LENGTH) {
          posts.push({
            id: post.id,
            subreddit: post.subreddit,
            title: post.title,
            selftext: post.selftext,
            score: post.score,
            created_utc: post.created_utc,
            permalink: `https://reddit.com${post.permalink}`,
            num_comments: post.num_comments,
          });
        }
      }
    } catch (error) {
      // Silently continue
    }
  }

  return deduplicateById(posts).slice(0, limit);
}

async function main() {
  console.log('\n=== Fetching Reddit Reviews (Public JSON API) ===\n');

  const { subreddit: targetSubreddit, limit, careerSearch, time } = parseArgs();

  console.log(`Quality filters: min-score=${MIN_SCORE}, min-length=${MIN_LENGTH}`);

  // Career search mode - search across Reddit for a job title
  if (careerSearch) {
    console.log(`\nMode: Career-specific search for "${careerSearch}"`);
    const posts = await searchRedditForCareer(careerSearch, limit, time);

    // Save to a career-specific file
    const safeName = careerSearch.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const outputPath = path.join(process.cwd(), `data/reviews/sources/reddit-career-${safeName}.json`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const output = {
      fetched_at: new Date().toISOString(),
      method: 'career_search',
      job_title: careerSearch,
      total_posts: posts.length,
      min_score: MIN_SCORE,
      min_length: MIN_LENGTH,
      posts,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`\n=== Career Search Complete ===`);
    console.log(`Job title: ${careerSearch}`);
    console.log(`Posts found: ${posts.length}`);
    console.log(`Output saved to: ${outputPath}\n`);

    // Show top posts
    console.log('Top posts by score:');
    posts.slice(0, 10).forEach((post, i) => {
      console.log(`  ${i + 1}. [${post.score}] ${post.title.slice(0, 60)}...`);
    });
    return;
  }

  const allPosts: RedditPost[] = [];
  const subreddits = targetSubreddit
    ? { [targetSubreddit]: SUBREDDIT_MAPPINGS[targetSubreddit] || { keywords: CAREER_KEYWORDS.slice(0, 3), confidence: 0.5, soc_codes: [] } }
    : SUBREDDIT_MAPPINGS;

  let processedCount = 0;
  const totalSubreddits = Object.keys(subreddits).length;

  for (const [subreddit, config] of Object.entries(subreddits)) {
    processedCount++;
    console.log(`[${processedCount}/${totalSubreddits}] Fetching r/${subreddit}...`);

    // Get top posts first (most reliable)
    const topPosts = await fetchTopPosts(subreddit, Math.floor(limit / 2));

    // Then search with keywords
    const searchPosts = await searchSubreddit(subreddit, config.keywords, Math.floor(limit / 2));

    // Combine and deduplicate
    const combinedPosts = deduplicateById([...topPosts, ...searchPosts]);

    console.log(`  Found ${combinedPosts.length} career-relevant posts`);
    allPosts.push(...combinedPosts);

    // Save progress periodically
    if (processedCount % 5 === 0) {
      console.log(`  Progress: ${allPosts.length} total posts collected`);
    }
  }

  // Deduplicate final list
  const uniquePosts = deduplicateById(allPosts);

  // Sort by score (highest first)
  uniquePosts.sort((a, b) => b.score - a.score);

  // Save raw data
  const outputPath = path.join(process.cwd(), 'data/reviews/sources/reddit-raw.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Calculate quality stats
  const highQualityCount = uniquePosts.filter(p => isHighQuality(p.title + ' ' + p.selftext, p.score)).length;
  const avgScore = uniquePosts.length > 0
    ? Math.round(uniquePosts.reduce((sum, p) => sum + p.score, 0) / uniquePosts.length)
    : 0;

  const output = {
    fetched_at: new Date().toISOString(),
    method: 'public_json_api',
    total_posts: uniquePosts.length,
    high_quality_posts: highQualityCount,
    average_score: avgScore,
    min_score_filter: MIN_SCORE,
    min_length_filter: MIN_LENGTH,
    subreddits_processed: Object.keys(subreddits).length,
    posts: uniquePosts,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n=== Reddit Fetch Complete ===`);
  console.log(`Total posts collected: ${uniquePosts.length}`);
  console.log(`High quality posts (50+ score, 500+ chars): ${highQualityCount}`);
  console.log(`Average score: ${avgScore}`);
  console.log(`Subreddits processed: ${Object.keys(subreddits).length}`);
  console.log(`Output saved to: ${outputPath}\n`);

  // Print subreddit breakdown
  const bySubreddit: Record<string, number> = {};
  for (const post of uniquePosts) {
    bySubreddit[post.subreddit] = (bySubreddit[post.subreddit] || 0) + 1;
  }

  console.log('Posts by subreddit:');
  Object.entries(bySubreddit)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([sub, count]) => {
      console.log(`  r/${sub}: ${count}`);
    });
}

main().catch(console.error);
