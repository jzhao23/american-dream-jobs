/**
 * Auth Profile Sync API
 *
 * Called after Supabase Auth sign-in/sign-up to ensure user has a profile
 * in our user_profiles table linked to their auth account.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/compass/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authId, email, locationCode, locationName } = body;

    if (!authId || !email) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_INPUT", message: "authId and email are required" },
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Use the database function to get or create user profile
    const { data, error } = await supabase.rpc("get_or_create_user_from_auth", {
      p_auth_id: authId,
      p_email: email,
      p_location_code: locationCode || null,
      p_location_name: locationName || null,
    });

    if (error) {
      console.error("Error syncing user profile:", error);
      return NextResponse.json(
        {
          success: false,
          error: { code: "DB_ERROR", message: "Failed to sync user profile" },
        },
        { status: 500 }
      );
    }

    const result = data?.[0] || data;

    return NextResponse.json({
      success: true,
      data: {
        userId: result?.user_id,
        isNew: result?.is_new,
        hasResume: result?.has_resume,
      },
    });
  } catch (error) {
    console.error("Error in sync-profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
