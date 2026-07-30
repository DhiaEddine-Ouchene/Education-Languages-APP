import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";
import { PLANS } from "@/lib/lemonsqueezy";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

const schema = z.object({
  plan: z.enum(["PRO", "ULTIMATE"]),
  interval: z.enum(["monthly", "yearly"]),
  embed: z.boolean().optional().default(false),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const { error, profile, session } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const plan = PLANS[body.data.plan];
    const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const variantIdStr =
      body.data.interval === "yearly"
        ? plan.variantIdYearly
        : plan.variantIdMonthly;

    const isConfigured =
      storeId &&
      storeId !== "your_store_id_here" &&
      apiKey &&
      apiKey !== "your_api_key_here" &&
      apiKey !== "dummy_key" &&
      variantIdStr &&
      variantIdStr.length > 0;

    // Dry run: just check if real payment is configured, don't create anything
    if (body.data.dryRun) {
      return NextResponse.json({ mock: !isConfigured });
    }

    if (!isConfigured) {
      // Dev mode: mock a successful checkout for testing
      console.warn(
        "[billing:subscribe] Lemon Squeezy not configured. Using mock subscription."
      );

      const mockSubId = `mock_ls_sub_${Date.now()}`;
      await prisma.$transaction([
        prisma.educatorProfile.update({
          where: { id: profile!.id },
          data: {
            subscriptionPlan: body.data.plan,
            lemonSqueezySubscriptionId: mockSubId,
          },
        }),
        prisma.subscription.upsert({
          where: { lemonSqueezyId: mockSubId },
          create: {
            educatorId: profile!.id,
            plan: body.data.plan,
            status: "ACTIVE",
            lemonSqueezyId: mockSubId,
            currentPeriodEnd: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
          },
          update: {
            plan: body.data.plan,
            status: "ACTIVE",
            currentPeriodEnd: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
          },
        }),
      ]);

      return NextResponse.json({
        url: `${origin}/dashboard/billing?success=1`,
        mock: true,
      });
    }

    const variantId = parseInt(variantIdStr!, 10);

    const { data, error: checkoutError } = await createCheckout(
      storeId,
      variantId,
      {
        checkoutData: {
          email: session?.user.email ?? undefined,
          name: session?.user.name ?? undefined,
          custom: {
            educatorId: profile!.id,
            plan: body.data.plan,
          },
        },
        checkoutOptions: {
          embed: body.data.embed,
          // Apply brand colors to the checkout page
          buttonColor:
            process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? "#7F77DD",
          buttonTextColor: "#FFFFFF",
        },
        productOptions: {
          redirectUrl: `${origin}/dashboard/billing?success=1`,
        },
      }
    );

    if (checkoutError || !data?.data?.attributes?.url) {
      console.error(
        "[billing:subscribe] Lemon Squeezy checkout error",
        checkoutError
      );
      return NextResponse.json(
        { error: "Could not create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.data.attributes.url,
      embed: body.data.embed,
    });
  } catch (err) {
    console.error("[billing:subscribe]", err);
    return NextResponse.json(
      { error: "Could not start checkout" },
      { status: 500 }
    );
  }
}
