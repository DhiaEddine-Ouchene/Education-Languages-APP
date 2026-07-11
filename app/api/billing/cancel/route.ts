import { NextResponse } from "next/server";
import { requireEducator } from "@/lib/api";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const { error, profile } = await requireEducator();
  if (error) return error;
  if (!profile!.stripeSubscriptionId) return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  try {
    await stripe.subscriptions.update(profile!.stripeSubscriptionId, { cancel_at_period_end: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[billing:cancel]", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
