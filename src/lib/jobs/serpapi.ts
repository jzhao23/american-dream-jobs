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
 * Fetches multiple pages to get more results (Google Jobs returns ~10 per page)
 */
export async function searchJobsSerpApi(params: JobSearchParams): Promise<JobSearchResult> {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY environment variable is not set');
  }

  // Simplify location for SerpApi (it doesn't support verbose MSA names)
  // "San Francisco-Oakland-Berkeley, CA" -> "San Francisco, CA"
  const simplifiedLocation = simplifyLocation(params.location);

  // Include location in query for better geographic matching
  // Google Jobs location parameter is a hint, not a strict filter
  const queryWithLocation = `${params.query} in ${simplifiedLocation}`;

  const targetLimit = params.limit || 50;
  const allJobs: JobListing[] = [];
  let searchId = '';
  let totalRawResults = 0;

  // Fetch multiple pages to get enough results (Google Jobs returns ~10 per page)
  // Limit to 5 pages max to avoid excessive API calls
  const maxPages = Math.min(Math.ceil(targetLimit / 10), 5);

  console.log(`[SerpApi] Searching for: "${queryWithLocation}" (location param: "${simplifiedLocation}", radius: 50km)`);
  console.log(`[SerpApi] Target: ${targetLimit} jobs, fetching up to ${maxPages} pages`);

  for (let page = 0; page < maxPages; page++) {
    // Build search URL
    const searchParams = new URLSearchParams({
      api_key: apiKey,
      engine: 'google_jobs',
      q: queryWithLocation,
      location: simplifiedLocation,
      lrad: '50',  // 50km radius to restrict results geographically
      google_domain: 'google.com',
      gl: 'us',
      hl: 'en',
      start: String(page * 10)  // Pagination offset
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

    try {
      const response = await fetch(`${SERPAPI_BASE_URL}?${searchParams.toString()}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SerpApi] Error response on page ${page + 1}: ${errorText}`);

        if (response.status === 429) {
          throw {
            code: 'RATE_LIMITED',
            message: 'API rate limit exceeded',
            retryAfter: 60
          };
        }
        // If first page fails, throw error; otherwise break and use what we have
        if (page === 0) {
          throw new Error(`SerpApi request failed: ${response.status} - ${errorText}`);
        }
        break;
      }

      const data: SerpApiJobsResponse = await response.json();

      if (data.error) {
        console.error(`[SerpApi] API returned error on page ${page + 1}: ${data.error}`);
        if (page === 0) {
          throw new Error(`SerpApi error: ${data.error}`);
        }
        break;
      }

      // Store search ID from first page
      if (page === 0) {
        searchId = data.search_metadata?.id || `serpapi_${Date.now()}`;
      }

      const pageJobs = data.jobs_results || [];
      totalRawResults += pageJobs.length;

      console.log(`[SerpApi] Page ${page + 1}: found ${pageJobs.length} jobs`);

      // No more results available
      if (pageJobs.length === 0) {
        break;
      }

      // Transform and filter jobs
      const transformedJobs = pageJobs
        .map(job => transformSerpApiJob(job))
        .filter(job => passesFilters(job, params.filters));

      allJobs.push(...transformedJobs);

      // Stop if we have enough jobs
      if (allJobs.length >= targetLimit) {
        break;
      }

      // Small delay between requests to be nice to the API
      if (page < maxPages - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      if (page === 0) {
        throw error;
      }
      console.warn(`[SerpApi] Error on page ${page + 1}, using results so far:`, error);
      break;
    }
  }

  // Post-filter to ensure jobs are in the expected location area
  // SerpApi sometimes returns jobs from other locations
  const locationFilteredJobs = filterJobsByLocation(allJobs, simplifiedLocation);

  const jobs = locationFilteredJobs.slice(0, targetLimit);

  console.log(`[SerpApi] Final: ${jobs.length} jobs (raw: ${totalRawResults}, after location filter: ${locationFilteredJobs.length})`);

  return {
    jobs,
    totalResults: totalRawResults,
    source: 'serpapi',
    searchId
  };
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
 * Simplify location for SerpApi
 * MSA names like "San Francisco-Oakland-Berkeley, CA" need to be simplified
 * to just "San Francisco, CA" for the API to accept them
 */
function simplifyLocation(location: string): string {
  // If it's a state-only location, keep as is
  if (!location.includes(',')) {
    return location;
  }

  // Split into city part and state
  const parts = location.split(',');
  const state = parts[parts.length - 1].trim();
  const cityPart = parts[0].trim();

  // If city part contains hyphens (MSA format), take just the first city
  // "San Francisco-Oakland-Berkeley" -> "San Francisco"
  const firstCity = cityPart.split('-')[0].trim();

  return `${firstCity}, ${state}`;
}

/**
 * Filter jobs to ensure they match the expected location
 * SerpApi sometimes returns jobs from other locations
 */
function filterJobsByLocation(jobs: JobListing[], expectedLocation: string): JobListing[] {
  // Extract city and state from expected location
  const parts = expectedLocation.split(',').map(p => p.trim().toLowerCase());
  const expectedCity = parts[0] || '';
  const expectedState = parts[1] || '';

  // Also handle state abbreviations
  const stateAbbreviations: Record<string, string> = {
    'ca': 'california', 'ny': 'new york', 'tx': 'texas', 'fl': 'florida',
    'wa': 'washington', 'il': 'illinois', 'pa': 'pennsylvania', 'oh': 'ohio',
    'ga': 'georgia', 'nc': 'north carolina', 'mi': 'michigan', 'nj': 'new jersey',
    'va': 'virginia', 'az': 'arizona', 'ma': 'massachusetts', 'tn': 'tennessee',
    'in': 'indiana', 'mo': 'missouri', 'md': 'maryland', 'wi': 'wisconsin',
    'co': 'colorado', 'mn': 'minnesota', 'sc': 'south carolina', 'al': 'alabama',
    'la': 'louisiana', 'ky': 'kentucky', 'or': 'oregon', 'ok': 'oklahoma',
    'ct': 'connecticut', 'ut': 'utah', 'nv': 'nevada', 'ia': 'iowa',
    'ar': 'arkansas', 'ms': 'mississippi', 'ks': 'kansas', 'nm': 'new mexico',
    'ne': 'nebraska', 'wv': 'west virginia', 'id': 'idaho', 'hi': 'hawaii',
    'nh': 'new hampshire', 'me': 'maine', 'mt': 'montana', 'ri': 'rhode island',
    'de': 'delaware', 'sd': 'south dakota', 'nd': 'north dakota', 'ak': 'alaska',
    'dc': 'district of columbia', 'vt': 'vermont', 'wy': 'wyoming'
  };

  const expectedStateFull = stateAbbreviations[expectedState] || expectedState;

  return jobs.filter(job => {
    const jobLocation = (job.location || '').toLowerCase();

    // Remote jobs are always included
    if (job.locationType === 'remote' || jobLocation.includes('remote')) {
      return true;
    }

    // Check if job location contains the expected city
    if (expectedCity && jobLocation.includes(expectedCity)) {
      return true;
    }

    // Check if job location contains the expected state (abbreviation or full name)
    if (expectedState && (jobLocation.includes(expectedState) || jobLocation.includes(expectedStateFull))) {
      return true;
    }

    // Log filtered out jobs for debugging
    console.log(`[SerpApi] Filtering out job: "${job.title}" at "${job.location}" (expected: ${expectedLocation})`);
    return false;
  });
}

/**
 * Check if SerpApi is configured
 */
export function isSerpApiConfigured(): boolean {
  return !!process.env.SERPAPI_API_KEY;
}
