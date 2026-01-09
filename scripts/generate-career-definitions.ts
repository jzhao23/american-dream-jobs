/**
 * Auto-Generate Career Definitions
 *
 * This script automatically generates career consolidation definitions
 * based on O*NET SOC code patterns. It groups careers by their SOC prefix
 * (first 5 characters like "29-12") to create logical career groups.
 *
 * Features:
 * - SOC-to-Title mapping for descriptive names (not generic "Engineers")
 * - Detects and skips O*NET catch-all descriptions
 * - No numbered suffix patterns (engineers-1721)
 *
 * Run: npx tsx scripts/generate-career-definitions.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
interface Career {
  slug: string;
  title: string;
  onet_code?: string;
  category: string;
  description: string;
  data_source?: string;
}

interface CareerDefinition {
  id: string;
  title: string;
  category: string;
  groupingStrategy: 'soc-based' | 'functional' | 'singleton' | 'catchall';
  displayStrategy: 'show-specializations' | 'career-only';
  specializationLabel?: string;
  primaryOnetCode: string;
  onetCodes: string[];
  description: string;
  keywords: string[];
}

interface DefinitionsFile {
  version: string;
  description: string;
  lastUpdated: string;
  categories: string[];
  careers: Record<string, CareerDefinition>;
}

// Categories that are already manually curated - skip these
const CURATED_CATEGORIES = ['healthcare-clinical', 'healthcare-technical', 'technology'];

// SOC-to-Title mapping for descriptive career names
// This prevents generic titles like "Engineers" or "Managers"
const SOC_TITLE_MAP: Record<string, string> = {
  // Management (11-XX)
  '11-10': 'Chief Executives & General Managers',
  '11-20': 'Advertising & Marketing Managers',
  '11-30': 'Operations Managers',
  '11-90': 'Other Managers',
  '11-91': 'Facilities & Property Managers',

  // Business & Financial (13-XX)
  '13-10': 'Business Operations Specialists',
  '13-11': 'Business Analysts & Project Managers',
  '13-20': 'Financial Specialists',

  // Architecture & Engineering (17-XX)
  '17-10': 'Architects & Surveyors',
  '17-20': 'Engineers',  // Will be further refined
  '17-21': 'Design Engineers',  // Aerospace, chemical, civil, etc.
  '17-30': 'Engineering Technicians',

  // Life, Physical, and Social Science (19-XX)
  '19-10': 'Agricultural & Food Scientists',
  '19-20': 'Physical Scientists',
  '19-30': 'Social Scientists',
  '19-40': 'Life Scientists',

  // Education (25-XX)
  '25-10': 'Postsecondary Teachers',
  '25-20': 'Preschool & Elementary Teachers',
  '25-30': 'Secondary & Special Education Teachers',
  '25-40': 'Librarians & Educational Specialists',
  '25-90': 'Other Education Workers',

  // Arts, Design, Entertainment (27-XX)
  '27-10': 'Artists & Designers',
  '27-20': 'Entertainers & Performers',
  '27-30': 'Media & Communication Workers',
  '27-40': 'Media Equipment Workers',

  // Healthcare Practitioners (29-XX) - mostly curated but some overlap
  '29-10': 'Healthcare Practitioners',
  '29-20': 'Healthcare Technologists',
  '29-90': 'Other Healthcare Practitioners',

  // Healthcare Support (31-XX)
  '31-10': 'Nursing & Home Health Aides',
  '31-90': 'Other Healthcare Support',

  // Protective Service (33-XX)
  '33-10': 'Supervisors, Protective Services',
  '33-20': 'Firefighters',
  '33-30': 'Law Enforcement Officers',
  '33-90': 'Other Protective Service Workers',

  // Food Preparation (35-XX)
  '35-10': 'Food Service Supervisors',
  '35-20': 'Cooks',
  '35-30': 'Food Preparation Workers',
  '35-90': 'Other Food Service Workers',

  // Building & Grounds (37-XX)
  '37-10': 'Building Cleaning Supervisors',
  '37-20': 'Building Cleaners',
  '37-30': 'Grounds Maintenance Workers',

  // Personal Care (39-XX)
  '39-10': 'Personal Care Supervisors',
  '39-20': 'Animal Care Workers',
  '39-30': 'Entertainment Attendants',
  '39-40': 'Funeral Service Workers',
  '39-50': 'Personal Appearance Workers',
  '39-90': 'Other Personal Care Workers',

  // Sales (41-XX)
  '41-10': 'Sales Supervisors',
  '41-20': 'Retail Sales Workers',
  '41-30': 'Sales Representatives',
  '41-40': 'Sales Representatives, Services',
  '41-90': 'Other Sales Workers',

  // Office & Administrative (43-XX)
  '43-10': 'Office Supervisors',
  '43-20': 'Communications Equipment Operators',
  '43-30': 'Financial Clerks',
  '43-40': 'Information & Record Clerks',
  '43-50': 'Material Recording Clerks',
  '43-60': 'Secretaries & Administrative Assistants',
  '43-90': 'Other Office Support Workers',

  // Farming, Fishing, Forestry (45-XX)
  '45-10': 'Agricultural Supervisors',
  '45-20': 'Agricultural Workers',
  '45-30': 'Fishing & Hunting Workers',
  '45-40': 'Forest & Conservation Workers',

  // Construction (47-XX)
  '47-10': 'Construction Supervisors',
  '47-20': 'Construction Trades Workers',
  '47-30': 'Helpers, Construction Trades',
  '47-40': 'Other Construction Workers',
  '47-50': 'Extraction Workers',

  // Installation, Maintenance, Repair (49-XX)
  '49-10': 'Maintenance Supervisors',
  '49-20': 'Electrical Equipment Mechanics',
  '49-30': 'Vehicle & Mobile Equipment Mechanics',
  '49-90': 'Other Installation & Repair Workers',

  // Production (51-XX)
  '51-10': 'Production Supervisors',
  '51-20': 'Assemblers & Fabricators',
  '51-30': 'Food Processing Workers',
  '51-40': 'Metal & Plastic Machine Workers',
  '51-50': 'Printing Workers',
  '51-60': 'Textile Workers',
  '51-70': 'Woodworkers',
  '51-80': 'Plant & System Operators',
  '51-90': 'Other Production Workers',

  // Transportation (53-XX)
  '53-10': 'Transportation Supervisors',
  '53-20': 'Air Transportation Workers',
  '53-30': 'Motor Vehicle Operators',
  '53-40': 'Rail Transportation Workers',
  '53-50': 'Water Transportation Workers',
  '53-60': 'Other Transportation Workers',
  '53-70': 'Material Moving Workers',

  // Military (55-XX)
  '55-10': 'Military Officer Careers',
  '55-20': 'First-Line Military Supervisors',
  '55-30': 'Military Enlisted Careers',
};

// Descriptions that indicate O*NET catch-all categories - skip these
const BAD_DESCRIPTION_PATTERNS = [
  /^All .* not listed separately\.?$/i,
  /^All other .* not listed separately\.?$/i,
  /^This broad occupation includes/i,
];

// Helper to create a slug from a title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Check if description is a bad O*NET catch-all
function isBadDescription(description: string): boolean {
  return BAD_DESCRIPTION_PATTERNS.some(pattern => pattern.test(description));
}

// Get the best title for a SOC prefix group
function getTitleForSOCPrefix(prefix: string, careers: Career[]): string {
  // First check our explicit mapping
  if (SOC_TITLE_MAP[prefix]) {
    return SOC_TITLE_MAP[prefix];
  }

  // Try 4-char prefix (major group)
  const majorPrefix = prefix.substring(0, 4);
  if (SOC_TITLE_MAP[majorPrefix]) {
    return SOC_TITLE_MAP[majorPrefix];
  }

  // Fall back to finding common title pattern
  return findCommonTitle(careers, prefix);
}

// Helper to find common words in titles for generating a group name
function findCommonTitle(careers: Career[], prefix: string): string {
  if (careers.length === 1) {
    return careers[0].title;
  }

  const titles = careers.map(c => c.title);

  // Check for common suffixes
  const commonSuffixes = [
    'Engineers', 'Technicians', 'Teachers', 'Managers', 'Workers',
    'Operators', 'Specialists', 'Analysts', 'Clerks', 'Supervisors',
    'Installers', 'Repairers', 'Assemblers', 'Inspectors', 'Scientists',
    'Designers', 'Writers', 'Editors', 'Developers', 'Programmers',
    'Nurses', 'Therapists', 'Assistants', 'Aides'
  ];

  for (const suffix of commonSuffixes) {
    const matchCount = titles.filter(t => t.includes(suffix)).length;
    if (matchCount >= careers.length * 0.5) {
      // Try to find a common prefix before the suffix
      const withSuffix = titles.filter(t => t.includes(suffix));

      // Look for category-specific prefix
      const category = careers[0].category;
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');

      // Create descriptive title based on category + suffix
      return `${categoryName} ${suffix}`;
    }
  }

  // If no common pattern, use category + "Professionals"
  const category = careers[0].category;
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
  return `${categoryName} Professionals`;
}

// Find the best career to use as primary (not a catch-all)
function findPrimaryCareer(careers: Career[]): Career {
  // Prefer careers with good descriptions (not catch-all)
  const withGoodDesc = careers.filter(c => !isBadDescription(c.description));

  if (withGoodDesc.length > 0) {
    // Return the one with the longest description (usually most detailed)
    return withGoodDesc.sort((a, b) => (b.description?.length || 0) - (a.description?.length || 0))[0];
  }

  // Fall back to first career
  return careers[0];
}

// Generate a good description from member careers
function generateDescription(careers: Career[]): string {
  // Filter out bad descriptions
  const goodDescCareers = careers.filter(c => !isBadDescription(c.description));

  if (goodDescCareers.length === 0) {
    // All descriptions are bad - create a placeholder
    const category = careers[0].category;
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
    return `Professionals in the ${categoryName} field. This career encompasses ${careers.length} specializations.`;
  }

  if (goodDescCareers.length === 1) {
    return goodDescCareers[0].description;
  }

  // Use the most detailed description
  const sorted = [...goodDescCareers].sort((a, b) =>
    (b.description?.length || 0) - (a.description?.length || 0)
  );

  return sorted[0].description;
}

// Generate keywords from titles
function generateKeywords(careers: Career[]): string[] {
  const keywords = new Set<string>();

  for (const career of careers) {
    const words = career.title.toLowerCase().split(/[\s,]+/);
    for (const word of words) {
      if (word.length > 3 && !['and', 'the', 'for', 'all', 'other', 'except'].includes(word)) {
        keywords.add(word);
      }
    }
  }

  return Array.from(keywords).slice(0, 8);
}

// Main function
async function main() {
  console.log('🚀 Starting Career Definitions Generation (v3.0)...\n');

  // Load existing curated definitions (healthcare, technology)
  const existingDefsPath = path.join(process.cwd(), 'data/consolidation/career-definitions.json');
  let curatedDefs: DefinitionsFile = {
    version: '3.0',
    description: 'Career consolidation definitions',
    lastUpdated: new Date().toISOString().split('T')[0],
    categories: [],
    careers: {}
  };

  // Only keep curated definitions from specific categories
  if (fs.existsSync(existingDefsPath)) {
    const existing = JSON.parse(fs.readFileSync(existingDefsPath, 'utf-8')) as DefinitionsFile;
    for (const [id, def] of Object.entries(existing.careers)) {
      if (CURATED_CATEGORIES.includes(def.category)) {
        curatedDefs.careers[id] = def;
      }
    }
    console.log(`✓ Kept ${Object.keys(curatedDefs.careers).length} curated definitions (healthcare, technology)`);
  }

  // Load raw careers data (not consolidated output)
  const careersPath = path.join(process.cwd(), 'data/careers.generated.json');
  if (!fs.existsSync(careersPath)) {
    console.error('❌ data/careers.generated.json not found. Run data generation first.');
    process.exit(1);
  }

  const careers: Career[] = JSON.parse(fs.readFileSync(careersPath, 'utf-8'));
  console.log(`✓ Loaded ${careers.length} raw careers\n`);

  // Filter to categories we need to process (exclude curated)
  const toProcess = careers.filter(c =>
    !CURATED_CATEGORIES.includes(c.category) && c.onet_code
  );

  console.log(`📊 Processing ${toProcess.length} careers from ${new Set(toProcess.map(c => c.category)).size} categories\n`);

  // Group by SOC prefix (first 5 chars: XX-XX)
  const byPrefix: Record<string, Career[]> = {};
  for (const career of toProcess) {
    const prefix = career.onet_code!.substring(0, 5);
    if (!byPrefix[prefix]) byPrefix[prefix] = [];
    byPrefix[prefix].push(career);
  }

  console.log(`📁 Found ${Object.keys(byPrefix).length} SOC prefix groups\n`);

  // Track used slugs to prevent duplicates
  const usedSlugs = new Set<string>(Object.keys(curatedDefs.careers));
  const newDefinitions: Record<string, CareerDefinition> = {};
  const categories = new Set<string>();

  // Add curated categories
  for (const def of Object.values(curatedDefs.careers)) {
    categories.add(def.category);
  }

  // Generate definitions for each group
  for (const [prefix, groupCareers] of Object.entries(byPrefix)) {
    // Get descriptive title for this SOC group
    let title = getTitleForSOCPrefix(prefix, groupCareers);
    let id = slugify(title);

    // Handle slug collisions by making title more specific
    if (usedSlugs.has(id)) {
      // Add category context to make unique
      const category = groupCareers[0].category;
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
      title = `${categoryName} ${title}`;
      id = slugify(title);

      // If still collides, skip this group (will be handled by existing definition)
      if (usedSlugs.has(id)) {
        console.log(`  ⚠ Skipping ${prefix}: slug "${id}" already exists`);
        continue;
      }
    }

    usedSlugs.add(id);

    // Find the best primary career
    const primaryCareer = findPrimaryCareer(groupCareers);

    const definition: CareerDefinition = {
      id,
      title,
      category: groupCareers[0].category,
      groupingStrategy: groupCareers.length > 1 ? 'soc-based' : 'singleton',
      displayStrategy: groupCareers.length > 1 ? 'show-specializations' : 'career-only',
      ...(groupCareers.length > 1 && { specializationLabel: 'Specializations' }),
      primaryOnetCode: primaryCareer.onet_code!,
      onetCodes: groupCareers.map(c => c.onet_code!),
      description: generateDescription(groupCareers),
      keywords: generateKeywords(groupCareers)
    };

    newDefinitions[id] = definition;
    categories.add(groupCareers[0].category);
  }

  // Merge curated + new definitions
  const allDefinitions: Record<string, CareerDefinition> = {
    ...curatedDefs.careers,
    ...newDefinitions
  };

  // Create output
  const output: DefinitionsFile = {
    version: '3.0',
    description: 'Career consolidation definitions - maps O*NET codes to consolidated careers',
    lastUpdated: new Date().toISOString().split('T')[0],
    categories: Array.from(categories).sort(),
    careers: allDefinitions
  };

  // Save
  fs.writeFileSync(existingDefsPath, JSON.stringify(output, null, 2));

  // Summary
  console.log('✅ Career definitions generated!\n');
  console.log(`📊 Summary:`);
  console.log(`   Total definitions: ${Object.keys(allDefinitions).length}`);
  console.log(`   Curated (kept): ${Object.keys(curatedDefs.careers).length}`);
  console.log(`   New (auto-generated): ${Object.keys(newDefinitions).length}`);
  console.log(`   Categories: ${output.categories.length}`);
  console.log(`\n📁 Saved to: data/consolidation/career-definitions.json`);

  // Show breakdown by category
  console.log('\n📋 Definitions by category:');
  const byCategory: Record<string, number> = {};
  for (const def of Object.values(allDefinitions)) {
    byCategory[def.category] = (byCategory[def.category] || 0) + 1;
  }
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });

  // Check for potential issues
  console.log('\n🔍 Quality checks:');
  const badDescCount = Object.values(allDefinitions).filter(d => isBadDescription(d.description)).length;
  console.log(`   Definitions with catch-all descriptions: ${badDescCount}`);

  const duplicateTitles = Object.values(allDefinitions)
    .map(d => d.title)
    .filter((t, i, arr) => arr.indexOf(t) !== i);
  if (duplicateTitles.length > 0) {
    console.log(`   ⚠ Duplicate titles found: ${[...new Set(duplicateTitles)].join(', ')}`);
  } else {
    console.log(`   ✓ No duplicate titles`);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
