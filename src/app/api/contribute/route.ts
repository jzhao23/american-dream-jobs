import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contributionSchema = z.object({
  careerSlug: z.string().optional(),
  submissionType: z.enum(["correction", "experience", "video"]),
  content: z.string().min(10),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  link: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contributionSchema.parse(body);

    // Log the contribution (in production, store in database or send to Airtable/Notion)
    console.log("New contribution:", {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // In production, you would:
    // 1. Store in database (Supabase, PlanetScale, etc.)
    // 2. Send notification email
    // 3. Create GitHub issue for review
    // Example with Supabase:
    // await supabase.from('contributions').insert(data);

    return NextResponse.json({ success: true });
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
