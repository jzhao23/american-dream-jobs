/**
 * Job Search Library
 *
 * Centralized exports for job search functionality
 */

// Types
export type {
  JobListing,
  JobSearchParams,
  JobSearchFilters,
  JobSearchResult,
  JobSearchError
} from './types';

// Aggregator (main entry point)
export {
  searchJobs,
  isJobSearchConfigured,
  type AggregatedSearchParams,
  type AggregatedSearchResult
} from './aggregator';

// Individual providers (for testing/debugging)
export { searchJobsSerpApi, isSerpApiConfigured } from './serpapi';
export { searchJobsJSearch, isJSearchConfigured } from './jsearch';
