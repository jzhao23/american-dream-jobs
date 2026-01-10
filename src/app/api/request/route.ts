import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrVoteCareerRequest } from "@/lib/db/career-requests";
import crypto from "crypto";

const requestSchema = z.object({
  careerTitle: z.string().min(2),
  reason: z.string().optional(),
  additionalInfo: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

function hashIP(ip: string): string {
  const salt = process.env.IP_SALT || 'default-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = requestSchema.parse(body);

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0] || 'unknown';
    const ipHash = hashIP(ip);

    try {
      const result = await createOrVoteCareerRequest({
        careerTitle: data.careerTitle,
        reason: data.reason,
        additionalInfo: data.additionalInfo,
        email: data.email || undefined,
        ipHash
      });

      console.log("Career request processed:", {
        id: result.request.id,
        careerTitle: data.careerTitle,
        isNew: result.isNew,
        voteCount: result.voteCount,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        isNew: result.isNew,
        voteCount: result.voteCount
      });
    } catch (dbError) {
      // Graceful degradation
      console.error("Database error (graceful degradation):", dbError);
      console.log("Career request logged (no persistence):", {
        ...data,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }
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
