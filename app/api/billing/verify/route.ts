import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

/**
 * Called when the user is redirected back from LemonSqueezy checkout
 * with `?checkout_id=xxx` in the URL.
 *
 * LemonSqueezy only redirects back on successful payment, so we trust
 * the redirect and update the educator's plan accordingly.
 *
 * The variant → plan mapping is already known from when the checkout
 * was created (subscribe route). We receive the educator ID via
 * the authenticated session.
 */
export async function GET(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const checkoutId = searchParams.get("checkout_id");

  if (!checkoutId) {
    return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
  }

  try {
    // Fetch the checkout to get the variant_id
    const { getCheckout } = await import("@lemonsqueezy/lemonsqueezy.js");
    const { data: checkoutData, error: checkoutErr } = await getCheckout(checkoutId);

    if (checkoutErr || !checkoutData) {
      // If LS API fails (e.g. network), we can still update based on the
      // checkout_id we stored locally when creating the checkout
      console.error("[verify] LS API error (non-fatal):", checkoutErr);
      return NextResponse.json({
        verified: false,
        message:
          "Payment received! Your plan will be updated once the webhook confirms it.",
      });
    }

    const variantId = checkoutData.data.attributes.variant_id;

    // Map variant ID to plan
    const { planFromVariantId } = await import("@/lib/lemonsqueezy");
    const plan = planFromVariantId(variantId);

    if (!plan) {
      return NextResponse.json({ error: "Unknown variant" }, { status: 400 });
    }

    // Update subscription in database (idempotent — safe to call multiple times)
    const subId = `ls_sub_${checkoutId}`;
    await prisma.$transaction([
      prisma.educatorProfile.update({
        where: { id: profile!.id },
        data: { subscriptionPlan: plan, lemonSqueezySubscriptionId: subId },
      }),
      prisma.subscription.upsert({
        where: { lemonSqueezyId: subId },
        create: {
          educatorId: profile!.id,
          plan,
          status: "ACTIVE",
          lemonSqueezyId: subId,
          currentPeriodEnd: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ),
        },
        update: { plan, status: "ACTIVE" },
      }),
    ]);

    return NextResponse.json({ verified: true, plan });
  } catch (err) {
    console.error("[verify] Error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
