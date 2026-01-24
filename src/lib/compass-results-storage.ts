/**
 * Compass Results Storage Utility
 *
 * Provides comprehensive localStorage-based persistence for Career Compass results.
 * Stores full questionnaire responses, resume data, parsed profile, and career recommendations.
 * Results expire after 24 hours to encourage users to retake the assessment.
 */

// Storage key
const STORAGE_KEY = 'american-dream-jobs-compass-results';

// Results expire after 24 hours
const EXPIRY_HOURS = 24;

// Type definitions for stored data
export interface StoredCareerMatch {
  slug: string;
  title: string;
  category: string;
  matchScore: number;
  medianPay: number;
  aiResilience: string;
  reasoning: string;
  skillsGap: [string, string, string];
  transitionTimeline: string;
  education: string;
}

export interface StoredResultsMetadata {
  stage1Candidates: number;
  stage2Candidates: number;
  finalMatches: number;
  processingTimeMs: number;
  costUsd: number;
}

export interface StoredParsedProfile {
  skills: string[];
  jobTitles: string[];
  education: {
    level: string;
    fields: string[];
  };
  industries: string[];
  experienceYears: number;
  confidence: number;
}

export interface StoredSubmissionData {
  training: string | null;
  education: string | null;
  background: string[];
  salary: string | null;
  workStyle: string[];
  location: {
    code: string;
    name: string;
    shortName: string;
  } | null;
  hasResume: boolean;
  anythingElse: string;
  timestamp: string;
}

export interface StoredResumeData {
  text: string;
  filename: string | null;
}

export interface CompassResultsData {
  // Core results
  recommendations: StoredCareerMatch[];
  metadata: StoredResultsMetadata | null;

  // User inputs
  submission: StoredSubmissionData;
  profile: StoredParsedProfile | null;

  // Resume data (text only, no sensitive personal info)
  resume: StoredResumeData | null;

  // Timestamps
  savedAt: number;
  generatedAt: string;

  // Session info
  sessionId: string;
}

/**
 * Check if localStorage is available (fails gracefully in private browsing)
 */
function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save comprehensive compass results to localStorage
 * @param data The complete compass results data to save
 */
export function saveCompassResults(data: Omit<CompassResultsData, 'savedAt'>): void {
  if (!isStorageAvailable()) {
    console.warn('localStorage not available - results will not be persisted');
    return;
  }

  try {
    const storageData: CompassResultsData = {
      ...data,
      savedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.warn('Failed to save compass results to localStorage:', error);
  }
}

/**
 * Load saved compass results from localStorage
 * @returns The stored results if valid and not expired, null otherwise
 */
export function loadCompassResults(): CompassResultsData | null {
  if (!isStorageAvailable()) return null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const data: CompassResultsData = JSON.parse(saved);

    // Check if results have expired
    const expiryMs = EXPIRY_HOURS * 60 * 60 * 1000;
    if (Date.now() - data.savedAt > expiryMs) {
      // Results expired, clear them
      clearCompassResults();
      return null;
    }

    // Validate minimum required fields
    if (!data.recommendations || !Array.isArray(data.recommendations) || data.recommendations.length === 0) {
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to load compass results from localStorage:', error);
    return null;
  }
}

/**
 * Check if saved results exist and are not expired
 * @returns true if valid results exist
 */
export function hasCompassResults(): boolean {
  return loadCompassResults() !== null;
}

/**
 * Get a summary of saved results for display in banners
 * @returns Summary info or null if no results
 */
export function getCompassResultsSummary(): {
  savedAt: Date;
  matchCount: number;
  topMatch: string;
  hasResume: boolean;
  isExpiringSoon: boolean;
} | null {
  const data = loadCompassResults();
  if (!data) return null;

  const savedAtDate = new Date(data.savedAt);
  const hoursRemaining = EXPIRY_HOURS - (Date.now() - data.savedAt) / (60 * 60 * 1000);

  return {
    savedAt: savedAtDate,
    matchCount: data.recommendations.length,
    topMatch: data.recommendations[0]?.title || 'Unknown',
    hasResume: data.submission.hasResume,
    isExpiringSoon: hoursRemaining < 4, // Less than 4 hours remaining
  };
}

/**
 * Clear saved compass results from localStorage
 */
export function clearCompassResults(): void {
  if (!isStorageAvailable()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear compass results from localStorage:', error);
  }
}

/**
 * Format a relative time string for display
 * @param date The date to format
 * @returns A human-readable relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else {
    // Format as date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

/**
 * Restore saved results to sessionStorage for the results page
 * This allows the results page to work as if freshly generated
 */
export function restoreResultsToSession(): boolean {
  const data = loadCompassResults();
  if (!data) return false;

  try {
    sessionStorage.setItem('compass-results', JSON.stringify(data.recommendations));
    sessionStorage.setItem('compass-submission', JSON.stringify(data.submission));

    if (data.metadata) {
      sessionStorage.setItem('compass-metadata', JSON.stringify(data.metadata));
    }
    if (data.profile) {
      sessionStorage.setItem('compass-profile', JSON.stringify(data.profile));
    }

    return true;
  } catch (error) {
    console.warn('Failed to restore results to session:', error);
    return false;
  }
}
