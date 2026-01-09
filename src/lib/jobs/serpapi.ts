/**
 * SerpApi Google Jobs Integration
 *
 * Primary job search provider using Google Jobs via SerpApi
 * Aggregates results from LinkedIn, Indeed, Glassdoor, and company sites
 */

import {
  JobListing,
  JobSearchParams,
  JobSearchResult,
  SerpApiJobsResponse,
  SerpApiJob
} from './types';

const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

/**
 * Search for jobs using SerpApi Google Jobs
 */
export async function searchJobsSerpApi(params: JobSearchParams): Promise<JobSearchResult> {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY environment variable is not set');
  }

  // Build search URL
  const searchParams = new URLSearchParams({
    api_key: apiKey,
    engine: 'google_jobs',
    q: params.query,
    location: params.location,
    google_domain: 'google.com',
    gl: 'us',
    hl: 'en'
  });

  // Add date filter if specified
  if (params.filters?.datePosted) {
    const chipMap: Record<string, string> = {
      'today': 'date_posted:today',
      '3days': 'date_posted:3days',
      'week': 'date_posted:week',
      'month': 'date_posted:month'
    };
    if (chipMap[params.filters.datePosted]) {
      searchParams.set('chips', chipMap[params.filters.datePosted]);
    }
  }

  console.log(`[SerpApi] Searching for: "${params.query}" in "${params.location}"`);

  try {
    const response = await fetch(`${SERPAPI_BASE_URL}?${searchParams.toString()}`);

    if (!response.ok) {
      if (response.status === 429) {
        throw {
          code: 'RATE_LIMITED',
          message: 'API rate limit exceeded',
          retryAfter: 60
        };
      }
      throw new Error(`SerpApi request failed: ${response.status}`);
    }

    const data: SerpApiJobsResponse = await response.json();

    if (data.error) {
      throw new Error(`SerpApi error: ${data.error}`);
    }

    const jobs = (data.jobs_results || [])
      .slice(0, params.limit || 20)
      .map(job => transformSerpApiJob(job))
      .filter(job => passesFilters(job, params.filters));

    console.log(`[SerpApi] Found ${jobs.length} jobs`);

    return {
      jobs,
      totalResults: data.jobs_results?.length || 0,
      source: 'serpapi',
      searchId: data.search_metadata?.id || `serpapi_${Date.now()}`
    };
  } catch (error) {
    console.error('[SerpApi] Search error:', error);
    throw error;
  }
}

/**
 * Transform SerpApi job format to our JobListing format
 */
function transformSerpApiJob(job: SerpApiJob): JobListing {
  // Determine location type
  let locationType: 'onsite' | 'remote' | 'hybrid' = 'onsite';
  if (job.detected_extensions?.work_from_home) {
    locationType = 'remote';
  } else if (job.location?.toLowerCase().includes('remote')) {
    locationType = 'remote';
  } else if (job.location?.toLowerCase().includes('hybrid')) {
    locationType = 'hybrid';
  }

  // Parse salary if available
  let salary: JobListing['salary'] | undefined;
  if (job.detected_extensions?.salary) {
    salary = parseSalaryString(job.detected_extensions.salary);
  }

  // Get apply URL (prefer direct apply links)
  let applyUrl = '';
  if (job.apply_options && job.apply_options.length > 0) {
    applyUrl = job.apply_options[0].link;
  } else if (job.related_links && job.related_links.length > 0) {
    applyUrl = job.related_links[0].link;
  }

  // Extract source from "via" field
  const source = job.via?.replace(/^via\s+/i, '') || 'Google Jobs';

  // Get highlights
  const highlights: string[] = [];
  if (job.job_highlights) {
    for (const highlight of job.job_highlights) {
      if (highlight.items) {
        highlights.push(...highlight.items.slice(0, 3));
      }
    }
  }

  return {
    id: job.job_id || `serpapi_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    title: job.title,
    company: job.company_name,
    companyLogo: job.thumbnail,
    location: job.location,
    locationType,
    salary,
    description: job.description?.slice(0, 500) || '',
    highlights: highlights.slice(0, 5),
    postedAt: job.detected_extensions?.posted_at || 'Recently',
    applyUrl,
    source
  };
}

/**
 * Parse salary string into structured format
 */
function parseSalaryString(salaryStr: string): JobListing['salary'] | undefined {
  if (!salaryStr) return undefined;

  // Common patterns: "$50,000 - $70,000 a year", "$25 an hour", "$60K - $80K"
  const yearlyMatch = salaryStr.match(/\$?([\d,]+)(?:K)?(?:\s*[-–]\s*\$?([\d,]+)(?:K)?)?\s*(?:a\s+year|\/yr|annually|per\s+year)/i);
  const hourlyMatch = salaryStr.match(/\$?([\d.]+)(?:\s*[-–]\s*\$?([\d.]+))?\s*(?:an?\s+hour|\/hr|hourly|per\s+hour)/i);

  if (yearlyMatch) {
    let min = parseFloat(yearlyMatch[1].replace(/,/g, ''));
    let max = yearlyMatch[2] ? parseFloat(yearlyMatch[2].replace(/,/g, '')) : undefined;

    // Handle K notation
    if (salaryStr.includes('K') || min < 1000) {
      min = min * 1000;
      if (max) max = max * 1000;
    }

    return {
      min,
      max,
      currency: 'USD',
      period: 'year'
    };
  }

  if (hourlyMatch) {
    const min = parseFloat(hourlyMatch[1]);
    const max = hourlyMatch[2] ? parseFloat(hourlyMatch[2]) : undefined;

    return {
      min,
      max,
      currency: 'USD',
      period: 'hour'
    };
  }

  return undefined;
}

/**
 * Check if a job passes the specified filters
 */
function passesFilters(job: JobListing, filters?: JobSearchParams['filters']): boolean {
  if (!filters) return true;

  // Remote filter
  if (filters.remoteOnly && job.locationType !== 'remote') {
    return false;
  }

  // Salary filters
  if (job.salary && filters.minSalary) {
    const annualSalary = job.salary.period === 'hour'
      ? (job.salary.min || 0) * 2080 // 40hrs * 52 weeks
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
 * Check if SerpApi is configured
 */
export function isSerpApiConfigured(): boolean {
  return !!process.env.SERPAPI_API_KEY;
}
