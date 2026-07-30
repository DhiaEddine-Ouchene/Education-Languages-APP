import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

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

    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantIdEnv = process.env.LEMON_SQUEEZY_DUMMY_VARIANT_ID;
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

    const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const isConfigured =
      storeId && storeId !== "your_store_id_here" &&
      apiKey && apiKey !== "your_api_key_here" && apiKey !== "dummy_key" &&
      variantIdEnv && variantIdEnv.length > 0;

    if (!isConfigured) {
      console.warn("[marketplace:purchase] Lemon Squeezy not configured. Mocking successful purchase.");
      await prisma.marketplacePurchase.create({
        data: { buyerId: session.user.id, courseId: courseId || null, gameId: gameId || null, amount: item.price, lemonSqueezyOrderId: `mock_order_${Date.now()}` },
      });
      return NextResponse.json({ url: `${origin}/marketplace?purchased=1` });
    }

    // Creating a custom checkout with overridden price for dynamic pricing
    const { data, error: checkoutError } = await createCheckout(storeId, parseInt(variantIdEnv!, 10), {
      checkoutData: {
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        // @ts-expect-error: customPrice is supported by the API but missing in the SDK type definitions
        customPrice: Math.round(item.price * 100), // LS expects cents for customPrice
        custom: {
          buyerId: session.user.id,
          courseId: courseId ?? "",
          gameId: gameId ?? "",
        },
      },
      productOptions: {
        name: item.title,
        redirectUrl: `${origin}/marketplace?purchased=1`,
      },
    });

    if (checkoutError || !data?.data?.attributes?.url) {
      console.error("[marketplace:purchase] Lemon Squeezy error", checkoutError);
      return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: data.data.attributes.url });
  } catch (err) {
    console.error("[marketplace:purchase]", err);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
