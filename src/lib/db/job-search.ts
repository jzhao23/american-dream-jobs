/**
 * Job Search Database Operations
 *
 * Handles job search caching and history tracking
 */

import { getSupabaseClient } from '../compass/supabase';
import crypto from 'crypto';

// Types
export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  locationType: 'onsite' | 'remote' | 'hybrid';
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'year' | 'hour';
  };
  description: string;
  highlights?: string[];
  postedAt: string;
  applyUrl: string;
  source: string;
}

export interface JobSearchCache {
  id: string;
  cache_key: string;
  career_slug: string;
  career_title: string;
  location_code: string;
  location_name: string;
  filters: Record<string, unknown> | null;
  results: JobListing[];
  results_count: number;
  api_source: string;
  created_at: string;
  expires_at: string;
}

export interface JobSearchHistory {
  id: string;
  user_id: string | null;
  career_slug: string;
  career_title: string;
  location_code: string;
  location_name: string;
  results_count: number | null;
  api_source: string | null;
  cache_hit: boolean;
  created_at: string;
}

export interface SaveSearchCacheInput {
  careerSlug: string;
  careerTitle: string;
  locationCode: string;
  locationName: string;
  filters?: Record<string, unknown>;
  results: JobListing[];
  apiSource: string;
}

export interface RecordSearchHistoryInput {
  userId?: string;
  careerSlug: string;
  careerTitle: string;
  locationCode: string;
  locationName: string;
  resultsCount?: number;
  apiSource?: string;
  cacheHit?: boolean;
}

/**
 * Generate a cache key for job search
 */
export function generateCacheKey(
  careerSlug: string,
  locationCode: string,
  filters?: Record<string, unknown>
): string {
  const filterHash = filters ? crypto.createHash('md5').update(JSON.stringify(filters)).digest('hex').slice(0, 8) : 'none';
  return `${careerSlug}:${locationCode}:${filterHash}`;
}

/**
 * Get cached job search results
 */
export async function getCachedJobSearch(
  careerSlug: string,
  locationCode: string,
  filters?: Record<string, unknown>
): Promise<JobSearchCache | null> {
  const supabase = getSupabaseClient();
  const cacheKey = generateCacheKey(careerSlug, locationCode, filters);

  const { data, error } = await supabase
    .from('job_search_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found or expired
    }
    console.warn(`Cache lookup error: ${error.message}`);
    return null;
  }

  return data as JobSearchCache;
}

/**
 * Save job search results to cache
 */
export async function saveJobSearchCache(input: SaveSearchCacheInput): Promise<void> {
  const supabase = getSupabaseClient();
  const cacheKey = generateCacheKey(input.careerSlug, input.locationCode, input.filters);

  // Upsert to handle race conditions
  const { error } = await supabase
    .from('job_search_cache')
    .upsert({
      cache_key: cacheKey,
      career_slug: input.careerSlug,
      career_title: input.careerTitle,
      location_code: input.locationCode,
      location_name: input.locationName,
      filters: input.filters || null,
      results: input.results,
      results_count: input.results.length,
      api_source: input.apiSource,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }, { onConflict: 'cache_key' });

  if (error) {
    console.warn(`Failed to save job search cache: ${error.message}`);
    // Don't throw - caching failure is non-critical
  }
}

/**
 * Record a job search in history (for analytics)
 */
export async function recordJobSearchHistory(input: RecordSearchHistoryInput): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('job_search_history')
    .insert({
      user_id: input.userId || null,
      career_slug: input.careerSlug,
      career_title: input.careerTitle,
      location_code: input.locationCode,
      location_name: input.locationName,
      results_count: input.resultsCount || null,
      api_source: input.apiSource || null,
      cache_hit: input.cacheHit || false
    });

  if (error) {
    console.warn(`Failed to record job search history: ${error.message}`);
    // Don't throw - history recording is non-critical
  }
}

/**
 * Get job search history for a user
 */
export async function getUserJobSearchHistory(
  userId: string,
  limit: number = 20
): Promise<JobSearchHistory[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('job_search_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get job search history: ${error.message}`);
  }

  return data as JobSearchHistory[];
}

/**
 * Cleanup expired cache entries
 */
export async function cleanupExpiredJobCache(): Promise<number> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('cleanup_expired_job_cache');

  if (error) {
    console.warn(`Failed to cleanup job cache: ${error.message}`);
    return 0;
  }

  return data as number;
}

/**
 * Get cache statistics
 */
export async function getJobCacheStats(): Promise<{
  totalCached: number;
  expiredCount: number;
}> {
  const supabase = getSupabaseClient();

  const { count: totalCached, error: totalError } = await supabase
    .from('job_search_cache')
    .select('*', { count: 'exact', head: true });

  const { count: expiredCount, error: expiredError } = await supabase
    .from('job_search_cache')
    .select('*', { count: 'exact', head: true })
    .lt('expires_at', new Date().toISOString());

  if (totalError || expiredError) {
    console.warn('Failed to get cache stats');
    return { totalCached: 0, expiredCount: 0 };
  }

  return {
    totalCached: totalCached || 0,
    expiredCount: expiredCount || 0
  };
}
