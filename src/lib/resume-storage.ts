/**
 * Resume Storage Utility
 *
 * Provides sessionStorage-based persistence for resume data from Career Compass.
 * This allows the resume to be available across the session for features like Find Jobs.
 */

// Storage keys
const RESUME_TEXT_KEY = 'compass-resume-text';
const RESUME_FILENAME_KEY = 'compass-resume-filename';

export interface CompassResumeData {
  text: string;
  filename: string | null;
}

/**
 * Store resume data in sessionStorage
 * @param text - The parsed resume text content
 * @param filename - The original filename (optional)
 */
export function storeCompassResume(text: string, filename?: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(RESUME_TEXT_KEY, text);
    if (filename) {
      sessionStorage.setItem(RESUME_FILENAME_KEY, filename);
    }
  } catch (error) {
    console.warn('Failed to store resume in sessionStorage:', error);
  }
}

/**
 * Retrieve stored resume data from sessionStorage
 * @returns The stored resume data or null if not found
 */
export function getCompassResume(): CompassResumeData | null {
  if (typeof window === 'undefined') return null;

  try {
    const text = sessionStorage.getItem(RESUME_TEXT_KEY);
    if (!text) return null;

    return {
      text,
      filename: sessionStorage.getItem(RESUME_FILENAME_KEY),
    };
  } catch (error) {
    console.warn('Failed to retrieve resume from sessionStorage:', error);
    return null;
  }
}

/**
 * Check if resume data exists in sessionStorage
 * @returns true if resume text is stored
 */
export function hasCompassResume(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const text = sessionStorage.getItem(RESUME_TEXT_KEY);
    return !!text && text.length > 0;
  } catch {
    return false;
  }
}

/**
 * Clear stored resume data from sessionStorage
 */
export function clearCompassResume(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(RESUME_TEXT_KEY);
    sessionStorage.removeItem(RESUME_FILENAME_KEY);
  } catch (error) {
    console.warn('Failed to clear resume from sessionStorage:', error);
  }
}
