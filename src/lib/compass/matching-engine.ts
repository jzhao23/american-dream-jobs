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
  careerGoals: string;        // question1
  skillsToDevelop: string;    // question2
  workEnvironment: string;    // question3
  salaryExpectations: string; // question4
  industryInterests: string;  // question5
  // Structured selections from wizard
  priorityIds?: string[];     // e.g., ['balance', 'stability', 'growth']
  environmentIds?: string[];  // e.g., ['remote', 'fieldwork']
  industryIds?: string[];     // e.g., ['healthcare', 'technology']
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
  onet_code: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  job_zone: number;
  tasks: string[];
  technology_skills: string[];
  abilities: string[];
  wages?: { annual?: { median?: number } };
  ai_resilience?: string;
  education?: {
    typical_entry_education?: string;
  };
  timeline_bucket?: 'asap' | '6-24-months' | '2-4-years' | '4-plus-years';
}

// Timeline bucket type for filtering
export type TimelineBucket = 'asap' | '6-24-months' | '2-4-years' | '4-plus-years' | 'flexible';

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
 * Filter careers by timeline bucket
 * Returns career slugs that match the timeline requirement
 */
function filterByTimeline(
  timelineBucket: TimelineBucket
): Set<string> | null {
  if (timelineBucket === 'flexible') {
    return null; // No filtering - all careers allowed
  }

  const careers = loadCareersData();
  const matchingSlugs = new Set<string>();

  // Timeline buckets are cumulative: 2-4 years includes everything faster
  const timelineOrder: TimelineBucket[] = ['asap', '6-24-months', '2-4-years', '4-plus-years'];
  const selectedIndex = timelineOrder.indexOf(timelineBucket);

  careers.forEach(career => {
    const careerBucket = career.timeline_bucket || '4-plus-years';
    const careerIndex = timelineOrder.indexOf(careerBucket as TimelineBucket);

    // Include career if it can be achieved within the user's timeline
    if (careerIndex <= selectedIndex) {
      matchingSlugs.add(career.slug);
    }
  });

  console.log(`  Timeline filter (${timelineBucket}): ${matchingSlugs.size} careers match`);
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
      careerGoals: profile.preferences.careerGoals,
      skillsToDevelop: profile.preferences.skillsToDevelop,
      workEnvironment: profile.preferences.workEnvironment,
      salaryExpectations: profile.preferences.salaryExpectations,
      industryInterests: profile.preferences.industryInterests
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

  // Parse salary expectations
  let targetSalary: number | null = null;
  const salaryMatch = profile.preferences.salaryExpectations.match(/\$?([\d,]+)/);
  if (salaryMatch) {
    targetSalary = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
  }

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

The user has made EXPLICIT selections about what they want. These are NON-NEGOTIABLE preferences that MUST heavily influence your scoring:

1. **PRIORITIES** (what matters most to them) - MUST be reflected in your career recommendations
   - "Higher earning potential" → prioritize high-paying careers
   - "Work-life balance" → prioritize careers known for flexibility, reasonable hours
   - "Job stability & security" → prioritize careers with strong demand, low volatility
   - "Career growth opportunities" → prioritize careers with clear advancement paths
   - "Meaningful / impactful work" → prioritize careers with social impact

2. **ENVIRONMENT** (where they want to work) - careers MUST match their environment preference
   - "Remote / Work from home" → prioritize remote-friendly careers
   - "Office-based / Indoor" → prioritize traditional office careers
   - "Hands-on / Fieldwork / Outdoors" → prioritize physical, outdoor, or field-based careers
   - "Mix of different settings" → flexible on environment

3. **INDUSTRIES** (fields they're interested in) - strongly favor careers in their selected industries
   - If they selected specific industries, prioritize those fields
   - Only recommend careers outside their selections if they're exceptional fits

## Scoring Weights

For each career, evaluate fit based on:
1. **Priority alignment (30%)**: Does this career deliver on their stated priorities?
2. **Environment match (20%)**: Does the work setting match their preference?
3. **Industry fit (15%)**: Is this in an industry they're interested in?
4. **Skills transferability (20%)**: Do their skills translate to this career?
5. **Transition feasibility (15%)**: Is the education/time realistic?

**IMPORTANT**: If a career doesn't match their environment preference OR their priorities, cap its score at 75 maximum.

Return a JSON array of the top 15 career matches with this structure:
[
  {
    "slug": "career-slug",
    "title": "Career Title",
    "category": "category",
    "matchScore": 85,
    "medianPay": 75000,
    "aiResilience": "AI-Resilient",
    "reasoning": "2-3 warm, encouraging sentences speaking directly to the person. Reference their specific priorities and how this career delivers on them. Make them feel understood.",
    "skillsGap": ["Specific Skill 1", "Specific Skill 2", "Specific Skill 3"],
    "transitionTimeline": "6-12 months",
    "education": "Bachelor's degree"
  }
]

Example good reasoning (for someone who selected "Work-life balance" + "Hands-on / Fieldwork"):
"This role checks all your boxes – you'll be working outdoors with your hands, and the 40-hour weeks with minimal overtime mean you'll have real time for life outside work. Your experience with [their skill] translates directly here."

Rules:
- Return 10-15 career matches based on fit quality. Aim for 15 if enough good matches exist.
- matchScore should range from 60-100, distributed appropriately based on fit
- reasoning MUST reference their specific priorities and how the career delivers on them
- reasoning must speak directly to "you/your" - NEVER say "the user" or "the candidate"
- skillsGap must be exactly 3 specific, learnable skills
- transitionTimeline: "6-12 months", "1-2 years", "2-4 years", "4-6 years", or "6+ years"
- Boost AI-Resilient careers by 5-10 points
- Penalize "High Disruption Risk" careers by 5-10 points
- If they provided "additional context" (e.g., "I'm a single parent"), factor this into your reasoning

Return ONLY the JSON array with 10-15 matches.`;

// Priority ID to label mapping for prompt building
const PRIORITY_LABELS: Record<string, string> = {
  'earning': 'Higher earning potential',
  'balance': 'Work-life balance',
  'stability': 'Job stability & security',
  'growth': 'Career growth opportunities',
  'meaningful': 'Meaningful / impactful work'
};

// Environment ID to label mapping
const ENVIRONMENT_LABELS: Record<string, string> = {
  'remote': 'Remote / Work from home',
  'office': 'Office-based / Indoor',
  'fieldwork': 'Hands-on / Fieldwork / Outdoors',
  'mixed': 'Mix of different settings'
};

// Industry ID to label mapping
const INDUSTRY_LABELS: Record<string, string> = {
  'healthcare': 'Healthcare',
  'technology': 'Technology',
  'trades': 'Skilled Trades',
  'business': 'Business / Finance',
  'transportation': 'Transportation / Logistics',
  'public-service': 'Public Service / Government'
};

function buildReasoningPrompt(
  candidates: CareerCandidate[],
  profile: UserProfile
): string {
  const parts: string[] = [];
  const prefs = profile.preferences;

  // USER SELECTIONS - Most important section
  parts.push('# USER SELECTIONS (MUST PRIORITIZE THESE)\n');

  // Priorities
  if (prefs.priorityIds && prefs.priorityIds.length > 0) {
    const priorityLabels = prefs.priorityIds.map(id => PRIORITY_LABELS[id] || id);
    parts.push(`## What Matters Most to Them:`);
    priorityLabels.forEach(label => parts.push(`- ✅ ${label}`));
    parts.push('');
  } else {
    parts.push(`## Priorities: ${prefs.careerGoals}\n`);
  }

  // Work Environment
  if (prefs.environmentIds && prefs.environmentIds.length > 0) {
    const envLabels = prefs.environmentIds.map(id => ENVIRONMENT_LABELS[id] || id);
    parts.push(`## Preferred Work Environment:`);
    envLabels.forEach(label => parts.push(`- ✅ ${label}`));
    parts.push('');
  } else {
    parts.push(`## Work Environment: ${prefs.workEnvironment}\n`);
  }

  // Industries
  if (prefs.industryIds && prefs.industryIds.length > 0) {
    const industryLabels = prefs.industryIds.map(id => INDUSTRY_LABELS[id] || id);
    parts.push(`## Industries They're Interested In:`);
    industryLabels.forEach(label => parts.push(`- ✅ ${label}`));
    parts.push('');
  } else {
    parts.push(`## Industry Interests: ${prefs.industryInterests}\n`);
  }

  // Additional Context (the "Anything else" field)
  if (prefs.additionalContext && prefs.additionalContext.trim()) {
    parts.push(`## Additional Context (IMPORTANT - factor this in):`);
    parts.push(`"${prefs.additionalContext.trim()}"`);
    parts.push('');
  }

  // User Background section
  parts.push('# USER BACKGROUND\n');
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

  parts.push('\nAnalyze these careers against their EXPLICIT SELECTIONS and return the top 15 matches as a JSON array.');

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
1. **PRIORITIES** - What matters most (e.g., work-life balance, earning potential)
2. **ENVIRONMENT** - Where they want to work (remote, office, fieldwork/outdoors)
3. **INDUSTRIES** - Fields they're interested in

These selections MUST heavily influence your scoring. Careers that don't match their environment or priorities should be scored lower.

Return a JSON array with 10-15 career matches in this structure:
[
  {
    "slug": "career-slug",
    "title": "Career Title",
    "category": "category",
    "matchScore": 85,
    "medianPay": 75000,
    "aiResilience": "AI-Resilient",
    "reasoning": "1-2 sentences about why this career fits their specific priorities and preferences.",
    "skillsGap": ["Skill 1", "Skill 2", "Skill 3"],
    "transitionTimeline": "6-12 months",
    "education": "Bachelor's degree"
  }
]

Rules:
- Return 10-15 matches, scored 60-100 based on fit
- Keep reasoning brief but reference their specific priorities
- Careers that don't match their environment preference: cap at 75
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
  
  // Priorities
  if (prefs.priorityIds && prefs.priorityIds.length > 0) {
    const priorityLabels = prefs.priorityIds.map(id => PRIORITY_LABELS[id] || id);
    parts.push(`## What Matters Most: ${priorityLabels.join(', ')}`);
  } else {
    parts.push(`## Priorities: ${prefs.careerGoals}`);
  }
  
  // Environment
  if (prefs.environmentIds && prefs.environmentIds.length > 0) {
    const envLabels = prefs.environmentIds.map(id => ENVIRONMENT_LABELS[id] || id);
    parts.push(`## Work Environment: ${envLabels.join(', ')}`);
  } else {
    parts.push(`## Environment: ${prefs.workEnvironment}`);
  }
  
  // Industries
  if (prefs.industryIds && prefs.industryIds.length > 0) {
    const industryLabels = prefs.industryIds.map(id => INDUSTRY_LABELS[id] || id);
    parts.push(`## Industries: ${industryLabels.join(', ')}`);
  } else {
    parts.push(`## Industries: ${prefs.industryInterests}`);
  }
  
  // Additional context
  if (prefs.additionalContext && prefs.additionalContext.trim()) {
    parts.push(`## Additional Context: "${prefs.additionalContext.trim()}"`);
  }
  parts.push('');

  // Include resume info if available (for hybrid cases)
  if (profile.resume.skills.length > 0) {
    parts.push(`# BACKGROUND`);
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

  parts.push('\nReturn the top 10-15 matches as JSON, prioritizing careers that match their selections.');

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
    timelineBucket?: TimelineBucket;
    model?: MatchingModel;
  } = {}
): Promise<MatchingResult> {
  const startTime = Date.now();
  let costUsd = 0;

  const model = options.model || 'model-a';
  const timelineBucket = options.timelineBucket || 'flexible';

  console.log(`\n🎯 Starting career matching (${model}, timeline: ${timelineBucket})...`);

  // Apply timeline filter if specified
  const timelineFilter = filterByTimeline(timelineBucket);

  // Stage 1: Embedding similarity
  const stage1Start = Date.now();
  const stage1Candidates = await stage1EmbeddingSimilarity(
    profile,
    options.useSupabase ?? true,
    timelineFilter
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
