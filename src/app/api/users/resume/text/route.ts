/**
 * Resume Text API
 *
 * DISABLED for Alpha Launch - Server-side resume storage is temporarily disabled.
 * Original code preserved in: src/lib/_stashed/auth/api/users/resume/text/route.ts
 *
 * TODO: Re-enable after auth security audit
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Return "no resume" response for compatibility
  return NextResponse.json({
    success: true,
    data: {
      hasResume: false,
      resumeText: null,
      metadata: null,
    },
  });
}
