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
import { matchCareers, CareerMatch, UserProfile, TrainingWillingness, MatchingModel } from '@/lib/compass/matching-engine';
import { EducationLevel } from '@/lib/compass/resume-parser';
import { saveCompassResponse } from '@/lib/db';

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
  // New structured selections from wizard
  trainingWillingness: z.enum(['minimal', 'short-term', 'medium', 'significant']),
  educationLevel: z.enum(['high-school', 'some-college', 'bachelors', 'masters-plus']),
  workBackground: z.array(z.string()),
  salaryTarget: z.enum(['under-40k', '40-60k', '60-80k', '80-100k', '100k-plus']),
  workStyle: z.array(z.string()),
  // Legacy fields for backward compatibility
  careerGoals: z.string().optional(),
  workEnvironment: z.string().optional(),
  additionalContext: z.string().optional()
});

// Training willingness schema for filtering
const trainingWillingnessSchema = z.enum(['minimal', 'short-term', 'medium', 'significant']);

// Matching model schema for routing between full LLM and lightweight modes
const matchingModelSchema = z.enum(['model-a', 'model-b']);

const recommendRequestSchema = z.object({
  profile: profileSchema,
  preferences: preferencesSchema,
  options: z.object({
    useSupabase: z.boolean().optional(),
    trainingWillingness: trainingWillingnessSchema.optional(),
    model: matchingModelSchema.optional()
  }).optional(),
  // Session tracking for persistence
  sessionId: z.string().optional(),
  userId: z.string().uuid().nullish(), // Allow null or undefined for unauthenticated users
  locationCode: z.string().optional(),
  locationName: z.string().optional(),
  resumeId: z.string().uuid().nullish() // Allow null or undefined
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

    const { profile, preferences, options, sessionId, userId, locationCode, locationName, resumeId } = validation.data;

    // Check for minimum profile data
    // Note: Model B (no resume) only requires preferences, not skills
    const hasProfileData = profile.skills.length > 0 || profile.jobTitles.length > 0;
    const hasPreferences = preferences.workBackground.length > 0 || preferences.workStyle.length > 0;

    if (!hasProfileData && !hasPreferences) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_DATA',
            message: 'Please provide either profile information (skills, job titles) or preferences (work background, work style)'
          }
        },
        { status: 400 }
      );
    }

    // Use client-specified model, fallback to model-b if not provided
    // Client determines model based on resume presence (>= 100 chars = model-a)
    const model = options?.model ?? 'model-b';
    const trainingWillingness = options?.trainingWillingness || preferences.trainingWillingness || 'open';

    console.log('\n🎯 Career Recommendation Request');
    console.log(`  Model (from client): ${options?.model ?? 'not specified'}`);
    console.log(`  Model (resolved): ${model}`);
    console.log(`  Training willingness: ${trainingWillingness}`);
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
        trainingWillingness: preferences.trainingWillingness,
        educationLevel: preferences.educationLevel,
        workBackground: preferences.workBackground,
        salaryTarget: preferences.salaryTarget,
        workStyle: preferences.workStyle,
        // Legacy fields for backward compatibility
        careerGoals: preferences.careerGoals,
        workEnvironment: preferences.workEnvironment,
        additionalContext: preferences.additionalContext
      }
    };

    // Run matching algorithm with training filter and model selection
    const result = await matchCareers(userProfile, {
      useSupabase: options?.useSupabase ?? true,
      trainingWillingness: trainingWillingness as TrainingWillingness,
      model: model as MatchingModel
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

    // Save compass response to database (if sessionId provided)
    if (sessionId) {
      try {
        await saveCompassResponse({
          userId: userId ?? undefined, // Convert null to undefined
          sessionId,
          trainingWillingness: preferences.trainingWillingness,
          educationLevel: preferences.educationLevel,
          workBackground: preferences.workBackground,
          salaryTarget: preferences.salaryTarget,
          workStyle: preferences.workStyle,
          additionalContext: preferences.additionalContext,
          locationCode,
          locationName,
          resumeId: resumeId ?? undefined, // Convert null to undefined
          recommendations: result.matches,
          modelUsed: model,
          processingTimeMs: result.metadata.processingTimeMs
        });
        console.log(`  Saved compass response for session: ${sessionId}`);
      } catch (saveError) {
        // Log but don't fail the request if save fails
        console.warn('Failed to save compass response:', saveError);
      }
    }

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
