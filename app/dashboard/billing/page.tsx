import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingClient } from "@/components/dashboard/BillingClient";
import { PaymentVerification } from "./PaymentVerification";
import { isAlgerianUser } from "@/lib/geolocation";
import { isChargilyConfigured } from "@/lib/chargily";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; checkout_id?: string; order_id?: string };
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const history = await prisma.subscription.findMany({
    where: { educatorId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  // Detect if user is in Algeria
  const headersList = headers();
  const isInAlgeria = isAlgerianUser(headersList);

  // Chargily uses server-only env vars, so this MUST be evaluated on the server
  // and passed to the client component (client bundles can't read these vars).
  const chargilyEnabled = isChargilyConfigured();

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Billing</h1>

      {/* Payment verification banner */}
      {(searchParams.success === "1" || searchParams.checkout_id) && (
        <PaymentVerification
          checkoutId={searchParams.checkout_id ?? null}
          orderId={searchParams.order_id ?? null}
          currentPlan={profile.subscriptionPlan}
        />
      )}

      <BillingClient
        currentPlan={profile.subscriptionPlan}
        paymentProvider={profile.paymentProvider}
        isAlgerian={isInAlgeria}
        chargilyEnabled={chargilyEnabled}
        history={history.map((h) => ({
          id: h.id,
          plan: h.plan,
          status: h.status,
          createdAt: h.createdAt.toISOString(),
          currentPeriodEnd: h.currentPeriodEnd?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
