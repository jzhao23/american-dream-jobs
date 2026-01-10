import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createContribution } from "@/lib/db/contributions";
import crypto from "crypto";

const contributionSchema = z.object({
  careerSlug: z.string().optional(),
  submissionType: z.enum(["correction", "experience", "video"]),
  content: z.string().min(10),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  link: z.string().url().optional().or(z.literal("")),
});

// Hash IP for rate limiting without storing raw IP (privacy)
function hashIP(ip: string): string {
  const salt = process.env.IP_SALT || 'default-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contributionSchema.parse(body);

    // Get IP hash for rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0] || 'unknown';
    const ipHash = hashIP(ip);

    try {
      const contribution = await createContribution({
        careerSlug: data.careerSlug,
        submissionType: data.submissionType,
        content: data.content,
        name: data.name,
        email: data.email || undefined,
        link: data.link || undefined,
        ipHash
      });

      console.log("Contribution saved:", {
        id: contribution.id,
        type: data.submissionType,
        careerSlug: data.careerSlug,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, id: contribution.id });
    } catch (dbError) {
      // Graceful degradation
      console.error("Database error (graceful degradation):", dbError);
      console.log("Contribution logged (no persistence):", {
        ...data,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid submission", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Contribution error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
