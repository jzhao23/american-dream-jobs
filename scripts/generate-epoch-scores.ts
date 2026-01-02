/**
 * Generate EPOCH Scores for All Careers
 *
 * This script generates EPOCH (Empathy, Presence, Opinion, Creativity, Hope)
 * scores for all careers based on category, job zone, and occupation characteristics.
 *
 * The generated scores are initial estimates that should be reviewed and refined.
 * Manual overrides for specific occupations are preserved.
 *
 * ## EPOCH Framework
 * - Empathy (E): Emotional intelligence, patient/customer care, interpersonal sensitivity
 * - Presence (P): Physical presence requirements, hands-on work, face-to-face interaction
 * - Opinion (O): Judgment, decision-making, critical thinking, expertise application
 * - Creativity (C): Innovation, problem-solving, artistic expression, novel solutions
 * - Hope (H): Mentorship, motivation, counseling, inspiring others, guidance
 *
 * ## Scoring Categories
 * - Strong: sum >= 20 (AI has limited ability to replace this work)
 * - Moderate: sum >= 12 and < 20 (AI augments but doesn't replace)
 * - Weak: sum < 12 (High risk of AI disruption)
 *
 * Run: npx tsx scripts/generate-epoch-scores.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SOURCES_DIR = path.join(DATA_DIR, 'sources');
const EPOCH_SCORES_FILE = path.join(SOURCES_DIR, 'epoch-scores.json');
const CAREERS_FILE = path.join(DATA_DIR, 'careers.generated.json');

interface EPOCHScores {
  empathy: number;
  presence: number;
  opinion: number;
  creativity: number;
  hope: number;
}

interface EPOCHEntry {
  onet_code: string;
  title: string;
  epochScores: EPOCHScores;
  sum: number;
  category: string;
  rationale: string;
  source: 'manual' | 'generated';
}

interface CategoryDefaults {
  empathy: number;
  presence: number;
  opinion: number;
  creativity: number;
  hope: number;
  rationale: string;
}

// Category-based default EPOCH scores
// These are starting points based on typical job characteristics
const CATEGORY_DEFAULTS: Record<string, CategoryDefaults> = {
  'healthcare-clinical': {
    empathy: 5, presence: 5, opinion: 4, creativity: 3, hope: 5,
    rationale: 'Healthcare clinical roles require high empathy, physical presence for patient care, clinical judgment, and patient advocacy'
  },
  'healthcare-technical': {
    empathy: 3, presence: 4, opinion: 3, creativity: 2, hope: 2,
    rationale: 'Healthcare technical roles involve equipment operation, some patient contact, and technical skill application'
  },
  'education': {
    empathy: 5, presence: 5, opinion: 4, creativity: 4, hope: 5,
    rationale: 'Education roles require empathy for students, classroom presence, pedagogical judgment, creative lesson delivery, and mentorship'
  },
  'social-services': {
    empathy: 5, presence: 4, opinion: 4, creativity: 3, hope: 5,
    rationale: 'Social services roles require deep empathy, client interaction, case judgment, and counseling/mentorship'
  },
  'construction': {
    empathy: 2, presence: 5, opinion: 3, creativity: 3, hope: 2,
    rationale: 'Construction roles require physical presence, hands-on work, problem-solving in varied environments'
  },
  'installation-repair': {
    empathy: 2, presence: 5, opinion: 4, creativity: 3, hope: 2,
    rationale: 'Installation and repair roles require on-site presence, diagnostic judgment, and problem-solving'
  },
  'production': {
    empathy: 1, presence: 4, opinion: 2, creativity: 2, hope: 1,
    rationale: 'Production roles often involve routine tasks, physical presence, limited judgment requirements'
  },
  'transportation': {
    empathy: 2, presence: 4, opinion: 2, creativity: 1, hope: 1,
    rationale: 'Transportation roles require physical presence and some judgment but limited creativity or interpersonal elements'
  },
  'technology': {
    empathy: 2, presence: 1, opinion: 5, creativity: 5, hope: 2,
    rationale: 'Technology roles require high creativity, complex problem-solving and judgment, but limited physical presence'
  },
  'science': {
    empathy: 2, presence: 2, opinion: 5, creativity: 5, hope: 2,
    rationale: 'Science roles require analytical judgment, research creativity, and expertise application'
  },
  'engineering': {
    empathy: 2, presence: 2, opinion: 5, creativity: 5, hope: 2,
    rationale: 'Engineering roles require design creativity, technical judgment, and problem-solving'
  },
  'business-finance': {
    empathy: 2, presence: 2, opinion: 4, creativity: 3, hope: 2,
    rationale: 'Business and finance roles require analytical judgment, some strategic creativity, client interaction varies'
  },
  'management': {
    empathy: 4, presence: 3, opinion: 5, creativity: 4, hope: 4,
    rationale: 'Management roles require people skills, strategic judgment, organizational creativity, and team leadership'
  },
  'legal': {
    empathy: 3, presence: 3, opinion: 5, creativity: 3, hope: 2,
    rationale: 'Legal roles require high judgment, argumentation skill, some client empathy, strategic thinking'
  },
  'arts-media': {
    empathy: 3, presence: 2, opinion: 4, creativity: 5, hope: 2,
    rationale: 'Arts and media roles require high creativity, aesthetic judgment, artistic expression'
  },
  'sales': {
    empathy: 4, presence: 3, opinion: 3, creativity: 3, hope: 3,
    rationale: 'Sales roles require customer empathy, persuasion skills, relationship building'
  },
  'office-admin': {
    empathy: 2, presence: 2, opinion: 2, creativity: 1, hope: 1,
    rationale: 'Office and admin roles often involve routine tasks, limited judgment or creativity requirements'
  },
  'protective-services': {
    empathy: 3, presence: 5, opinion: 4, creativity: 3, hope: 3,
    rationale: 'Protective services require physical presence, quick judgment, public interaction, crisis management'
  },
  'food-service': {
    empathy: 3, presence: 4, opinion: 2, creativity: 3, hope: 2,
    rationale: 'Food service roles require customer interaction, physical presence, some creativity in preparation'
  },
  'personal-care': {
    empathy: 4, presence: 5, opinion: 2, creativity: 3, hope: 3,
    rationale: 'Personal care roles require empathy, physical presence for hands-on service, client relationships'
  },
  'building-grounds': {
    empathy: 1, presence: 5, opinion: 2, creativity: 2, hope: 1,
    rationale: 'Building and grounds roles require physical presence, routine tasks, limited interpersonal elements'
  },
  'agriculture': {
    empathy: 1, presence: 5, opinion: 3, creativity: 2, hope: 1,
    rationale: 'Agriculture roles require physical presence, environmental judgment, hands-on work'
  },
  'military': {
    empathy: 3, presence: 5, opinion: 4, creativity: 3, hope: 4,
    rationale: 'Military roles require physical presence, tactical judgment, team leadership, discipline maintenance'
  },
};

// Default for unknown categories
const DEFAULT_EPOCH: CategoryDefaults = {
  empathy: 2, presence: 3, opinion: 3, creativity: 2, hope: 2,
  rationale: 'Default scores for occupation without category-specific adjustments'
};

// Job zone adjustments (1-5 scale, higher = more education/experience)
// Higher job zones generally indicate more judgment, creativity, and responsibility
function adjustForJobZone(scores: EPOCHScores, jobZone: number): EPOCHScores {
  const adjustment = Math.floor((jobZone - 3) * 0.5); // -1 to +1 adjustment
  return {
    empathy: Math.min(5, Math.max(1, scores.empathy)),
    presence: Math.min(5, Math.max(1, scores.presence)),
    opinion: Math.min(5, Math.max(1, scores.opinion + adjustment)),
    creativity: Math.min(5, Math.max(1, scores.creativity + adjustment)),
    hope: Math.min(5, Math.max(1, scores.hope)),
  };
}

// Title-based adjustments for specific keywords
function adjustForTitle(scores: EPOCHScores, title: string): EPOCHScores {
  const titleLower = title.toLowerCase();
  const adjusted = { ...scores };

  // High empathy indicators
  if (titleLower.includes('counsel') || titleLower.includes('therapist') ||
      titleLower.includes('social work') || titleLower.includes('psycholog')) {
    adjusted.empathy = Math.min(5, adjusted.empathy + 1);
    adjusted.hope = Math.min(5, adjusted.hope + 1);
  }

  // High presence indicators
  if (titleLower.includes('surgeon') || titleLower.includes('nurse') ||
      titleLower.includes('technician') || titleLower.includes('installer') ||
      titleLower.includes('mechanic') || titleLower.includes('operator')) {
    adjusted.presence = Math.min(5, adjusted.presence + 1);
  }

  // High creativity indicators
  if (titleLower.includes('designer') || titleLower.includes('architect') ||
      titleLower.includes('artist') || titleLower.includes('writer') ||
      titleLower.includes('developer') || titleLower.includes('engineer')) {
    adjusted.creativity = Math.min(5, adjusted.creativity + 1);
  }

  // High judgment indicators
  if (titleLower.includes('manager') || titleLower.includes('director') ||
      titleLower.includes('analyst') || titleLower.includes('specialist') ||
      titleLower.includes('physician') || titleLower.includes('lawyer')) {
    adjusted.opinion = Math.min(5, adjusted.opinion + 1);
  }

  // High hope/mentorship indicators
  if (titleLower.includes('teacher') || titleLower.includes('instructor') ||
      titleLower.includes('coach') || titleLower.includes('professor') ||
      titleLower.includes('trainer')) {
    adjusted.hope = Math.min(5, adjusted.hope + 1);
    adjusted.empathy = Math.min(5, adjusted.empathy + 1);
  }

  // Low creativity/judgment for routine roles
  if (titleLower.includes('clerk') || titleLower.includes('data entry') ||
      titleLower.includes('teller') || titleLower.includes('cashier') ||
      titleLower.includes('receptionist')) {
    adjusted.creativity = Math.max(1, adjusted.creativity - 1);
    adjusted.opinion = Math.max(1, adjusted.opinion - 1);
  }

  return adjusted;
}

function getHumanAdvantageCategory(sum: number): string {
  if (sum >= 20) return 'Strong';
  if (sum >= 12) return 'Moderate';
  return 'Weak';
}

function calculateSum(scores: EPOCHScores): number {
  return scores.empathy + scores.presence + scores.opinion + scores.creativity + scores.hope;
}

async function main() {
  console.log('\n=== Generating EPOCH Scores for All Careers ===\n');

  // Load existing manual scores (preserve them)
  let existingScores: Record<string, EPOCHEntry> = {};
  if (fs.existsSync(EPOCH_SCORES_FILE)) {
    const existingData = JSON.parse(fs.readFileSync(EPOCH_SCORES_FILE, 'utf-8'));
    existingScores = existingData.scores || {};
    console.log(`Loaded ${Object.keys(existingScores).length} existing EPOCH scores`);
  }

  // Load all careers
  const careers = JSON.parse(fs.readFileSync(CAREERS_FILE, 'utf-8'));
  console.log(`Processing ${careers.length} careers...`);

  const newScores: Record<string, EPOCHEntry> = {};
  let manualCount = 0;
  let generatedCount = 0;

  for (const career of careers) {
    const onetCode = career.onet_code;

    // Preserve manual scores
    if (existingScores[onetCode] && existingScores[onetCode].source === 'manual') {
      newScores[onetCode] = existingScores[onetCode];
      manualCount++;
      continue;
    }

    // Get category defaults
    const categoryDefaults = CATEGORY_DEFAULTS[career.category] || DEFAULT_EPOCH;
    let scores: EPOCHScores = {
      empathy: categoryDefaults.empathy,
      presence: categoryDefaults.presence,
      opinion: categoryDefaults.opinion,
      creativity: categoryDefaults.creativity,
      hope: categoryDefaults.hope,
    };

    // Adjust for job zone
    if (career.job_zone) {
      scores = adjustForJobZone(scores, career.job_zone);
    }

    // Adjust for title keywords
    scores = adjustForTitle(scores, career.title);

    const sum = calculateSum(scores);
    const category = getHumanAdvantageCategory(sum);

    newScores[onetCode] = {
      onet_code: onetCode,
      title: career.title,
      epochScores: scores,
      sum,
      category,
      rationale: `${categoryDefaults.rationale}. Adjusted for job zone ${career.job_zone || 'N/A'} and title characteristics.`,
      source: 'generated',
    };
    generatedCount++;
  }

  // Save the scores
  const output = {
    metadata: {
      description: 'EPOCH Framework Human Advantage Scores',
      framework: {
        E: 'Empathy - Emotional intelligence, patient/customer care, interpersonal sensitivity',
        P: 'Presence - Physical presence requirements, hands-on work, face-to-face interaction',
        O: 'Opinion - Judgment, decision-making, critical thinking, expertise application',
        C: 'Creativity - Innovation, problem-solving, artistic expression, novel solutions',
        H: 'Hope - Mentorship, motivation, counseling, inspiring others, guidance',
      },
      scoring: {
        range: '1-5 per dimension',
        categories: {
          Strong: 'sum >= 20',
          Moderate: 'sum >= 12 and sum < 20',
          Weak: 'sum < 12',
        },
      },
      generated_at: new Date().toISOString().split('T')[0],
      total_scores: Object.keys(newScores).length,
      manual_scores: manualCount,
      generated_scores: generatedCount,
    },
    scores: newScores,
  };

  fs.writeFileSync(EPOCH_SCORES_FILE, JSON.stringify(output, null, 2));

  // Print statistics
  const categoryCounts = { Strong: 0, Moderate: 0, Weak: 0 };
  for (const entry of Object.values(newScores)) {
    categoryCounts[entry.category as keyof typeof categoryCounts]++;
  }

  console.log(`\n=== Results ===`);
  console.log(`Total scores: ${Object.keys(newScores).length}`);
  console.log(`  Manual (preserved): ${manualCount}`);
  console.log(`  Generated: ${generatedCount}`);
  console.log(`\nHuman Advantage Distribution:`);
  console.log(`  Strong (sum >= 20): ${categoryCounts.Strong}`);
  console.log(`  Moderate (sum 12-19): ${categoryCounts.Moderate}`);
  console.log(`  Weak (sum < 12): ${categoryCounts.Weak}`);
  console.log(`\nSaved to: ${EPOCH_SCORES_FILE}`);
  console.log('\n=== EPOCH Score Generation Complete ===\n');
}

main().catch(console.error);
