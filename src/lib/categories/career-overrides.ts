/**
 * Career Category Overrides
 *
 * Some occupations are miscategorized by their SOC major group.
 * This file provides explicit overrides for careers that belong
 * in a different category than their SOC code would suggest.
 *
 * Pattern follows manager-redistribution.ts for managers.
 *
 * To add a new override:
 * 1. Find the career's O*NET-SOC code (e.g., "41-9012.00")
 * 2. Add an entry to CAREER_OVERRIDES with the correct category
 * 3. Update docs/CATEGORY_SYSTEM.md with the new override
 * 4. Run `npm run data:generate-final` to regenerate data
 */

import type { CategoryId } from './onet-category-mapping';

/**
 * Map of O*NET-SOC codes to their correct category.
 * These override the default SOC major group mapping.
 *
 * | Career | SOC Code | Default Category | Override To | Reason |
 * |--------|----------|------------------|-------------|--------|
 * | Models | 41-9012 | sales | arts-media | Creative/performance work |
 */
export const CAREER_OVERRIDES: Record<string, CategoryId> = {
  // Models - Creative/performance work, not transactional sales
  // SOC 41 = Sales, but models work in fashion, entertainment, and artistic endeavors
  '41-9012.00': 'arts-media',
};

/**
 * Check if a career has a category override.
 * @param onetCode - The O*NET-SOC code (e.g., "41-9012.00")
 * @returns The override category ID, or undefined if no override exists
 */
export function getCareerOverride(onetCode: string): CategoryId | undefined {
  return CAREER_OVERRIDES[onetCode];
}
