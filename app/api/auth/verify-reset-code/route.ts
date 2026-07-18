import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Missing email or code" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
    }

    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
      return NextResponse.json({ error: "Reset code has expired" }, { status: 400 });
    }

    // Code is valid — don't clear it yet, it will be cleared when the password is actually reset
    return NextResponse.json({ success: true, message: "Code verified" }, { status: 200 });
  } catch (err) {
    console.error("[verify-reset-code]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
