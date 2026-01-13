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

  // Return mock data as fallback (allows demo when APIs fail or aren't configured)
  console.log('[Aggregator] Returning mock data as fallback');
  return getMockJobResults(careerTitle, locationName, limit);
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
 * Get mock job results for development
 */
function getMockJobResults(careerTitle: string, location: string, limit: number): AggregatedSearchResult {
  const mockJobs: JobListing[] = [];

  const companies = [
    'Acme Corporation', 'TechStart Inc', 'Global Solutions', 'Innovation Labs',
    'Premier Services', 'Dynamic Systems', 'Future Forward', 'NextGen Co',
    'Apex Industries', 'Summit Enterprises', 'Metro Services', 'City Works',
    'United Industries', 'Pacific Group', 'Atlantic Corp', 'Midwest Solutions',
    'Southern Tech', 'Northern Systems', 'Central Services', 'Coastal Enterprises',
    'Mountain View Co', 'Valley Partners', 'Harbor Group', 'Lakeside Corp',
    'Riverfront Inc', 'Parkway Services', 'Gateway Systems', 'Crossroads Tech',
    'Horizon Group', 'Skyline Industries', 'Landmark Corp', 'Pioneer Solutions',
    'Frontier Tech', 'Cornerstone Inc', 'Keystone Services', 'Milestone Group',
    'Pathway Corp', 'Ridgeway Systems', 'Springboard Inc', 'Trailblazer Co',
    'Vanguard Services', 'Westward Group', 'Eastside Corp', 'Northstar Inc',
    'Southgate Systems', 'Sunbelt Services', 'Heartland Group', 'Bayview Corp',
    'Hillcrest Inc', 'Meadowbrook Co'
  ];

  const locationTypes = ['onsite', 'remote', 'hybrid', 'onsite', 'onsite'];

  for (let i = 0; i < Math.min(limit, 50); i++) {
    const locationType = locationTypes[i % locationTypes.length];
    const jobLocation = locationType === 'remote' ? 'Remote (US)' :
                        locationType === 'hybrid' ? `${location} (Hybrid)` : location;
    const baseSalary = 50000 + Math.floor(Math.random() * 80000);

    mockJobs.push({
      id: `mock_${i}_${Date.now()}`,
      title: `${careerTitle}${i > 0 ? ` - Level ${i + 1}` : ''}`,
      company: companies[i % companies.length],
      location: jobLocation,
      locationType: locationType as 'onsite' | 'remote' | 'hybrid',
      salary: {
        min: baseSalary,
        max: baseSalary + 20000,
        currency: 'USD',
        period: 'year'
      },
      description: `Join our team as a ${careerTitle}. We offer competitive compensation, great benefits, and opportunities for growth.`,
      highlights: [
        'Competitive salary and benefits',
        'Professional development opportunities',
        'Collaborative team environment'
      ],
      postedAt: `${i + 1} day${i > 0 ? 's' : ''} ago`,
      applyUrl: `https://example.com/jobs/mock-${i}`,
      source: 'Mock Data'
    });
  }

  return {
    jobs: mockJobs,
    totalResults: mockJobs.length,
    source: 'mock',
    searchId: `mock_${Date.now()}`,
    cached: false
  };
}

/**
 * Check if any job search API is configured
 */
export function isJobSearchConfigured(): boolean {
  return isSerpApiConfigured() || isJSearchConfigured();
}
