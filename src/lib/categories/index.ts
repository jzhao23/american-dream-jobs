export {
  type CategoryId,
  ALL_CATEGORY_IDS,
  CATEGORY_TO_SOC_PREFIXES,
  getCategory,
  getCategorySafe,
  isValidOnetSocCode,
  isCategoryId,
} from './onet-category-mapping';

export {
  type CategoryMetadata,
  CATEGORY_METADATA,
  getAllCategories,
  getCategoryMetadata,
  getCategoryName,
  getCategoryColor,
  getCategoryIcon,
  getCategorySelectOptions,
} from './category-metadata';

// Manager redistribution mapping (for documentation/transparency)
export {
  MANAGER_TO_CATEGORY,
  PURE_MANAGEMENT_CODES,
} from './manager-redistribution';

// Career-specific overrides (for non-manager careers miscategorized by SOC)
export {
  CAREER_OVERRIDES,
  getCareerOverride,
} from './career-overrides';

// Extended category content for landing pages
export {
  type CategoryContent,
  CATEGORY_CONTENT,
  getCategoryContent,
} from './category-content';

// Category statistics utilities
export {
  type CategoryStats,
  computeCategoryStats,
  getCareersByCategory,
  getAIRiskLevel,
  formatCategoryStatsSummary,
} from './category-stats';
