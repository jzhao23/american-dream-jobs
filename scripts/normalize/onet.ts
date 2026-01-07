/**
 * O*NET Normalizer
 *
 * Passes through O*NET occupation data with category overrides and curated tech skills.
 * Preserves the original data structure for full compatibility.
 *
 * Input: data/processed/occupations_complete.json
 * Output: data/sources/onet/normalized.json
 *
 * Run: npx tsx scripts/normalize/onet.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { getCategory } from '../../src/lib/categories';

// Input/Output paths
const INPUT_FILE = path.join(process.cwd(), 'data/processed/occupations_complete.json');
const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/onet');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'normalized.json');

async function main() {
  console.log('\n=== O*NET Normalizer ===\n');

  // Check input exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  // Load data
  console.log('Loading O*NET occupations data...');
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const occupations = rawData.occupations;
  console.log(`Found ${occupations.length} occupations`);

  // Load curated technology skills (if available)
  const curatedDocsFile = path.join(process.cwd(), 'docs', 'curated-tech-skills', '_combined.json');
  const curatedProcessedFile = path.join(process.cwd(), 'data/processed', 'curated-tech-skills.json');
  const curatedTechSkillsFile = fs.existsSync(curatedDocsFile) ? curatedDocsFile : curatedProcessedFile;
  let curatedSkills: Record<string, string[]> = {};

  if (fs.existsSync(curatedTechSkillsFile)) {
    const curatedData = JSON.parse(fs.readFileSync(curatedTechSkillsFile, 'utf-8'));
    curatedSkills = curatedData.skills || {};
    console.log(`Loaded curated tech skills for ${Object.keys(curatedSkills).length} careers`);
  }

  // Process each occupation - preserve original structure with enhancements
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized: Record<string, any> = {};
  let categoryOverrides = 0;
  let techSkillOverrides = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const occ of occupations as any[]) {
    // Apply category overrides
    const newCategory = getCategory(occ.onet_code);
    if (newCategory !== occ.category) {
      occ.category = newCategory;
      categoryOverrides++;
    }

    // Apply curated tech skills if available
    if (curatedSkills[occ.onet_code]) {
      occ.technology_skills = curatedSkills[occ.onet_code];
      techSkillOverrides++;
    }

    // Store with onet_code as key
    normalized[occ.onet_code] = occ;
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write output
  const output = {
    metadata: {
      source: 'O*NET 30.1',
      normalizedAt: new Date().toISOString(),
      totalOccupations: Object.keys(normalized).length,
      categoryOverrides,
      techSkillOverrides,
    },
    occupations: normalized,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWritten: ${OUTPUT_FILE}`);
  console.log(`  Total occupations: ${Object.keys(normalized).length}`);
  console.log(`  Category overrides: ${categoryOverrides}`);
  console.log(`  Tech skill overrides: ${techSkillOverrides}`);
  console.log('\n=== O*NET Normalization Complete ===\n');
}

main().catch(console.error);
