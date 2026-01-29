/**
 * User Profile API
 *
 * DISABLED for Alpha Launch - User profile features are temporarily disabled.
 * Original code preserved in: src/lib/_stashed/auth/api/users/profile/route.ts
 *
 * TODO: Re-enable after auth security audit
 */

import { NextResponse } from "next/server";

const disabledResponse = NextResponse.json(
  {
    success: false,
    error: {
      code: "SERVICE_UNAVAILABLE",
      message: "User profiles are temporarily disabled for alpha launch. Your data is stored locally in your browser.",
    },
  },
  { status: 503 }
);

export async function POST() {
  return disabledResponse;
}

export async function GET() {
  return disabledResponse;
}
