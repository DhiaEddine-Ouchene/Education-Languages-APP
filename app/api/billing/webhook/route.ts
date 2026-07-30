import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendSaleNotification } from "@/lib/mail";
import { planFromVariantId } from "@/lib/lemonsqueezy";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "";
  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(body).digest("hex"), "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
    console.error("[webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch (e) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventName = event.meta.event_name;
  const customData = event.meta.custom_data || {};

  try {
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const sub = event.data.attributes;
        const educatorId = customData.educatorId;
        if (!educatorId) break;
        
        const variantId = sub.variant_id;
        const plan = planFromVariantId(variantId) ?? "PRO";
        const status = sub.status === "active" ? "ACTIVE" : sub.status === "past_due" ? "PAST_DUE" : "CANCELLED";
        const subId = event.data.id;
        
        await prisma.$transaction([
          prisma.educatorProfile.update({
            where: { id: educatorId },
            data: { subscriptionPlan: status === "CANCELLED" ? "FREE" : plan, lemonSqueezySubscriptionId: subId },
          }),
          prisma.subscription.upsert({
            where: { lemonSqueezyId: subId },
            create: { educatorId, plan, status, lemonSqueezyId: subId, currentPeriodEnd: new Date(sub.renews_at) },
            update: { plan, status, currentPeriodEnd: new Date(sub.renews_at) },
          }),
        ]);
        break;
      }
      case "subscription_cancelled":
      case "subscription_expired": {
        const subId = event.data.id;
        const educatorId = customData.educatorId;
        await prisma.subscription.updateMany({ where: { lemonSqueezyId: subId }, data: { status: "CANCELLED" } });
        if (educatorId) {
          await prisma.educatorProfile.update({ where: { id: educatorId }, data: { subscriptionPlan: "FREE", lemonSqueezySubscriptionId: null } });
        }
        break;
      }
      case "order_created": {
        // This is for marketplace purchases
        const order = event.data.attributes;
        const { buyerId, courseId, gameId } = customData;
        if (!buyerId || (!courseId && !gameId)) break;
        
        const amount = order.total / 100; // Assuming total is in cents
        await prisma.marketplacePurchase.create({
          data: { buyerId, courseId: courseId || null, gameId: gameId || null, amount, lemonSqueezyOrderId: event.data.id },
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
    console.error("[webhook]", eventName, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
