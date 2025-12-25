/**
 * Fetch Reddit Reviews
 *
 * Collects career-related posts from target subreddits.
 * Uses Reddit Data API with rate limiting.
 *
 * Run: npx tsx scripts/fetch-reddit-reviews.ts
 * Options:
 *   --subreddit=electricians   Fetch from specific subreddit
 *   --limit=100                Max posts per subreddit
 *   --days=365                 Posts from last N days
 */

import * as fs from 'fs';
import * as path from 'path';
import { SUBREDDIT_MAPPINGS, CAREER_KEYWORDS } from './config/subreddit-mappings';

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getRedditToken(): Promise<string> {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
    throw new Error('Reddit API credentials not set. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET environment variables.');
  }

  const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'AmericanDreamJobs/1.0',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Reddit auth failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function isCareerRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  const matchCount = CAREER_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase())).length;
  // Require at least 2 keywords and minimum text length
  return matchCount >= 2 && text.length > 100;
}

function deduplicateById(posts: RedditPost[]): RedditPost[] {
  const seen = new Set<string>();
  return posts.filter(post => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}

async function searchSubreddit(
  token: string,
  subreddit: string,
  keywords: string[],
  limit: number = 100
): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];

  for (const keyword of keywords) {
    // Rate limit: 100 requests per minute, so wait 600ms between requests
    await sleep(600);

    try {
      const response = await fetch(
        `https://oauth.reddit.com/r/${subreddit}/search?q=${encodeURIComponent(keyword)}&restrict_sr=1&sort=top&t=year&limit=25`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'AmericanDreamJobs/1.0',
          },
        }
      );

      if (!response.ok) {
        console.warn(`  Warning: Failed to search r/${subreddit} for "${keyword}": ${response.status}`);
        continue;
      }

      const data: RedditApiResponse = await response.json();

      for (const child of data.data?.children || []) {
        const post = child.data;
        const fullText = post.title + ' ' + post.selftext;

        if (isCareerRelevant(fullText)) {
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
  token: string,
  subreddit: string,
  limit: number = 50
): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];

  try {
    await sleep(600);

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/top?t=year&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'AmericanDreamJobs/1.0',
        },
      }
    );

    if (!response.ok) {
      console.warn(`  Warning: Failed to fetch top posts from r/${subreddit}: ${response.status}`);
      return posts;
    }

    const data: RedditApiResponse = await response.json();

    for (const child of data.data?.children || []) {
      const post = child.data;
      const fullText = post.title + ' ' + post.selftext;

      if (isCareerRelevant(fullText)) {
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

function parseArgs(): { subreddit?: string; limit: number; days: number } {
  const args = process.argv.slice(2);
  let subreddit: string | undefined;
  let limit = 100;
  let days = 365;

  for (const arg of args) {
    if (arg.startsWith('--subreddit=')) {
      subreddit = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--days=')) {
      days = parseInt(arg.split('=')[1], 10);
    }
  }

  return { subreddit, limit, days };
}

async function main() {
  console.log('\n=== Fetching Reddit Reviews ===\n');

  const { subreddit: targetSubreddit, limit } = parseArgs();

  // Get Reddit access token
  let token: string;
  try {
    token = await getRedditToken();
    console.log('Authenticated with Reddit API\n');
  } catch (error) {
    console.error('Failed to authenticate with Reddit:', error);
    console.log('\nTo use this script, set up Reddit API credentials:');
    console.log('1. Go to https://www.reddit.com/prefs/apps');
    console.log('2. Create a new "script" type application');
    console.log('3. Set environment variables:');
    console.log('   export REDDIT_CLIENT_ID=your_client_id');
    console.log('   export REDDIT_CLIENT_SECRET=your_client_secret\n');
    process.exit(1);
  }

  const allPosts: RedditPost[] = [];
  const subreddits = targetSubreddit
    ? { [targetSubreddit]: SUBREDDIT_MAPPINGS[targetSubreddit] || { keywords: CAREER_KEYWORDS.slice(0, 5), confidence: 0.5 } }
    : SUBREDDIT_MAPPINGS;

  let processedCount = 0;
  const totalSubreddits = Object.keys(subreddits).length;

  for (const [subreddit, config] of Object.entries(subreddits)) {
    processedCount++;
    console.log(`[${processedCount}/${totalSubreddits}] Fetching r/${subreddit}...`);

    // Search with keywords
    const searchPosts = await searchSubreddit(token, subreddit, config.keywords, Math.floor(limit / 2));

    // Also get top posts
    const topPosts = await fetchTopPosts(token, subreddit, Math.floor(limit / 2));

    // Combine and deduplicate
    const combinedPosts = deduplicateById([...searchPosts, ...topPosts]);

    console.log(`  Found ${combinedPosts.length} career-relevant posts`);
    allPosts.push(...combinedPosts);

    // Save progress periodically
    if (processedCount % 10 === 0) {
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

  const output = {
    fetched_at: new Date().toISOString(),
    total_posts: uniquePosts.length,
    subreddits_processed: Object.keys(subreddits).length,
    posts: uniquePosts,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n=== Reddit Fetch Complete ===`);
  console.log(`Total posts collected: ${uniquePosts.length}`);
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
