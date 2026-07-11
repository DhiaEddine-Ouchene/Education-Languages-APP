import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";
import { sendMail } from "@/lib/mail";

const schema = z.object({ message: z.string().min(3).max(5000) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const cls = await prisma.class.findFirst({
      where: { id: params.id, educatorId: profile!.id },
      include: { members: { include: { student: true } } },
    });
    if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
    for (const m of cls.members) {
      void sendMail(m.student.email, `Announcement from ${cls.name}`, `<p>${body.data.message}</p>`);
    }
    return NextResponse.json({ ok: true, sent: cls.members.length });
  } catch (err) {
    console.error("[classes:announce]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
