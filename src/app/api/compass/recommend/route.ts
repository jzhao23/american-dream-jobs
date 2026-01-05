/**
 * Career Recommendation API Endpoint
 *
 * POST /api/compass/recommend
 *
 * Returns top 7 career matches based on user profile and preferences.
 * Uses 3-stage matching: embeddings -> structured -> LLM reasoning
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { matchCareers, CareerMatch, UserProfile, UserPreferences } from '@/lib/compass/matching-engine';
import { ParsedResume, EducationLevel } from '@/lib/compass/resume-parser';

// Request validation schema
const educationLevelSchema = z.enum([
  'high_school',
  'some_college',
  'associates',
  'bachelors',
  'masters',
  'doctorate',
  'professional_degree'
]);

const profileSchema = z.object({
  skills: z.array(z.string()),
  jobTitles: z.array(z.string()),
  education: z.object({
    level: educationLevelSchema,
    fields: z.array(z.string())
  }),
  industries: z.array(z.string()),
  experienceYears: z.number().min(0).max(50)
});

const preferencesSchema = z.object({
  careerGoals: z.string().min(10, 'Career goals must be at least 10 characters'),
  skillsToDevelop: z.string().min(10, 'Skills to develop must be at least 10 characters'),
  workEnvironment: z.string().min(10, 'Work environment must be at least 10 characters'),
  salaryExpectations: z.string().min(5, 'Salary expectations must be at least 5 characters'),
  industryInterests: z.string().min(5, 'Industry interests must be at least 5 characters')
});

const recommendRequestSchema = z.object({
  profile: profileSchema,
  preferences: preferencesSchema,
  options: z.object({
    useSupabase: z.boolean().optional()
  }).optional()
});

// Response types
interface RecommendSuccessResponse {
  success: true;
  recommendations: CareerMatch[];
  metadata: {
    stage1Candidates: number;
    stage2Candidates: number;
    finalMatches: number;
    processingTimeMs: number;
    costUsd: number;
  };
}

interface RecommendErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type RecommendResponse = RecommendSuccessResponse | RecommendErrorResponse;

export async function POST(request: NextRequest): Promise<NextResponse<RecommendResponse>> {
  const startTime = Date.now();

  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON'
          }
        },
        { status: 400 }
      );
    }

    // Validate request
    const validation = recommendRequestSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `${firstError.path.join('.')}: ${firstError.message}`,
            details: validation.error.errors
          }
        },
        { status: 400 }
      );
    }

    const { profile, preferences, options } = validation.data;

    // Check for minimum profile data
    if (profile.skills.length === 0 && profile.jobTitles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PROFILE',
            message: 'Profile must include at least some skills or job titles'
          }
        },
        { status: 400 }
      );
    }

    console.log('\n🎯 Career Recommendation Request');
    console.log(`  Skills: ${profile.skills.length}`);
    console.log(`  Experience: ${profile.experienceYears} years`);
    console.log(`  Education: ${profile.education.level}`);

    // Build user profile
    const userProfile: UserProfile = {
      resume: {
        skills: profile.skills,
        jobTitles: profile.jobTitles,
        education: {
          level: profile.education.level as EducationLevel,
          fields: profile.education.fields
        },
        industries: profile.industries,
        experienceYears: profile.experienceYears,
        confidence: 0.9 // From API, so assumed good data
      },
      preferences: {
        careerGoals: preferences.careerGoals,
        skillsToDevelop: preferences.skillsToDevelop,
        workEnvironment: preferences.workEnvironment,
        salaryExpectations: preferences.salaryExpectations,
        industryInterests: preferences.industryInterests
      }
    };

    // Run matching algorithm
    const result = await matchCareers(userProfile, {
      useSupabase: options?.useSupabase ?? true
    });

    // Validate we got enough results
    if (result.matches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_MATCHES',
            message: 'Unable to find suitable career matches. Please try adjusting your preferences.'
          }
        },
        { status: 404 }
      );
    }

    console.log(`✅ Found ${result.matches.length} career matches`);
    console.log(`  Processing time: ${result.metadata.processingTimeMs}ms`);
    console.log(`  Estimated cost: $${result.metadata.costUsd.toFixed(4)}`);

    return NextResponse.json({
      success: true,
      recommendations: result.matches,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Recommendation error:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFIGURATION_ERROR',
              message: 'Service not properly configured. Please contact support.'
            }
          },
          { status: 500 }
        );
      }

      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: 'Service is temporarily busy. Please try again in a few seconds.'
            }
          },
          { status: 429 }
        );
      }

      if (error.message.includes('embeddings not found')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EMBEDDINGS_NOT_READY',
              message: 'Career matching system is being initialized. Please try again in a few minutes.'
            }
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MATCHING_FAILED',
            message: error.message
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again.'
        }
      },
      { status: 500 }
    );
  }
}
