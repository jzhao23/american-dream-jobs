import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { parseResumeWithLLM, ParsedResume } from '@/lib/resume-parser';
import { VectorSearchEngine } from '@/lib/vector-search';
import { rankCareer, UserProfile, RankedCareer } from '@/lib/career-ranker';
import type { Career } from '@/types/career';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Validation schema - accepts resume text directly (no PDF parsing needed)
const matchRequestSchema = z.object({
  resumeText: z.string().min(50, "Please provide your resume text (at least 50 characters)"),
  answers: z.object({
    question1: z.string().min(10, "Please provide at least 10 characters for your career goals"),
    question2: z.string().min(10, "Please provide at least 10 characters for skills to develop"),
    question3: z.string().min(10, "Please provide at least 10 characters for work environment"),
    question4: z.string().min(10, "Please provide at least 10 characters for salary expectations"),
    question5: z.string().min(10, "Please provide at least 10 characters for industry interests")
  })
});

// Load embeddings and careers once at module init (cached)
let vectorSearch: VectorSearchEngine | null = null;
let careersData: Career[] | null = null;

function initializeData(): { vectorSearch: VectorSearchEngine; careersData: Career[] } {
  if (!vectorSearch || !careersData) {
    console.log('🔄 Loading embeddings and career data...');

    const embeddingsPath = path.join(process.cwd(), 'data/embeddings/career-embeddings.json');
    const careersPath = path.join(process.cwd(), 'data/careers.generated.json');

    if (!fs.existsSync(embeddingsPath)) {
      throw new Error(
        'Embeddings file not found. Please run: npx tsx scripts/generate-career-embeddings.ts'
      );
    }

    const embeddingsData = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'));
    careersData = JSON.parse(fs.readFileSync(careersPath, 'utf-8'));
    vectorSearch = new VectorSearchEngine(embeddingsData);

    console.log(`✓ Loaded ${careersData!.length} careers and embeddings`);
  }

  return { vectorSearch: vectorSearch!, careersData: careersData! };
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n🎯 Career Compass Match Request Started');

    // 1. Parse and validate request
    const body = await request.json();
    const data = matchRequestSchema.parse(body);

    console.log('✓ Request validated');

    // 2. Initialize data (cached after first call)
    const { vectorSearch, careersData } = initializeData();

    // 3. Use the provided resume text directly
    const resumeText = data.resumeText;
    console.log(`📄 Resume text received (${resumeText.length} characters)`);

    // 4. Parse resume with LLM
    console.log('🤖 Parsing resume with AI...');
    const parsedResume: ParsedResume = await parseResumeWithLLM(resumeText);

    console.log(`✓ Resume parsed: ${parsedResume.skills.length} skills, ${parsedResume.years_experience} years exp`);

    // 5. Build user profile
    const userProfile: UserProfile = {
      resume: parsedResume,
      answers: data.answers
    };

    // 6. Generate query embeddings
    console.log('🔍 Generating search embeddings...');
    const queryEmbeddings = await generateQueryEmbeddings(userProfile);

    console.log('✓ Query embeddings generated');

    // 7. Vector search to get top 50 candidates
    console.log('🎯 Searching career database...');
    const candidates = vectorSearch.search(
      queryEmbeddings.task,
      queryEmbeddings.narrative,
      queryEmbeddings.skills,
      { topK: 50 }
    );

    console.log(`✓ Found ${candidates.length} candidates (vector similarity)`);

    // 8. Get full career data for candidates
    const candidateCareers = candidates
      .map(c => careersData.find(career => career.slug === c.slug))
      .filter((c): c is Career => c !== undefined);

    console.log(`✓ Loaded full data for ${candidateCareers.length} careers`);

    // 9. LLM re-ranking (early termination once we have 7 good matches)
    console.log('🎓 AI ranking and matching...');
    const rankedCareers: RankedCareer[] = [];
    let evaluated = 0;

    for (const career of candidateCareers) {
      evaluated++;
      const ranked = await rankCareer(career, userProfile);

      if (ranked && ranked.matchScore >= 60) {
        rankedCareers.push(ranked);
        console.log(`  ✓ Match #${rankedCareers.length}: ${career.title} (${ranked.matchScore}%)`);
      }

      // Early termination: stop once we have 7 good matches
      if (rankedCareers.length >= 7) {
        console.log(`✓ Found 7 strong matches after evaluating ${evaluated} careers`);
        break;
      }
    }

    // 10. Sort by match score and return top 7
    const topMatches = rankedCareers
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 7);

    console.log(`✅ Returning ${topMatches.length} career recommendations\n`);

    return NextResponse.json({
      success: true,
      matches: topMatches,
      metadata: {
        total_candidates: candidates.length,
        evaluated_careers: evaluated,
        final_matches: topMatches.length,
        user_profile: {
          skills_count: parsedResume.skills.length,
          years_experience: parsedResume.years_experience,
          education: parsedResume.education
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Match API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations. Please try again.',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate specialized embeddings for user query
 */
async function generateQueryEmbeddings(profile: UserProfile) {
  // Create specialized queries for each embedding type
  const taskQuery = `
    Career goals: ${profile.answers.question1}
    Industry interests: ${profile.answers.question5}
    Previous experience: ${profile.resume.job_titles.join(', ')}
    Looking to develop: ${profile.answers.question2}
  `.trim();

  const narrativeQuery = `
    Work environment preferences: ${profile.answers.question3}
    Career goals: ${profile.answers.question1}
    Skills to develop: ${profile.answers.question2}
    Salary expectations: ${profile.answers.question4}
  `.trim();

  const skillsQuery = profile.resume.skills.length > 0
    ? profile.resume.skills.join(', ')
    : `${profile.answers.question2} general professional skills`;

  // Generate all 3 embeddings in one API call (batch)
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: [taskQuery, narrativeQuery, skillsQuery],
    encoding_format: 'float'
  });

  return {
    task: response.data[0].embedding,
    narrative: response.data[1].embedding,
    skills: response.data[2].embedding
  };
}
