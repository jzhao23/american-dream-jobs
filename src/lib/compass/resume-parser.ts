/**
 * Resume Parser for Career Compass
 *
 * Uses Claude Haiku to extract structured profile data from resume text
 */

import Anthropic from '@anthropic-ai/sdk';

// Types for parsed resume
export interface ParsedResume {
  skills: string[];
  jobTitles: string[];
  education: {
    level: EducationLevel;
    fields: string[];
  };
  industries: string[];
  experienceYears: number;
  confidence: number;
}

export type EducationLevel =
  | 'high_school'
  | 'some_college'
  | 'associates'
  | 'bachelors'
  | 'masters'
  | 'doctorate'
  | 'professional_degree';

// Validation types
interface ParsedResumeRaw {
  skills?: string[];
  job_titles?: string[];
  education?: {
    level?: string;
    fields?: string[];
  };
  industries?: string[];
  years_experience?: number;
  confidence?: number;
}

// Singleton Anthropic client
let anthropicClient: Anthropic | null = null;

/**
 * Get or create Anthropic client
 */
function getAnthropicClient(): Anthropic {
  if (anthropicClient) {
    return anthropicClient;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing Anthropic API key. Please set ANTHROPIC_API_KEY in .env.local'
    );
  }

  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

/**
 * Normalize education level string to enum
 */
function normalizeEducationLevel(level: string | undefined): EducationLevel {
  if (!level) return 'high_school';

  const normalized = level.toLowerCase().trim();

  if (normalized.includes('doctor') || normalized.includes('phd') || normalized.includes('ph.d')) {
    return 'doctorate';
  }
  if (normalized.includes('professional') || normalized.includes('j.d') || normalized.includes('m.d') ||
      normalized.includes('jd') || normalized.includes('md')) {
    return 'professional_degree';
  }
  if (normalized.includes('master') || normalized.includes('mba') || normalized.includes('m.s') ||
      normalized.includes('m.a') || normalized.includes('ms ') || normalized.includes('ma ')) {
    return 'masters';
  }
  if (normalized.includes('bachelor') || normalized.includes('b.s') || normalized.includes('b.a') ||
      normalized.includes('bs ') || normalized.includes('ba ') || normalized.includes('undergraduate')) {
    return 'bachelors';
  }
  if (normalized.includes('associate') || normalized.includes('a.a') || normalized.includes('a.s') ||
      normalized.includes('aa ') || normalized.includes('as ')) {
    return 'associates';
  }
  if (normalized.includes('some college') || normalized.includes('college') ||
      normalized.includes('certificate') || normalized.includes('certification')) {
    return 'some_college';
  }

  return 'high_school';
}

/**
 * Validate and sanitize parsed resume data
 */
function validateParsedResume(raw: ParsedResumeRaw): ParsedResume {
  return {
    skills: Array.isArray(raw.skills) ? raw.skills.slice(0, 30) : [],
    jobTitles: Array.isArray(raw.job_titles) ? raw.job_titles.slice(0, 10) : [],
    education: {
      level: normalizeEducationLevel(raw.education?.level),
      fields: Array.isArray(raw.education?.fields) ? raw.education.fields.slice(0, 5) : []
    },
    industries: Array.isArray(raw.industries) ? raw.industries.slice(0, 5) : [],
    experienceYears: typeof raw.years_experience === 'number'
      ? Math.min(Math.max(0, raw.years_experience), 50)
      : 0,
    confidence: typeof raw.confidence === 'number'
      ? Math.min(Math.max(0, raw.confidence), 1)
      : 0.5
  };
}

/**
 * System prompt for resume parsing
 */
const SYSTEM_PROMPT = `You are an expert resume analyzer. Extract structured information from the resume text provided.

Your task is to identify:
1. Skills: Technical skills, tools, programming languages, frameworks, soft skills
2. Job Titles: Previous positions held (exact titles)
3. Education: Highest level achieved and field(s) of study
4. Industries: Sectors the person has worked in
5. Years of Experience: Total professional experience

Return your analysis as a JSON object with this exact structure:
{
  "skills": ["skill1", "skill2", ...],
  "job_titles": ["Title 1", "Title 2", ...],
  "education": {
    "level": "bachelors" | "masters" | "doctorate" | "professional_degree" | "associates" | "some_college" | "high_school",
    "fields": ["Computer Science", "Business", ...]
  },
  "industries": ["Technology", "Healthcare", ...],
  "years_experience": 5,
  "confidence": 0.85
}

Guidelines:
- Extract specific, concrete skills (e.g., "Python" not "programming")
- Use standard industry names (e.g., "Technology" not "Tech industry")
- Calculate years from work history dates, or estimate from career progression
- Confidence should be 0.0-1.0 based on how much information was available
- If information is missing, use reasonable defaults rather than null
- For education level, use the highest completed degree
- Skills should be the most relevant/prominent ones (max 20-30)

Return ONLY the JSON object, no additional text.`;

/**
 * Parse resume text using Claude Haiku
 */
export async function parseResumeWithLLM(resumeText: string): Promise<ParsedResume> {
  const client = getAnthropicClient();

  // Validate input
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error('Resume text is too short (minimum 50 characters)');
  }

  // Truncate if too long (to manage costs)
  const truncatedText = resumeText.slice(0, 10000);

  try {
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Please analyze this resume and extract structured information:\n\n${truncatedText}`
        }
      ],
      system: SYSTEM_PROMPT
    });

    // Extract text content
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    let parsed: ParsedResumeRaw;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content.text);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content.text);
      throw new Error('Failed to parse resume analysis result');
    }

    // Validate and return
    return validateParsedResume(parsed);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('Anthropic API error:', error.message);
      throw new Error(`Resume analysis failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Estimate parsing cost in USD
 * Claude Haiku: $0.001/1K input tokens, $0.005/1K output tokens
 */
export function estimateParsingCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1000) * 0.001 + (outputTokens / 1000) * 0.005;
}

/**
 * Extract key phrases from resume for fallback matching
 */
export function extractKeyPhrases(resumeText: string): string[] {
  // Simple keyword extraction for fallback
  const keywords: Set<string> = new Set();

  // Common skill patterns
  const skillPatterns = [
    /\b(python|javascript|typescript|java|c\+\+|c#|ruby|go|rust|swift|kotlin)\b/gi,
    /\b(react|angular|vue|node\.?js|express|django|flask|spring|rails)\b/gi,
    /\b(aws|azure|gcp|docker|kubernetes|terraform|jenkins)\b/gi,
    /\b(sql|mysql|postgresql|mongodb|redis|elasticsearch)\b/gi,
    /\b(machine learning|data science|ai|artificial intelligence)\b/gi,
    /\b(project management|agile|scrum|product management)\b/gi,
    /\b(marketing|sales|finance|accounting|hr|human resources)\b/gi,
    /\b(nursing|healthcare|medical|clinical|patient care)\b/gi,
    /\b(electrical|mechanical|civil|chemical) engineering\b/gi,
    /\b(teaching|education|training|curriculum)\b/gi
  ];

  for (const pattern of skillPatterns) {
    const matches = resumeText.match(pattern) || [];
    matches.forEach(match => keywords.add(match.toLowerCase()));
  }

  return Array.from(keywords);
}
