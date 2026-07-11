import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEducator, sendWelcomeStudent } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Missing email or code" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Email is already verified" }, { status: 200 });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    // Mark as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    // Send appropriate welcome email after successful verification
    if (user.role === "STUDENT") {
      void sendWelcomeStudent(user.email, user.name);
    } else {
      void sendWelcomeEducator(user.email, user.name);
    }

    return NextResponse.json({ success: true, message: "Email verified successfully" }, { status: 200 });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
