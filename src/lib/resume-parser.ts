import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedResume {
  skills: string[];
  years_experience: number;
  job_titles: string[];
  education: string;
  industries: string[];
}

/**
 * Parse resume text using LLM to extract structured data
 */
export async function parseResumeWithLLM(resumeText: string): Promise<ParsedResume> {
  const prompt = `You are an expert resume parser. Extract structured information from this resume.

RESUME TEXT:
${resumeText.slice(0, 12000)}

Extract the following information:
1. **Skills**: Technical skills, tools, certifications (max 20, most relevant first)
2. **Years of Experience**: Total years of professional work (best estimate as a number)
3. **Job Titles**: Previous job titles (max 5, most recent first)
4. **Education**: Highest degree completed - choose exactly one from:
   - "High school diploma or equivalent"
   - "Associate degree"
   - "Bachelor's degree"
   - "Master's degree"
   - "Doctoral or professional degree"
   - "No formal credential"
5. **Industries**: Industries worked in (max 3, e.g., "Healthcare", "Technology", "Finance")

Respond ONLY with valid JSON (no markdown, no explanations):
{
  "skills": ["skill1", "skill2"],
  "years_experience": 5,
  "job_titles": ["Title 1", "Title 2"],
  "education": "Bachelor's degree",
  "industries": ["Industry1", "Industry2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a resume parsing assistant. Respond only with valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 800
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    // Validate and provide defaults
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 20) : [],
      years_experience: typeof parsed.years_experience === 'number' ? Math.max(0, parsed.years_experience) : 0,
      job_titles: Array.isArray(parsed.job_titles) ? parsed.job_titles.slice(0, 5) : [],
      education: typeof parsed.education === 'string' ? parsed.education : 'No formal credential',
      industries: Array.isArray(parsed.industries) ? parsed.industries.slice(0, 3) : []
    };
  } catch (error) {
    console.error('LLM parsing error:', error);

    // Return default profile if parsing fails
    return {
      skills: [],
      years_experience: 0,
      job_titles: [],
      education: 'No formal credential',
      industries: []
    };
  }
}
