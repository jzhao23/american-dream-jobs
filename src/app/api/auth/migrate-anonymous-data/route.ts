/**
 * Anonymous Data Migration API
 *
 * Links anonymous session data (like Career Compass responses) to
 * a user's authenticated account when they sign up or sign in.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/compass/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authUserId, sessionId } = body;

    if (!authUserId || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_INPUT", message: "authUserId and sessionId are required" },
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Use the database function to link anonymous data
    const { data, error } = await supabase.rpc("link_anonymous_data_to_user", {
      p_auth_user_id: authUserId,
      p_session_id: sessionId,
    });

    if (error) {
      console.error("Error migrating anonymous data:", error);
      return NextResponse.json(
        {
          success: false,
          error: { code: "DB_ERROR", message: "Failed to migrate anonymous data" },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        linkedCount: data || 0,
      },
    });
  } catch (error) {
    console.error("Error in migrate-anonymous-data:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
