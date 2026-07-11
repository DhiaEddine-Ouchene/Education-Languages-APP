import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";
import { stripe, PLANS } from "@/lib/stripe";

const schema = z.object({ plan: z.enum(["STARTER", "PRO", "SCHOOL"]), interval: z.enum(["monthly", "yearly"]) });

export async function POST(req: Request) {
  const { error, profile, session } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const plan = PLANS[body.data.plan];
    const priceId = body.data.interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
    if (!priceId) return NextResponse.json({ error: "Plan is not configured. Set Stripe price IDs in env." }, { status: 500 });

    let customerId = profile!.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: session!.user.email ?? undefined, metadata: { educatorId: profile!.id } });
      customerId = customer.id;
      await prisma.educatorProfile.update({ where: { id: profile!.id }, data: { stripeCustomerId: customerId } });
    }

    const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/billing?success=1`,
      cancel_url: `${origin}/dashboard/billing?cancelled=1`,
      metadata: { educatorId: profile!.id, plan: body.data.plan },
      subscription_data: { metadata: { educatorId: profile!.id, plan: body.data.plan } },
    });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[billing:subscribe]", err);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
