import { NextResponse } from "next/server";
import { checkExpiredSubscriptions } from "@/lib/subscription-checker";

/**
 * Cron endpoint to check for expired Chargily subscriptions
 * Should be called daily by Vercel Cron or similar scheduler
 *
 * Requires Authorization header with CRON_SECRET for security
 */
export async function GET(req: Request) {
  // Verify cron authorization
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.error("[cron] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const downgradedIds = await checkExpiredSubscriptions();

    return NextResponse.json({
      success: true,
      checked: new Date().toISOString(),
      downgraded: downgradedIds.length,
      educatorIds: downgradedIds,
    });
  } catch (err) {
    console.error("[cron] Subscription check failed:", err);
    return NextResponse.json(
      { error: "Subscription check failed" },
      { status: 500 }
    );
  }
}
