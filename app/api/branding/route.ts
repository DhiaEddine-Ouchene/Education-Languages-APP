import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const schema = z.object({
  brandName: z.string().max(60).optional(),
  brandLogo: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  customDomain: z.string().max(255).optional(),
});

export async function GET() {
  const { error, profile } = await requireEducator();
  if (error) return error;
  return NextResponse.json({
    brandName: profile!.brandName, brandLogo: profile!.brandLogo,
    primaryColor: profile!.primaryColor, accentColor: profile!.accentColor,
    customDomain: profile!.customDomain, domainVerified: profile!.domainVerified,
  });
}

export async function PUT(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    const domain = body.data.customDomain?.trim().toLowerCase() || null;
    const domainChanged = domain !== profile!.customDomain;
    const updated = await prisma.educatorProfile.update({
      where: { id: profile!.id },
      data: {
        brandName: body.data.brandName?.trim() || null,
        brandLogo: body.data.brandLogo || null,
        primaryColor: body.data.primaryColor,
        accentColor: body.data.accentColor,
        customDomain: domain,
        ...(domainChanged ? { domainVerified: false } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[branding:PUT]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
