/**
 * O*NET-SOC to Category Mapping
 *
 * Maps O*NET-SOC occupation codes to user-friendly career categories.
 * Based on BLS Standard Occupational Classification (SOC) 2018.
 *
 * ## Override Priority
 *
 * 1. Career-specific overrides (career-overrides.ts) - e.g., Models → arts-media
 * 2. Manager redistribution (manager-redistribution.ts) - genealogical principle
 * 3. Healthcare split logic - clinical vs technical
 * 4. Default SOC major group mapping
 *
 * @see https://www.bls.gov/soc/2018/major_groups.htm
 * @see https://www.onetcenter.org/taxonomy.html
 */

import { MANAGER_TO_CATEGORY } from './manager-redistribution';
import { getCareerOverride } from './career-overrides';

// ============================================================================
// Types
// ============================================================================

export type CategoryId =
  | 'management'
  | 'business-finance'
  | 'legal'
  | 'technology'
  | 'engineering'
  | 'science'
  | 'social-services'
  | 'education'
  | 'arts-media'
  | 'healthcare-clinical'
  | 'healthcare-technical'
  | 'protective-services'
  | 'food-service'
  | 'building-grounds'
  | 'personal-care'
  | 'sales'
  | 'office-admin'
  | 'agriculture'
  | 'construction'
  | 'installation-repair'
  | 'production'
  | 'transportation'
  | 'military';

export const ALL_CATEGORY_IDS: readonly CategoryId[] = [
  'management',
  'business-finance',
  'legal',
  'technology',
  'engineering',
  'science',
  'social-services',
  'education',
  'arts-media',
  'healthcare-clinical',
  'healthcare-technical',
  'protective-services',
  'food-service',
  'building-grounds',
  'personal-care',
  'sales',
  'office-admin',
  'agriculture',
  'construction',
  'installation-repair',
  'production',
  'transportation',
  'military',
] as const;

// ============================================================================
// Mapping Configuration
// ============================================================================

/**
 * Maps SOC Major Group (first 2 digits) to category ID.
 * Healthcare (29, 31) handled separately due to split logic.
 */
const MAJOR_GROUP_TO_CATEGORY: Record<string, CategoryId> = {
  '11': 'management',
  '13': 'business-finance',
  '15': 'technology',
  '17': 'engineering',
  '19': 'science',
  '21': 'social-services',
  '23': 'legal',
  '25': 'education',
  '27': 'arts-media',
  // 29, 31: handled by healthcare split
  '33': 'protective-services',
  '35': 'food-service',
  '37': 'building-grounds',
  '39': 'personal-care',
  '41': 'sales',
  '43': 'office-admin',
  '45': 'agriculture',
  '47': 'construction',
  '49': 'installation-repair',
  '51': 'production',
  '53': 'transportation',
  '55': 'military',
};

/**
 * Reverse mapping: category to SOC prefixes.
 * Useful for filtering occupations by category.
 */
export const CATEGORY_TO_SOC_PREFIXES: Record<CategoryId, string[]> = {
  'management': ['11'],
  'business-finance': ['13'],
  'legal': ['23'],
  'technology': ['15'],
  'engineering': ['17'],
  'science': ['19'],
  'social-services': ['21'],
  'education': ['25'],
  'arts-media': ['27'],
  'healthcare-clinical': ['29-1', '29-9'],
  'healthcare-technical': ['29-2', '31'],
  'protective-services': ['33'],
  'food-service': ['35'],
  'building-grounds': ['37'],
  'personal-care': ['39'],
  'sales': ['41'],
  'office-admin': ['43'],
  'agriculture': ['45'],
  'construction': ['47'],
  'installation-repair': ['49'],
  'production': ['51'],
  'transportation': ['53'],
  'military': ['55'],
};

// ============================================================================
// Validation
// ============================================================================

const ONET_SOC_CODE_REGEX = /^\d{2}-\d{4}(\.\d{2})?$/;

export function isValidOnetSocCode(code: string): boolean {
  return ONET_SOC_CODE_REGEX.test(code);
}

// ============================================================================
// Core Mapping Function
// ============================================================================

/**
 * Gets the category ID for an O*NET-SOC occupation code.
 *
 * @param onetSocCode - Code like "15-1252.00" or "15-1252"
 * @returns The category ID
 * @throws Error if code format is invalid or major group is unknown
 *
 * @example
 * getCategory("29-1141.00") // "healthcare-clinical" (Registered Nurses)
 * getCategory("29-2034.00") // "healthcare-technical" (Radiologic Technologists)
 * getCategory("15-1252.00") // "technology" (Software Developers)
 * getCategory("47-2111.00") // "construction" (Electricians)
 * getCategory("11-2022.00") // "sales" (Sales Managers - genealogical redistribution)
 * getCategory("11-1011.00") // "management" (Chief Executives - stays in management)
 * getCategory("41-9012.00") // "arts-media" (Models - career override)
 */
export function getCategory(onetSocCode: string): CategoryId {
  if (!isValidOnetSocCode(onetSocCode)) {
    throw new Error(
      `Invalid O*NET-SOC code format: "${onetSocCode}". Expected: XX-XXXX or XX-XXXX.XX`
    );
  }

  // 1. Check career-specific overrides first (e.g., Models → arts-media)
  const careerOverride = getCareerOverride(onetSocCode);
  if (careerOverride) {
    return careerOverride;
  }

  const majorGroup = onetSocCode.substring(0, 2);
  const minorGroup = onetSocCode.substring(0, 4);

  // 2. Manager redistribution: check if this management role maps to a domain category
  // Based on "genealogical principle" - where did this manager get promoted from?
  if (majorGroup === '11') {
    const redistributedCategory = MANAGER_TO_CATEGORY[onetSocCode];
    if (redistributedCategory) {
      return redistributedCategory;
    }
    // Not in redistribution map - stays in 'management' (pure executive roles)
    return 'management';
  }

  // Healthcare split logic
  if (majorGroup === '29') {
    if (minorGroup === '29-1' || minorGroup === '29-9') {
      return 'healthcare-clinical';
    }
    return 'healthcare-technical';
  }

  if (majorGroup === '31') {
    return 'healthcare-technical';
  }

  // Standard mapping
  const category = MAJOR_GROUP_TO_CATEGORY[majorGroup];
  if (!category) {
    throw new Error(`Unknown SOC major group: "${majorGroup}" from code "${onetSocCode}"`);
  }

  return category;
}

/**
 * Safe version that returns undefined instead of throwing.
 */
export function getCategorySafe(onetSocCode: string): CategoryId | undefined {
  try {
    return getCategory(onetSocCode);
  } catch {
    return undefined;
  }
}

/**
 * Type guard for CategoryId.
 */
export function isCategoryId(value: string): value is CategoryId {
  return ALL_CATEGORY_IDS.includes(value as CategoryId);
}
