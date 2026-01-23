/**
 * Resume Storage Utility
 *
 * Provides localStorage-based persistence for resume data from Career Compass.
 * This allows the resume to persist across browser sessions so users don't need
 * to re-upload their resume on return visits.
 */

// Storage keys
const RESUME_TEXT_KEY = 'compass-resume-text';
const RESUME_FILENAME_KEY = 'compass-resume-filename';
const RESUME_STORED_AT_KEY = 'compass-resume-stored-at';

export interface CompassResumeData {
  text: string;
  filename: string | null;
  storedAt: string | null;
}

/**
 * Store resume data in localStorage for persistence across sessions
 * @param text - The parsed resume text content
 * @param filename - The original filename (optional)
 */
export function storeCompassResume(text: string, filename?: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(RESUME_TEXT_KEY, text);
    localStorage.setItem(RESUME_STORED_AT_KEY, new Date().toISOString());
    if (filename) {
      localStorage.setItem(RESUME_FILENAME_KEY, filename);
    }
  } catch (error) {
    console.warn('Failed to store resume in localStorage:', error);
  }
}

/**
 * Retrieve stored resume data from localStorage
 * @returns The stored resume data or null if not found
 */
export function getCompassResume(): CompassResumeData | null {
  if (typeof window === 'undefined') return null;

  try {
    const text = localStorage.getItem(RESUME_TEXT_KEY);
    if (!text) return null;

    return {
      text,
      filename: localStorage.getItem(RESUME_FILENAME_KEY),
      storedAt: localStorage.getItem(RESUME_STORED_AT_KEY),
    };
  } catch (error) {
    console.warn('Failed to retrieve resume from localStorage:', error);
    return null;
  }
}

/**
 * Check if resume data exists in localStorage
 * @returns true if resume text is stored
 */
export function hasCompassResume(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const text = localStorage.getItem(RESUME_TEXT_KEY);
    return !!text && text.length > 0;
  } catch {
    return false;
  }
}

/**
 * Clear stored resume data from localStorage
 */
export function clearCompassResume(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(RESUME_TEXT_KEY);
    localStorage.removeItem(RESUME_FILENAME_KEY);
    localStorage.removeItem(RESUME_STORED_AT_KEY);
  } catch (error) {
    console.warn('Failed to clear resume from localStorage:', error);
  }
}
