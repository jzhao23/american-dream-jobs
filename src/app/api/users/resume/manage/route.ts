/**
 * Resume Management API
 *
 * DISABLED for Alpha Launch - Server-side resume storage is temporarily disabled.
 * Original code preserved in: src/lib/_stashed/auth/api/users/resume/manage/route.ts
 *
 * TODO: Re-enable after auth security audit
 */

import { NextResponse } from "next/server";

const disabledResponse = NextResponse.json(
  {
    success: false,
    error: {
      code: "SERVICE_UNAVAILABLE",
      message: "Server-side resume management is temporarily disabled for alpha launch. Your resume is stored locally in your browser.",
    },
  },
  { status: 503 }
);

export async function GET() {
  // Return "no resume" response for compatibility
  return NextResponse.json({
    success: true,
    data: null,
  });
}

export async function DELETE() {
  return disabledResponse;
}
