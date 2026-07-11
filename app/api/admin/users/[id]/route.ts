import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

const schema = z.object({
  role: z.enum(["SUPER_ADMIN", "EDUCATOR", "STUDENT"]).optional(),
  plan: z.enum(["FREE", "STARTER", "PRO", "SCHOOL"]).optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: params.id }, include: { educatorProfile: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (body.data.role) {
      await prisma.user.update({ where: { id: params.id }, data: { role: body.data.role } });
      // Ensure an educator profile exists when granting educator access
      if (body.data.role === "EDUCATOR" && !user.educatorProfile) {
        await prisma.educatorProfile.create({ data: { userId: params.id } });
      }
    }
    if (body.data.plan && user.educatorProfile) {
      await prisma.educatorProfile.update({ where: { id: user.educatorProfile.id }, data: { subscriptionPlan: body.data.plan } });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin:users:PUT]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
