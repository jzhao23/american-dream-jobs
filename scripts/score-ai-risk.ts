/**
 * AI Automation Risk Scoring
 *
 * Scores all occupations on a 1-10 scale for AI automation risk.
 * Uses task analysis, job characteristics, and research-based factors.
 *
 * Run: npx tsx scripts/score-ai-risk.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

// Keywords indicating high automation risk (routine, data-processing tasks)
const HIGH_RISK_KEYWORDS = [
  'data entry', 'record', 'file', 'compile', 'transcribe', 'type',
  'calculate', 'compute', 'process', 'sort', 'organize', 'schedule',
  'bookkeeping', 'accounting', 'payroll', 'billing', 'invoice',
  'proofread', 'verify', 'check', 'validate', 'audit',
  'telemarketing', 'cold call', 'customer service', 'call center',
  'assemble', 'repetitive', 'routine', 'standard',
  'monitor', 'watch', 'observe', 'track',
  'scan', 'input', 'enter', 'log',
];

// Keywords indicating low automation risk (physical, creative, interpersonal)
const LOW_RISK_KEYWORDS = [
  'repair', 'install', 'construct', 'build', 'plumb', 'weld',
  'diagnose', 'troubleshoot', 'problem-solve', 'investigate',
  'negotiate', 'persuade', 'counsel', 'advise', 'mentor', 'coach',
  'creative', 'design', 'invent', 'innovate', 'compose', 'write',
  'emergency', 'crisis', 'urgent', 'unpredictable',
  'patient', 'care', 'treat', 'therapy', 'nurse', 'medical',
  'teach', 'educate', 'instruct', 'train',
  'lead', 'manage', 'supervise', 'coordinate',
  'climb', 'lift', 'physical', 'outdoor', 'site', 'field',
  'custom', 'specialized', 'unique', 'variable',
  'judgment', 'decision', 'evaluate', 'assess',
  'relationship', 'rapport', 'trust', 'empathy',
];

// Category-level risk adjustments
const CATEGORY_RISK_ADJUSTMENTS: Record<string, number> = {
  'Office & Admin': 2.0,      // Higher risk
  'Production': 1.5,          // Higher risk
  'Food Service': 1.0,        // Mixed
  'Transportation': 0.5,      // Medium (some automation)
  'Sales': 0.5,               // Mixed
  'Healthcare': -1.5,         // Lower risk (human care)
  'Construction': -2.0,       // Lower risk (physical)
  'Installation & Repair': -2.0, // Lower risk (physical + diagnostic)
  'Education': -1.0,          // Lower risk (human interaction)
  'Social Services': -1.5,    // Lower risk (human interaction)
  'Protective Services': -1.5, // Lower risk (physical + judgment)
  'Legal': -0.5,              // Mixed (research vs. court)
  'Management': -1.0,         // Lower risk (judgment)
  'Technology': 0.0,          // Ironically mixed - AI creates AND replaces
  'Science': -0.5,            // Lower risk (research)
  'Arts & Media': -0.5,       // Mixed (creative vs. production)
  'Personal Care': -1.0,      // Lower risk (human touch)
  'Building & Grounds': -0.5, // Lower risk (physical)
  'Agriculture': -0.5,        // Mixed (physical but some automation)
  'Military': -1.5,           // Lower risk (judgment + physical)
  'Business & Finance': 1.0,  // Higher risk (data processing)
};

// Job zone affects risk (higher education often means more complex judgment)
const JOB_ZONE_ADJUSTMENTS: Record<number, number> = {
  1: 1.5,   // Simple tasks - higher risk
  2: 1.0,   // Routine tasks - higher risk
  3: 0.0,   // Moderate complexity - neutral
  4: -0.5,  // Complex judgment - lower risk
  5: -1.0,  // Expert judgment - lower risk
};

// Regulatory/licensing protection (reduces risk)
const LICENSED_OCCUPATIONS_PATTERNS = [
  /nurse/i, /physician/i, /doctor/i, /surgeon/i, /therapist/i,
  /lawyer/i, /attorney/i, /paralegal/i,
  /accountant.*certified/i, /cpa/i,
  /electrician/i, /plumber/i, /hvac/i,
  /pilot/i, /air traffic/i,
  /pharmacist/i, /dentist/i,
  /engineer.*licensed/i, /architect/i,
  /teacher/i, /professor/i,
  /police/i, /firefighter/i, /paramedic/i, /emt/i,
  /real estate.*agent/i, /broker/i,
];

// Physical work indicators (reduces risk)
const PHYSICAL_WORK_PATTERNS = [
  /install/i, /repair/i, /maintain/i, /construct/i, /build/i,
  /operate.*equipment/i, /operate.*machinery/i, /operate.*vehicle/i,
  /lift/i, /carry/i, /climb/i, /crawl/i,
  /outdoor/i, /field/i, /site/i,
  /weld/i, /solder/i, /cut/i, /drill/i,
  /clean/i, /sanitize/i,
];

interface AIRiskScore {
  score: number;
  label: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  confidence: 'high' | 'medium' | 'low';
  rationale: {
    summary: string;
    factors_increasing_risk: string[];
    factors_decreasing_risk: string[];
  };
  reference_scores: { source: string; score: number | null; notes: string }[];
  last_assessed: string;
  assessor: 'claude' | 'human_override';
}

function countKeywordMatches(text: string, keywords: string[]): number {
  const textLower = text.toLowerCase();
  return keywords.filter(kw => textLower.includes(kw.toLowerCase())).length;
}

function matchesPatterns(text: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(text));
}

function scoreOccupation(occ: {
  onet_code: string;
  title: string;
  description: string;
  category: string;
  job_zone: number;
  tasks: string[];
  abilities: string[];
  technology_skills: string[];
}): AIRiskScore {
  // Combine all text for analysis
  const allText = [
    occ.title,
    occ.description,
    ...(occ.tasks || []),
  ].join(' ');

  // Start with base score of 5 (medium)
  let score = 5.0;
  const increasingFactors: string[] = [];
  const decreasingFactors: string[] = [];

  // 1. Keyword analysis
  const highRiskMatches = countKeywordMatches(allText, HIGH_RISK_KEYWORDS);
  const lowRiskMatches = countKeywordMatches(allText, LOW_RISK_KEYWORDS);

  if (highRiskMatches > 5) {
    score += 1.5;
    increasingFactors.push(`High proportion of routine/data-processing tasks (${highRiskMatches} indicators)`);
  } else if (highRiskMatches > 2) {
    score += 0.75;
    increasingFactors.push(`Some routine/data-processing tasks (${highRiskMatches} indicators)`);
  }

  if (lowRiskMatches > 5) {
    score -= 1.5;
    decreasingFactors.push(`High proportion of physical/creative/interpersonal tasks (${lowRiskMatches} indicators)`);
  } else if (lowRiskMatches > 2) {
    score -= 0.75;
    decreasingFactors.push(`Some physical/creative/interpersonal tasks (${lowRiskMatches} indicators)`);
  }

  // 2. Category adjustment
  const categoryAdj = CATEGORY_RISK_ADJUSTMENTS[occ.category] || 0;
  if (categoryAdj > 0) {
    score += categoryAdj;
    increasingFactors.push(`${occ.category} sector historically more susceptible to automation`);
  } else if (categoryAdj < 0) {
    score += categoryAdj; // Adding negative number decreases
    decreasingFactors.push(`${occ.category} sector requires human judgment/physical presence`);
  }

  // 3. Job zone adjustment
  const jobZoneAdj = JOB_ZONE_ADJUSTMENTS[occ.job_zone] || 0;
  score += jobZoneAdj;
  if (occ.job_zone >= 4) {
    decreasingFactors.push(`Requires advanced education and complex decision-making (Job Zone ${occ.job_zone})`);
  } else if (occ.job_zone <= 2) {
    increasingFactors.push(`Routine tasks requiring minimal training (Job Zone ${occ.job_zone})`);
  }

  // 4. Licensed/regulated occupation check
  if (matchesPatterns(occ.title, LICENSED_OCCUPATIONS_PATTERNS)) {
    score -= 1.0;
    decreasingFactors.push('Requires professional licensing/certification with regulatory barriers');
  }

  // 5. Physical work check
  if (matchesPatterns(allText, PHYSICAL_WORK_PATTERNS)) {
    score -= 0.75;
    decreasingFactors.push('Requires significant physical work in variable environments');
  }

  // 6. Technology skills - having many may indicate tech-savviness but also replaceability
  const techCount = (occ.technology_skills || []).length;
  if (techCount > 15) {
    score += 0.5;
    increasingFactors.push('Heavy reliance on software tools that could be automated');
  }

  // 7. Specific high-risk occupation patterns
  const titleLower = occ.title.toLowerCase();
  if (titleLower.includes('clerk') || titleLower.includes('secretary') || titleLower.includes('receptionist')) {
    score += 1.0;
    increasingFactors.push('Administrative role with high automation potential');
  }
  if (titleLower.includes('cashier') || titleLower.includes('teller')) {
    score += 1.5;
    increasingFactors.push('Transaction processing role already being automated');
  }
  if (titleLower.includes('driver') && !titleLower.includes('emergency')) {
    score += 0.5;
    increasingFactors.push('Driving role with autonomous vehicle potential (long-term)');
  }

  // 8. Specific low-risk occupation patterns
  if (titleLower.includes('surgeon') || titleLower.includes('physician')) {
    score -= 1.5;
    decreasingFactors.push('Requires medical judgment and physical intervention with life-or-death stakes');
  }
  if (titleLower.includes('emergency') || titleLower.includes('first responder')) {
    score -= 1.0;
    decreasingFactors.push('Emergency response requires real-time human judgment in unpredictable situations');
  }
  if (titleLower.includes('therapist') || titleLower.includes('counselor')) {
    score -= 1.0;
    decreasingFactors.push('Requires human empathy and therapeutic relationship');
  }

  // Clamp score to 1-10 range
  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

  // Determine label
  let label: AIRiskScore['label'];
  if (score <= 2) label = 'very_low';
  else if (score <= 4) label = 'low';
  else if (score <= 6) label = 'medium';
  else if (score <= 8) label = 'high';
  else label = 'very_high';

  // Determine confidence based on how much data we have
  let confidence: AIRiskScore['confidence'] = 'medium';
  if ((occ.tasks || []).length >= 10 && increasingFactors.length + decreasingFactors.length >= 4) {
    confidence = 'high';
  } else if ((occ.tasks || []).length < 3) {
    confidence = 'low';
  }

  // Generate summary
  const summary = score <= 4
    ? `${occ.title} has ${label.replace('_', ' ')} automation risk due to the need for ${decreasingFactors[0]?.toLowerCase() || 'human judgment and physical presence'}.`
    : score >= 7
    ? `${occ.title} has ${label.replace('_', ' ')} automation risk because ${increasingFactors[0]?.toLowerCase() || 'many tasks are routine and data-driven'}.`
    : `${occ.title} has ${label.replace('_', ' ')} automation risk with a mix of automatable and human-dependent tasks.`;

  return {
    score,
    label,
    confidence,
    rationale: {
      summary,
      factors_increasing_risk: increasingFactors.slice(0, 5),
      factors_decreasing_risk: decreasingFactors.slice(0, 5),
    },
    reference_scores: [
      {
        source: 'Task-based analysis',
        score,
        notes: `Based on O*NET task statements and occupation characteristics`,
      },
    ],
    last_assessed: new Date().toISOString().split('T')[0],
    assessor: 'claude',
  };
}

async function main() {
  console.log('\n=== Scoring AI Automation Risk ===\n');

  // Load occupations
  const occupationsFile = path.join(PROCESSED_DIR, 'occupations_complete.json');
  if (!fs.existsSync(occupationsFile)) {
    console.error('Error: occupations_complete.json not found. Run earlier phases first.');
    process.exit(1);
  }

  const occupationsData = JSON.parse(fs.readFileSync(occupationsFile, 'utf-8'));
  const occupations = occupationsData.occupations;
  console.log(`Scoring ${occupations.length} occupations...`);

  // Score each occupation
  const aiRiskRationales: Record<string, AIRiskScore> = {};
  const scoreDistribution: Record<string, number> = {
    'very_low': 0,
    'low': 0,
    'medium': 0,
    'high': 0,
    'very_high': 0,
  };

  occupations.forEach((occ: {
    onet_code: string;
    title: string;
    description: string;
    category: string;
    job_zone: number;
    tasks: string[];
    abilities: string[];
    technology_skills: string[];
    ai_risk: AIRiskScore | null;
  }) => {
    const riskScore = scoreOccupation(occ);
    occ.ai_risk = riskScore;
    aiRiskRationales[occ.onet_code] = riskScore;
    scoreDistribution[riskScore.label]++;
  });

  // Update occupations file
  occupationsData.metadata.fields_pending = occupationsData.metadata.fields_pending.filter(
    (f: string) => f !== 'ai_risk'
  );
  occupationsData.metadata.last_updated = new Date().toISOString().split('T')[0];

  fs.writeFileSync(occupationsFile, JSON.stringify(occupationsData, null, 2));
  console.log('Updated occupations with AI risk scores');

  // Save detailed rationales
  const rationalesFile = path.join(PROCESSED_DIR, 'ai_risk_rationales.json');
  const rationalesOutput = {
    metadata: {
      methodology_version: '1.0',
      assessed_at: new Date().toISOString().split('T')[0],
      total_assessed: Object.keys(aiRiskRationales).length,
      methodology_notes: 'Scoring based on task analysis, job zone, category, and occupation-specific factors',
    },
    score_distribution: scoreDistribution,
    assessments: aiRiskRationales,
  };
  fs.writeFileSync(rationalesFile, JSON.stringify(rationalesOutput, null, 2));
  console.log('Saved detailed rationales to ai_risk_rationales.json');

  // Print distribution
  console.log('\nAI Risk Score Distribution:');
  Object.entries(scoreDistribution).forEach(([label, count]) => {
    const pct = ((count / occupations.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 20));
    console.log(`  ${label.padEnd(10)}: ${count.toString().padStart(4)} (${pct}%) ${bar}`);
  });

  // Print examples for each category
  console.log('\nExamples by risk level:');
  const examples: Record<string, { title: string; score: number }[]> = {
    'very_low': [],
    'low': [],
    'medium': [],
    'high': [],
    'very_high': [],
  };

  occupations.forEach((occ: { title: string; ai_risk: AIRiskScore }) => {
    if (occ.ai_risk && examples[occ.ai_risk.label].length < 3) {
      examples[occ.ai_risk.label].push({ title: occ.title, score: occ.ai_risk.score });
    }
  });

  Object.entries(examples).forEach(([label, occs]) => {
    console.log(`\n  ${label.toUpperCase()}:`);
    occs.forEach(o => console.log(`    - ${o.title} (${o.score})`));
  });

  console.log('\n=== AI Risk Scoring Complete ===\n');
}

main().catch(console.error);
