/**
 * Job Search API
 *
 * POST: Search for jobs by career and location
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchJobs } from '@/lib/jobs';

// Request schema
const searchJobsSchema = z.object({
  careerSlug: z.string().min(1, 'Career slug is required'),
  careerTitle: z.string().min(1, 'Career title is required'),
  alternateJobTitles: z.array(z.string()).optional(),
  locationCode: z.string().min(1, 'Location code is required'),
  locationName: z.string().min(1, 'Location name is required'),
  userId: z.string().optional(),
  filters: z.object({
    remoteOnly: z.boolean().optional(),
    minSalary: z.number().optional(),
    maxSalary: z.number().optional(),
    datePosted: z.enum(['today', '3days', 'week', 'month']).optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior']).optional()
  }).optional(),
  limit: z.number().min(1).max(50).optional().default(20)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = searchJobsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error.errors[0].message,
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    console.log(`[API] Job search: ${params.careerTitle} in ${params.locationName}`);

    const result = await searchJobs({
      careerSlug: params.careerSlug,
      careerTitle: params.careerTitle,
      alternateJobTitles: params.alternateJobTitles,
      locationCode: params.locationCode,
      locationName: params.locationName,
      filters: params.filters,
      limit: params.limit,
      userId: params.userId
    });

    return NextResponse.json({
      success: true,
      data: {
        jobs: result.jobs,
        totalResults: result.totalResults,
        source: result.source,
        searchId: result.searchId,
        cached: result.cached
      },
      metadata: {
        careerSlug: params.careerSlug,
        locationCode: params.locationCode,
        filters: params.filters,
        limit: params.limit
      }
    });
  } catch (error) {
    console.error('Job search error:', error);

    // Handle specific error types
    if (error && typeof error === 'object' && 'code' in error) {
      const typedError = error as { code: string; message: string; retryAfter?: number };

      if (typedError.code === 'RATE_LIMITED') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests. Please try again later.',
              retryAfter: typedError.retryAfter || 60
            }
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search for jobs. Please try again.'
        }
      },
      { status: 500 }
    );
  }
}
