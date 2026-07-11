"use client";
import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
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
import { cn } from "@/lib/utils";
import { Gamepad2, Check, X, ArrowLeft, RefreshCw } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .refine((val) => /[A-Z]/.test(val), "Must contain an uppercase letter")
    .refine((val) => /[a-z]/.test(val), "Must contain a lowercase letter")
    .refine((val) => /[0-9]/.test(val), "Must contain a number")
    .refine((val) => /[^A-Za-z0-9]/.test(val), "Must contain a special character"),
  creatorType: z.enum(["Teacher", "Content Creator", "Both", "Student"]),
});
type FormData = z.infer<typeof schema>;

const roles = ["Teacher", "Content Creator", "Both", "Student"] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // States for verification OTP flow
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  // Stored for auto-login after OTP success
  const [registeredPassword, setRegisteredPassword] = useState("");
  const [registeredCreatorType, setRegisteredCreatorType] = useState("");

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { creatorType: "Teacher" },
  });
  
  const creatorType = watch("creatorType");
  const passwordValue = watch("password") || "";

  // Password requirements checklist
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);

  const passedRequirementsCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthColor = (count: number) => {
    if (count <= 2) return "bg-error";
    if (count <= 4) return "bg-warning";
    return "bg-accent";
  };

  const getStrengthText = (count: number) => {
    if (passwordValue.length === 0) return "Empty";
    if (count <= 2) return "Weak";
    if (count <= 4) return "Medium";
    return "Strong";
  };

  // Timer for resending verification code
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast("error", err.error ?? "Registration failed");
        return;
      }
      
      // Store credentials for auto-signin later
      setRegisteredPassword(data.password);
      setRegisteredCreatorType(data.creatorType);
      
      // Show Verification code screen
      setVerifyingEmail(data.email);
      toast("info", "Verification code sent to your email!");
    } catch (err) {
      console.error(err);
      toast("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle individual OTP inputs
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    const char = value.slice(-1); // Only take last character
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto-focus next input
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
      
      // Focus last filled slot
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

      toast("success", "Email verified! Welcome to EduPlay.");
      
      // Attempt auto-login
      const loginRes = await signIn("credentials", { 
        email: verifyingEmail, 
        password: registeredPassword, 
        redirect: false 
      });

      if (loginRes?.error) {
        toast("info", "Verification success! Please log in.");
        router.push("/auth/login");
      } else {
        router.push(registeredCreatorType === "Student" ? "/learn" : "/dashboard");
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
      setResendTimer(60); // 60s cooldown
      setOtp(Array(6).fill(""));
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      console.error(err);
      toast("error", "Failed to resend verification code");
    }
  };

  if (verifyingEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-hover border-border">
          <CardContent className="pt-8 pb-8">
            <button 
              onClick={() => setVerifyingEmail(null)}
              className="flex items-center gap-1 text-sm text-txt-secondary hover:text-primary mb-6 transition-colors font-medium focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4" /> Back to register
            </button>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary-light p-3">
                <Gamepad2 className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="font-heading font-bold text-2xl text-center mb-2">Verify your email</h1>
            <p className="text-sm text-center text-txt-secondary mb-6">
              We've sent a 6-digit verification code to <span className="font-medium text-txt">{verifyingEmail}</span>. Enter the code below to complete your registration.
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
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-4"><Gamepad2 className="h-10 w-10 text-primary" /></div>
          <h1 className="font-heading font-bold text-2xl text-center mb-6">Create your account</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 8 characters" {...register("password")} />
              <FieldError message={errors.password?.message} />
              
              {/* Password Strength Checklist */}
              {passwordValue && (
                <div className="mt-2 space-y-2 rounded-btn border border-border bg-background p-3 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span>Password Strength: {getStrengthText(passedRequirementsCount)}</span>
                    <span className="h-1.5 w-24 rounded-full bg-border overflow-hidden relative">
                      <span 
                        className={cn("absolute left-0 top-0 h-full transition-all duration-300", getStrengthColor(passedRequirementsCount))}
                        style={{ width: `${(passedRequirementsCount / 5) * 100}%` }}
                      />
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] text-txt-secondary">
                    <div className="flex items-center gap-1">
                      {hasMinLength ? <Check className="h-3.5 w-3.5 text-accent" /> : <X className="h-3.5 w-3.5 text-error" />}
                      <span>At least 8 chars</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasUppercase ? <Check className="h-3.5 w-3.5 text-accent" /> : <X className="h-3.5 w-3.5 text-error" />}
                      <span>1 uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasLowercase ? <Check className="h-3.5 w-3.5 text-accent" /> : <X className="h-3.5 w-3.5 text-error" />}
                      <span>1 lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasNumber ? <Check className="h-3.5 w-3.5 text-accent" /> : <X className="h-3.5 w-3.5 text-error" />}
                      <span>1 number</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      {hasSpecial ? <Check className="h-3.5 w-3.5 text-accent" /> : <X className="h-3.5 w-3.5 text-error" />}
                      <span>1 special character (!@#$%^&*, etc.)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>I am a:</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue("creatorType", r)}
                    className={cn(
                      "rounded-btn border px-3 py-2 text-sm transition-colors",
                      creatorType === r ? "border-primary bg-primary-light text-primary-dark font-medium" : "border-border"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-txt-secondary"><span className="h-px bg-border flex-1" />or<span className="h-px bg-border flex-1" /></div>
          <Button variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            Continue with Google
          </Button>
          <p className="text-sm text-center text-txt-secondary mt-6">
            Already have an account? <Link href="/auth/login" className="text-primary font-medium">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
