"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { Gamepad2, ArrowLeft, RefreshCw } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

function ForgotPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast("error", err.error ?? "Failed to send reset code");
        return;
      }

      setEmail(data.email);
      setStep("code");
      toast("success", "If an account exists, a reset code has been sent");
      setResendTimer(60);
    } catch {
      toast("error", "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    const char = value.slice(-1);
    newOtp[index] = char;
    setOtp(newOtp);

    if (char && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpInputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pasted) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || "";
      setOtp(newOtp);
      otpInputsRef.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast("error", "Please enter all 6 digits");
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast("error", err.error ?? "Invalid code");
        return;
      }

      toast("success", "Code verified! Redirecting to reset password...");
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
      router.refresh();
    } catch {
      toast("error", "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast("error", err.error ?? "Failed to resend");
        return;
      }

      toast("success", "A new reset code has been sent!");
      setResendTimer(60);
      setOtp(Array(6).fill(""));
      otpInputsRef.current[0]?.focus();
    } catch {
      toast("error", "Failed to resend code");
    }
  };

  if (step === "code") {
    return (
      <Card className="w-full max-w-md shadow-hover border-border">
        <CardContent className="pt-8 pb-8">
          <button
            onClick={() => setStep("email")}
            className="flex items-center gap-1 text-sm text-txt-secondary hover:text-primary mb-6 transition-colors font-medium focus:outline-none"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary-light p-3">
              <Gamepad2 className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="font-heading font-bold text-2xl text-center mb-2">Verify reset code</h1>
          <p className="text-sm text-center text-txt-secondary mb-6">
            A 6-digit code was sent to <span className="font-medium text-txt">{email}</span>. Enter it below.
          </p>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  ref={(el) => { otpInputsRef.current[idx] = el; }}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-11 h-12 sm:w-12 sm:h-14 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-btn text-center text-xl font-bold bg-card-bg text-txt shadow-sm transition-all focus:outline-none"
                />
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={verifyLoading}>
              {verifyLoading ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm">
            {resendTimer > 0 ? (
              <span className="text-txt-secondary">Resend code in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="flex items-center gap-1 text-primary hover:underline font-medium focus:outline-none"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Resend code
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8 pb-8">
        <div className="flex justify-center mb-4">
          <Gamepad2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-center mb-6">Reset your password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset code"}
          </Button>
        </form>
        <p className="text-sm text-center text-txt-secondary mt-6">
          Remember your password? <Link href="/auth/login" className="text-primary font-medium">Log in</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense><ForgotPasswordForm /></Suspense>
    </main>
  );
}