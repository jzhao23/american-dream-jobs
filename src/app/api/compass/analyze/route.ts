/**
 * Resume Analysis API Endpoint
 *
 * POST /api/compass/analyze
 *
 * Analyzes resume text and extracts structured profile data using Claude Haiku.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseResumeWithLLM, ParsedResume } from '@/lib/compass/resume-parser';

// Request validation schema
const analyzeRequestSchema = z.object({
  resumeText: z
    .string()
    .min(50, 'Resume text must be at least 50 characters')
    .max(15000, 'Resume text must be less than 15,000 characters')
});

// Response types
interface AnalyzeSuccessResponse {
  success: true;
  profile: ParsedResume;
  processingTimeMs: number;
}

interface AnalyzeErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
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
    const validation = analyzeRequestSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: firstError.message,
            details: validation.error.errors
          }
        },
        { status: 400 }
      );
    }

    const { resumeText } = validation.data;

    // Check for minimum content
    const wordCount = resumeText.trim().split(/\s+/).length;
    if (wordCount < 20) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESUME_TOO_SHORT',
            message: 'Resume text is too short. Please provide more details about your experience.'
          }
        },
        { status: 400 }
      );
    }

    console.log(`📄 Analyzing resume (${resumeText.length} chars, ${wordCount} words)...`);

    // Parse resume with LLM
    const profile = await parseResumeWithLLM(resumeText);

    const processingTimeMs = Date.now() - startTime;

    console.log(`✓ Resume analyzed in ${processingTimeMs}ms`);
    console.log(`  Skills: ${profile.skills.length}`);
    console.log(`  Experience: ${profile.experienceYears} years`);
    console.log(`  Education: ${profile.education.level}`);

    return NextResponse.json({
      success: true,
      profile,
      processingTimeMs
    });
  } catch (error) {
    console.error('Resume analysis error:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('ANTHROPIC_API_KEY')) {
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

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
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
