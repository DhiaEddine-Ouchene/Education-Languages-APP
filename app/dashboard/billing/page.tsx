import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingClient } from "@/components/dashboard/BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const history = await prisma.subscription.findMany({ where: { educatorId: profile.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Billing</h1>
      <BillingClient
        currentPlan={profile.subscriptionPlan}
        history={history.map((h) => ({ id: h.id, plan: h.plan, status: h.status, createdAt: h.createdAt.toISOString(), currentPeriodEnd: h.currentPeriodEnd?.toISOString() ?? null }))}
      />
    </div>
  );
}
