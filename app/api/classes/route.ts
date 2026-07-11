import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";
import { generateInviteCode } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  language: z.string().min(2),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

export async function GET() {
  const { error, profile } = await requireEducator();
  if (error) return error;
  const classes = await prisma.class.findMany({ where: { educatorId: profile!.id }, include: { _count: { select: { members: true } } } });
  return NextResponse.json(classes);
}

export async function POST(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    let inviteCode = generateInviteCode();
    while (await prisma.class.findUnique({ where: { inviteCode } })) inviteCode = generateInviteCode();
    const cls = await prisma.class.create({ data: { ...body.data, inviteCode, educatorId: profile!.id } });
    return NextResponse.json(cls, { status: 201 });
  } catch (err) {
    console.error("[classes:POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
