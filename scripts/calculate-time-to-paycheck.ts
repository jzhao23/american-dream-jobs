/**
 * Time-to-First-Paycheck Calculation
 *
 * Calculates how long it takes from starting education/training until first paycheck
 * for each career. Critical information for unemployed job seekers.
 *
 * Run: npx tsx scripts/calculate-time-to-paycheck.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'data/output');

// Category-specific job search time buffers (in months)
// Based on industry hiring cycles and typical job search durations
const CATEGORY_JOB_SEARCH_MONTHS: Record<string, number> = {
  // Fast hiring (2 months)
  'food-service': 2,
  'sales': 2,
  'personal-care': 2,
  'building-grounds': 2,

  // Moderate hiring (3 months)
  'office-admin': 3,
  'production': 3,
  'transportation': 3,
  'installation-repair': 3,
  'construction': 3,
  'agriculture': 3,

  // Standard hiring (4 months)
  'technology': 4,
  'business-finance': 4,
  'management': 4,
  'arts-media': 4,
  'social-services': 4,

  // Slower hiring / credentialing (5-6 months)
  'healthcare-clinical': 5,
  'healthcare-technical': 5,
  'education': 5,
  'legal': 5,
  'science': 5,
  'engineering': 4,
  'protective-services': 6,
  'military': 6,
};

// Categories where apprenticeships or immediate entry is common
const EARN_WHILE_LEARNING_CATEGORIES = new Set([
  'construction',
  'installation-repair',
  'production',
  'protective-services',
  'military',
  'transportation',
]);

// Education level to typical duration in months
const EDUCATION_DURATION_MONTHS: Record<string, number> = {
  'No formal educational credential': 0,
  'High school diploma or equivalent': 0,
  'Some college, no degree': 12,
  'Postsecondary nondegree award': 12,
  "Associate's degree": 24,
  "Bachelor's degree": 48,
  "Master's degree": 72,
  'Doctoral or professional degree': 96,
};

interface TimeToPaycheck {
  min_months: number;
  typical_months: number;
  max_months: number;
  can_earn_while_learning: boolean;
  immediate_entry_options: string[];
  notes: string;
  data_source: 'calculated' | 'manual' | 'verified';
  last_updated: string;
}

interface Career {
  slug: string;
  title: string;
  category: string;
  education?: {
    typical_entry_education?: string;
    education_duration?: {
      min_years: number;
      typical_years: number;
      max_years: number;
    };
    time_to_job_ready?: {
      min_years: number;
      typical_years: number;
      max_years: number;
      earning_while_learning: boolean;
      notes: string;
    };
    cost_by_institution_type?: {
      apprenticeship?: {
        earn_while_learning: boolean;
      } | null;
      trade_school?: {
        program_length_months: number;
      } | null;
    };
  };
  time_to_paycheck?: TimeToPaycheck | null;
}

function getImmediateEntryOptions(career: Career): string[] {
  const options: string[] = [];
  const category = career.category;
  const title = career.title.toLowerCase();

  // Check for apprenticeship availability
  if (career.education?.cost_by_institution_type?.apprenticeship?.earn_while_learning) {
    options.push('Paid apprenticeship program');
  }

  // Category-specific immediate options
  if (EARN_WHILE_LEARNING_CATEGORIES.has(category)) {
    if (category === 'construction') {
      options.push('Entry-level helper/laborer position');
    } else if (category === 'installation-repair') {
      options.push('Apprentice technician role');
    } else if (category === 'protective-services') {
      options.push('Police/fire academy (paid training)');
    } else if (category === 'military') {
      options.push('Military enlistment with paid training');
    }
  }

  // Title-specific options
  if (title.includes('nurse') && !title.includes('practitioner') && !title.includes('anesthetist')) {
    options.push('CNA certification (2-6 weeks) while pursuing RN');
  }
  if (title.includes('software') || title.includes('developer') || title.includes('programmer')) {
    options.push('Coding bootcamp (3-6 months)');
    options.push('Freelance/contract work while learning');
  }
  if (title.includes('truck driver') || title.includes('commercial driver')) {
    options.push('CDL training program (4-8 weeks)');
  }
  if (title.includes('electrician') || title.includes('plumber') || title.includes('hvac')) {
    options.push('Union apprenticeship with immediate pay');
  }
  if (title.includes('medical assistant') || title.includes('phlebotom') || title.includes('emt')) {
    options.push('Short-term certification program');
  }

  return [...new Set(options)]; // Remove duplicates
}

function generateNotes(career: Career, timeToPaycheck: Omit<TimeToPaycheck, 'notes' | 'data_source' | 'last_updated'>): string {
  const parts: string[] = [];

  // Education path notes
  const typicalEd = career.education?.typical_entry_education;
  if (typicalEd) {
    if (typicalEd.includes('Bachelor')) {
      parts.push('Standard path requires 4-year degree');
    } else if (typicalEd.includes('Associate')) {
      parts.push('Standard path requires 2-year degree');
    } else if (typicalEd.includes('Postsecondary')) {
      parts.push('Requires certificate or vocational training');
    } else if (typicalEd.includes('High school')) {
      parts.push('Entry possible with high school diploma');
    }
  }

  // Earn while learning
  if (timeToPaycheck.can_earn_while_learning) {
    parts.push('Earn-while-learning options available');
  }

  // Fast track options
  if (timeToPaycheck.immediate_entry_options.length > 0) {
    parts.push(`${timeToPaycheck.immediate_entry_options.length} accelerated pathway(s) available`);
  }

  // Category-specific notes
  if (career.category === 'healthcare-clinical' || career.category === 'healthcare-technical') {
    parts.push('May require licensing exam after education');
  }
  if (career.category === 'legal') {
    parts.push('Bar exam required for attorneys');
  }
  if (career.category === 'education') {
    parts.push('Teaching certification may add time');
  }

  return parts.join('. ') || 'Standard education-to-employment timeline';
}

function calculateTimeToPaycheck(career: Career): TimeToPaycheck {
  const category = career.category;
  const jobSearchBuffer = CATEGORY_JOB_SEARCH_MONTHS[category] || 4;

  // Get education duration
  let baseMinMonths = 0;
  let baseTypicalMonths = 0;
  let baseMaxMonths = 0;

  // First try education_duration
  if (career.education?.education_duration) {
    baseMinMonths = career.education.education_duration.min_years * 12;
    baseTypicalMonths = career.education.education_duration.typical_years * 12;
    baseMaxMonths = career.education.education_duration.max_years * 12;
  }
  // Fall back to time_to_job_ready
  else if (career.education?.time_to_job_ready) {
    baseMinMonths = career.education.time_to_job_ready.min_years * 12;
    baseTypicalMonths = career.education.time_to_job_ready.typical_years * 12;
    baseMaxMonths = career.education.time_to_job_ready.max_years * 12;
  }
  // Fall back to typical_entry_education
  else if (career.education?.typical_entry_education) {
    const edLevel = career.education.typical_entry_education;
    baseTypicalMonths = EDUCATION_DURATION_MONTHS[edLevel] || 24;
    baseMinMonths = Math.max(0, baseTypicalMonths - 12);
    baseMaxMonths = baseTypicalMonths + 12;
  }
  // Default fallback
  else {
    baseTypicalMonths = 24;
    baseMinMonths = 12;
    baseMaxMonths = 48;
  }

  // Check for trade school fast track
  if (career.education?.cost_by_institution_type?.trade_school?.program_length_months) {
    const tradeMonths = career.education.cost_by_institution_type.trade_school.program_length_months;
    baseMinMonths = Math.min(baseMinMonths, tradeMonths);
  }

  // Check earn-while-learning status
  let canEarnWhileLearning = false;
  if (career.education?.cost_by_institution_type?.apprenticeship?.earn_while_learning) {
    canEarnWhileLearning = true;
  }
  if (career.education?.time_to_job_ready?.earning_while_learning) {
    canEarnWhileLearning = true;
  }
  if (EARN_WHILE_LEARNING_CATEGORIES.has(category)) {
    canEarnWhileLearning = true;
  }

  // Get immediate entry options
  const immediateOptions = getImmediateEntryOptions(career);

  // Calculate final times
  let minMonths: number;
  let typicalMonths: number;
  let maxMonths: number;

  if (canEarnWhileLearning) {
    // Can start earning immediately or very quickly
    minMonths = 0;
    typicalMonths = Math.round(baseTypicalMonths * 0.5) + Math.round(jobSearchBuffer * 0.5);
    maxMonths = baseMaxMonths + jobSearchBuffer;
  } else if (immediateOptions.length > 0) {
    // Has accelerated options
    minMonths = Math.max(1, Math.round(baseMinMonths * 0.3));
    typicalMonths = baseTypicalMonths + jobSearchBuffer;
    maxMonths = baseMaxMonths + jobSearchBuffer + 3;
  } else {
    // Standard path
    minMonths = Math.max(baseMinMonths, 3);
    typicalMonths = baseTypicalMonths + jobSearchBuffer;
    maxMonths = Math.round(baseMaxMonths * 1.25) + jobSearchBuffer + 3;
  }

  // Ensure logical ordering
  minMonths = Math.max(0, minMonths);
  typicalMonths = Math.max(minMonths + 1, typicalMonths);
  maxMonths = Math.max(typicalMonths + 1, maxMonths);

  const result = {
    min_months: minMonths,
    typical_months: typicalMonths,
    max_months: maxMonths,
    can_earn_while_learning: canEarnWhileLearning,
    immediate_entry_options: immediateOptions,
  };

  return {
    ...result,
    notes: generateNotes(career, result),
    data_source: 'calculated' as const,
    last_updated: new Date().toISOString().split('T')[0],
  };
}

function aggregateTimeToPaycheck(times: TimeToPaycheck[]): TimeToPaycheck {
  if (times.length === 0) {
    return {
      min_months: 12,
      typical_months: 24,
      max_months: 48,
      can_earn_while_learning: false,
      immediate_entry_options: [],
      notes: 'No specialization data available',
      data_source: 'calculated',
      last_updated: new Date().toISOString().split('T')[0],
    };
  }

  // Aggregate across specializations
  const minMonths = Math.min(...times.map(t => t.min_months));
  const avgTypical = Math.round(times.reduce((sum, t) => sum + t.typical_months, 0) / times.length);
  const maxMonths = Math.max(...times.map(t => t.max_months));
  const canEarnWhileLearning = times.some(t => t.can_earn_while_learning);

  // Union all immediate entry options
  const allOptions = times.flatMap(t => t.immediate_entry_options);
  const uniqueOptions = [...new Set(allOptions)];

  return {
    min_months: minMonths,
    typical_months: avgTypical,
    max_months: maxMonths,
    can_earn_while_learning: canEarnWhileLearning,
    immediate_entry_options: uniqueOptions.slice(0, 5),
    notes: `Aggregated across ${times.length} specializations`,
    data_source: 'calculated',
    last_updated: new Date().toISOString().split('T')[0],
  };
}

async function main() {
  console.log('\n=== Calculating Time-to-First-Paycheck ===\n');

  // Load careers
  const careersFile = path.join(OUTPUT_DIR, 'careers.json');
  if (!fs.existsSync(careersFile)) {
    console.error('Error: careers.json not found. Run data pipeline first.');
    process.exit(1);
  }

  const careers: Career[] = JSON.parse(fs.readFileSync(careersFile, 'utf-8'));
  console.log(`Processing ${careers.length} careers...`);

  // Calculate for each career
  let processed = 0;
  let withEarnWhileLearning = 0;
  let withImmediateOptions = 0;

  careers.forEach((career) => {
    const timeToPaycheck = calculateTimeToPaycheck(career);
    career.time_to_paycheck = timeToPaycheck;
    processed++;

    if (timeToPaycheck.can_earn_while_learning) {
      withEarnWhileLearning++;
    }
    if (timeToPaycheck.immediate_entry_options.length > 0) {
      withImmediateOptions++;
    }
  });

  // Save updated careers
  fs.writeFileSync(careersFile, JSON.stringify(careers, null, 2));
  console.log(`Updated careers.json with time_to_paycheck data`);

  // Also update specializations.json if it exists
  const specializationsFile = path.join(OUTPUT_DIR, 'specializations.json');
  if (fs.existsSync(specializationsFile)) {
    const specializations: Career[] = JSON.parse(fs.readFileSync(specializationsFile, 'utf-8'));
    specializations.forEach((spec) => {
      spec.time_to_paycheck = calculateTimeToPaycheck(spec);
    });
    fs.writeFileSync(specializationsFile, JSON.stringify(specializations, null, 2));
    console.log(`Updated specializations.json with time_to_paycheck data`);
  }

  // Print summary
  console.log('\n=== Summary ===');
  console.log(`Total careers processed: ${processed}`);
  console.log(`With earn-while-learning: ${withEarnWhileLearning} (${((withEarnWhileLearning / processed) * 100).toFixed(1)}%)`);
  console.log(`With immediate options: ${withImmediateOptions} (${((withImmediateOptions / processed) * 100).toFixed(1)}%)`);

  // Print some examples
  console.log('\n=== Examples ===');

  // Find fastest careers
  const sorted = [...careers].sort((a, b) =>
    (a.time_to_paycheck?.typical_months || 999) - (b.time_to_paycheck?.typical_months || 999)
  );

  console.log('\nFastest time to paycheck:');
  sorted.slice(0, 5).forEach((c) => {
    const t = c.time_to_paycheck!;
    console.log(`  ${c.title}: ${t.min_months}-${t.typical_months} months${t.can_earn_while_learning ? ' (earn while learning)' : ''}`);
  });

  console.log('\nLongest time to paycheck:');
  sorted.slice(-5).reverse().forEach((c) => {
    const t = c.time_to_paycheck!;
    console.log(`  ${c.title}: ${t.typical_months}-${t.max_months} months`);
  });

  console.log('\n=== Time-to-Paycheck Calculation Complete ===\n');
}

// Export for use in consolidation
export { calculateTimeToPaycheck, aggregateTimeToPaycheck, TimeToPaycheck };

main().catch(console.error);
