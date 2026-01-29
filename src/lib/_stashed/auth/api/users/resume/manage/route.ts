/**
 * Resume Management API
 *
 * GET: Get resume metadata for a user
 * DELETE: Delete the user's active resume
 *
 * This endpoint is used by the ResumeManager component for managing
 * user resumes outside of the Career Compass flow.
 */

import { NextRequest, NextResponse } from "next/server";
import { getActiveResume, deactivateResume, getUserById } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAM",
            message: "User ID is required",
          },
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 }
      );
    }

    const resume = await getActiveResume(userId);

    if (!resume) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: resume.id,
        fileName: resume.file_name,
        fileType: resume.file_type,
        fileSizeBytes: resume.file_size_bytes,
        version: resume.version,
        createdAt: resume.created_at,
        updatedAt: resume.updated_at,
        hasParsedProfile: !!resume.parsed_profile,
      },
    });
  } catch (error) {
    console.error("Get resume metadata error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get resume metadata",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAM",
            message: "User ID is required",
          },
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 }
      );
    }

    // Get the active resume
    const resume = await getActiveResume(userId);

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_RESUME",
            message: "No active resume to delete",
          },
        },
        { status: 404 }
      );
    }

    // Deactivate the resume (soft delete for audit purposes)
    // Note: For permanent deletion (GDPR), use permanentlyDeleteResume instead
    await deactivateResume(resume.id);

    console.log(`Resume ${resume.id} deactivated for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        deletedResumeId: resume.id,
      },
    });
  } catch (error) {
    console.error("Delete resume error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete resume",
        },
      },
      { status: 500 }
    );
  }
}
