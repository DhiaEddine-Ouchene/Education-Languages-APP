import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getPlanFromChargilyPrice } from "@/lib/chargily";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("signature");

  if (!signature) {
    console.error("[chargily-webhook] Missing signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const secret = process.env.CHARGILY_API_SECRET_KEY ?? "";
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(body).digest("hex");

  if (signature !== digest) {
    console.error("[chargily-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch (e) {
    console.error("[chargily-webhook] Invalid JSON payload");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventType = event.type;

  try {
    switch (eventType) {
      case "checkout.paid": {
        const checkout = event.data;
        const priceId = checkout.amount; // TODO: Verify correct field from Chargily docs
        const checkoutId = checkout.id;
        const metadata = checkout.metadata || {};
        const educatorId = metadata.educatorId;

        if (!educatorId) {
          console.error("[chargily-webhook] Missing educatorId in metadata");
          return NextResponse.json({ error: "Missing educatorId" }, { status: 400 });
        }

        // Map price ID to plan details
        const planMapping = getPlanFromChargilyPrice(priceId);
        if (!planMapping) {
          console.error("[chargily-webhook] Unknown price ID:", priceId);
          return NextResponse.json({ error: "Unknown price" }, { status: 400 });
        }

        const { plan, days } = planMapping;
        const currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        // Update educator and create/update subscription
        await prisma.$transaction([
          prisma.educatorProfile.update({
            where: { id: educatorId },
            data: {
              subscriptionPlan: plan,
              paymentProvider: "CHARGILY",
            },
          }),
          prisma.subscription.upsert({
            where: {
              educatorId_paymentProvider: {
                educatorId,
                paymentProvider: "CHARGILY",
              },
            },
            create: {
              educatorId,
              plan,
              status: "ACTIVE",
              paymentProvider: "CHARGILY",
              chargilyCheckoutId: checkoutId,
              currentPeriodEnd,
            },
            update: {
              plan,
              status: "ACTIVE",
              chargilyCheckoutId: checkoutId,
              currentPeriodEnd,
            },
          }),
        ]);

        console.log(
          `[chargily-webhook] checkout.paid: Upgraded educator ${educatorId} to ${plan}, expires ${currentPeriodEnd.toISOString()}`
        );
        break;
      }

      case "checkout.failed":
      case "checkout.canceled": {
        // Log only, no state change
        console.log(`[chargily-webhook] ${eventType}:`, event.data?.id);
        break;
      }

      default:
        console.log(`[chargily-webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[chargily-webhook] Handler error:", eventType, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
