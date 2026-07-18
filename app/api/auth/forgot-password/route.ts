import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const { email } = body.data;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, a reset code has been sent" });
    }

    // Generate 6-digit reset code and expiry (10 minutes)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: resetCode,
        verificationCodeExpires: resetCodeExpires,
      },
    });

    // Send reset code email
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#F9F9F7;border-radius:12px">
        <h2 style="color:#7F77DD;margin-bottom:16px">Reset your password</h2>
        <div style="color:#1A1A2E;font-size:15px;line-height:1.6">
          Hi <b>${user.name}</b>,<br/><br/>
          You requested to reset your password for <b>EduPlay</b>.<br/><br/>
          Please use the following 6-digit code to reset your password:
          <div style="background:#ECECFE;padding:20px;border-radius:10px;font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;color:#7F77DD;margin:20px auto;max-width:240px;border:1px solid #7F77DD;">
            ${resetCode}
          </div>
          This code is valid for <b>10 minutes</b>. If you did not request this, please ignore this email.<br/><br/>
        </div>
        <p style="color:#6B7280;font-size:12px;margin-top:24px">Sent by EduPlay</p>
      </div>
    `;

    // Fallback logs for dev testing
    console.log(`\n==========================================\n[MAIL FALLBACK] Password Reset Code for ${user.email}: ${resetCode}\n==========================================\n`);

    await sendMail(user.email, "Reset your EduPlay password", html);

    return NextResponse.json({ success: true, message: "If an account exists, a reset code has been sent" });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
