/**
 * Local Storage System for American Dream Jobs
 *
 * Provides localStorage-based persistence for user data during alpha launch.
 * All user data is stored locally in the browser - nothing is sent to servers.
 *
 * Features:
 * - Single unified storage key
 * - Data versioning for future migrations
 * - 30-day automatic data expiration
 * - Graceful handling when localStorage unavailable
 * - Size limits enforced
 *
 * @module localStorage
 */

// Storage configuration
const STORAGE_KEY = 'american_dream_jobs_data';
const CURRENT_VERSION = 1;
const MAX_AGE_DAYS = 30;
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Types
export interface CareerRecommendation {
  slug: string;
  title: string;
  score: number;
  matchReasons: string[];
  salary?: {
    median: number;
    range: { low: number; high: number };
  };
  training?: {
    duration: string;
    type: string;
  };
}

export interface CareerCompassResult {
  timestamp: string;
  responses: {
    training: string | null;
    education: string | null;
    background: string[];
    salary: string | null;
    workStyle: string[];
    location: { code: string; name: string; shortName: string } | null;
    anythingElse: string;
  };
  recommendations: CareerRecommendation[];
  metadata?: {
    stage1Candidates: number;
    stage2Candidates: number;
    finalMatches: number;
    processingTimeMs: number;
    hasResume: boolean;
  };
  savedAt: string;
}

export interface ResumeData {
  fileName: string;
  uploadedAt: string;
  parsedContent: string | null;
  fileSize?: number;
}

export interface UserPreferences {
  location: string;
  locationCode: string;
  locationName: string;
  trainingTimePreference: string;
  educationLevel: string;
}

export interface LocalUserData {
  version: number;
  careerCompassResults: CareerCompassResult | null;
  resumeData: ResumeData | null;
  preferences: UserPreferences;
  lastVisit: string;
  createdAt: string;
}

// Default data structure
function getDefaultUserData(): LocalUserData {
  const now = new Date().toISOString();
  return {
    version: CURRENT_VERSION,
    careerCompassResults: null,
    resumeData: null,
    preferences: {
      location: '',
      locationCode: '',
      locationName: '',
      trainingTimePreference: '',
      educationLevel: '',
    },
    lastVisit: now,
    createdAt: now,
  };
}

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Check if data has expired (older than MAX_AGE_DAYS)
function isDataExpired(data: LocalUserData): boolean {
  try {
    const createdAt = new Date(data.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > MAX_AGE_DAYS;
  } catch {
    return true; // If we can't parse the date, consider it expired
  }
}

// Migrate data from older versions if needed
function migrateData(data: LocalUserData): LocalUserData {
  // Currently at version 1, no migrations needed
  // Future migrations would go here:
  // if (data.version === 1) { ... migrate to version 2 ... }
  return { ...data, version: CURRENT_VERSION };
}

/**
 * Get all local user data from localStorage
 * Returns default data if nothing is stored or if data has expired
 */
export function getLocalUserData(): LocalUserData {
  if (!isLocalStorageAvailable()) {
    return getDefaultUserData();
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultUserData();
    }

    const data = JSON.parse(stored) as LocalUserData;

    // Check if data has expired
    if (isDataExpired(data)) {
      clearAllLocalData();
      return getDefaultUserData();
    }

    // Migrate if needed and update last visit
    const migrated = migrateData(data);
    migrated.lastVisit = new Date().toISOString();

    return migrated;
  } catch (error) {
    console.warn('Failed to parse localStorage data:', error);
    return getDefaultUserData();
  }
}

/**
 * Save all local user data to localStorage
 */
function saveLocalUserData(data: LocalUserData): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    const serialized = JSON.stringify(data);

    // Check if data exceeds reasonable size (10MB total limit)
    if (serialized.length > 10 * 1024 * 1024) {
      console.error('Data exceeds maximum storage size');
      return false;
    }

    window.localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Save Career Compass results to localStorage
 */
export function saveCareerCompassResult(result: CareerCompassResult): boolean {
  const data = getLocalUserData();
  data.careerCompassResults = {
    ...result,
    savedAt: new Date().toISOString(),
  };
  return saveLocalUserData(data);
}

/**
 * Get the latest Career Compass result from localStorage
 */
export function getLatestCareerCompassResult(): CareerCompassResult | null {
  const data = getLocalUserData();
  return data.careerCompassResults;
}

/**
 * Check if there are existing Career Compass results
 */
export function hasCareerCompassResults(): boolean {
  const result = getLatestCareerCompassResult();
  return result !== null && result.recommendations.length > 0;
}

/**
 * Save resume data to localStorage
 * Note: Only stores parsed text content, not the actual file
 */
export function saveResumeData(resumeData: ResumeData): boolean {
  // Validate size limit
  if (resumeData.parsedContent && resumeData.parsedContent.length > MAX_RESUME_SIZE_BYTES) {
    console.error('Resume content exceeds maximum size limit');
    return false;
  }

  const data = getLocalUserData();
  data.resumeData = {
    ...resumeData,
    uploadedAt: resumeData.uploadedAt || new Date().toISOString(),
  };
  return saveLocalUserData(data);
}

/**
 * Get stored resume data from localStorage
 */
export function getResumeData(): ResumeData | null {
  const data = getLocalUserData();
  return data.resumeData;
}

/**
 * Check if resume data exists in localStorage
 */
export function hasResumeData(): boolean {
  const resume = getResumeData();
  return resume !== null && resume.parsedContent !== null && resume.parsedContent.length > 0;
}

/**
 * Clear resume data from localStorage
 */
export function clearResumeData(): boolean {
  const data = getLocalUserData();
  data.resumeData = null;
  return saveLocalUserData(data);
}

/**
 * Update user preferences
 */
export function updatePreferences(prefs: Partial<UserPreferences>): boolean {
  const data = getLocalUserData();
  data.preferences = {
    ...data.preferences,
    ...prefs,
  };
  return saveLocalUserData(data);
}

/**
 * Get user preferences
 */
export function getPreferences(): UserPreferences {
  const data = getLocalUserData();
  return data.preferences;
}

/**
 * Clear all locally stored data
 */
export function clearAllLocalData(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);

    // Also clear legacy keys from the old system
    const legacyKeys = [
      'compass-resume-text',
      'compass-resume-filename',
      'compass-resume-stored-at',
      'adjn_user_session',
      'adj_auth_user_profile_id',
      'compass-results',
      'compass-metadata',
      'compass-profile',
      'compass-submission',
    ];

    legacyKeys.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore errors for individual keys
      }
    });

    // Clear sessionStorage as well
    try {
      window.sessionStorage.removeItem('compass-results');
      window.sessionStorage.removeItem('compass-metadata');
      window.sessionStorage.removeItem('compass-profile');
      window.sessionStorage.removeItem('compass-submission');
    } catch {
      // Ignore errors
    }

    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Get summary of what data is stored (for privacy notice)
 */
export function getStoredDataSummary(): {
  hasCompassResults: boolean;
  hasResume: boolean;
  hasPreferences: boolean;
  lastVisit: string | null;
  dataAge: number | null; // days
} {
  const data = getLocalUserData();

  let dataAge: number | null = null;
  try {
    const createdAt = new Date(data.createdAt);
    const now = new Date();
    dataAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    dataAge = null;
  }

  return {
    hasCompassResults: data.careerCompassResults !== null,
    hasResume: data.resumeData !== null && data.resumeData.parsedContent !== null,
    hasPreferences:
      data.preferences.location !== '' ||
      data.preferences.trainingTimePreference !== '' ||
      data.preferences.educationLevel !== '',
    lastVisit: data.lastVisit,
    dataAge,
  };
}

/**
 * Check if localStorage is available (for UI display)
 */
export function isStorageAvailable(): boolean {
  return isLocalStorageAvailable();
}

// Legacy compatibility functions (for gradual migration)
// These maintain backward compatibility with the old resume-storage.ts

/**
 * Store resume in localStorage (legacy compatibility)
 * @deprecated Use saveResumeData instead
 */
export function storeCompassResume(text: string, filename?: string): void {
  saveResumeData({
    fileName: filename || 'resume.pdf',
    uploadedAt: new Date().toISOString(),
    parsedContent: text,
  });
}

/**
 * Get stored resume (legacy compatibility)
 * @deprecated Use getResumeData instead
 */
export function getCompassResume(): { text: string; filename: string | null; storedAt: string | null } | null {
  const resume = getResumeData();
  if (!resume || !resume.parsedContent) return null;

  return {
    text: resume.parsedContent,
    filename: resume.fileName,
    storedAt: resume.uploadedAt,
  };
}

/**
 * Check if resume exists (legacy compatibility)
 * @deprecated Use hasResumeData instead
 */
export function hasCompassResume(): boolean {
  return hasResumeData();
}

/**
 * Clear stored resume (legacy compatibility)
 * @deprecated Use clearResumeData instead
 */
export function clearCompassResume(): void {
  clearResumeData();
}
