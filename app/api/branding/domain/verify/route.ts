import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

export async function POST() {
  const { error, profile } = await requireEducator();
  if (error) return error;
  if (!profile!.customDomain) return NextResponse.json({ error: "Set a custom domain first" }, { status: 400 });

  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? "").split(":")[0];
  try {
    let verified = false;
    try {
      const cnames = await dns.resolveCname(profile!.customDomain);
      verified = cnames.some((c) => c.includes(appDomain));
    } catch {
      // No CNAME; check A records exist at all (basic reachability)
      const a = await dns.resolve4(profile!.customDomain).catch(() => []);
      verified = a.length > 0 && !!appDomain;
    }
    if (!verified) {
      return NextResponse.json({ verified: false, error: `Add a CNAME record for ${profile!.customDomain} pointing to ${appDomain}` }, { status: 422 });
    }
    await prisma.educatorProfile.update({ where: { id: profile!.id }, data: { domainVerified: true } });
    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("[branding:verify]", err);
    return NextResponse.json({ verified: false, error: "DNS lookup failed" }, { status: 500 });
  }
}
