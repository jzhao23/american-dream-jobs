/**
 * Resume Text API
 *
 * GET: Get the extracted text from a user's active resume
 * This enables sharing resume data between Find Jobs and Career Compass
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveResume, getUserByEmail } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    // Must provide either userId or email
    if (!userId && !email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAM',
            message: 'User ID or email is required'
          }
        },
        { status: 400 }
      );
    }

    let resolvedUserId = userId;

    // If email provided, look up the user
    if (!resolvedUserId && email) {
      try {
        const user = await getUserByEmail(email);
        if (user) {
          resolvedUserId = user.id;
        } else {
          // No user found with this email - return no resume
          return NextResponse.json({
            success: true,
            data: {
              hasResume: false,
              resumeText: null,
              metadata: null
            }
          });
        }
      } catch {
        // Database error - treat as no resume
        return NextResponse.json({
          success: true,
          data: {
            hasResume: false,
            resumeText: null,
            metadata: null
          }
        });
      }
    }

    if (!resolvedUserId) {
      return NextResponse.json({
        success: true,
        data: {
          hasResume: false,
          resumeText: null,
          metadata: null
        }
      });
    }

    // Get the user's active resume
    const resume = await getActiveResume(resolvedUserId);

    if (!resume || !resume.extracted_text) {
      return NextResponse.json({
        success: true,
        data: {
          hasResume: false,
          resumeText: null,
          metadata: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasResume: true,
        resumeText: resume.extracted_text,
        metadata: {
          resumeId: resume.id,
          fileName: resume.file_name,
          fileType: resume.file_type,
          textLength: resume.extracted_text.length,
          uploadedAt: resume.created_at,
          hasParsedProfile: !!resume.parsed_profile
        }
      }
    });
  } catch (error) {
    console.error('Get resume text error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get resume text'
        }
      },
      { status: 500 }
    );
  }
}
