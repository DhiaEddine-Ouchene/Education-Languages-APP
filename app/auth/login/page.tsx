"use client";
import { useState, Suspense, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  // States for OTP verification flow
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [loginPassword, setLoginPassword] = useState("");

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await signIn("credentials", { ...data, redirect: false });
      if (res?.error) {
        if (res.error === "UNVERIFIED" || res.error.includes("UNVERIFIED")) {
          // Store credentials for auto-signin
          setLoginPassword(data.password);
          setVerifyingEmail(data.email);
          
          // Request new code automatically so the user receives it immediately
          await fetch("/api/auth/verify/resend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email }),
          });
          
          toast("info", "Please verify your email address. A code has been sent.");
        } else {
          toast("error", "Invalid email or password");
        }
      } else {
        toast("success", "Welcome back!");
        router.push(params.get("callbackUrl") ?? "/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast("error", "An error occurred during sign in");
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
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || "";
      }
      setOtp(newOtp);
      
      const focusIndex = Math.min(pastedData.length, 5);
      otpInputsRef.current[focusIndex]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast("error", "Please enter all 6 digits");
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyingEmail, code }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast("error", err.error ?? "Verification failed");
        return;
      }

      toast("success", "Email verified! Logging in...");
      
      // Auto login
      const loginRes = await signIn("credentials", { 
        email: verifyingEmail, 
        password: loginPassword, 
        redirect: false 
      });

      if (loginRes?.error) {
        toast("error", "Automatic sign-in failed. Please enter your credentials again.");
        setVerifyingEmail(null);
      } else {
        router.push(params.get("callbackUrl") ?? "/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast("error", "Verification failed. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!verifyingEmail) return;
    try {
      const res = await fetch("/api/auth/verify/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyingEmail }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast("error", err.error ?? "Failed to resend code");
        return;
      }

      toast("success", "A new verification code has been sent!");
      setResendTimer(60);
      setOtp(Array(6).fill(""));
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      console.error(err);
      toast("error", "Failed to resend verification code");
    }
  };

  if (verifyingEmail) {
    return (
      <Card className="w-full max-w-md shadow-hover border-border">
        <CardContent className="pt-8 pb-8">
          <button 
            onClick={() => setVerifyingEmail(null)}
            className="flex items-center gap-1 text-sm text-txt-secondary hover:text-primary mb-6 transition-colors font-medium focus:outline-none"
          >
            <ArrowLeft className="h-4 w-4" /> Back to log in
          </button>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary-light p-3">
              <Gamepad2 className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="font-heading font-bold text-2xl text-center mb-2">Verify your email</h1>
          <p className="text-sm text-center text-txt-secondary mb-6">
            An OTP verification code was sent to <span className="font-medium text-txt">{verifyingEmail}</span>. Enter it below to verify and sign in.
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
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
                onClick={handleResendCode}
                className="flex items-center gap-1 text-primary hover:underline font-medium focus:outline-none"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Resend verification code
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
        <div className="flex justify-center mb-4"><Gamepad2 className="h-10 w-10 text-primary" /></div>
        <h1 className="font-heading font-bold text-2xl text-center mb-6">Log in to EduPlay</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            <FieldError message={errors.password?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-txt-secondary"><span className="h-px bg-border flex-1" />or<span className="h-px bg-border flex-1" /></div>
        <Button variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
          Continue with Google
        </Button>
        <p className="text-sm text-center text-txt-secondary mt-6">
          No account? <Link href="/auth/register" className="text-primary font-medium">Register</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense><LoginForm /></Suspense>
    </main>
  );
}
