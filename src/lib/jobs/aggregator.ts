/**
 * Job Search Aggregator
 *
 * Aggregates results from multiple job search providers with caching
 */

import { JobListing, JobSearchParams, JobSearchResult, JobSearchFilters } from './types';
import { searchJobsSerpApi, isSerpApiConfigured } from './serpapi';
import { searchJobsJSearch, isJSearchConfigured } from './jsearch';
import {
  getCachedJobSearch,
  saveJobSearchCache,
  recordJobSearchHistory
} from '@/lib/db';

export interface AggregatedSearchParams {
  careerSlug: string;
  careerTitle: string;
  alternateJobTitles?: string[];
  locationCode: string;
  locationName: string;
  filters?: JobSearchFilters;
  limit?: number;
  userId?: string;
}

export interface AggregatedSearchResult {
  jobs: JobListing[];
  totalResults: number;
  source: string;
  searchId: string;
  cached: boolean;
  /** Reason why no data was returned (if jobs array is empty) */
  noDataReason?: 'no_api_configured' | 'api_error' | 'no_results';
}

/**
 * Search for jobs with caching and fallback
 */
export async function searchJobs(params: AggregatedSearchParams): Promise<AggregatedSearchResult> {
  const { careerSlug, careerTitle, locationCode, locationName, filters, limit = 50, userId } = params;

  // Check cache first
  try {
    const cachedResult = await getCachedJobSearch(careerSlug, locationCode, filters as Record<string, unknown> | undefined);

    if (cachedResult) {
      console.log(`[Aggregator] Cache hit for ${careerSlug} in ${locationCode}`);

      // Record cache hit in history
      await recordJobSearchHistory({
        userId,
        careerSlug,
        careerTitle,
        locationCode,
        locationName,
        resultsCount: cachedResult.results_count,
        apiSource: cachedResult.api_source,
        cacheHit: true
      });

      return {
        jobs: cachedResult.results as JobListing[],
        totalResults: cachedResult.results_count,
        source: cachedResult.api_source,
        searchId: cachedResult.id,
        cached: true
      };
    }
  } catch (error) {
    console.warn('[Aggregator] Cache lookup failed:', error);
    // Continue without cache
  }

  console.log(`[Aggregator] Cache miss for ${careerSlug} in ${locationCode}`);

  // Build search query using career title and alternate titles
  const searchQuery = buildSearchQuery(careerTitle, params.alternateJobTitles);
  const searchParams: JobSearchParams = {
    query: searchQuery,
    location: locationName,
    filters,
    limit
  };

  let result: JobSearchResult;
  let source = 'none';

  // Try SerpApi first (primary)
  if (isSerpApiConfigured()) {
    try {
      result = await searchJobsSerpApi(searchParams);
      source = 'serpapi';

      // Cache the result
      await cacheAndRecordResult(params, result, source, userId);

      return {
        jobs: result.jobs,
        totalResults: result.totalResults,
        source,
        searchId: result.searchId,
        cached: false
      };
    } catch (error) {
      console.warn('[Aggregator] SerpApi failed, trying fallback:', error);
    }
  }

  // Fallback to JSearch
  if (isJSearchConfigured()) {
    try {
      result = await searchJobsJSearch(searchParams);
      source = 'jsearch';

      // Cache the result
      await cacheAndRecordResult(params, result, source, userId);

      return {
        jobs: result.jobs,
        totalResults: result.totalResults,
        source,
        searchId: result.searchId,
        cached: false
      };
    } catch (error) {
      console.warn('[Aggregator] JSearch failed:', error);
    }
  }

  // No API configured or all failed
  const noApiConfigured = !isSerpApiConfigured() && !isJSearchConfigured();
  console.error('[Aggregator] No job search APIs available or all failed');
  console.log('[Aggregator] SerpApi configured:', isSerpApiConfigured());
  console.log('[Aggregator] JSearch configured:', isJSearchConfigured());

  // Record the failed attempt
  try {
    await recordJobSearchHistory({
      userId,
      careerSlug,
      careerTitle,
      locationCode,
      locationName,
      resultsCount: 0,
      apiSource: 'none',
      cacheHit: false
    });
  } catch (e) {
    console.warn('[Aggregator] Failed to record history:', e);
  }

  // Return empty result with reason (no mock data - be honest with users)
  return {
    jobs: [],
    totalResults: 0,
    source: 'none',
    searchId: `empty_${Date.now()}`,
    cached: false,
    noDataReason: noApiConfigured ? 'no_api_configured' : 'api_error'
  };
}

/**
 * Build search query from career title and alternate titles
 */
function buildSearchQuery(careerTitle: string, alternateTitles?: string[]): string {
  // Use the main career title as primary query
  // Could enhance with OR queries for alternate titles if supported
  return careerTitle;
}

/**
 * Cache result and record in history
 */
async function cacheAndRecordResult(
  params: AggregatedSearchParams,
  result: JobSearchResult,
  source: string,
  userId?: string
): Promise<void> {
  // Cache the result
  try {
    await saveJobSearchCache({
      careerSlug: params.careerSlug,
      careerTitle: params.careerTitle,
      locationCode: params.locationCode,
      locationName: params.locationName,
      filters: params.filters as Record<string, unknown> | undefined,
      results: result.jobs,
      apiSource: source
    });
  } catch (error) {
    console.warn('[Aggregator] Failed to cache result:', error);
  }

  // Record in history
  try {
    await recordJobSearchHistory({
      userId,
      careerSlug: params.careerSlug,
      careerTitle: params.careerTitle,
      locationCode: params.locationCode,
      locationName: params.locationName,
      resultsCount: result.jobs.length,
      apiSource: source,
      cacheHit: false
    });
  } catch (error) {
    console.warn('[Aggregator] Failed to record history:', error);
  }
}

/**
 * Check if any job search API is configured
 */
export function isJobSearchConfigured(): boolean {
  return isSerpApiConfigured() || isJSearchConfigured();
}
