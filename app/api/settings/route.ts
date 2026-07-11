import { NextResponse } from "next/server";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (body.data.name) data.name = body.data.name;
    if (body.data.avatar) data.avatar = body.data.avatar;

    if (body.data.newPassword) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (user?.password) {
        if (!body.data.currentPassword || !(await compare(body.data.currentPassword, user.password))) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
        }
      }
      data.password = await hash(body.data.newPassword, 12);
    }

    await prisma.user.update({ where: { id: session.user.id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[settings:PUT]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ ok: true });
}
