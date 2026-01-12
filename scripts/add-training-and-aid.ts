/**
 * Add Training Programs and Financial Aid to Careers
 *
 * Simple script to add training programs and financial aid data
 * to existing careers.json and specializations.json files.
 *
 * Run: npx tsx scripts/add-training-and-aid.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const SOURCES_DIR = path.join(process.cwd(), 'data/sources');
const OUTPUT_DIR = path.join(process.cwd(), 'data/output');

const CAREERS_FILE = path.join(OUTPUT_DIR, 'careers.json');
const SPECIALIZATIONS_FILE = path.join(OUTPUT_DIR, 'specializations.json');
const SEED_DIR = path.join(process.cwd(), 'data/seed');
const TRAINING_PROGRAMS_FILE = path.join(SEED_DIR, 'training-programs.json');
const FINANCIAL_AID_FILE = path.join(SEED_DIR, 'scholarships.json');

interface Career {
  slug: string;
  category: string;
  education?: {
    typical_entry_education?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  training_programs?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  financial_aid?: any;
}

function loadJson(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    console.warn(`  Warning: File not found: ${filePath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function main() {
  console.log('\n=== Adding Training Programs & Financial Aid ===\n');

  // Load existing careers
  const careers: Career[] = loadJson(CAREERS_FILE);
  if (!careers) {
    console.error('Error: careers.json not found');
    process.exit(1);
  }
  console.log(`Loaded ${careers.length} careers`);

  // Load training programs data
  const trainingData = loadJson(TRAINING_PROGRAMS_FILE);
  const financialData = loadJson(FINANCIAL_AID_FILE);

  // Build training programs lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trainingProgramsMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trainingCategoryResources = new Map<string, any[]>();

  if (trainingData) {
    const programs = trainingData.programs || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const programsById = new Map(programs.map((p: any) => [p.id, p]));
    const mappings = trainingData.career_mappings || {};

    for (const [careerSlug, programIds] of Object.entries(mappings)) {
      const careerPrograms = (programIds as string[])
        .map(id => programsById.get(id))
        .filter(Boolean);
      if (careerPrograms.length > 0) {
        trainingProgramsMap.set(careerSlug, {
          programs: careerPrograms,
          last_updated: trainingData.last_updated,
        });
      }
    }

    const catResources = trainingData.category_resources || {};
    for (const [category, resources] of Object.entries(catResources)) {
      trainingCategoryResources.set(category, resources as any[]);
    }
    console.log(`  Loaded ${trainingProgramsMap.size} training program mappings`);
    console.log(`  Loaded ${trainingCategoryResources.size} category training resources`);
  }

  // Build financial aid lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const financialAidMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const financialCategoryResources = new Map<string, any[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const federalAidRules = new Map<string, any>();

  if (financialData) {
    const scholarships = financialData.scholarships || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scholarshipsById = new Map(scholarships.map((s: any) => [s.id, s]));
    const mappings = financialData.career_mappings || {};

    for (const [careerSlug, scholarshipIds] of Object.entries(mappings)) {
      const careerScholarships = (scholarshipIds as string[])
        .map(id => scholarshipsById.get(id))
        .filter(Boolean);
      if (careerScholarships.length > 0) {
        financialAidMap.set(careerSlug, {
          scholarships: careerScholarships,
          last_updated: financialData.last_updated,
        });
      }
    }

    const catResources = financialData.category_resources || {};
    for (const [category, resources] of Object.entries(catResources)) {
      financialCategoryResources.set(category, resources as any[]);
    }

    const aidRules = financialData.federal_aid_rules || {};
    for (const [eduLevel, rules] of Object.entries(aidRules)) {
      federalAidRules.set(eduLevel, rules);
    }
    console.log(`  Loaded ${financialAidMap.size} financial aid mappings`);
    console.log(`  Loaded ${financialCategoryResources.size} category financial resources`);
    console.log(`  Loaded ${federalAidRules.size} federal aid rules`);
  }

  // Apply to careers
  let trainingAdded = 0;
  let financialAidAdded = 0;

  for (const career of careers) {
    // Add training programs
    const trainingPrograms = trainingProgramsMap.get(career.slug);
    if (trainingPrograms) {
      career.training_programs = {
        ...trainingPrograms,
        category_resources: trainingCategoryResources.get(career.category) || [],
      };
      trainingAdded++;
    } else if (trainingCategoryResources.has(career.category)) {
      career.training_programs = {
        programs: [],
        category_resources: trainingCategoryResources.get(career.category),
        last_updated: trainingData?.last_updated || new Date().toISOString().split('T')[0],
      };
    }

    // Add financial aid
    const financialAid = financialAidMap.get(career.slug);
    const eduLevel = career.education?.typical_entry_education;
    const federalAidInfo = eduLevel ? federalAidRules.get(eduLevel) : null;

    if (financialAid || federalAidInfo || financialCategoryResources.has(career.category)) {
      career.financial_aid = {
        scholarships: financialAid?.scholarships || [],
        federal_aid_eligible: federalAidInfo?.federal_aid_eligible ?? false,
        typical_aid_sources: federalAidInfo?.typical_aid_sources || [],
        category_resources: financialCategoryResources.get(career.category) || [],
        last_updated: financialData?.last_updated || new Date().toISOString().split('T')[0],
      };
      financialAidAdded++;
    }
  }

  // Save updated careers
  fs.writeFileSync(CAREERS_FILE, JSON.stringify(careers, null, 2));
  console.log(`\nUpdated careers.json`);
  console.log(`  Training programs added: ${trainingAdded}`);
  console.log(`  Financial aid added: ${financialAidAdded}`);

  // Also update specializations
  const specializations: Career[] = loadJson(SPECIALIZATIONS_FILE);
  if (specializations) {
    let specTrainingAdded = 0;
    let specFinancialAidAdded = 0;

    for (const spec of specializations) {
      // Add training programs
      const trainingPrograms = trainingProgramsMap.get(spec.slug);
      if (trainingPrograms) {
        spec.training_programs = {
          ...trainingPrograms,
          category_resources: trainingCategoryResources.get(spec.category) || [],
        };
        specTrainingAdded++;
      } else if (trainingCategoryResources.has(spec.category)) {
        spec.training_programs = {
          programs: [],
          category_resources: trainingCategoryResources.get(spec.category),
          last_updated: trainingData?.last_updated || new Date().toISOString().split('T')[0],
        };
      }

      // Add financial aid
      const financialAid = financialAidMap.get(spec.slug);
      const eduLevel = spec.education?.typical_entry_education;
      const federalAidInfo = eduLevel ? federalAidRules.get(eduLevel) : null;

      if (financialAid || federalAidInfo || financialCategoryResources.has(spec.category)) {
        spec.financial_aid = {
          scholarships: financialAid?.scholarships || [],
          federal_aid_eligible: federalAidInfo?.federal_aid_eligible ?? false,
          typical_aid_sources: federalAidInfo?.typical_aid_sources || [],
          category_resources: financialCategoryResources.get(spec.category) || [],
          last_updated: financialData?.last_updated || new Date().toISOString().split('T')[0],
        };
        specFinancialAidAdded++;
      }
    }

    fs.writeFileSync(SPECIALIZATIONS_FILE, JSON.stringify(specializations, null, 2));
    console.log(`\nUpdated specializations.json`);
    console.log(`  Training programs added: ${specTrainingAdded}`);
    console.log(`  Financial aid added: ${specFinancialAidAdded}`);
  }

  console.log('\n=== Complete ===\n');
}

main().catch(console.error);
