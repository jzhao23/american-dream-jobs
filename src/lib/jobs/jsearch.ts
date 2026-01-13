/**
 * JSearch (RapidAPI) Integration
 *
 * Fallback job search provider using JSearch via RapidAPI
 */

import {
  JobListing,
  JobSearchParams,
  JobSearchResult,
  JSearchResponse,
  JSearchJob
} from './types';

const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com/search';

/**
 * Search for jobs using JSearch (RapidAPI)
 * Fetches multiple pages to get more results
 */
export async function searchJobsJSearch(params: JobSearchParams): Promise<JobSearchResult> {
  const apiKey = process.env.JSEARCH_API_KEY;

  if (!apiKey) {
    throw new Error('JSEARCH_API_KEY environment variable is not set');
  }

  // Build query with location
  const query = `${params.query} in ${params.location}`;
  const targetLimit = params.limit || 50;
  const allJobs: JobListing[] = [];
  let searchId = '';
  let totalRawResults = 0;

  // Fetch multiple pages to get enough results
  // JSearch returns ~10 jobs per page, limit to 5 pages max
  const maxPages = Math.min(Math.ceil(targetLimit / 10), 5);

  console.log(`[JSearch] Searching for: "${query}"`);
  console.log(`[JSearch] Target: ${targetLimit} jobs, fetching up to ${maxPages} pages`);

  for (let page = 1; page <= maxPages; page++) {
    // Build request parameters
    const searchParams = new URLSearchParams({
      query,
      page: String(page),
      num_pages: '1',
      country: 'us',
      date_posted: getDatePostedFilter(params.filters?.datePosted)
    });

    // Add remote filter if specified
    if (params.filters?.remoteOnly) {
      searchParams.set('remote_jobs_only', 'true');
    }

    try {
      const response = await fetch(`${JSEARCH_BASE_URL}?${searchParams.toString()}`, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw {
            code: 'RATE_LIMITED',
            message: 'API rate limit exceeded',
            retryAfter: 60
          };
        }
        if (page === 1) {
          throw new Error(`JSearch request failed: ${response.status}`);
        }
        break;
      }

      const data: JSearchResponse = await response.json();

      if (data.status !== 'OK') {
        if (page === 1) {
          throw new Error(`JSearch error: ${data.status}`);
        }
        break;
      }

      // Store search ID from first page
      if (page === 1) {
        searchId = data.request_id || `jsearch_${Date.now()}`;
      }

      const pageJobs = data.data || [];
      totalRawResults += pageJobs.length;

      console.log(`[JSearch] Page ${page}: found ${pageJobs.length} jobs`);

      // No more results available
      if (pageJobs.length === 0) {
        break;
      }

      // Transform and filter jobs
      const transformedJobs = pageJobs
        .map(job => transformJSearchJob(job))
        .filter(job => passesFilters(job, params.filters));

      allJobs.push(...transformedJobs);

      // Stop if we have enough jobs
      if (allJobs.length >= targetLimit) {
        break;
      }

      // Small delay between requests to be nice to the API
      if (page < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      if (page === 1) {
        throw error;
      }
      console.warn(`[JSearch] Error on page ${page}, using results so far:`, error);
      break;
    }
  }

  const jobs = allJobs.slice(0, targetLimit);

  console.log(`[JSearch] Final: ${jobs.length} jobs (raw: ${totalRawResults})`);

  return {
    jobs,
    totalResults: totalRawResults,
    source: 'jsearch',
    searchId
  };
}

/**
 * Transform JSearch job format to our JobListing format
 */
function transformJSearchJob(job: JSearchJob): JobListing {
  // Determine location type
  let locationType: 'onsite' | 'remote' | 'hybrid' = 'onsite';
  if (job.job_is_remote) {
    locationType = 'remote';
  }

  // Format location string
  const locationParts = [job.job_city, job.job_state, job.job_country]
    .filter(Boolean);
  const location = locationParts.join(', ') || 'Location not specified';

  // Build salary info
  let salary: JobListing['salary'] | undefined;
  if (job.job_min_salary || job.job_max_salary) {
    salary = {
      min: job.job_min_salary || undefined,
      max: job.job_max_salary || undefined,
      currency: job.job_salary_currency || 'USD',
      period: mapSalaryPeriod(job.job_salary_period)
    };
  }

  // Get highlights from job_highlights
  const highlights: string[] = [];
  if (job.job_highlights) {
    if (job.job_highlights.Qualifications) {
      highlights.push(...job.job_highlights.Qualifications.slice(0, 2));
    }
    if (job.job_highlights.Responsibilities) {
      highlights.push(...job.job_highlights.Responsibilities.slice(0, 2));
    }
    if (job.job_highlights.Benefits) {
      highlights.push(...job.job_highlights.Benefits.slice(0, 1));
    }
  }

  // Calculate relative posted time
  const postedAt = formatRelativeTime(job.job_posted_at_timestamp);

  return {
    id: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    companyLogo: job.employer_logo || undefined,
    location,
    locationType,
    salary,
    description: job.job_description?.slice(0, 500) || '',
    highlights: highlights.slice(0, 5),
    postedAt,
    applyUrl: job.job_apply_link,
    source: 'JSearch'
  };
}

/**
 * Map JSearch salary period to our format
 */
function mapSalaryPeriod(period: string | null): 'year' | 'hour' {
  if (!period) return 'year';
  const lower = period.toLowerCase();
  if (lower.includes('hour')) return 'hour';
  return 'year';
}

/**
 * Format timestamp to relative time string
 */
function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Recently';

  const now = Date.now();
  const posted = timestamp * 1000; // Convert to milliseconds
  const diffMs = now - posted;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Convert our date filter to JSearch format
 */
function getDatePostedFilter(filter?: string): string {
  switch (filter) {
    case 'today': return 'today';
    case '3days': return '3days';
    case 'week': return 'week';
    case 'month': return 'month';
    default: return 'all';
  }
}

/**
 * Check if a job passes the specified filters
 */
function passesFilters(job: JobListing, filters?: JobSearchParams['filters']): boolean {
  if (!filters) return true;

  // Remote filter (already filtered by API, but double-check)
  if (filters.remoteOnly && job.locationType !== 'remote') {
    return false;
  }

  // Salary filters
  if (job.salary && filters.minSalary) {
    const annualSalary = job.salary.period === 'hour'
      ? (job.salary.min || 0) * 2080
      : (job.salary.min || 0);

    if (annualSalary < filters.minSalary) {
      return false;
    }
  }

  if (job.salary && filters.maxSalary) {
    const annualSalary = job.salary.period === 'hour'
      ? (job.salary.max || job.salary.min || 0) * 2080
      : (job.salary.max || job.salary.min || 0);

    if (annualSalary > filters.maxSalary) {
      return false;
    }
  }

  return true;
}

/**
 * Check if JSearch is configured
 */
export function isJSearchConfigured(): boolean {
  return !!process.env.JSEARCH_API_KEY;
}
