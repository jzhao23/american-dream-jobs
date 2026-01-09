/**
 * Specializations Utility Library
 *
 * Provides utilities for loading and working with specialization data
 * for consolidated careers. Used by Compare and Calculator pages to
 * allow users to select specific specializations with different education
 * requirements within a consolidated career.
 */

import type { Career } from '@/types/career';

// Import specializations data
import specializationsData from '../../data/output/specializations.json';

const specializations = specializationsData as Career[];

/**
 * Lightweight specialization info for dropdowns and selectors
 */
export interface SpecializationOption {
  slug: string;
  title: string;
  education_duration: {
    min_years: number;
    typical_years: number;
    max_years: number;
  } | null;
  estimated_cost: {
    min_cost: number;
    typical_cost: number;
    max_cost: number;
  } | null;
  typical_education: string | null;
}

/**
 * Get specialization options for a consolidated career
 * Returns lightweight objects suitable for dropdown display
 */
export function getSpecializationsForCareer(specializationSlugs: string[]): SpecializationOption[] {
  if (!specializationSlugs || specializationSlugs.length === 0) {
    return [];
  }

  return specializationSlugs
    .map(slug => {
      const spec = specializations.find(s => s.slug === slug);
      if (!spec) return null;

      return {
        slug: spec.slug,
        title: spec.title,
        education_duration: spec.education?.education_duration ? {
          min_years: spec.education.education_duration.min_years,
          typical_years: spec.education.education_duration.typical_years,
          max_years: spec.education.education_duration.max_years,
        } : null,
        estimated_cost: spec.education?.estimated_cost ? {
          min_cost: spec.education.estimated_cost.min_cost,
          typical_cost: spec.education.estimated_cost.typical_cost,
          max_cost: spec.education.estimated_cost.max_cost,
        } : null,
        typical_education: spec.education?.typical_entry_education || null,
      };
    })
    .filter((spec): spec is SpecializationOption => spec !== null)
    .sort((a, b) => {
      // Sort by typical years ascending
      const yearsA = a.education_duration?.typical_years || 0;
      const yearsB = b.education_duration?.typical_years || 0;
      return yearsA - yearsB;
    });
}

/**
 * Get full specialization data by slug
 */
export function getSpecializationBySlug(slug: string): Career | null {
  return specializations.find(s => s.slug === slug) || null;
}

/**
 * Get education data for a specific specialization
 * Returns the full education object for cost calculations
 */
export function getSpecializationEducation(slug: string): Career['education'] | null {
  const spec = specializations.find(s => s.slug === slug);
  return spec?.education || null;
}

/**
 * Check if a career has multiple specializations with different education requirements
 * Useful to determine if specialization selector should be shown
 */
export function hasEducationVariance(specializationSlugs: string[]): boolean {
  const specs = getSpecializationsForCareer(specializationSlugs);
  if (specs.length <= 1) return false;

  const durations = specs
    .map(s => s.education_duration?.typical_years)
    .filter((d): d is number => d !== null && d !== undefined);

  if (durations.length <= 1) return false;

  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  // Consider variance significant if there's at least 1 year difference
  return (maxDuration - minDuration) >= 1;
}
