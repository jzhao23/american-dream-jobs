/**
 * Job Search Aggregator
 *
 * Aggregates results from multiple job search providers
 * No server-side caching or history storage - all data stays local
 */

import { JobListing, JobSearchParams, JobSearchResult, JobSearchFilters } from './types';
import { searchJobsSerpApi, isSerpApiConfigured } from './serpapi';
import { searchJobsJSearch, isJSearchConfigured } from './jsearch';

export interface AggregatedSearchParams {
  careerSlug: string;
  careerTitle: string;
  alternateJobTitles?: string[];
  locationCode: string;
  locationName: string;
  filters?: JobSearchFilters;
  limit?: number;
  userId?: string; // Kept for API compatibility but not stored
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
 * Search for jobs using configured providers
 * Results are returned directly without server-side caching
 */
export async function searchJobs(params: AggregatedSearchParams): Promise<AggregatedSearchResult> {
  const { careerTitle, locationName, filters, limit = 50 } = params;

  console.log('[Aggregator] Starting job search for:', careerTitle, 'in', locationName);
  console.log('[Aggregator] API keys present - SerpApi:', !!process.env.SERPAPI_API_KEY, 'JSearch:', !!process.env.JSEARCH_API_KEY);

  // Build search query using career title
  const searchQuery = careerTitle;
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
  const serpApiConfigured = isSerpApiConfigured();
  const jSearchConfigured = isJSearchConfigured();
  const noApiConfigured = !serpApiConfigured && !jSearchConfigured;

  console.error('[Aggregator] No job search APIs available or all failed');
  console.log('[Aggregator] SerpApi configured:', serpApiConfigured);
  console.log('[Aggregator] JSearch configured:', jSearchConfigured);

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
 * Check if any job search API is configured
 */
export function isJobSearchConfigured(): boolean {
  return isSerpApiConfigured() || isJSearchConfigured();
}
