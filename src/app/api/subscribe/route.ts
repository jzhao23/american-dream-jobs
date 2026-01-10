import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSubscription } from "@/lib/db/subscriptions";

const subscribeSchema = z.object({
  email: z.string().email(),
  persona: z.enum(["student", "switcher", "practitioner", "educator"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = subscribeSchema.parse(body);

    try {
      const result = await createSubscription({
        email: data.email,
        persona: data.persona,
        source: 'website'
      });

      console.log("Subscription saved:", {
        id: result.subscription.id,
        email: data.email,
        isNew: result.isNew
      });

      return NextResponse.json({
        success: true,
        isNew: result.isNew
      });
    } catch (dbError) {
      // Graceful degradation: log but don't fail if DB is unavailable
      console.error("Database error (graceful degradation):", dbError);
      console.log("Subscription logged (no persistence):", data);

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
