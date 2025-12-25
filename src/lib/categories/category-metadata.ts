/**
 * Category Metadata
 * Display names, descriptions, and icons for career categories.
 */

import type { CategoryId } from './onet-category-mapping';

export interface CategoryMetadata {
  id: CategoryId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  socMajorGroups: string[];
}

export const CATEGORY_METADATA: Record<CategoryId, CategoryMetadata> = {
  'management': {
    id: 'management',
    name: 'Management & Executive',
    shortName: 'Management',
    description: 'Plan, direct, and coordinate operations of organizations. Includes executives, managers, and supervisors.',
    icon: '👔',
    color: 'bg-slate-100 text-slate-800',
    socMajorGroups: ['11'],
  },
  'business-finance': {
    id: 'business-finance',
    name: 'Business & Finance',
    shortName: 'Business & Finance',
    description: 'Perform financial analysis, accounting, HR, and business operations.',
    icon: '📊',
    color: 'bg-emerald-100 text-emerald-800',
    socMajorGroups: ['13'],
  },
  'legal': {
    id: 'legal',
    name: 'Legal',
    shortName: 'Legal',
    description: 'Provide legal services and support. Includes lawyers, judges, and paralegals.',
    icon: '⚖️',
    color: 'bg-amber-100 text-amber-800',
    socMajorGroups: ['23'],
  },
  'technology': {
    id: 'technology',
    name: 'Technology & Computing',
    shortName: 'Technology',
    description: 'Design, develop, and maintain computer systems and software.',
    icon: '💻',
    color: 'bg-blue-100 text-blue-800',
    socMajorGroups: ['15'],
  },
  'engineering': {
    id: 'engineering',
    name: 'Engineering',
    shortName: 'Engineering',
    description: 'Apply scientific principles to design and build systems and structures.',
    icon: '⚙️',
    color: 'bg-indigo-100 text-indigo-800',
    socMajorGroups: ['17'],
  },
  'science': {
    id: 'science',
    name: 'Science & Research',
    shortName: 'Science',
    description: 'Conduct research and apply scientific knowledge.',
    icon: '🔬',
    color: 'bg-purple-100 text-purple-800',
    socMajorGroups: ['19'],
  },
  'social-services': {
    id: 'social-services',
    name: 'Social Services & Community',
    shortName: 'Social Services',
    description: 'Provide social assistance, counseling, and community support.',
    icon: '🤝',
    color: 'bg-pink-100 text-pink-800',
    socMajorGroups: ['21'],
  },
  'education': {
    id: 'education',
    name: 'Education & Library',
    shortName: 'Education',
    description: 'Teach, train, and provide educational support.',
    icon: '📚',
    color: 'bg-orange-100 text-orange-800',
    socMajorGroups: ['25'],
  },
  'arts-media': {
    id: 'arts-media',
    name: 'Arts, Design & Media',
    shortName: 'Arts & Media',
    description: 'Create artistic, design, and media content.',
    icon: '🎨',
    color: 'bg-fuchsia-100 text-fuchsia-800',
    socMajorGroups: ['27'],
  },
  'healthcare-clinical': {
    id: 'healthcare-clinical',
    name: 'Healthcare: Clinical',
    shortName: 'Healthcare (Clinical)',
    description: 'Diagnose and treat patients directly. Includes physicians, nurses, and therapists.',
    icon: '🩺',
    color: 'bg-red-100 text-red-800',
    socMajorGroups: ['29-1', '29-9'],
  },
  'healthcare-technical': {
    id: 'healthcare-technical',
    name: 'Healthcare: Technical & Support',
    shortName: 'Healthcare (Technical)',
    description: 'Provide technical healthcare services and patient support.',
    icon: '🏥',
    color: 'bg-rose-100 text-rose-800',
    socMajorGroups: ['29-2', '31'],
  },
  'protective-services': {
    id: 'protective-services',
    name: 'Protective Services',
    shortName: 'Protective Services',
    description: 'Protect people and property. Includes police, firefighters, and security.',
    icon: '🛡️',
    color: 'bg-sky-100 text-sky-800',
    socMajorGroups: ['33'],
  },
  'food-service': {
    id: 'food-service',
    name: 'Food Service & Hospitality',
    shortName: 'Food Service',
    description: 'Prepare and serve food.',
    icon: '🍳',
    color: 'bg-yellow-100 text-yellow-800',
    socMajorGroups: ['35'],
  },
  'building-grounds': {
    id: 'building-grounds',
    name: 'Building & Grounds',
    shortName: 'Building & Grounds',
    description: 'Clean and maintain buildings and outdoor spaces.',
    icon: '🏢',
    color: 'bg-lime-100 text-lime-800',
    socMajorGroups: ['37'],
  },
  'personal-care': {
    id: 'personal-care',
    name: 'Personal Care & Service',
    shortName: 'Personal Care',
    description: 'Provide personal services like hairstyling, fitness training, and childcare.',
    icon: '💈',
    color: 'bg-teal-100 text-teal-800',
    socMajorGroups: ['39'],
  },
  'sales': {
    id: 'sales',
    name: 'Sales',
    shortName: 'Sales',
    description: 'Sell products and services.',
    icon: '🛒',
    color: 'bg-cyan-100 text-cyan-800',
    socMajorGroups: ['41'],
  },
  'office-admin': {
    id: 'office-admin',
    name: 'Office & Administrative',
    shortName: 'Office & Admin',
    description: 'Perform administrative and clerical tasks.',
    icon: '📋',
    color: 'bg-gray-100 text-gray-800',
    socMajorGroups: ['43'],
  },
  'agriculture': {
    id: 'agriculture',
    name: 'Agriculture & Natural Resources',
    shortName: 'Agriculture',
    description: 'Work in farming, fishing, and forestry.',
    icon: '🌾',
    color: 'bg-green-100 text-green-800',
    socMajorGroups: ['45'],
  },
  'construction': {
    id: 'construction',
    name: 'Construction & Extraction',
    shortName: 'Construction',
    description: 'Build structures and extract natural resources.',
    icon: '🏗️',
    color: 'bg-orange-100 text-orange-800',
    socMajorGroups: ['47'],
  },
  'installation-repair': {
    id: 'installation-repair',
    name: 'Installation, Maintenance & Repair',
    shortName: 'Installation & Repair',
    description: 'Install, maintain, and repair equipment and systems.',
    icon: '🔧',
    color: 'bg-stone-100 text-stone-800',
    socMajorGroups: ['49'],
  },
  'production': {
    id: 'production',
    name: 'Manufacturing & Production',
    shortName: 'Manufacturing',
    description: 'Manufacture and assemble products.',
    icon: '🏭',
    color: 'bg-zinc-100 text-zinc-800',
    socMajorGroups: ['51'],
  },
  'transportation': {
    id: 'transportation',
    name: 'Transportation & Logistics',
    shortName: 'Transportation',
    description: 'Move people and materials.',
    icon: '🚛',
    color: 'bg-violet-100 text-violet-800',
    socMajorGroups: ['53'],
  },
  'military': {
    id: 'military',
    name: 'Military',
    shortName: 'Military',
    description: 'Serve in the armed forces.',
    icon: '🎖️',
    color: 'bg-neutral-100 text-neutral-800',
    socMajorGroups: ['55'],
  },
};

/**
 * Get all categories sorted by name.
 */
export function getAllCategories(): CategoryMetadata[] {
  return Object.values(CATEGORY_METADATA).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get category metadata by ID.
 */
export function getCategoryMetadata(id: CategoryId): CategoryMetadata {
  return CATEGORY_METADATA[id];
}

/**
 * Get category name by ID.
 */
export function getCategoryName(id: CategoryId): string {
  return CATEGORY_METADATA[id].name;
}

/**
 * Get category color by ID.
 */
export function getCategoryColor(id: CategoryId): string {
  return CATEGORY_METADATA[id].color;
}

/**
 * Get category icon by ID.
 */
export function getCategoryIcon(id: CategoryId): string {
  return CATEGORY_METADATA[id].icon;
}

/**
 * Get options for a select/dropdown.
 */
export function getCategorySelectOptions(): Array<{ value: CategoryId; label: string }> {
  return getAllCategories().map(cat => ({ value: cat.id, label: cat.name }));
}
