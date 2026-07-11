import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/mail";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  creatorType: z.enum(["Teacher", "Content Creator", "Both", "Student"]),
});

export async function POST(req: Request) {
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }
    const { name, email, password, creatorType } = body.data;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const hashed = await hash(password, 12);
    const isStudent = creatorType === "Student";

    // Generate 6-digit OTP code and expiry (10 minutes)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: isStudent ? "STUDENT" : "EDUCATOR",
        isVerified: false,
        verificationCode,
        verificationCodeExpires,
        ...(isStudent ? {} : { educatorProfile: { create: { creatorType } } }),
      },
    });

    // Send verification code
    await sendVerificationCode(user.email, user.name, verificationCode);

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
