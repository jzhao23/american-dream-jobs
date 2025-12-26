"use client";

import type { CareerIndex } from "@/types/career";

const STORAGE_KEYS = {
  SAVED_CAREERS: "ad_jobs_saved_careers",
  COMPARE_LIST: "ad_jobs_compare_list",
  RECENTLY_VIEWED: "ad_jobs_recently_viewed",
  ONBOARDING_COMPLETE: "ad_jobs_onboarding_complete",
} as const;

const MAX_RECENTLY_VIEWED = 10;
const MAX_COMPARE_ITEMS = 3;

// Saved Careers (My Careers shortlist)
export function getSavedCareers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SAVED_CAREERS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCareer(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const saved = getSavedCareers();
    if (!saved.includes(slug)) {
      localStorage.setItem(STORAGE_KEYS.SAVED_CAREERS, JSON.stringify([...saved, slug]));
    }
  } catch {
    // Ignore errors
  }
}

export function unsaveCareer(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const saved = getSavedCareers();
    localStorage.setItem(STORAGE_KEYS.SAVED_CAREERS, JSON.stringify(saved.filter(s => s !== slug)));
  } catch {
    // Ignore errors
  }
}

export function isCareerSaved(slug: string): boolean {
  return getSavedCareers().includes(slug);
}

// Compare List
export function getCompareList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.COMPARE_LIST);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToCompare(slug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = getCompareList();
    if (list.length >= MAX_COMPARE_ITEMS) return false;
    if (list.includes(slug)) return true; // Already in list
    localStorage.setItem(STORAGE_KEYS.COMPARE_LIST, JSON.stringify([...list, slug]));
    return true;
  } catch {
    return false;
  }
}

export function removeFromCompare(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getCompareList();
    localStorage.setItem(STORAGE_KEYS.COMPARE_LIST, JSON.stringify(list.filter(s => s !== slug)));
  } catch {
    // Ignore errors
  }
}

export function isInCompare(slug: string): boolean {
  return getCompareList().includes(slug);
}

export function clearCompare(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.COMPARE_LIST);
  } catch {
    // Ignore errors
  }
}

// Recently Viewed
export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToRecentlyViewed(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentlyViewed();
    const updated = [slug, ...recent.filter(s => s !== slug)].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(updated));
  } catch {
    // Ignore errors
  }
}

// Onboarding
export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === "true";
  } catch {
    return false;
  }
}

export function setOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true");
  } catch {
    // Ignore errors
  }
}

