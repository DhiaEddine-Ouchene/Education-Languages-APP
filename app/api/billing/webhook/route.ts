import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { sendSaleNotification } from "@/lib/mail";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const educatorId = sub.metadata.educatorId;
        if (!educatorId) break;
        const priceId = sub.items.data[0]?.price.id ?? "";
        const plan = (sub.metadata.plan as "STARTER" | "PRO" | "SCHOOL") ?? planFromPriceId(priceId) ?? "STARTER";
        const status = sub.status === "active" ? "ACTIVE" : sub.status === "trialing" ? "TRIALING" : sub.status === "past_due" ? "PAST_DUE" : "CANCELLED";
        await prisma.$transaction([
          prisma.educatorProfile.update({
            where: { id: educatorId },
            data: { subscriptionPlan: status === "CANCELLED" ? "FREE" : plan, stripeSubscriptionId: sub.id },
          }),
          prisma.subscription.upsert({
            where: { stripeId: sub.id },
            create: { educatorId, plan, status, stripeId: sub.id, currentPeriodEnd: new Date(sub.current_period_end * 1000) },
            update: { plan, status, currentPeriodEnd: new Date(sub.current_period_end * 1000) },
          }),
        ]);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const educatorId = sub.metadata.educatorId;
        await prisma.subscription.updateMany({ where: { stripeId: sub.id }, data: { status: "CANCELLED" } });
        if (educatorId) {
          await prisma.educatorProfile.update({ where: { id: educatorId }, data: { subscriptionPlan: "FREE", stripeSubscriptionId: null } });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (subId) await prisma.subscription.updateMany({ where: { stripeId: subId }, data: { status: "PAST_DUE" } });
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { buyerId, courseId, gameId } = pi.metadata;
        if (!buyerId || (!courseId && !gameId)) break;
        const amount = pi.amount_received / 100;
        await prisma.marketplacePurchase.create({
          data: { buyerId, courseId: courseId || null, gameId: gameId || null, amount, stripePaymentId: pi.id },
        });
        // Notify the creator and track revenue
        const item = courseId
          ? await prisma.course.findUnique({ where: { id: courseId }, include: { educator: { include: { user: true } } } })
          : await prisma.game.findUnique({ where: { id: gameId }, include: { educator: { include: { user: true } } } });
        if (item) {
          await prisma.educatorProfile.update({ where: { id: item.educatorId }, data: { monthlyRevenue: { increment: amount * 0.75 } } });
          void sendSaleNotification(item.educator.user.email, item.title, amount);
        }
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook]", event.type, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
