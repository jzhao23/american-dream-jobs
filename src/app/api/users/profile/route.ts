/**
 * User Profile API
 *
 * POST: Create or get user by email
 * GET: Get user by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateUser, getUserById } from '@/lib/db';

// Request schema for creating/getting user
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  locationCode: z.string().optional(),
  locationName: z.string().optional(),
  tcAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the Terms & Conditions'
  }),
  tcVersion: z.string().optional().default('1.0')
});

// Generate a temporary user ID for when database is unavailable
function generateTempUserId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

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

    const { email, locationCode, locationName, tcVersion } = validationResult.data;

    try {
      const result = await getOrCreateUser({
        email,
        locationCode,
        locationName,
        tcVersion
      });

      return NextResponse.json({
        success: true,
        data: {
          userId: result.userId,
          isNew: result.isNew,
          hasResume: result.hasResume
        }
      });
    } catch (dbError) {
      // If database isn't available, generate a temp ID and continue
      // The job search will still work, just won't persist user data
      console.warn('Database unavailable, using temp user ID:', dbError);
      return NextResponse.json({
        success: true,
        data: {
          userId: generateTempUserId(),
          isNew: true,
          hasResume: false,
          _note: 'Using temporary session (database unavailable)'
        }
      });
    }
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user profile'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAM',
            message: 'User ID is required'
          }
        },
        { status: 400 }
      );
    }

    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        locationCode: user.location_code,
        locationName: user.location_name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user profile'
        }
      },
      { status: 500 }
    );
  }
}
