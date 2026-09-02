import { NextResponse } from "next/server";
import { auth, getEducatorProfile } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getEducatorProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { plan, interval } = await req.json();

  if (!plan || !interval) {
    return NextResponse.json({ error: "Missing plan or interval" }, { status: 400 });
  }

  // Get Chargily Payment Link URL from environment
  const envKey = `CHARGILY_LINK_${plan}_${interval}`;
  const paymentLink = process.env[envKey as keyof typeof process.env];

  if (!paymentLink) {
    return NextResponse.json(
      { error: "Payment link not configured" },
      { status: 404 }
    );
  }

  // Append educator ID as metadata (Chargily will pass this back in webhook)
  const linkWithMetadata = `${paymentLink}?metadata[educatorId]=${profile.id}`;

  return NextResponse.json({ url: linkWithMetadata });
}
