/**
 * User Check API
 *
 * DISABLED for Alpha Launch - User check features are temporarily disabled.
 * Original code preserved in: src/lib/_stashed/auth/api/users/check/route.ts
 *
 * TODO: Re-enable after auth security audit
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Return "user does not exist" response for compatibility
  // This allows existing UI code to work without modification
  return NextResponse.json({
    success: true,
    data: {
      exists: false,
      hasResume: false,
      userId: undefined,
    },
  });
}
