/**
 * User Check API
 *
 * GET: Check if a user exists by email
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserExists } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAM',
            message: 'Email is required'
          }
        },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email format'
          }
        },
        { status: 400 }
      );
    }

    try {
      const result = await checkUserExists(email);

      return NextResponse.json({
        success: true,
        data: {
          exists: result.exists,
          hasResume: result.hasResume,
          userId: result.userId
        }
      });
    } catch (dbError) {
      // If database table doesn't exist or other DB error, treat as new user
      console.warn('Database check failed (table may not exist):', dbError);
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          hasResume: false,
          userId: undefined
        }
      });
    }
  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check user'
        }
      },
      { status: 500 }
    );
  }
}
