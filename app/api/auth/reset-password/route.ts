import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, code, password } = body.data;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
    }

    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
      return NextResponse.json({ error: "Reset code has expired" }, { status: 400 });
    }

    const hashed = await hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}