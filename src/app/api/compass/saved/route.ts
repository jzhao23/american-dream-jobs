/**
 * API routes for managing saved Career Compass results
 *
 * GET - Fetch saved results for a user
 * DELETE - Clear saved results for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCompassResultsForUser,
  getCompassResultsSummary,
  deleteUserCompassResults,
} from '@/lib/db/compass';

/**
 * GET /api/compass/saved?userId=xxx
 * Get saved compass results for a user
 *
 * Query params:
 * - userId: The user ID to fetch results for
 * - summary: If 'true', return just a summary for banner display
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const summaryOnly = searchParams.get('summary') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (summaryOnly) {
      // Return just the summary for banner display
      const summary = await getCompassResultsSummary(userId);

      if (!summary) {
        return NextResponse.json({ hasSavedResults: false });
      }

      return NextResponse.json({
        hasSavedResults: true,
        summary: {
          savedAt: summary.savedAt.toISOString(),
          matchCount: summary.matchCount,
          topMatch: summary.topMatch,
          hasResume: summary.hasResume,
        },
      });
    }

    // Return full results
    const results = await getCompassResultsForUser(userId);

    if (!results) {
      return NextResponse.json({ hasSavedResults: false });
    }

    return NextResponse.json({
      hasSavedResults: true,
      results: {
        id: results.id,
        recommendations: results.recommendations,
        metadata: results.metadata,
        parsedProfile: results.parsed_profile,
        submission: {
          training: results.training_willingness,
          education: results.education_level,
          background: results.work_background,
          salary: results.salary_target,
          workStyle: results.work_style,
          location: results.location_code ? {
            code: results.location_code,
            name: results.location_name,
            shortName: results.location_short_name,
          } : null,
          hasResume: !!results.resume_text || !!results.resume_id,
          anythingElse: results.additional_context || '',
          timestamp: results.created_at,
        },
        resumeText: results.resume_text,
        savedAt: results.updated_at || results.created_at,
        modelUsed: results.model_used,
      },
    });
  } catch (error) {
    console.error('Error fetching saved compass results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved results' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/compass/saved?userId=xxx
 * Clear saved compass results for a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    await deleteUserCompassResults(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting compass results:', error);
    return NextResponse.json(
      { error: 'Failed to delete results' },
      { status: 500 }
    );
  }
}
