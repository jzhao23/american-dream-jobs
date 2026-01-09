/**
 * Career Matching Engine for Career Compass
 *
 * Implements a 3-stage matching algorithm:
 * 1. Embedding Similarity (Fast Filter) - Top 50 candidates
 * 2. O*NET Structured Matching - Top 15 candidates
 * 3. LLM Reasoning - Top 7 with explanations
 */

import Anthropic from '@anthropic-ai/sdk';
import { ParsedResume } from './resume-parser';
import {
  generateQueryEmbeddings,
  cosineSimilarity,
  calculateWeightedSimilarity
} from './embedding-service';
import { findSimilarCareers, SimilarCareer } from './supabase';
import * as fs from 'fs';
import * as path from 'path';

// Types
export interface UserPreferences {
  // Legacy string fields (for backward compatibility)
  careerGoals?: string;
  workEnvironment?: string;
  // New structured selections from wizard
  trainingWillingness: 'minimal' | 'short-term' | 'medium' | 'significant';
  educationLevel: 'high-school' | 'some-college' | 'bachelors' | 'masters-plus';
  workBackground: string[];   // e.g., ['service', 'office', 'technical']
  salaryTarget: 'under-40k' | '40-60k' | '60-80k' | '80-100k' | '100k-plus';
  workStyle: string[];        // e.g., ['hands-on', 'people'] - max 2
  additionalContext?: string; // "Anything else we should know" field
}

export interface UserProfile {
  resume: ParsedResume;
  preferences: UserPreferences;
}

export interface CareerMatch {
  slug: string;
  title: string;
  category: string;
  matchScore: number;
  medianPay: number;
  aiResilience: string;
  reasoning: string;
  skillsGap: [string, string, string];
  transitionTimeline: string;
  education: string;
}

export interface MatchingResult {
  matches: CareerMatch[];
  metadata: {
    stage1Candidates: number;
    stage2Candidates: number;
    finalMatches: number;
    processingTimeMs: number;
    costUsd: number;
  };
}

interface CareerCandidate extends SimilarCareer {
  structuredScore?: number;
  careerData?: CareerData;
}

interface CareerData {
  // O*NET-specific fields (optional for manual careers)
  onet_code?: string;  // Required for O*NET careers, undefined for manual
  job_zone?: number;   // O*NET job zone (1-5), undefined for manual

  // Core fields (required for all)
  title: string;
  slug: string;
  description: string;
  category: string;
  tasks: string[];
  technology_skills: string[];
  abilities: string[];

  // Optional fields
  wages?: { annual?: { median?: number } };
  ai_resilience?: string;
  education?: {
    typical_entry_education?: string;
  };
  timeline_bucket?: 'asap' | '6-24-months' | '2-4-years' | '4-plus-years';

  // Data source (v2.1)
  data_source?: 'onet' | 'manual';
}

// Training willingness type for filtering
export type TrainingWillingness = 'minimal' | 'short-term' | 'medium' | 'significant';

// Model type for routing between full LLM and lightweight modes
export type MatchingModel = 'model-a' | 'model-b';

interface CareerDWAMapping {
  careers: Record<string, { dwa_ids: string[] }>;
}

// Singleton Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

// Cache for career data
let careersData: CareerData[] | null = null;
let careerDWAs: Record<string, string[]> | null = null;

function loadCareersData(): CareerData[] {
  if (careersData) return careersData;

  const careersPath = path.join(process.cwd(), 'data/output/careers.json');
  if (!fs.existsSync(careersPath)) {
    throw new Error('careers.json not found');
  }

  careersData = JSON.parse(fs.readFileSync(careersPath, 'utf-8'));
  return careersData!;
}

function loadCareerDWAs(): Record<string, string[]> {
  if (careerDWAs) return careerDWAs;

  const dwaPath = path.join(process.cwd(), 'data/compass/career-dwas.json');
  if (!fs.existsSync(dwaPath)) {
    console.warn('career-dwas.json not found, proceeding without DWA matching');
    careerDWAs = {};
    return careerDWAs;
  }

  const data: CareerDWAMapping = JSON.parse(fs.readFileSync(dwaPath, 'utf-8'));
  careerDWAs = {};
  Object.entries(data.careers).forEach(([, mapping]) => {
    careerDWAs![mapping.dwa_ids[0]?.split('.')[0] || ''] = mapping.dwa_ids;
  });

  // Re-index by onet_code
  careerDWAs = {};
  Object.values(data.careers).forEach((mapping: { dwa_ids: string[] } & { onet_code?: string }) => {
    if (mapping.onet_code) {
      careerDWAs![mapping.onet_code] = mapping.dwa_ids;
    }
  });

  return careerDWAs;
}

/**
 * Filter careers by training willingness, accounting for user's existing education
 *
 * The key insight: We calculate ADDITIONAL training needed, not total from-scratch training.
 * A user with a Master's degree selecting "short-term training" shouldn't be filtered out
 * of Bachelor's-required careers - they already exceed that requirement!
 */
function filterByTrainingWillingness(
  trainingLevel: TrainingWillingness,
  userEducationLevel: string // 'high-school' | 'some-college' | 'bachelors' | 'masters-plus'
): Set<string> | null {
  const careers = loadCareersData();
  const matchingSlugs = new Set<string>();

  // Training willingness maps to max ADDITIONAL education time user is willing to invest
  const maxYears: Record<TrainingWillingness, number> = {
    'minimal': 0.5,      // < 6 months
    'short-term': 1,     // 3-6 months to 1 year
    'medium': 2,         // 1-2 year programs
    'significant': 999   // No limit - includes 10+ year paths like surgeons
  };

  // User's education level in years (approximate time to achieve from high school)
  const educationYears: Record<string, number> = {
    'high-school': 0,
    'some-college': 1,
    'bachelors': 4,
    'masters-plus': 6
  };

  // Career education requirements in years (based on timeline_bucket)
  const careerEducationRequirements: Record<string, number> = {
    'asap': 0,              // No formal education required
    '6-24-months': 1,       // Certificate or short program
    '2-4-years': 4,         // Bachelor's degree
    '4-plus-years': 6       // Master's or professional degree
  };

  const userMaxYears = maxYears[trainingLevel];
  const userEducationYears = educationYears[userEducationLevel] || 0;

  careers.forEach(career => {
    const careerBucket = career.timeline_bucket || '2-4-years';

    // Get the career's education requirement in years
    const careerRequiredYears = careerEducationRequirements[careerBucket] ?? 4;

    // Calculate ADDITIONAL training needed (can't be negative)
    const additionalTrainingNeeded = Math.max(0, careerRequiredYears - userEducationYears);

    // Include career if additional training is within user's willingness
    if (additionalTrainingNeeded <= userMaxYears) {
      matchingSlugs.add(career.slug);
    }
  });

  console.log(`  Training filter (${trainingLevel}, user edu: ${userEducationLevel}): ${matchingSlugs.size} careers match`);
  return matchingSlugs;
}

/**
 * Stage 1: Embedding Similarity Filter
 * Returns top 50 candidates based on vector similarity
 */
async function stage1EmbeddingSimilarity(
  profile: UserProfile,
  useSupabase: boolean = true,
  timelineFilter: Set<string> | null = null
): Promise<CareerCandidate[]> {
  console.log('  Stage 1: Embedding similarity search...');

  // Build preference strings from structured selections
  const workStyleLabels = profile.preferences.workStyle
    .map(id => WORK_STYLE_LABELS[id] || id)
    .join(', ');
  const backgroundLabels = profile.preferences.workBackground
    .map(id => WORK_BACKGROUND_LABELS[id] || id)
    .join(', ');

  // Generate query embeddings
  const queryEmbeddings = await generateQueryEmbeddings(
    {
      skills: profile.resume.skills,
      jobTitles: profile.resume.jobTitles,
      education: profile.resume.education.level,
      industries: profile.resume.industries,
      experienceYears: profile.resume.experienceYears
    },
    {
      careerGoals: workStyleLabels || profile.preferences.careerGoals || 'Career growth and stability',
      skillsToDevelop: backgroundLabels || 'Skills relevant to career goals',
      workEnvironment: profile.preferences.workEnvironment || 'Flexible environment',
      salaryExpectations: SALARY_TARGET_LABELS[profile.preferences.salaryTarget] || '$60,000',
      industryInterests: backgroundLabels || 'Open to various industries'
    }
  );

  if (useSupabase) {
    // Use Supabase pgvector for similarity search
    try {
      let candidates = await findSimilarCareers(
        queryEmbeddings.task,
        queryEmbeddings.narrative,
        queryEmbeddings.skills,
        { limit: timelineFilter ? 100 : 50 } // Fetch more if we need to filter
      );

      // Apply timeline filter if provided
      if (timelineFilter) {
        candidates = candidates.filter(c => timelineFilter.has(c.career_slug));
        candidates = candidates.slice(0, 50);
      }

      console.log(`    Found ${candidates.length} candidates via Supabase`);
      return candidates;
    } catch (error) {
      console.warn('    Supabase search failed, falling back to local search');
    }
  }

  // Fallback: Local embedding search using JSON file
  const embeddingsPath = path.join(process.cwd(), 'data/compass/career-embeddings.json');
  if (!fs.existsSync(embeddingsPath)) {
    throw new Error('Career embeddings not found. Run npm run compass:generate-embeddings first.');
  }

  const embeddingsData = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'));
  const candidates: CareerCandidate[] = [];

  for (const career of embeddingsData.embeddings) {
    // Apply timeline filter if provided
    if (timelineFilter && !timelineFilter.has(career.career_slug)) {
      continue;
    }

    const similarity = calculateWeightedSimilarity(
      queryEmbeddings,
      {
        task: career.task_embedding,
        narrative: career.narrative_embedding,
        skills: career.skills_embedding
      }
    );

    candidates.push({
      career_slug: career.career_slug,
      onet_code: career.onet_code,
      title: career.title,
      category: career.category,
      median_salary: career.median_salary,
      ai_resilience: career.ai_resilience,
      similarity
    });
  }

  // Sort and return top 50
  candidates.sort((a, b) => b.similarity - a.similarity);
  console.log(`    Found ${candidates.length} candidates via local search`);
  return candidates.slice(0, 50);
}

/**
 * Stage 2: O*NET Structured Matching
 * Re-ranks candidates using skill overlap, education fit, salary fit
 */
function stage2StructuredMatching(
  candidates: CareerCandidate[],
  profile: UserProfile
): CareerCandidate[] {
  console.log('  Stage 2: Structured matching...');

  const careers = loadCareersData();
  const careerLookup = new Map(careers.map(c => [c.slug, c]));

  // Parse salary target from new preferences
  let targetSalary: number | null = null;
  const salaryTargetMap: Record<string, number> = {
    'under-40k': 35000,
    '40-60k': 50000,
    '60-80k': 70000,
    '80-100k': 90000,
    '100k-plus': 120000
  };
  targetSalary = salaryTargetMap[profile.preferences.salaryTarget] || 50000;

  // Score each candidate
  const scored = candidates.map(candidate => {
    const careerData = careerLookup.get(candidate.career_slug);
    if (!careerData) {
      return { ...candidate, structuredScore: candidate.similarity * 0.5 };
    }

    // Skill overlap (Jaccard similarity)
    const userSkills = new Set(profile.resume.skills.map(s => s.toLowerCase()));
    const careerSkills = new Set([
      ...careerData.technology_skills.map(s => s.toLowerCase()),
      ...careerData.abilities.map(a => a.toLowerCase())
    ]);
    const intersection = new Set([...userSkills].filter(x => careerSkills.has(x)));
    const union = new Set([...userSkills, ...careerSkills]);
    const skillOverlap = union.size > 0 ? intersection.size / union.size : 0;

    // Education fit (1.0 = perfect match, lower for mismatches)
    const educationFit = calculateEducationFit(
      profile.resume.education.level,
      careerData.education?.typical_entry_education || "Bachelor's degree"
    );

    // Salary fit (1.0 if meets or exceeds expectations)
    let salaryFit = 0.7; // Default
    if (targetSalary && careerData.wages?.annual?.median) {
      const medianSalary = careerData.wages.annual.median;
      if (medianSalary >= targetSalary) {
        salaryFit = 1.0;
      } else {
        salaryFit = Math.max(0.3, medianSalary / targetSalary);
      }
    }

    // AI resilience bonus
    let aiBonus = 0;
    if (careerData.ai_resilience === 'AI-Resilient') {
      aiBonus = 0.1;
    } else if (careerData.ai_resilience === 'AI-Augmented') {
      aiBonus = 0.05;
    } else if (careerData.ai_resilience === 'High Disruption Risk') {
      aiBonus = -0.1;
    }

    // Weighted score
    const structuredScore =
      skillOverlap * 0.35 +
      educationFit * 0.15 +
      salaryFit * 0.15 +
      candidate.similarity * 0.35 +
      aiBonus;

    return {
      ...candidate,
      structuredScore,
      careerData
    };
  });

  // Sort by structured score and return top 30
  scored.sort((a, b) => (b.structuredScore || 0) - (a.structuredScore || 0));
  console.log(`    Re-ranked to ${Math.min(scored.length, 30)} candidates`);
  return scored.slice(0, 30);
}

/**
 * Calculate education fit score
 */
function calculateEducationFit(userLevel: string, requiredLevel: string): number {
  const levels: Record<string, number> = {
    'high_school': 1,
    'some_college': 2,
    'associates': 3,
    'bachelors': 4,
    'masters': 5,
    'professional_degree': 6,
    'doctorate': 7
  };

  const userScore = levels[userLevel] || 1;

  // Parse required level
  const reqLower = requiredLevel.toLowerCase();
  let reqScore = 4; // Default to bachelor's
  if (reqLower.includes('high school') || reqLower.includes('less than')) {
    reqScore = 1;
  } else if (reqLower.includes('some college') || reqLower.includes('certificate')) {
    reqScore = 2;
  } else if (reqLower.includes('associate')) {
    reqScore = 3;
  } else if (reqLower.includes('bachelor')) {
    reqScore = 4;
  } else if (reqLower.includes('master')) {
    reqScore = 5;
  } else if (reqLower.includes('professional') || reqLower.includes('first professional')) {
    reqScore = 6;
  } else if (reqLower.includes('doctor') || reqLower.includes('phd')) {
    reqScore = 7;
  }

  // Score based on gap
  const gap = reqScore - userScore;
  if (gap <= 0) return 1.0;      // User meets or exceeds requirement
  if (gap === 1) return 0.8;     // One level below
  if (gap === 2) return 0.5;     // Two levels below
  return 0.3;                     // Significant gap
}

/**
 * Stage 3: LLM Reasoning
 * Generates personalized reasoning for top candidates
 */
async function stage3LLMReasoning(
  candidates: CareerCandidate[],
  profile: UserProfile
): Promise<CareerMatch[]> {
  console.log('  Stage 3: LLM reasoning...');

  const client = getAnthropicClient();

  // Build prompt with user profile and candidates
  const prompt = buildReasoningPrompt(candidates, profile);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0,
    messages: [
      { role: 'user', content: prompt }
    ],
    system: REASONING_SYSTEM_PROMPT
  });

  // Parse response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const matches: CareerMatch[] = JSON.parse(jsonMatch[0]);

    // Validate and enrich matches
    return matches
      .filter(m => m.matchScore >= 60)
      .slice(0, 15)
      .map(m => ({
        ...m,
        // Ensure skillsGap is exactly 3 items
        skillsGap: (m.skillsGap || ['General skills', 'Industry knowledge', 'Technical certifications']).slice(0, 3) as [string, string, string]
      }));
  } catch (error) {
    console.error('Failed to parse LLM response:', content.text);
    throw new Error('Failed to generate career recommendations');
  }
}

const REASONING_SYSTEM_PROMPT = `You are a warm, supportive career counselor speaking directly to someone exploring their career options.

Write as if you're having an encouraging one-on-one conversation. Always use "you" and "your" - never "the user" or "the candidate".

Your tone should be:
- Supportive and optimistic (but realistic)
- Personal and conversational
- Encouraging about their potential
- Specific about how THEIR background connects to this career

## CRITICAL: User Selections Are Your Priority

The user has made EXPLICIT selections about what they want. These MUST heavily influence your scoring:

1. **TRAINING WILLINGNESS** - How much education/training they're willing to invest
   - Only recommend careers that fit within their training timeframe
   - If they selected "minimal training", don't recommend careers requiring years of education

2. **EDUCATION LEVEL** - Their current education
   - Use this to assess realistic career transitions
   - Factor into whether they meet minimum requirements

3. **WORK BACKGROUND** - Their experience areas
   - Strongly favor careers where their background transfers
   - Look for skill and industry overlaps

4. **SALARY TARGET** - What they want to earn
   - Prioritize careers that meet or exceed their target
   - Be realistic about salaries at their experience level

5. **WORK STYLE** - Type of work they prefer
   - Hands-on, people-focused, analytical, creative, technology, or leadership
   - Match careers to their preferred work type

## Scoring Weights (IMPORTANT - these weights are prioritized)

For each career, evaluate fit based on:
1. **Background transferability (30%)**: Does their work experience translate to this career?
2. **Training feasibility (30%)**: Can they complete the required training within their stated willingness?
3. **Salary fit (25%)**: Does the career meet their salary target?
4. **Work style alignment (15%)**: Does the day-to-day work match their preferred style?

**IMPORTANT**: If a career requires training beyond their stated willingness OR doesn't match their background at all, cap its score at 70 maximum.

Return a JSON array of the top 15 career matches with this structure:
[
  {
    "slug": "career-slug",
    "title": "Career Title",
    "category": "category",
    "matchScore": 85,
    "medianPay": 75000,
    "aiResilience": "AI-Resilient",
    "reasoning": "2-3 warm, encouraging sentences speaking directly to the person. Reference how their background transfers and how the career fits their practical needs (salary, training time).",
    "skillsGap": ["Specific Skill 1", "Specific Skill 2", "Specific Skill 3"],
    "transitionTimeline": "6-12 months",
    "education": "Bachelor's degree"
  }
]

Example good reasoning (for someone with office background targeting $60-80k with short-term training):
"Your administrative experience gives you a real head start here – project coordination skills transfer directly. With a 3-6 month certification, you could be earning in your target range. The analytical day-to-day work matches what you're looking for."

Rules:
- Return 10-15 career matches based on fit quality. Aim for 15 if enough good matches exist.
- matchScore should range from 60-100, distributed appropriately based on fit
- reasoning MUST reference their background and practical fit (training, salary)
- reasoning must speak directly to "you/your" - NEVER say "the user" or "the candidate"
- skillsGap must be exactly 3 specific, learnable skills
- transitionTimeline: "6-12 months", "1-2 years", "2-4 years", "4-6 years", or "6+ years"
- Boost AI-Resilient careers by 5-10 points
- Penalize "High Disruption Risk" careers by 5-10 points
- If they provided "additional context" (e.g., "I'm a single parent"), factor this into your reasoning

Return ONLY the JSON array with 10-15 matches.`;

// Training willingness labels
const TRAINING_LABELS: Record<string, string> = {
  'minimal': 'Minimal training (a few weeks)',
  'short-term': 'Short-term program (3-6 months)',
  'medium': '1-2 year program',
  'significant': 'Significant investment (Bachelor\'s or apprenticeship)',
  'open': 'Open to anything'
};

// Education level labels
const EDUCATION_LABELS: Record<string, string> = {
  'high-school': 'High school diploma or GED',
  'some-college': 'Some college or Associate\'s degree',
  'bachelors': 'Bachelor\'s degree',
  'masters-plus': 'Master\'s degree or higher'
};

// Work background labels
const WORK_BACKGROUND_LABELS: Record<string, string> = {
  'none': 'No significant work experience',
  'service': 'Service, Retail, or Hospitality',
  'office': 'Office, Administrative, or Clerical',
  'technical': 'Technical, IT, or Engineering',
  'healthcare': 'Healthcare or Medical',
  'trades': 'Trades, Construction, or Manufacturing',
  'sales': 'Sales & Marketing',
  'finance': 'Business & Finance',
  'education': 'Education or Social Services',
  'creative': 'Creative, Media, or Design'
};

// Salary target labels
const SALARY_TARGET_LABELS: Record<string, string> = {
  'under-40k': 'Under $40,000',
  '40-60k': '$40,000 - $60,000',
  '60-80k': '$60,000 - $80,000',
  '80-100k': '$80,000 - $100,000',
  '100k-plus': '$100,000+'
};

// Work style labels
const WORK_STYLE_LABELS: Record<string, string> = {
  'hands-on': 'Hands-on work (building, fixing, operating)',
  'people': 'Working with people (caring, teaching, helping)',
  'analytical': 'Analysis & problem-solving (data, research, strategy)',
  'creative': 'Creative & design (art, writing, media)',
  'technology': 'Technology & digital (coding, IT, software)',
  'leadership': 'Leadership & business (managing, selling, organizing)'
};

function buildReasoningPrompt(
  candidates: CareerCandidate[],
  profile: UserProfile
): string {
  const parts: string[] = [];
  const prefs = profile.preferences;

  // USER SELECTIONS - Most important section
  parts.push('# USER SELECTIONS (MUST PRIORITIZE THESE)\n');

  // Training Willingness
  parts.push(`## Training Willingness:`);
  parts.push(`- ${TRAINING_LABELS[prefs.trainingWillingness] || prefs.trainingWillingness}`);
  parts.push('');

  // Education Level
  parts.push(`## Current Education:`);
  parts.push(`- ${EDUCATION_LABELS[prefs.educationLevel] || prefs.educationLevel}`);
  parts.push('');

  // Work Background
  if (prefs.workBackground && prefs.workBackground.length > 0) {
    const backgroundLabels = prefs.workBackground.map(id => WORK_BACKGROUND_LABELS[id] || id);
    parts.push(`## Work Background:`);
    backgroundLabels.forEach(label => parts.push(`- ✅ ${label}`));
    parts.push('');
  } else {
    parts.push(`## Work Background: No significant experience\n`);
  }

  // Salary Target
  parts.push(`## Salary Target:`);
  parts.push(`- ${SALARY_TARGET_LABELS[prefs.salaryTarget] || prefs.salaryTarget}`);
  parts.push('');

  // Work Style
  if (prefs.workStyle && prefs.workStyle.length > 0) {
    const workStyleLabels = prefs.workStyle.map(id => WORK_STYLE_LABELS[id] || id);
    parts.push(`## Preferred Work Style:`);
    workStyleLabels.forEach(label => parts.push(`- ✅ ${label}`));
    parts.push('');
  }

  // Additional Context (the "Anything else" field)
  if (prefs.additionalContext && prefs.additionalContext.trim()) {
    parts.push(`## Additional Context (IMPORTANT - factor this in):`);
    parts.push(`"${prefs.additionalContext.trim()}"`);
    parts.push('');
  }

  // User Background section (from resume if available)
  parts.push('# USER BACKGROUND (from resume)\n');
  parts.push(`- Skills: ${profile.resume.skills.slice(0, 15).join(', ') || 'Not specified'}`);
  parts.push(`- Experience: ${profile.resume.experienceYears} years`);
  parts.push(`- Education: ${profile.resume.education.level} in ${profile.resume.education.fields.join(', ') || 'general field'}`);
  parts.push(`- Previous Roles: ${profile.resume.jobTitles.slice(0, 5).join(', ') || 'Not specified'}`);
  parts.push(`- Industries: ${profile.resume.industries.join(', ') || 'Not specified'}\n`);

  // Candidate careers section
  parts.push('# CANDIDATE CAREERS\n');

  candidates.forEach((candidate, i) => {
    const career = candidate.careerData;
    if (!career) return;

    parts.push(`## ${i + 1}. ${career.title}`);
    parts.push(`- Slug: ${career.slug}`);
    parts.push(`- Category: ${career.category}`);
    parts.push(`- Median Salary: $${(career.wages?.annual?.median || 0).toLocaleString()}`);
    parts.push(`- AI Resilience: ${career.ai_resilience || 'Unknown'}`);
    parts.push(`- Education Required: ${career.education?.typical_entry_education || 'Bachelor\'s degree'}`);
    parts.push(`- Initial Match Score: ${(candidate.structuredScore! * 100).toFixed(0)}%`);
    parts.push(`- Key Tasks: ${career.tasks.slice(0, 3).join('; ')}`);
    parts.push(`- Required Skills: ${career.technology_skills.slice(0, 5).join(', ')}\n`);
  });

  parts.push('\nAnalyze these careers against their EXPLICIT SELECTIONS (training, background, salary, work style) and return the top 15 matches as a JSON array.');

  return parts.join('\n');
}

/**
 * Model B: Lightweight Haiku reasoning for users without resumes
 * Faster and cheaper than full Sonnet pipeline
 */
const HAIKU_REASONING_PROMPT = `You are a supportive career counselor helping someone explore career options.

Write brief, encouraging reasoning for each career match. Use "you" and "your" language.

## CRITICAL: Respect User Selections

The user made explicit selections about:
1. **TRAINING WILLINGNESS** - How much education/training they'll invest
2. **EDUCATION LEVEL** - Their current education
3. **WORK BACKGROUND** - Their experience areas (where skills transfer)
4. **SALARY TARGET** - What they want to earn
5. **WORK STYLE** - Type of work they prefer

## Scoring Weights (IMPORTANT)

1. **Background transferability (30%)**: Does their experience translate?
2. **Training feasibility (30%)**: Can they complete required training within their stated willingness?
3. **Salary fit (25%)**: Does the career meet their target?
4. **Work style alignment (15%)**: Does the work match their preference?

Return a JSON array with 10-15 career matches in this structure:
[
  {
    "slug": "career-slug",
    "title": "Career Title",
    "category": "category",
    "matchScore": 85,
    "medianPay": 75000,
    "aiResilience": "AI-Resilient",
    "reasoning": "1-2 sentences about how their background transfers and if the career fits their practical needs.",
    "skillsGap": ["Skill 1", "Skill 2", "Skill 3"],
    "transitionTimeline": "6-12 months",
    "education": "Bachelor's degree"
  }
]

Rules:
- Return 10-15 matches, scored 60-100 based on fit
- Careers requiring training beyond their willingness: cap at 70
- skillsGap must be exactly 3 items
- transitionTimeline: "6-12 months", "1-2 years", "2-4 years", "4-6 years", or "6+ years"
- Boost AI-Resilient careers slightly

Return ONLY the JSON array.`;

async function stage3HaikuReasoning(
  candidates: CareerCandidate[],
  profile: UserProfile
): Promise<CareerMatch[]> {
  console.log('  Stage 3: Haiku reasoning (Model B)...');

  const client = getAnthropicClient();
  const prefs = profile.preferences;

  // Build a lighter prompt for Haiku
  const parts: string[] = [];

  // USER SELECTIONS - Most important
  parts.push('# USER SELECTIONS (PRIORITIZE THESE)\n');

  // Training Willingness
  parts.push(`## Training Willingness: ${TRAINING_LABELS[prefs.trainingWillingness] || prefs.trainingWillingness}`);

  // Education
  parts.push(`## Education: ${EDUCATION_LABELS[prefs.educationLevel] || prefs.educationLevel}`);

  // Work Background
  if (prefs.workBackground && prefs.workBackground.length > 0) {
    const backgroundLabels = prefs.workBackground.map(id => WORK_BACKGROUND_LABELS[id] || id);
    parts.push(`## Work Background: ${backgroundLabels.join(', ')}`);
  } else {
    parts.push(`## Work Background: No significant experience`);
  }

  // Salary Target
  parts.push(`## Salary Target: ${SALARY_TARGET_LABELS[prefs.salaryTarget] || prefs.salaryTarget}`);

  // Work Style
  if (prefs.workStyle && prefs.workStyle.length > 0) {
    const workStyleLabels = prefs.workStyle.map(id => WORK_STYLE_LABELS[id] || id);
    parts.push(`## Work Style: ${workStyleLabels.join(', ')}`);
  }

  // Additional context
  if (prefs.additionalContext && prefs.additionalContext.trim()) {
    parts.push(`## Additional Context: "${prefs.additionalContext.trim()}"`);
  }
  parts.push('');

  // Include resume info if available (for hybrid cases)
  if (profile.resume.skills.length > 0) {
    parts.push(`# BACKGROUND (from resume)`);
    parts.push(`- Skills: ${profile.resume.skills.slice(0, 10).join(', ')}`);
    parts.push(`- Experience: ${profile.resume.experienceYears} years\n`);
  }

  parts.push('# TOP CAREER CANDIDATES\n');

  candidates.slice(0, 20).forEach((candidate, i) => {
    const career = candidate.careerData;
    if (!career) return;

    parts.push(`${i + 1}. ${career.title} (${career.slug})`);
    parts.push(`   Category: ${career.category}, Salary: $${(career.wages?.annual?.median || 0).toLocaleString()}`);
    parts.push(`   AI Resilience: ${career.ai_resilience || 'Unknown'}, Education: ${career.education?.typical_entry_education || 'Bachelor\'s'}`);
  });

  parts.push('\nReturn the top 10-15 matches as JSON, prioritizing careers that match their training willingness, background, and salary target.');

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 3000,
    temperature: 0,
    messages: [
      { role: 'user', content: parts.join('\n') }
    ],
    system: HAIKU_REASONING_PROMPT
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Haiku');
  }

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in Haiku response');
    }

    const matches: CareerMatch[] = JSON.parse(jsonMatch[0]);

    return matches
      .filter(m => m.matchScore >= 60)
      .slice(0, 15)
      .map(m => ({
        ...m,
        skillsGap: (m.skillsGap || ['General skills', 'Industry knowledge', 'Technical certifications']).slice(0, 3) as [string, string, string]
      }));
  } catch (error) {
    console.error('Failed to parse Haiku response:', content.text);
    throw new Error('Failed to generate career recommendations (Haiku)');
  }
}

/**
 * Main matching function
 *
 * Supports two models:
 * - model-a (default): Full Sonnet pipeline for users with resumes
 * - model-b: Lightweight Haiku pipeline for users without resumes
 */
export async function matchCareers(
  profile: UserProfile,
  options: {
    useSupabase?: boolean;
    trainingWillingness?: TrainingWillingness;
    model?: MatchingModel;
  } = {}
): Promise<MatchingResult> {
  const startTime = Date.now();
  let costUsd = 0;

  const model = options.model || 'model-a';
  const trainingWillingness = options.trainingWillingness || profile.preferences.trainingWillingness || 'significant';

  console.log(`\n🎯 Starting career matching (${model}, training: ${trainingWillingness})...`);

  // Apply training filter if specified, accounting for user's existing education
  const userEducation = profile.preferences.educationLevel || 'high-school';
  const trainingFilter = filterByTrainingWillingness(trainingWillingness, userEducation);

  // Stage 1: Embedding similarity
  const stage1Start = Date.now();
  const stage1Candidates = await stage1EmbeddingSimilarity(
    profile,
    options.useSupabase ?? true,
    trainingFilter
  );
  console.log(`    Stage 1 time: ${Date.now() - stage1Start}ms`);
  costUsd += 0.0004; // Embedding cost

  // Stage 2: Structured matching
  const stage2Start = Date.now();
  const stage2Candidates = stage2StructuredMatching(stage1Candidates, profile);
  console.log(`    Stage 2 time: ${Date.now() - stage2Start}ms`);

  // Stage 3: LLM reasoning (route based on model)
  const stage3Start = Date.now();
  let matches: CareerMatch[];

  if (model === 'model-b') {
    // Model B: Lightweight Haiku for users without resumes
    matches = await stage3HaikuReasoning(stage2Candidates, profile);
    costUsd += 0.001; // Haiku cost estimate (~90% cheaper)
  } else {
    // Model A: Full Sonnet for users with resumes
    matches = await stage3LLMReasoning(stage2Candidates, profile);
    costUsd += 0.01; // Sonnet cost estimate
  }

  console.log(`    Stage 3 time: ${Date.now() - stage3Start}ms`);

  const processingTimeMs = Date.now() - startTime;

  console.log(`✅ Matching complete in ${processingTimeMs}ms (model: ${model}, cost: $${costUsd.toFixed(4)})`);

  return {
    matches,
    metadata: {
      stage1Candidates: stage1Candidates.length,
      stage2Candidates: stage2Candidates.length,
      finalMatches: matches.length,
      processingTimeMs,
      costUsd
    }
  };
}
