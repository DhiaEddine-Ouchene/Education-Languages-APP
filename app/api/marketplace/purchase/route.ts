import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe, PLATFORM_REVENUE_SHARE } from "@/lib/stripe";

const schema = z.object({ courseId: z.string().optional(), gameId: z.string().optional() }).refine((d) => d.courseId || d.gameId, { message: "courseId or gameId required" });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { courseId, gameId } = body.data;

    const item = courseId
      ? await prisma.course.findFirst({ where: { id: courseId, isPublished: true, isMarketplace: true, approved: true }, include: { educator: true } })
      : await prisma.game.findFirst({ where: { id: gameId, isPublished: true, isMarketplace: true, approved: true }, include: { educator: true } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    if (item.price <= 0) {
      const purchase = await prisma.marketplacePurchase.create({ data: { buyerId: session.user.id, courseId: courseId || null, gameId: gameId || null, amount: 0 } });
      return NextResponse.json({ free: true, purchaseId: purchase.id });
    }

    const amountCents = Math.round(item.price * 100);
    const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price_data: { currency: "usd", unit_amount: amountCents, product_data: { name: item.title } }, quantity: 1 }],
      success_url: `${origin}/marketplace?purchased=1`,
      cancel_url: `${origin}/marketplace?cancelled=1`,
      payment_intent_data: {
        metadata: { buyerId: session.user.id, courseId: courseId ?? "", gameId: gameId ?? "" },
        // Stripe Connect: creator keeps 75%, platform takes 25%
        ...(item.educator.stripeConnectId
          ? { application_fee_amount: Math.round(amountCents * PLATFORM_REVENUE_SHARE), transfer_data: { destination: item.educator.stripeConnectId } }
          : {}),
      },
    });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[marketplace:purchase]", err);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
