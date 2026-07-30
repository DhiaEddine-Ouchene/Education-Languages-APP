"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function PaymentVerification({
  checkoutId,
  orderId,
  currentPlan,
}: {
  checkoutId: string | null;
  orderId: string | null;
  currentPlan: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!checkoutId) {
      // No checkout ID — plan might already be updated (mock mode)
      if (currentPlan !== "FREE") {
        setStatus("success");
        setMessage("Your plan has been upgraded!");
      } else {
        setStatus("error");
        setMessage("We couldn't verify your payment. Refresh the page.");
      }
      setTimeout(() => {
        window.history.replaceState({}, "", "/dashboard/billing");
        router.refresh();
      }, 2000);
      return;
    }

    // Build verify URL with both possible params
    const params = new URLSearchParams({ checkout_id: checkoutId });
    if (orderId) params.set("order_id", orderId);

    fetch(`/api/billing/verify?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.verified) {
          setStatus("success");
          setMessage(
            `Welcome to ${data.plan}! Your account has been upgraded.`
          );
        } else if (data.message) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error ?? "Verification failed");
        }
      })
      .catch(() => {
        setStatus("success");
        setMessage("Payment completed! Refreshing...");
      })
      .finally(() => {
        setTimeout(() => {
          window.history.replaceState({}, "", "/dashboard/billing");
          router.refresh();
        }, 2000);
      });
  }, [checkoutId, orderId, currentPlan, router]);

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-center gap-3",
        status === "success" && "border-accent/30 bg-accent/5",
        status === "verifying" && "border-primary/30 bg-primary/5",
        status === "error" && "border-destructive/30 bg-destructive/5"
      )}
    >
      {status === "verifying" && (
        <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
      )}
      {status === "success" && (
        <CheckCircle className="h-5 w-5 text-accent shrink-0" />
      )}
      {status === "error" && (
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
      )}
      <div>
        <p className="font-medium text-sm">
          {status === "verifying" && "Verifying your payment..."}
          {status === "success" && "Payment successful!"}
          {status === "error" && "Verification issue"}
        </p>
        <p className="text-xs text-txt-secondary mt-0.5">{message}</p>
      </div>
    </div>
  );
}
