/**
 * Resume Upload API
 *
 * DISABLED for Alpha Launch - Server-side resume storage is temporarily disabled.
 * Original code preserved in: src/lib/_stashed/auth/api/users/resume/route.ts
 *
 * For resume parsing, use /api/compass/parse-file instead which parses locally
 * without storing any data on the server.
 *
 * TODO: Re-enable after auth security audit
 */

import { NextResponse } from "next/server";

const disabledResponse = NextResponse.json(
  {
    success: false,
    error: {
      code: "SERVICE_UNAVAILABLE",
      message: "Server-side resume storage is temporarily disabled for alpha launch. Your resume is parsed and stored locally in your browser. Use /api/compass/parse-file for parsing.",
    },
  },
  { status: 503 }
);

export async function POST() {
  return disabledResponse;
}

export async function GET() {
  // Return "no resume" response for compatibility
  return NextResponse.json({
    success: true,
    data: null,
  });
}
