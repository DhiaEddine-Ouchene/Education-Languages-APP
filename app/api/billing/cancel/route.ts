import { NextResponse } from "next/server";
import { requireEducator } from "@/lib/api";
import { cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { error, profile } = await requireEducator();
  if (error) return error;

  const subId = profile!.lemonSqueezySubscriptionId;
  if (!subId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  try {
    // Handle mock subscriptions (dev mode without real LS configured)
    if (subId.startsWith("mock_ls_sub_")) {
      await prisma.$transaction([
        prisma.educatorProfile.update({
          where: { id: profile!.id },
          data: { subscriptionPlan: "FREE", lemonSqueezySubscriptionId: null },
        }),
        prisma.subscription.updateMany({
          where: { lemonSqueezyId: subId },
          data: { status: "CANCELLED" },
        }),
      ]);
      return NextResponse.json({ ok: true, mock: true });
    }

    // Real LemonSqueezy subscription cancellation
    const { error: cancelError } = await cancelSubscription(subId);
    if (cancelError) {
      console.error("[billing:cancel] Lemon Squeezy error", cancelError);
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[billing:cancel]", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
