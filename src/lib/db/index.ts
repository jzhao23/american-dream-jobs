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

// Subscription operations
export {
  type EmailSubscription,
  type CreateSubscriptionInput,
  type CreateSubscriptionResult,
  createSubscription,
  getSubscriptionByEmail,
  unsubscribe,
  deleteSubscription,
  getSubscriptionStats
} from './subscriptions';

// Contribution operations
export {
  type CareerContribution,
  type CreateContributionInput,
  createContribution,
  getContributionsByCareer,
  getPendingContributions,
  updateContributionStatus,
  deleteContribution
} from './contributions';

// Career request operations
export {
  type CareerRequest,
  type CreateCareerRequestInput,
  type CreateCareerRequestResult,
  createOrVoteCareerRequest,
  getPopularCareerRequests,
  getRecentCareerRequests,
  updateCareerRequestStatus,
  deleteCareerRequest
} from './career-requests';

// Training program operations
export {
  type TrainingProgram,
  type CategoryTrainingResource,
  type CareerTrainingProgramLink,
  type UpsertTrainingProgramInput,
  getTrainingProgramsForCareer,
  getCategoryTrainingResources,
  upsertTrainingProgram,
  linkProgramToCareer,
  unlinkProgramFromCareer,
  addCategoryTrainingResource,
  getAllTrainingPrograms,
  getAllCareerProgramLinks,
  deleteTrainingProgram
} from './training-programs';

// Financial aid operations
export {
  type Scholarship,
  type CategoryFinancialResource,
  type FederalAidInfo,
  type CareerScholarshipLink,
  type UpsertScholarshipInput,
  getScholarshipsForCareer,
  getCategoryFinancialResources,
  getFederalAidEligibility,
  getAllFederalAidRules,
  upsertScholarship,
  linkScholarshipToCareer,
  unlinkScholarshipFromCareer,
  addCategoryFinancialResource,
  getAllScholarships,
  getAllCareerScholarshipLinks,
  deleteScholarship
} from './financial-aid';
