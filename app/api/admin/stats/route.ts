import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";
import { PLAN_MRR } from "@/lib/stripe";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const [totalUsers, profiles, activeSubs, totalSubs, cancelled] = await Promise.all([
    prisma.user.count(),
    prisma.educatorProfile.findMany({ select: { subscriptionPlan: true } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "CANCELLED" } }),
  ]);
  const mrr = profiles.reduce((s, p) => s + (PLAN_MRR[p.subscriptionPlan] ?? 0), 0);
  return NextResponse.json({ totalUsers, mrr, activeSubscriptions: activeSubs, churnRate: totalSubs ? Math.round((cancelled / totalSubs) * 100) : 0 });
}
