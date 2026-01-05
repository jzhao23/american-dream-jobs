/**
 * Career Compass Module
 *
 * AI-powered career recommendation system
 */

// Resume parsing
export { parseResumeWithLLM, type ParsedResume, type EducationLevel } from './resume-parser';

// Embedding service
export {
  generateEmbedding,
  generateBatchEmbeddings,
  generateCareerEmbeddings,
  generateQueryEmbeddings,
  cosineSimilarity,
  calculateWeightedSimilarity,
  estimateEmbeddingCost
} from './embedding-service';

// Matching engine
export {
  matchCareers,
  type UserProfile,
  type UserPreferences,
  type CareerMatch,
  type MatchingResult
} from './matching-engine';

// Supabase operations
export {
  getSupabaseClient,
  upsertCareerEmbedding,
  batchUpsertCareerEmbeddings,
  upsertDWAEmbedding,
  batchUpsertDWAEmbeddings,
  findSimilarCareers,
  findSimilarDWAs,
  getCareerEmbedding,
  getCareerEmbeddingsCount,
  cacheUserProfileEmbedding,
  getCachedUserProfileEmbedding,
  cleanupExpiredCache,
  type CareerEmbedding,
  type DWAEmbedding,
  type UserProfileEmbedding,
  type SimilarCareer
} from './supabase';
