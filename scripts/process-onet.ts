/**
 * Process O*NET Database
 *
 * Parses the O*NET database files and generates structured JSON outputs.
 * Run: npx tsx scripts/process-onet.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { getCategory as getCategoryId, getCategoryMetadata, type CategoryId } from '../src/lib/categories';

const ONET_DIR = path.join(process.cwd(), 'data/sources/onet/db_30_1_text');
const OUTPUT_DIR = path.join(process.cwd(), 'data/processed');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Parse tab-separated file
function parseTSV<T>(filename: string): T[] {
  const filepath = path.join(ONET_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split('\t');

  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = values[i]?.trim() || '';
    });
    return obj as T;
  });
}

// Interfaces for O*NET data
interface OccupationRaw {
  'O*NET-SOC Code': string;
  'Title': string;
  'Description': string;
}

interface JobZoneRaw {
  'O*NET-SOC Code': string;
  'Job Zone': string;
}

interface AlternateTitleRaw {
  'O*NET-SOC Code': string;
  'Alternate Title': string;
}

interface TaskRaw {
  'O*NET-SOC Code': string;
  'Task': string;
  'Task Type': string;
}

interface TechSkillRaw {
  'O*NET-SOC Code': string;
  'Example': string;
}

interface EducationRaw {
  'O*NET-SOC Code': string;
  'Element ID': string;
  'Element Name': string;
  'Category': string;
  'Data Value': string;
}

interface AbilityRaw {
  'O*NET-SOC Code': string;
  'Element Name': string;
  'Scale ID': string;
  'Data Value': string;
}

// Education category mapping
const EDUCATION_CATEGORIES: Record<string, string> = {
  '1': 'Less than high school',
  '2': 'High school diploma or equivalent',
  '3': 'Post-secondary certificate',
  '4': 'Some college, no degree',
  '5': "Associate's degree",
  '6': "Bachelor's degree",
  '7': 'Post-baccalaureate certificate',
  '8': "Master's degree",
  '9': 'Post-master\'s certificate',
  '10': 'First professional degree',
  '11': 'Doctoral degree',
  '12': 'Post-doctoral training',
};

// Education duration mapping (ground truth - standard degree durations)
// This maps typical_entry_education text to actual education duration in years
const EDUCATION_DURATION_MAP: Record<string, { min: number; typical: number; max: number }> = {
  'Less than high school': { min: 0, typical: 0, max: 0 },
  'High school diploma or equivalent': { min: 0, typical: 0, max: 0 },
  'Post-secondary certificate': { min: 0.5, typical: 1, max: 2 },
  'Some college, no degree': { min: 1, typical: 1, max: 2 },
  "Associate's degree": { min: 2, typical: 2, max: 3 },
  "Bachelor's degree": { min: 4, typical: 4, max: 5 },
  'Post-baccalaureate certificate': { min: 4, typical: 4.5, max: 5 },
  "Master's degree": { min: 5, typical: 6, max: 7 },
  "Post-master's certificate": { min: 6, typical: 7, max: 8 },
  'First professional degree': { min: 7, typical: 7, max: 8 },
  'Doctoral degree': { min: 8, typical: 9, max: 12 },
  'Post-doctoral training': { min: 10, typical: 11, max: 14 },
};

// Job zone descriptions
const JOB_ZONE_DESCRIPTIONS: Record<number, { education: string, experience: string, training: string }> = {
  1: { education: 'Some high school', experience: 'Little or no experience', training: 'Short demonstration' },
  2: { education: 'High school diploma', experience: 'Some experience helpful', training: 'Few months to one year' },
  3: { education: 'Vocational school or associate degree', experience: 'One to two years', training: 'One to two years' },
  4: { education: "Bachelor's degree", experience: 'Several years', training: 'Several years' },
  5: { education: 'Graduate degree or professional degree', experience: 'Extensive experience', training: 'Extensive training' },
};

// SOC major group to subcategory mapping
const SOC_SUBCATEGORIES: Record<string, string> = {
  '11': 'Management Occupations',
  '13': 'Business and Financial Operations',
  '15': 'Computer and Mathematical',
  '17': 'Architecture and Engineering',
  '19': 'Life, Physical, and Social Science',
  '21': 'Community and Social Service',
  '23': 'Legal Occupations',
  '25': 'Educational Instruction and Library',
  '27': 'Arts, Design, Entertainment, Sports, and Media',
  '29': 'Healthcare Practitioners and Technical',
  '31': 'Healthcare Support',
  '33': 'Protective Service',
  '35': 'Food Preparation and Serving',
  '37': 'Building and Grounds Cleaning and Maintenance',
  '39': 'Personal Care and Service',
  '41': 'Sales and Related',
  '43': 'Office and Administrative Support',
  '45': 'Farming, Fishing, and Forestry',
  '47': 'Construction and Extraction',
  '49': 'Installation, Maintenance, and Repair',
  '51': 'Production Occupations',
  '53': 'Transportation and Material Moving',
  '55': 'Military Specific',
};

// Category mapping using new standardized categories
function getCategory(socCode: string): { category: CategoryId; subcategory: string } {
  const major = socCode.substring(0, 2);
  try {
    const categoryId = getCategoryId(socCode);
    const metadata = getCategoryMetadata(categoryId);
    return {
      category: categoryId,
      subcategory: SOC_SUBCATEGORIES[major] || 'Other Occupations'
    };
  } catch {
    // Fallback for unknown codes
    return { category: 'production' as CategoryId, subcategory: SOC_SUBCATEGORIES[major] || 'Other Occupations' };
  }
}

// Generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

// Estimate time to job ready (years after high school)
// NOTE: This uses Job Zone which conflates education with work experience.
// For education-only duration, use getEducationDuration() instead.
function estimateTimeToJobReady(jobZone: number, education: string): { min: number; typical: number; max: number; earningWhileLearning: boolean } {
  // Based on job zone and typical education
  const estimates: Record<number, { min: number; typical: number; max: number }> = {
    1: { min: 0, typical: 0, max: 0.5 },
    2: { min: 0, typical: 0.5, max: 1 },
    3: { min: 1, typical: 2, max: 3 },
    4: { min: 4, typical: 4, max: 6 },
    5: { min: 6, typical: 8, max: 12 },
  };

  const base = estimates[jobZone] || estimates[3];

  // Check for apprenticeship or on-the-job training
  const isApprentice = education.toLowerCase().includes('apprentice') ||
                       education.toLowerCase().includes('on-the-job');

  return {
    ...base,
    earningWhileLearning: isApprentice || jobZone <= 2
  };
}

// Get education duration from typical_entry_education text (ground truth mapping)
// This returns the actual years of formal education required, NOT including work experience
function getEducationDuration(typicalEducation: string): { min: number; typical: number; max: number } {
  // Try exact match first
  const exactMatch = EDUCATION_DURATION_MAP[typicalEducation];
  if (exactMatch) return exactMatch;

  // Fuzzy match for variations
  const normalized = typicalEducation.toLowerCase();

  if (normalized.includes('post-doctoral') || normalized.includes('postdoctoral')) {
    return { min: 10, typical: 11, max: 14 };
  }
  if (normalized.includes('doctoral') || normalized.includes('doctorate')) {
    return { min: 8, typical: 9, max: 12 };
  }
  if (normalized.includes('professional') || normalized.includes('first professional')) {
    return { min: 7, typical: 7, max: 8 };
  }
  if (normalized.includes('post-master')) {
    return { min: 6, typical: 7, max: 8 };
  }
  if (normalized.includes('master')) {
    return { min: 5, typical: 6, max: 7 };
  }
  if (normalized.includes('post-baccalaureate')) {
    return { min: 4, typical: 4.5, max: 5 };
  }
  if (normalized.includes('bachelor')) {
    return { min: 4, typical: 4, max: 5 };
  }
  if (normalized.includes('associate')) {
    return { min: 2, typical: 2, max: 3 };
  }
  if (normalized.includes('some college')) {
    return { min: 1, typical: 1, max: 2 };
  }
  if (normalized.includes('certificate') || normalized.includes('postsecondary') || normalized.includes('post-secondary')) {
    return { min: 0.5, typical: 1, max: 2 };
  }
  if (normalized.includes('high school') || normalized.includes('ged') || normalized.includes('equivalent')) {
    return { min: 0, typical: 0, max: 0 };
  }
  if (normalized.includes('less than high school') || normalized.includes('no formal')) {
    return { min: 0, typical: 0, max: 0 };
  }

  // Default fallback (high school equivalent)
  return { min: 0, typical: 0, max: 0 };
}

// Estimate education costs
function estimateEducationCost(jobZone: number, typicalEducation: string): { min: number; max: number; typical: number; breakdown: { item: string; min: number; max: number }[] } {
  const costs: Record<string, { min: number; max: number }> = {
    'high_school': { min: 0, max: 0 },
    'certificate': { min: 5000, max: 20000 },
    'associates': { min: 8000, max: 60000 },
    'bachelors': { min: 40000, max: 240000 },
    'masters': { min: 30000, max: 120000 },
    'doctoral': { min: 0, max: 200000 },
    'professional': { min: 100000, max: 350000 },
    'apprenticeship': { min: 0, max: 0 },
  };

  const eduLower = typicalEducation.toLowerCase();
  let breakdown: { item: string; min: number; max: number }[] = [];

  if (eduLower.includes('doctoral')) {
    breakdown.push({ item: "Bachelor's degree", ...costs.bachelors });
    breakdown.push({ item: 'Doctoral degree', ...costs.doctoral });
  } else if (eduLower.includes('professional') || eduLower.includes('first professional')) {
    breakdown.push({ item: "Bachelor's degree", ...costs.bachelors });
    breakdown.push({ item: 'Professional degree (JD/MD)', ...costs.professional });
  } else if (eduLower.includes('master')) {
    breakdown.push({ item: "Bachelor's degree", ...costs.bachelors });
    breakdown.push({ item: "Master's degree", ...costs.masters });
  } else if (eduLower.includes('bachelor')) {
    breakdown.push({ item: "Bachelor's degree", ...costs.bachelors });
  } else if (eduLower.includes('associate')) {
    breakdown.push({ item: "Associate's degree", ...costs.associates });
  } else if (eduLower.includes('certificate') || eduLower.includes('postsecondary')) {
    breakdown.push({ item: 'Certificate/Trade school', ...costs.certificate });
  } else if (eduLower.includes('apprentice')) {
    breakdown.push({ item: 'Apprenticeship', ...costs.apprenticeship });
  } else {
    // Default based on job zone
    if (jobZone <= 2) {
      breakdown.push({ item: 'On-the-job training', min: 0, max: 5000 });
    } else if (jobZone === 3) {
      breakdown.push({ item: 'Vocational training', ...costs.certificate });
    } else {
      breakdown.push({ item: "Bachelor's degree", ...costs.bachelors });
    }
  }

  const totalMin = breakdown.reduce((sum, item) => sum + item.min, 0);
  const totalMax = breakdown.reduce((sum, item) => sum + item.max, 0);

  return {
    min: totalMin,
    max: totalMax,
    typical: Math.round((totalMin + totalMax) / 2),
    breakdown
  };
}

async function main() {
  console.log('\n=== Processing O*NET Database ===\n');

  // Load all data files
  console.log('Loading O*NET files...');
  const occupations = parseTSV<OccupationRaw>('Occupation Data.txt');
  const jobZones = parseTSV<JobZoneRaw>('Job Zones.txt');
  const alternateTitles = parseTSV<AlternateTitleRaw>('Alternate Titles.txt');
  const tasks = parseTSV<TaskRaw>('Task Statements.txt');
  const techSkills = parseTSV<TechSkillRaw>('Technology Skills.txt');
  const education = parseTSV<EducationRaw>('Education, Training, and Experience.txt');
  const abilities = parseTSV<AbilityRaw>('Abilities.txt');

  console.log(`Loaded ${occupations.length} occupations`);

  // Create lookup maps
  const jobZoneMap = new Map<string, number>();
  jobZones.forEach(jz => {
    jobZoneMap.set(jz['O*NET-SOC Code'], parseInt(jz['Job Zone']) || 3);
  });

  const alternateTitlesMap = new Map<string, string[]>();
  alternateTitles.forEach(at => {
    const code = at['O*NET-SOC Code'];
    if (!alternateTitlesMap.has(code)) {
      alternateTitlesMap.set(code, []);
    }
    alternateTitlesMap.get(code)!.push(at['Alternate Title']);
  });

  const tasksMap = new Map<string, string[]>();
  tasks.forEach(t => {
    const code = t['O*NET-SOC Code'];
    if (!tasksMap.has(code)) {
      tasksMap.set(code, []);
    }
    if (t['Task Type'] === 'Core') {
      tasksMap.get(code)!.push(t['Task']);
    }
  });

  const techSkillsMap = new Map<string, string[]>();
  techSkills.forEach(ts => {
    const code = ts['O*NET-SOC Code'];
    if (!techSkillsMap.has(code)) {
      techSkillsMap.set(code, []);
    }
    techSkillsMap.get(code)!.push(ts['Example']);
  });

  // Process education data to find typical education per occupation
  const educationMap = new Map<string, { typicalEducation: string; categories: Map<string, number> }>();
  education.forEach(edu => {
    const code = edu['O*NET-SOC Code'];
    if (edu['Element Name'] === 'Required Level of Education') {
      if (!educationMap.has(code)) {
        educationMap.set(code, { typicalEducation: '', categories: new Map() });
      }
      const catNum = edu['Category'];
      const value = parseFloat(edu['Data Value']) || 0;
      educationMap.get(code)!.categories.set(catNum, value);
    }
  });

  // Find most common education level per occupation
  educationMap.forEach((data, code) => {
    let maxValue = 0;
    let maxCat = '6'; // Default to bachelor's
    data.categories.forEach((value, cat) => {
      if (value > maxValue) {
        maxValue = value;
        maxCat = cat;
      }
    });
    data.typicalEducation = EDUCATION_CATEGORIES[maxCat] || "Bachelor's degree";
  });

  // Get top abilities per occupation
  const abilitiesMap = new Map<string, string[]>();
  const abilityScores = new Map<string, { name: string; score: number }[]>();
  abilities.forEach(ab => {
    const code = ab['O*NET-SOC Code'];
    if (ab['Scale ID'] === 'IM') { // Importance scale
      if (!abilityScores.has(code)) {
        abilityScores.set(code, []);
      }
      abilityScores.get(code)!.push({
        name: ab['Element Name'],
        score: parseFloat(ab['Data Value']) || 0
      });
    }
  });
  abilityScores.forEach((scores, code) => {
    const topAbilities = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(s => s.name);
    abilitiesMap.set(code, topAbilities);
  });

  // Generate Output File 1: Occupation List
  console.log('\nGenerating occupation list...');
  const occupationList = occupations.map(occ => {
    const code = occ['O*NET-SOC Code'];
    const { category, subcategory } = getCategory(code);

    return {
      onet_code: code,
      title: occ['Title'],
      alternate_titles: (alternateTitlesMap.get(code) || []).slice(0, 10),
      category,
      subcategory,
      job_zone: jobZoneMap.get(code) || 3,
      description: occ['Description'].substring(0, 500),
    };
  });

  const occupationListOutput = {
    metadata: {
      source: 'O*NET 30.1',
      retrieved_at: new Date().toISOString().split('T')[0],
      total_occupations: occupationList.length
    },
    occupations: occupationList
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'onet_occupations_list.json'),
    JSON.stringify(occupationListOutput, null, 2)
  );
  console.log(`Written: onet_occupations_list.json (${occupationList.length} occupations)`);

  // Generate Output File 2: Complete Occupation Data
  console.log('\nGenerating complete occupation data...');
  const occupationsComplete = occupations.map(occ => {
    const code = occ['O*NET-SOC Code'];
    const { category, subcategory } = getCategory(code);
    const jobZone = jobZoneMap.get(code) || 3;
    const typicalEducation = educationMap.get(code)?.typicalEducation || "Bachelor's degree";
    const timeToReady = estimateTimeToJobReady(jobZone, typicalEducation);
    const educationDuration = getEducationDuration(typicalEducation);
    const costEstimate = estimateEducationCost(jobZone, typicalEducation);
    const jobZoneInfo = JOB_ZONE_DESCRIPTIONS[jobZone] || JOB_ZONE_DESCRIPTIONS[3];

    // Determine boolean education requirements based on typical education
    const eduLower = typicalEducation.toLowerCase();

    return {
      // Identification
      onet_code: code,
      soc_code: code.replace('.00', '').replace('.', '-'),
      title: occ['Title'],
      slug: generateSlug(occ['Title']),
      alternate_titles: (alternateTitlesMap.get(code) || []).slice(0, 15),
      description: occ['Description'],

      // Categorization
      category,
      subcategory,
      job_zone: jobZone,
      job_family: code.substring(0, 7),

      // Wages (placeholder - will be filled from BLS)
      wages: null,

      // Education & Training
      education: {
        // Boolean requirements
        requires_high_school: true,
        requires_some_college: jobZone >= 3,
        requires_associates: eduLower.includes('associate'),
        requires_bachelors: eduLower.includes('bachelor') || jobZone >= 4,
        requires_masters: eduLower.includes('master'),
        requires_doctorate: eduLower.includes('doctoral'),
        requires_professional_degree: eduLower.includes('professional') || eduLower.includes('first professional'),
        requires_apprenticeship: eduLower.includes('apprentice') || code.startsWith('47-') || code.startsWith('49-'),
        requires_license_or_cert: jobZone >= 3, // Estimate
        requires_on_the_job_training: jobZone <= 3,

        // Typical path
        typical_entry_education: typicalEducation,
        work_experience_required: jobZoneInfo.experience,
        on_the_job_training: jobZoneInfo.training,

        // Time estimates (Job Zone based - includes work experience, NOT just education)
        time_to_job_ready: {
          min_years: timeToReady.min,
          typical_years: timeToReady.typical,
          max_years: timeToReady.max,
          earning_while_learning: timeToReady.earningWhileLearning,
          notes: `Based on Job Zone ${jobZone}. For formal education duration only, see education_duration.`
        },

        // Education duration (ground truth from typical_entry_education)
        education_duration: {
          min_years: educationDuration.min,
          typical_years: educationDuration.typical,
          max_years: educationDuration.max,
          source: 'typical_entry_education' as const,
          education_level: typicalEducation,
        },

        // Cost estimates
        estimated_cost: {
          min_cost: costEstimate.min,
          max_cost: costEstimate.max,
          typical_cost: costEstimate.typical,
          cost_breakdown: costEstimate.breakdown,
          notes: `Estimated based on typical education path. Min = public/in-state, Max = private.`
        }
      },

      // Outlook (placeholder - will be filled from BLS)
      outlook: null,

      // Tasks & Skills
      tasks: (tasksMap.get(code) || []).slice(0, 15),
      technology_skills: [...new Set(techSkillsMap.get(code) || [])].slice(0, 20),
      abilities: abilitiesMap.get(code) || [],

      // Metadata
      data_sources: [
        {
          source: 'O*NET 30.1',
          url: `https://www.onetonline.org/link/summary/${code}`,
          retrieved_at: new Date().toISOString().split('T')[0]
        }
      ],
      last_updated: new Date().toISOString().split('T')[0],
      data_completeness: {
        has_wages: false,
        has_education: true,
        has_outlook: false,
        has_tasks: (tasksMap.get(code) || []).length > 0,
        completeness_score: 40 // Base score without wages
      },

      // Placeholders for Phase 2+
      ai_risk: null,
      national_importance: null,
      career_progression: null
    };
  });

  const occupationsCompleteOutput = {
    metadata: {
      source: 'O*NET 30.1 + estimates',
      retrieved_at: new Date().toISOString().split('T')[0],
      total_occupations: occupationsComplete.length,
      fields_pending: ['wages', 'outlook', 'ai_risk', 'national_importance', 'career_progression']
    },
    occupations: occupationsComplete
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'occupations_complete.json'),
    JSON.stringify(occupationsCompleteOutput, null, 2)
  );
  console.log(`Written: occupations_complete.json (${occupationsComplete.length} occupations)`);

  // Generate category summary
  const categoryCounts = new Map<string, number>();
  occupationsComplete.forEach(occ => {
    const cat = occ.category;
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });

  console.log('\nCategory breakdown:');
  [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  console.log('\n=== O*NET Processing Complete ===\n');
}

main().catch(console.error);
