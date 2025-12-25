/**
 * Generate Reviews Index
 *
 * Creates lightweight summaries and per-career files from enriched reviews.
 *
 * Run: npx tsx scripts/generate-reviews-index.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface OccupationMatch {
  soc_code: string;
  slug: string;
  title: string;
  confidence: number;
}

interface Review {
  id: string;
  occupations: OccupationMatch[];
  source: {
    type: string;
    platform?: string;
    url?: string;
    original_id?: string;
    retrieved_at: string;
  };
  content: {
    raw_text: string;
    summary?: string;
    quote?: string;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    topics: string[];
  };
  author: {
    years_experience: number | null;
    region: string | null;
    union_status: 'union' | 'non_union' | 'unknown' | null;
    employment_type: 'employee' | 'self_employed' | 'contractor' | null;
    verified: boolean;
  };
  quality: {
    source_upvotes: number | null;
    helpful_votes: number;
    report_count: number;
    moderator_approved: boolean;
  };
  enrichment: {
    enriched_by: 'claude' | 'manual' | 'none';
    enriched_at: string | null;
    confidence: 'high' | 'medium' | 'low';
  };
  created_at: string;
  updated_at: string;
}

interface FeaturedQuote {
  quote: string;
  topic: string;
  source_type: string;
  upvotes: number | null;
}

interface CareerReviewsSummary {
  slug: string;
  soc_code: string;
  total_reviews: number;
  avg_sentiment_score: number;
  topic_counts: Record<string, number>;
  sources: Record<string, number>;
  featured_quotes: FeaturedQuote[];
  last_updated: string;
}

function selectFeaturedQuotes(reviews: Review[]): FeaturedQuote[] {
  const byTopic: Record<string, FeaturedQuote> = {};

  for (const review of reviews) {
    if (!review.content.quote) continue;

    for (const topic of review.content.topics) {
      const existing = byTopic[topic];
      const upvotes = review.quality.source_upvotes || 0;

      if (!existing || upvotes > (existing.upvotes || 0)) {
        byTopic[topic] = {
          quote: review.content.quote,
          topic,
          source_type: review.source.type,
          upvotes: review.quality.source_upvotes,
        };
      }
    }
  }

  // Sort by upvotes and take top 5
  return Object.values(byTopic)
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    .slice(0, 5);
}

async function main() {
  console.log('\n=== Generating Reviews Index ===\n');

  const reviewsPath = path.join(process.cwd(), 'data/reviews/reviews-all.json');

  if (!fs.existsSync(reviewsPath)) {
    console.error(`Error: Reviews file not found at ${reviewsPath}`);
    console.log('Run the enrichment script first.\n');
    process.exit(1);
  }

  const reviewsData = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
  const reviews: Review[] = reviewsData.reviews;

  console.log(`Processing ${reviews.length} reviews...\n`);

  // Group by career slug (a review can appear in multiple careers)
  const byCareer: Record<string, { review: Review; occupation: OccupationMatch }[]> = {};

  for (const review of reviews) {
    for (const occupation of review.occupations) {
      const slug = occupation.slug;
      if (!byCareer[slug]) byCareer[slug] = [];
      byCareer[slug].push({ review, occupation });
    }
  }

  // Count unique reviews (for stats)
  const uniqueReviewIds = new Set(reviews.map(r => r.id));
  console.log(`Unique reviews: ${uniqueReviewIds.size}, Total mappings: ${Object.values(byCareer).flat().length}\n`);

  // Generate per-career files
  const careerDir = path.join(process.cwd(), 'data/reviews/reviews-by-career');
  fs.mkdirSync(careerDir, { recursive: true });

  const summaries: CareerReviewsSummary[] = [];

  for (const [slug, careerMappings] of Object.entries(byCareer)) {
    // Extract reviews for this career
    const careerReviews = careerMappings.map(m => m.review);
    const primaryOccupation = careerMappings[0].occupation;

    // Save individual career file (includes occupation match info)
    const careerFile = careerMappings.map(m => ({
      ...m.review,
      matched_occupation: m.occupation, // Which occupation matched this career
    }));
    fs.writeFileSync(
      path.join(careerDir, `${slug}.json`),
      JSON.stringify(careerFile, null, 2)
    );

    // Calculate sentiment score (-1 to 1)
    const sentimentScore = careerReviews.reduce((sum, r) => {
      const s = r.content.sentiment;
      return sum + (s === 'positive' ? 1 : s === 'negative' ? -1 : 0);
    }, 0) / careerReviews.length;

    // Count topics
    const topicCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};

    for (const review of careerReviews) {
      for (const topic of review.content.topics) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
      sourceCounts[review.source.type] = (sourceCounts[review.source.type] || 0) + 1;
    }

    // Select featured quotes
    const featuredQuotes = selectFeaturedQuotes(careerReviews);

    const summary: CareerReviewsSummary = {
      slug,
      soc_code: primaryOccupation.soc_code,
      total_reviews: careerReviews.length,
      avg_sentiment_score: Math.round(sentimentScore * 100) / 100,
      topic_counts: topicCounts,
      sources: sourceCounts,
      featured_quotes: featuredQuotes,
      last_updated: new Date().toISOString(),
    };

    summaries.push(summary);

    console.log(`${slug}: ${careerReviews.length} reviews, sentiment: ${sentimentScore.toFixed(2)}`);
  }

  // Sort summaries by number of reviews (descending)
  summaries.sort((a, b) => b.total_reviews - a.total_reviews);

  // Save index
  const indexPath = path.join(process.cwd(), 'data/reviews/reviews-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(summaries, null, 2));

  console.log(`\n=== Index Generation Complete ===`);
  console.log(`Careers with reviews: ${summaries.length}`);
  console.log(`Total reviews: ${reviews.length}`);
  console.log(`Index saved to: ${indexPath}`);
  console.log(`Per-career files: ${careerDir}\n`);

  // Print top careers by review count
  console.log('Top 10 careers by review count:');
  summaries.slice(0, 10).forEach((s, i) => {
    const sentiment = s.avg_sentiment_score > 0 ? '(+)' : s.avg_sentiment_score < 0 ? '(-)' : '(~)';
    console.log(`  ${i + 1}. ${s.slug}: ${s.total_reviews} reviews ${sentiment}`);
  });

  // Print topic distribution
  const allTopics: Record<string, number> = {};
  for (const summary of summaries) {
    for (const [topic, count] of Object.entries(summary.topic_counts)) {
      allTopics[topic] = (allTopics[topic] || 0) + count;
    }
  }

  console.log('\nTopic distribution across all reviews:');
  Object.entries(allTopics)
    .sort((a, b) => b[1] - a[1])
    .forEach(([topic, count]) => {
      console.log(`  ${topic}: ${count}`);
    });
}

main().catch(console.error);
