/**
 * Job Search Types
 *
 * Shared types for job search functionality
 */

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

export interface JobSearchParams {
  query: string;
  location: string;
  alternateQueries?: string[];
  filters?: JobSearchFilters;
  limit?: number;
}

export interface JobSearchFilters {
  remoteOnly?: boolean;
  minSalary?: number;
  maxSalary?: number;
  datePosted?: 'today' | '3days' | 'week' | 'month';
  experienceLevel?: 'entry' | 'mid' | 'senior';
}

export interface JobSearchResult {
  jobs: JobListing[];
  totalResults: number;
  source: string;
  searchId: string;
}

export interface JobSearchError {
  code: 'RATE_LIMITED' | 'API_ERROR' | 'NO_RESULTS' | 'NETWORK_ERROR';
  message: string;
  retryAfter?: number;
}

// SerpApi specific types
export interface SerpApiJobsResponse {
  search_metadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_jobs_url: string;
    total_time_taken: number;
  };
  search_parameters: {
    q: string;
    location: string;
    google_domain: string;
    device: string;
  };
  jobs_results?: SerpApiJob[];
  serpapi_pagination?: {
    next_page_token?: string;
    next?: string;
  };
  error?: string;
}

export interface SerpApiJob {
  title: string;
  company_name: string;
  location: string;
  via: string;
  description: string;
  job_highlights?: {
    title: string;
    items: string[];
  }[];
  related_links?: {
    link: string;
    text: string;
  }[];
  extensions?: string[];
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    salary?: string;
    work_from_home?: boolean;
  };
  job_id: string;
  thumbnail?: string;
  apply_options?: {
    title: string;
    link: string;
  }[];
}

// JSearch (RapidAPI) specific types
export interface JSearchResponse {
  status: string;
  request_id: string;
  parameters: Record<string, unknown>;
  data: JSearchJob[];
}

export interface JSearchJob {
  job_id: string;
  employer_name: string;
  employer_logo: string | null;
  employer_website: string | null;
  job_employment_type: string;
  job_title: string;
  job_apply_link: string;
  job_description: string;
  job_is_remote: boolean;
  job_posted_at_timestamp: number;
  job_posted_at_datetime_utc: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_latitude: number;
  job_longitude: number;
  job_benefits: string[] | null;
  job_google_link: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
}
