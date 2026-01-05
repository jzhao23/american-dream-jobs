/**
 * Embedding Service for Career Compass
 *
 * Handles generation and management of vector embeddings using OpenAI
 */

import OpenAI from 'openai';

// Types for embedding operations
export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export interface CareerEmbeddingInput {
  title: string;
  description: string;
  tasks: string[];
  technology_skills: string[];
  abilities: string[];
  inside_look?: string;
  dwas?: string[];
}

export interface MultiFieldEmbeddings {
  task: number[];
  narrative: number[];
  skills: number[];
  combined: number[];
  totalTokens: number;
}

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client
 */
function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing OpenAI API key. Please set OPENAI_API_KEY in .env.local'
    );
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/**
 * Generate a single embedding
 */
export async function generateEmbedding(
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<EmbeddingResult> {
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model,
    input: text,
    encoding_format: 'float'
  });

  return {
    embedding: response.data[0].embedding,
    tokens: response.usage.total_tokens
  };
}

/**
 * Generate embeddings for multiple texts in a single API call
 */
export async function generateBatchEmbeddings(
  texts: string[],
  model: string = 'text-embedding-3-small'
): Promise<{ embeddings: number[][]; totalTokens: number }> {
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model,
    input: texts,
    encoding_format: 'float'
  });

  return {
    embeddings: response.data.map(d => d.embedding),
    totalTokens: response.usage.total_tokens
  };
}

/**
 * Build task embedding text from career data
 * Focuses on what you do day-to-day
 */
function buildTaskText(input: CareerEmbeddingInput): string {
  const parts: string[] = [];

  // Title and description
  parts.push(`Career: ${input.title}`);
  parts.push(`Description: ${input.description}`);

  // Tasks (core activities)
  if (input.tasks.length > 0) {
    parts.push('Key Tasks:');
    input.tasks.slice(0, 10).forEach(task => {
      parts.push(`- ${task}`);
    });
  }

  // DWAs if available
  if (input.dwas && input.dwas.length > 0) {
    parts.push('Work Activities:');
    input.dwas.slice(0, 10).forEach(dwa => {
      parts.push(`- ${dwa}`);
    });
  }

  return parts.join('\n').slice(0, 8000); // Limit to ~2000 tokens
}

/**
 * Build narrative embedding text from career data
 * Focuses on work culture and environment
 */
function buildNarrativeText(input: CareerEmbeddingInput): string {
  const parts: string[] = [];

  parts.push(`Career: ${input.title}`);

  // Inside look is the primary source for narrative
  if (input.inside_look) {
    parts.push('Work Environment and Culture:');
    parts.push(input.inside_look.slice(0, 4000));
  } else {
    // Fall back to description and tasks
    parts.push(`Description: ${input.description}`);
    if (input.tasks.length > 0) {
      parts.push('Daily activities include:');
      input.tasks.slice(0, 5).forEach(task => {
        parts.push(`- ${task}`);
      });
    }
  }

  return parts.join('\n').slice(0, 8000);
}

/**
 * Build skills embedding text from career data
 * Focuses on technical and cognitive abilities
 */
function buildSkillsText(input: CareerEmbeddingInput): string {
  const parts: string[] = [];

  parts.push(`Career: ${input.title}`);

  // Technology skills
  if (input.technology_skills.length > 0) {
    parts.push('Technology Skills:');
    parts.push(input.technology_skills.slice(0, 20).join(', '));
  }

  // Abilities
  if (input.abilities.length > 0) {
    parts.push('Key Abilities:');
    parts.push(input.abilities.slice(0, 10).join(', '));
  }

  return parts.join('\n').slice(0, 4000);
}

/**
 * Build combined embedding text (for quick single-vector search)
 */
function buildCombinedText(input: CareerEmbeddingInput): string {
  const parts: string[] = [];

  parts.push(`${input.title}: ${input.description}`);

  // Add a sample of tasks
  if (input.tasks.length > 0) {
    parts.push('Tasks: ' + input.tasks.slice(0, 5).join('. '));
  }

  // Add skills
  if (input.technology_skills.length > 0) {
    parts.push('Skills: ' + input.technology_skills.slice(0, 10).join(', '));
  }

  return parts.join(' ').slice(0, 4000);
}

/**
 * Generate multi-field embeddings for a career
 */
export async function generateCareerEmbeddings(
  input: CareerEmbeddingInput
): Promise<MultiFieldEmbeddings> {
  // Build texts for each field
  const taskText = buildTaskText(input);
  const narrativeText = buildNarrativeText(input);
  const skillsText = buildSkillsText(input);
  const combinedText = buildCombinedText(input);

  // Generate all embeddings in a single batch call
  const { embeddings, totalTokens } = await generateBatchEmbeddings([
    taskText,
    narrativeText,
    skillsText,
    combinedText
  ]);

  return {
    task: embeddings[0],
    narrative: embeddings[1],
    skills: embeddings[2],
    combined: embeddings[3],
    totalTokens
  };
}

/**
 * Generate query embeddings for user profile matching
 */
export async function generateQueryEmbeddings(
  profile: {
    skills: string[];
    jobTitles: string[];
    education: string;
    industries: string[];
    experienceYears: number;
  },
  preferences: {
    careerGoals: string;
    skillsToDevelop: string;
    workEnvironment: string;
    salaryExpectations: string;
    industryInterests: string;
  }
): Promise<MultiFieldEmbeddings> {
  // Build task query (what user wants to do)
  const taskQuery = [
    `Career Goals: ${preferences.careerGoals}`,
    `Industry Interests: ${preferences.industryInterests}`,
    `Previous Experience: ${profile.jobTitles.join(', ') || 'Entry level'}`,
    `Skills to Develop: ${preferences.skillsToDevelop}`
  ].join('\n');

  // Build narrative query (work style preferences)
  const narrativeQuery = [
    `Work Environment: ${preferences.workEnvironment}`,
    `Career Goals: ${preferences.careerGoals}`,
    `Skills to Develop: ${preferences.skillsToDevelop}`,
    `Salary Expectations: ${preferences.salaryExpectations}`
  ].join('\n');

  // Build skills query (what user knows)
  const skillsQuery = profile.skills.length > 0
    ? profile.skills.join(', ')
    : `${preferences.skillsToDevelop}, general professional skills`;

  // Combined query
  const combinedQuery = [
    `${profile.experienceYears} years experience`,
    `Education: ${profile.education}`,
    `Skills: ${profile.skills.join(', ') || 'general skills'}`,
    `Goals: ${preferences.careerGoals}`,
    `Interests: ${preferences.industryInterests}`
  ].join('. ');

  // Generate all embeddings in a single batch call
  const { embeddings, totalTokens } = await generateBatchEmbeddings([
    taskQuery,
    narrativeQuery,
    skillsQuery,
    combinedQuery
  ]);

  return {
    task: embeddings[0],
    narrative: embeddings[1],
    skills: embeddings[2],
    combined: embeddings[3],
    totalTokens
  };
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Calculate weighted similarity score across multiple embedding fields
 */
export function calculateWeightedSimilarity(
  queryEmbeddings: { task: number[]; narrative: number[]; skills: number[] },
  careerEmbeddings: { task: number[]; narrative: number[]; skills: number[] },
  weights: { task: number; narrative: number; skills: number } = { task: 0.5, narrative: 0.3, skills: 0.2 }
): number {
  const taskSim = cosineSimilarity(queryEmbeddings.task, careerEmbeddings.task);
  const narrativeSim = cosineSimilarity(queryEmbeddings.narrative, careerEmbeddings.narrative);
  const skillsSim = cosineSimilarity(queryEmbeddings.skills, careerEmbeddings.skills);

  return (
    weights.task * taskSim +
    weights.narrative * narrativeSim +
    weights.skills * skillsSim
  );
}

/**
 * Estimate embedding cost in USD
 * text-embedding-3-small: $0.00002 per 1K tokens
 */
export function estimateEmbeddingCost(tokens: number): number {
  return (tokens / 1000) * 0.00002;
}
