import OpenAI from 'openai';
import { ParsedResume } from './resume-parser';
import type { Career } from '@/types/career';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface UserProfile {
  resume: ParsedResume;
  answers: {
    question1: string; // Career goals
    question2: string; // Skills to develop
    question3: string; // Work environment
    question4: string; // Salary expectations
    question5: string; // Industry interests
  };
}

export interface RankedCareer {
  slug: string;
  title: string;
  category: string;
  matchScore: number;
  medianPay: number;
  aiResilience: string;
  reasoning: string;
  skillsGap: string[];
  transitionTimeline: string;
  education: string;
}

/**
 * Rank a single career for a user profile
 */
export async function rankCareer(
  career: Career,
  userProfile: UserProfile
): Promise<RankedCareer | null> {
  const prompt = buildRankingPrompt(career, userProfile);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career counselor providing personalized career matching analysis. Respond only with valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 600
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);

    // Filter out poor matches
    if (result.match_score < 50 || result.disqualifying_factors) {
      return null;
    }

    return {
      slug: career.slug,
      title: career.title,
      category: career.category,
      matchScore: result.match_score,
      medianPay: career.wages?.annual?.median || 0,
      aiResilience: career.ai_resilience || 'Unknown',
      reasoning: result.reasoning,
      skillsGap: result.skills_gap || [],
      transitionTimeline: result.transition_timeline,
      education: career.education.typical_entry_education
    };
  } catch (error) {
    console.error(`Error ranking career ${career.slug}:`, error);
    return null;
  }
}

/**
 * Build the ranking prompt with career + user context
 */
function buildRankingPrompt(career: Career, profile: UserProfile): string {
  const epochScores = career.ai_assessment?.humanAdvantage?.epochScores;
  const medianPay = career.wages?.annual?.median || 0;
  const jobGrowth = career.ai_assessment?.jobGrowth;

  return `You are an expert career counselor. Rate this career match for the user on a 0-100 scale.

# USER PROFILE

## Resume
- Skills: ${profile.resume.skills.join(', ') || 'None listed'}
- Experience: ${profile.resume.years_experience} years
- Education: ${profile.resume.education}
- Previous Roles: ${profile.resume.job_titles.join(', ') || 'None listed'}
- Industries: ${profile.resume.industries.join(', ') || 'None listed'}

## Career Goals
1. Primary Goals: ${profile.answers.question1}
2. Skills to Develop: ${profile.answers.question2}
3. Work Environment: ${profile.answers.question3}
4. Salary Expectations: ${profile.answers.question4}
5. Industry Interests: ${profile.answers.question5}

---

# CAREER: ${career.title}

**Category**: ${career.category}
**Median Salary**: $${medianPay.toLocaleString()}/year

**Description**: ${career.description}

**Key Tasks**:
${career.tasks.slice(0, 8).map((t, i) => `${i + 1}. ${t}`).join('\n') || '- No task data available'}

**Required Skills**: ${career.technology_skills.join(', ') || 'General skills'}
**Core Abilities**: ${career.abilities.slice(0, 5).join(', ') || 'Various abilities'}

**Education & Training**:
- Entry Requirement: ${career.education.typical_entry_education}
- Training Time: ${career.education.time_to_job_ready.typical_years} years
- Estimated Cost: $${(career.education.estimated_cost.typical_cost || 0).toLocaleString()}
${career.education.time_to_job_ready.earning_while_learning ? '- ✓ Earn while learning (apprenticeship)' : ''}

**AI Resilience**:
- Classification: ${career.ai_resilience || 'Unknown'}
- Job Growth: ${jobGrowth?.category || 'Unknown'} (${jobGrowth?.percentChange?.toFixed(1) || 0}% change 2024-2034)
- EPOCH Human Advantage: E=${epochScores?.empathy || '?'}, P=${epochScores?.presence || '?'}, O=${epochScores?.opinion || '?'}, C=${epochScores?.creativity || '?'}, H=${epochScores?.hope || '?'}

**Work Reality**: ${career.inside_look?.content?.slice(0, 800) || 'No detailed work environment data available'}

---

# EVALUATION

Rate 0-100 considering:
1. **Skills transferability** (40%): Do user's skills translate to this career?
2. **Goal alignment** (25%): Does this career fulfill their stated goals?
3. **Environment fit** (15%): Does work style match their preferences?
4. **Financial viability** (10%): Does it meet salary expectations?
5. **Transition feasibility** (10%): Is education/time realistic for their situation?

IMPORTANT RULES:
- match_score < 60 if salary significantly below expectations
- match_score < 50 if education gap is very large (e.g., they have HS diploma, career needs doctorate)
- match_score < 50 if skills are completely unrelated
- Boost score +5-10 if career is "AI-Resilient" or "Growing Quickly"
- Reduce score -5-10 if career is "High Disruption Risk" or "Declining"

Respond with valid JSON:
{
  "match_score": 85,
  "reasoning": "2-3 sentences explaining the match, citing specific user goals and career realities. Be personal and specific.",
  "skills_gap": ["Specific Skill 1", "Specific Skill 2", "Specific Skill 3"],
  "transition_timeline": "6-12 months" or "2-4 years" or "4-6 years",
  "disqualifying_factors": null
}

SKILLS GAP RULES:
- Must be exactly 3 specific, learnable skills
- Not vague ("communication") but concrete ("Medical terminology", "SQL databases", "AutoCAD")
- Based on gap between user's current skills and career requirements
- If user already has all required skills, suggest advanced/specialized versions

REASONING RULES:
- Personal and specific to this user
- Cite actual user goals from their answers
- Mention specific career aspects (salary, tasks, work environment)
- Avoid generic statements like "good fit" or "aligns well"

TIMELINE RULES:
- Account for current education level vs requirement
- Consider years of experience needed
- Factor in certification/licensing time
- "6-12 months" if minor upskilling needed
- "2-4 years" if bachelor's needed or major career change
- "4-6 years" if graduate degree needed
- "6+ years" if doctoral/medical/law degree needed`;
}
