"use client";
import React, { useState, useMemo, Suspense } from "react";
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
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains a number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const score = checks.filter(c => c.met).length;

  const strengthLabel = score <= 1 ? "Weak" : score <= 2 ? "Fair" : score <= 3 ? "Good" : score <= 4 ? "Strong" : "Excellent";
  const strengthColor = score <= 1 ? "bg-red-500" : score <= 2 ? "bg-orange-500" : score <= 3 ? "bg-yellow-500" : score <= 4 ? "bg-green-500" : "bg-emerald-500";

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= score ? strengthColor : "bg-border"
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${
          score <= 1 ? "text-red-500" : score <= 2 ? "text-orange-500" : score <= 3 ? "text-yellow-600" : "text-green-600"
        }`}>
          {strengthLabel}
        </span>
      </div>
      <ul className="space-y-1">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-1.5 text-xs">
            {check.met ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-txt-secondary/40 shrink-0" />
            )}
            <span className={check.met ? "text-green-600" : "text-txt-secondary/60"}>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const email = searchParams.get("email") ?? "";
  const code = searchParams.get("code") ?? "";

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({ resolver: zodResolver(schema) });
  const password = watch("password") ?? "";

  // Redirect if missing params
  if (!email || !code) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </div>
          <h1 className="font-heading font-bold text-2xl mb-2">Invalid reset link</h1>
          <p className="text-sm text-txt-secondary mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/auth/forgot-password">
            <Button className="w-full">Request new reset code</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <ShieldCheck className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h1 className="font-heading font-bold text-2xl mb-2">Password reset successful!</h1>
          <p className="text-sm text-txt-secondary mb-6">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link href="/auth/login">
            <Button className="w-full">Go to login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password: data.password }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast("error", err.error ?? "Failed to reset password");
        return;
      }

      setSuccess(true);
    } catch {
      toast("error", "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8 pb-8">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary-light p-3">
            <Lock className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="font-heading font-bold text-2xl text-center mb-2">Set new password</h1>
        <p className="text-sm text-center text-txt-secondary mb-6">
          Create a strong password for your account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-secondary hover:text-txt transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={errors.password?.message} />
            <PasswordStrength password={password} />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-secondary hover:text-txt transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={errors.confirmPassword?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        <p className="text-sm text-center text-txt-secondary mt-6">
          <Link href="/auth/login" className="text-primary font-medium">Back to login</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense><ResetPasswordForm /></Suspense>
    </main>
  );
}