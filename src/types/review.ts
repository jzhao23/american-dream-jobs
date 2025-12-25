import { z } from "zod";

// Review source enum
export const ReviewSourceEnum = z.enum([
  "reddit",
  "glassdoor",
  "indeed",
  "user_submitted",
  "curated"
]);

// Review topic categories
export const ReviewTopicEnum = z.enum([
  "salary_transparency",
  "work_life_balance",
  "career_progression",
  "training_path",
  "day_to_day",
  "physical_demands",
  "job_security",
  "union_experience",
  "management_quality",
  "entry_advice",
  "regrets_lessons"
]);

// Sentiment enum
export const SentimentEnum = z.enum([
  "positive",
  "neutral",
  "negative",
  "mixed"
]);

// Occupation match schema
export const OccupationMatchSchema = z.object({
  soc_code: z.string(),
  slug: z.string(),
  title: z.string(),
  confidence: z.number().min(0).max(1),
});

// Individual review schema
export const ReviewSchema = z.object({
  id: z.string(),

  // Occupation mappings - can match multiple careers
  occupations: z.array(OccupationMatchSchema).min(1).max(5),

  // Source tracking (matches data_sources pattern)
  source: z.object({
    type: ReviewSourceEnum,
    platform: z.string().optional(),
    url: z.string().url().optional(),
    original_id: z.string().optional(),
    retrieved_at: z.string(),
  }),

  // Content
  content: z.object({
    raw_text: z.string(),
    summary: z.string().optional(),
    quote: z.string().optional(),
    sentiment: SentimentEnum,
    topics: z.array(ReviewTopicEnum),
  }),

  // Author metadata
  author: z.object({
    years_experience: z.number().nullable(),
    region: z.string().nullable(),
    union_status: z.enum(["union", "non_union", "unknown"]).nullable(),
    employment_type: z.enum(["employee", "self_employed", "contractor"]).nullable(),
    verified: z.boolean(),
  }),

  // Quality signals (matches existing pattern)
  quality: z.object({
    source_upvotes: z.number().nullable(),
    helpful_votes: z.number(),
    report_count: z.number(),
    moderator_approved: z.boolean(),
  }),

  // AI enrichment metadata (matches assessor pattern)
  enrichment: z.object({
    enriched_by: z.enum(["claude", "manual", "none"]),
    enriched_at: z.string().nullable(),
    confidence: z.enum(["high", "medium", "low"]),
  }),

  created_at: z.string(),
  updated_at: z.string(),
});

// Featured quote schema
export const FeaturedQuoteSchema = z.object({
  quote: z.string(),
  topic: ReviewTopicEnum,
  source_type: ReviewSourceEnum,
  upvotes: z.number().nullable(),
});

// Aggregated reviews for a career (lightweight for index)
export const CareerReviewsSummarySchema = z.object({
  slug: z.string(),
  soc_code: z.string(),
  total_reviews: z.number(),
  avg_sentiment_score: z.number(),
  topic_counts: z.record(z.string(), z.number()),
  sources: z.record(z.string(), z.number()),
  featured_quotes: z.array(FeaturedQuoteSchema).max(5),
  last_updated: z.string(),
});

// TypeScript types
export type ReviewSource = z.infer<typeof ReviewSourceEnum>;
export type ReviewTopic = z.infer<typeof ReviewTopicEnum>;
export type Sentiment = z.infer<typeof SentimentEnum>;
export type OccupationMatch = z.infer<typeof OccupationMatchSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type FeaturedQuote = z.infer<typeof FeaturedQuoteSchema>;
export type CareerReviewsSummary = z.infer<typeof CareerReviewsSummarySchema>;

// Helper functions
export function formatTopicLabel(topic: ReviewTopic): string {
  const labels: Record<ReviewTopic, string> = {
    salary_transparency: "Salary & Pay",
    work_life_balance: "Work-Life Balance",
    career_progression: "Career Growth",
    training_path: "Training & Education",
    day_to_day: "Day-to-Day Work",
    physical_demands: "Physical Demands",
    job_security: "Job Security",
    union_experience: "Union Experience",
    management_quality: "Management",
    entry_advice: "Getting Started",
    regrets_lessons: "Lessons Learned",
  };
  return labels[topic] || topic;
}

export function getSentimentColor(sentiment: Sentiment): string {
  const colors: Record<Sentiment, string> = {
    positive: "text-green-600 bg-green-100",
    neutral: "text-gray-600 bg-gray-100",
    negative: "text-red-600 bg-red-100",
    mixed: "text-yellow-600 bg-yellow-100",
  };
  return colors[sentiment];
}

export function getTopicIcon(topic: ReviewTopic): string {
  const icons: Record<ReviewTopic, string> = {
    salary_transparency: "💰",
    work_life_balance: "⚖️",
    career_progression: "📈",
    training_path: "🎓",
    day_to_day: "📋",
    physical_demands: "💪",
    job_security: "🛡️",
    union_experience: "🤝",
    management_quality: "👔",
    entry_advice: "🚀",
    regrets_lessons: "💡",
  };
  return icons[topic] || "💬";
}
