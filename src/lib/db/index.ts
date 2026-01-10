/**
 * Database Operations
 *
 * Centralized exports for all database operations
 */

// User operations
export {
  type UserProfile,
  type CreateUserInput,
  type GetOrCreateUserResult,
  getOrCreateUser,
  getUserByEmail,
  getUserById,
  checkUserExists,
  updateUserLocation,
  deleteUser
} from './users';

// Resume operations
export {
  type UserResume,
  type ParsedResumeProfile,
  type UploadResumeInput,
  uploadResume,
  getActiveResume,
  getUserResumes,
  getResumeById,
  deactivateResume,
  permanentlyDeleteResume,
  deleteAllUserResumes,
  updateResumeParsedProfile,
  getResumeDownloadUrl
} from './resumes';

// Compass response operations
export {
  type CompassResponse,
  type SaveCompassResponseInput,
  saveCompassResponse,
  getUserCompassResponses,
  getLatestCompassResponse,
  linkCompassResponsesToUser,
  updateCompassRecommendations
} from './compass';

// Job search operations
export {
  type JobListing,
  type JobSearchCache,
  type JobSearchHistory,
  type SaveSearchCacheInput,
  type RecordSearchHistoryInput,
  generateCacheKey,
  getCachedJobSearch,
  saveJobSearchCache,
  recordJobSearchHistory,
  getUserJobSearchHistory,
  cleanupExpiredJobCache,
  getJobCacheStats
} from './job-search';
