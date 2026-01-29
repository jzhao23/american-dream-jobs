/**
 * Anonymous Data Migration API
 *
 * DISABLED for Alpha Launch - Authentication features are temporarily disabled.
 * Original code preserved in: src/lib/_stashed/auth/api/migrate-anonymous-data/route.ts
 *
 * TODO: Re-enable after auth security audit
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Authentication is temporarily disabled for alpha launch. Your data is stored locally in your browser.",
      },
    },
    { status: 503 }
  );
}
