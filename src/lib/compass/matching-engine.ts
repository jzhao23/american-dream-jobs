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
}

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

  const careersPath = path.join(process.cwd(), 'data/careers.generated.json');
  if (!fs.existsSync(careersPath)) {
    throw new Error('careers.generated.json not found');
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
 * Stage 1: Embedding Similarity Filter
 * Returns top 50 candidates based on vector similarity
 */
async function stage1EmbeddingSimilarity(
  profile: UserProfile,
  useSupabase: boolean = true
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
      const candidates = await findSimilarCareers(
        queryEmbeddings.task,
        queryEmbeddings.narrative,
        queryEmbeddings.skills,
        { limit: 50 }
      );
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

  // Sort by structured score and return top 15
  scored.sort((a, b) => (b.structuredScore || 0) - (a.structuredScore || 0));
  console.log(`    Re-ranked to ${Math.min(scored.length, 15)} candidates`);
  return scored.slice(0, 15);
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
    model: 'claude-3-haiku-20240307',
    max_tokens: 3000,
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
      .slice(0, 7)
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

const REASONING_SYSTEM_PROMPT = `You are an expert career counselor analyzing career matches for a user.

For each career, evaluate the fit based on:
1. Skills transferability (40%): Do the user's skills translate to this career?
2. Goal alignment (25%): Does this career fulfill their stated goals?
3. Environment fit (15%): Does the work style match their preferences?
4. Financial viability (10%): Does it meet salary expectations?
5. Transition feasibility (10%): Is the education/time realistic?

Return a JSON array of the top 7 career matches with this structure:
[
  {
    "slug": "career-slug",
    "title": "Career Title",
    "category": "category",
    "matchScore": 85,
    "medianPay": 75000,
    "aiResilience": "AI-Resilient",
    "reasoning": "2-3 sentences explaining the match, citing specific user goals and career aspects.",
    "skillsGap": ["Specific Skill 1", "Specific Skill 2", "Specific Skill 3"],
    "transitionTimeline": "6-12 months",
    "education": "Bachelor's degree"
  }
]

Rules:
- matchScore must be 60-100 (filter out poor matches)
- reasoning must be personalized, citing user's specific goals/skills
- skillsGap must be exactly 3 specific, learnable skills
- transitionTimeline: "6-12 months", "1-2 years", "2-4 years", "4-6 years", or "6+ years"
- Avoid generic phrases like "great fit" or "perfect match"
- Boost AI-Resilient careers by 5-10 points
- Penalize "High Disruption Risk" careers by 5-10 points

Return ONLY the JSON array.`;

function buildReasoningPrompt(
  candidates: CareerCandidate[],
  profile: UserProfile
): string {
  const parts: string[] = [];

  // User profile section
  parts.push('# USER PROFILE\n');
  parts.push(`## Background`);
  parts.push(`- Skills: ${profile.resume.skills.slice(0, 15).join(', ') || 'Not specified'}`);
  parts.push(`- Experience: ${profile.resume.experienceYears} years`);
  parts.push(`- Education: ${profile.resume.education.level} in ${profile.resume.education.fields.join(', ') || 'general field'}`);
  parts.push(`- Previous Roles: ${profile.resume.jobTitles.slice(0, 5).join(', ') || 'Not specified'}`);
  parts.push(`- Industries: ${profile.resume.industries.join(', ') || 'Not specified'}\n`);

  parts.push(`## Preferences`);
  parts.push(`- Career Goals: ${profile.preferences.careerGoals}`);
  parts.push(`- Skills to Develop: ${profile.preferences.skillsToDevelop}`);
  parts.push(`- Work Environment: ${profile.preferences.workEnvironment}`);
  parts.push(`- Salary Expectations: ${profile.preferences.salaryExpectations}`);
  parts.push(`- Industry Interests: ${profile.preferences.industryInterests}\n`);

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

  parts.push('\nAnalyze these careers and return the top 7 matches as a JSON array.');

  return parts.join('\n');
}

/**
 * Main matching function
 */
export async function matchCareers(
  profile: UserProfile,
  options: {
    useSupabase?: boolean;
  } = {}
): Promise<MatchingResult> {
  const startTime = Date.now();
  let costUsd = 0;

  console.log('\n🎯 Starting career matching...');

  // Stage 1: Embedding similarity
  const stage1Start = Date.now();
  const stage1Candidates = await stage1EmbeddingSimilarity(
    profile,
    options.useSupabase ?? true
  );
  console.log(`    Stage 1 time: ${Date.now() - stage1Start}ms`);
  costUsd += 0.0004; // Embedding cost

  // Stage 2: Structured matching
  const stage2Start = Date.now();
  const stage2Candidates = stage2StructuredMatching(stage1Candidates, profile);
  console.log(`    Stage 2 time: ${Date.now() - stage2Start}ms`);

  // Stage 3: LLM reasoning
  const stage3Start = Date.now();
  const matches = await stage3LLMReasoning(stage2Candidates, profile);
  console.log(`    Stage 3 time: ${Date.now() - stage3Start}ms`);
  costUsd += 0.01; // LLM cost estimate

  const processingTimeMs = Date.now() - startTime;

  console.log(`✅ Matching complete in ${processingTimeMs}ms`);

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
