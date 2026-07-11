import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

const schema = z.object({
  revenueSharePct: z.number().min(0).max(100),
  promoCodes: z.array(z.object({ code: z.string().min(1), discountPct: z.number().min(1).max(100) })),
  emailTemplates: z.record(z.string()),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const settings = await prisma.platformSettings.upsert({ where: { id: "singleton" }, create: { id: "singleton" }, update: {} });
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const settings = await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...body.data },
      update: body.data,
    });
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[admin:settings:PUT]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
