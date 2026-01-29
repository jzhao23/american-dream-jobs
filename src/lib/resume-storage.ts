/**
 * Resume Storage Utility
 *
 * This is a compatibility wrapper around the new unified localStorage system.
 * All resume data is now stored in the unified storage key.
 *
 * @deprecated Use the functions from lib/localStorage.ts directly
 */

import {
  saveResumeData,
  getResumeData,
  hasResumeData,
  clearResumeData,
} from "./localStorage";

export interface CompassResumeData {
  text: string;
  filename: string | null;
  storedAt: string | null;
}

/**
 * Store resume data in localStorage for persistence across sessions
 * @param text - The parsed resume text content
 * @param filename - The original filename (optional)
 * @deprecated Use saveResumeData from lib/localStorage.ts
 */
export function storeCompassResume(text: string, filename?: string): void {
  saveResumeData({
    fileName: filename || "resume.pdf",
    uploadedAt: new Date().toISOString(),
    parsedContent: text,
  });
}

/**
 * Retrieve stored resume data from localStorage
 * @returns The stored resume data or null if not found
 * @deprecated Use getResumeData from lib/localStorage.ts
 */
export function getCompassResume(): CompassResumeData | null {
  const resume = getResumeData();
  if (!resume || !resume.parsedContent) return null;

  return {
    text: resume.parsedContent,
    filename: resume.fileName,
    storedAt: resume.uploadedAt,
  };
}

/**
 * Check if resume data exists in localStorage
 * @returns true if resume text is stored
 * @deprecated Use hasResumeData from lib/localStorage.ts
 */
export function hasCompassResume(): boolean {
  return hasResumeData();
}

/**
 * Clear stored resume data from localStorage
 * @deprecated Use clearResumeData from lib/localStorage.ts
 */
export function clearCompassResume(): void {
  clearResumeData();
}
