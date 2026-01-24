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

    // Try using the database function first
    const { data, error } = await supabase.rpc("get_or_create_user_from_auth", {
      p_auth_id: authId,
      p_email: email,
      p_location_code: locationCode || null,
      p_location_name: locationName || null,
    });

    if (error) {
      console.error("RPC error syncing user profile:", error.message, error.code);

      // Fallback: Try direct database operations if RPC function doesn't exist or any RPC error
      // This handles: function not found, permission errors, or other RPC issues
      console.log("RPC failed, using fallback direct DB operations. Error:", error.message);
      return await fallbackSyncProfile(supabase, authId, email, locationCode, locationName);
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

/**
 * Fallback function when RPC is not available
 * Performs direct database operations to sync user profile
 */
async function fallbackSyncProfile(
  supabase: ReturnType<typeof getSupabaseClient>,
  authId: string,
  email: string,
  locationCode?: string | null,
  locationName?: string | null
) {
  const normalizedEmail = email.toLowerCase().trim();

  // First, try to find user by auth_id
  const { data: existingByAuth } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_id", authId)
    .is("deleted_at", null)
    .single();

  if (existingByAuth) {
    // Check for resume
    const { data: resume } = await supabase
      .from("user_resumes")
      .select("id")
      .eq("user_id", existingByAuth.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        userId: existingByAuth.id,
        isNew: false,
        hasResume: !!resume,
      },
    });
  }

  // Try to find by email (for linking anonymous profiles or profiles without auth_id)
  const { data: existingByEmail } = await supabase
    .from("user_profiles")
    .select("id, auth_id")
    .eq("email", normalizedEmail)
    .is("deleted_at", null)
    .single();

  if (existingByEmail) {
    // If profile exists but has different/no auth_id, update it to link to current auth
    if (!existingByEmail.auth_id || existingByEmail.auth_id !== authId) {
      await supabase
        .from("user_profiles")
        .update({
          auth_id: authId,
          email_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingByEmail.id);
    }

    const { data: resume } = await supabase
      .from("user_resumes")
      .select("id")
      .eq("user_id", existingByEmail.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        userId: existingByEmail.id,
        isNew: false,
        hasResume: !!resume,
      },
    });
  }

  // Create new profile
  const { data: newUser, error: createError } = await supabase
    .from("user_profiles")
    .insert({
      auth_id: authId,
      email: normalizedEmail,
      email_verified: true,
      location_code: locationCode || null,
      location_name: locationName || null,
      tc_version: "1.0",
      tc_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createError) {
    console.error("Failed to create user profile:", createError);
    return NextResponse.json(
      {
        success: false,
        error: { code: "DB_ERROR", message: "Failed to create user profile" },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: newUser.id,
      isNew: true,
      hasResume: false,
    },
  });
}
