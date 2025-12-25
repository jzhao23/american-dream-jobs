import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  careerTitle: z.string().min(2),
  reason: z.string().optional(),
  additionalInfo: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = requestSchema.parse(body);

    // Log the request (in production, store in database)
    console.log("New career request:", {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // In production, you would:
    // 1. Store in database
    // 2. Increment vote count if career already requested
    // 3. Send notification to admin

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
