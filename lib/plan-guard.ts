import { prisma } from "./prisma";
import type { Plan } from "@prisma/client";

const FREE_TIER_MONTHLY_LIMIT = 15;

export type AIGenerationStatus =
  | { allowed: true; remaining: number; resetAt: Date | null }
  | { allowed: false; remaining: 0; resetAt: Date | null };

// Paid tiers (either the profile's plan or an active subscription row) have no limit.
function isPaidPlan(plan: string | null | undefined): boolean {
  return plan === "PRO" || plan === "ULTIMATE";
}

/**
 * Resolve whether an educator is on a paid (unlimited) tier.
 * Checks both the profile's `subscriptionPlan` field AND any ACTIVE paid
 * subscription in the `subscription` table — the field can lag behind the
 * real subscription (e.g. during payment verification or test-mode checkouts).
 */
async function educatorIsPaid(
  tx: PrismaClientLike,
  educatorId: string
): Promise<boolean> {
  const p = await tx.educatorProfile.findUniqueOrThrow({
    where: { id: educatorId },
    select: { subscriptionPlan: true },
  });
  if (isPaidPlan(p.subscriptionPlan)) return true;

  const active = await tx.subscription.findFirst({
    where: { educatorId, status: "ACTIVE", plan: { in: ["PRO", "ULTIMATE"] } },
    select: { id: true },
  });
  return !!active;
}

/**
 * Check whether an educator can perform an AI generation this month.
 *
 * - PRO and ULTIMATE (profile field or active subscription) → always allowed.
 * - FREE → allowed up to 15/month; counter resets lazily on first gen of a new
 *   calendar month. Uses a transaction to avoid race conditions.
 */
export async function checkAIGenerationLimit(
  educatorId: string
): Promise<AIGenerationStatus> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Use a transaction for atomic read-and-reset
  const profile = await prisma.$transaction(async (tx) => {
    const p = await tx.educatorProfile.findUniqueOrThrow({
      where: { id: educatorId },
      select: {
        subscriptionPlan: true,
        aiGenerationsThisMonth: true,
        aiGenerationsResetAt: true,
      },
    });

    // Paid tiers have no limit
    if (await educatorIsPaid(tx as any, educatorId)) {
      return { ...p, aiGenerationsThisMonth: 0 };
    }

    // FREE tier: lazy reset if the resetAt is before the start of this month
    if (!p.aiGenerationsResetAt || p.aiGenerationsResetAt < startOfMonth) {
      await tx.educatorProfile.update({
        where: { id: educatorId },
        data: {
          aiGenerationsThisMonth: 0,
          aiGenerationsResetAt: new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
          ),
        },
      });
      return { ...p, aiGenerationsThisMonth: 0, aiGenerationsResetAt: null };
    }

    return p;
  });

  const paid = await educatorIsPaid(prisma as any, educatorId);
  if (paid) {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: null,
    };
  }

  if (profile.aiGenerationsThisMonth >= FREE_TIER_MONTHLY_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: profile.aiGenerationsResetAt ?? startOfMonth,
    };
  }

  return {
    allowed: true,
    remaining: FREE_TIER_MONTHLY_LIMIT - profile.aiGenerationsThisMonth,
    resetAt: profile.aiGenerationsResetAt ?? startOfMonth,
  };
}

/**
 * Atomically increment the AI generation counter for an educator.
 * Call this AFTER a successful generation.
 */
export async function incrementAIGenerationCount(
  educatorId: string
): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  await prisma.$transaction(async (tx) => {
    const p = await tx.educatorProfile.findUniqueOrThrow({
      where: { id: educatorId },
      select: {
        subscriptionPlan: true,
        aiGenerationsThisMonth: true,
        aiGenerationsResetAt: true,
      },
    });

    // Only count for FREE tier (not paid via plan or active subscription)
    if (isPaidPlan(p.subscriptionPlan)) return;
    if (await educatorIsPaid(tx as any, educatorId)) return;

    // Lazy reset if needed
    if (!p.aiGenerationsResetAt || p.aiGenerationsResetAt < startOfMonth) {
      await tx.educatorProfile.update({
        where: { id: educatorId },
        data: {
          aiGenerationsThisMonth: 1,
          aiGenerationsResetAt: new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
          ),
        },
      });
      return;
    }

    await tx.educatorProfile.update({
      where: { id: educatorId },
      data: { aiGenerationsThisMonth: { increment: 1 } },
    });
  });
}

// Minimal structural type for the transaction client so we can share the paid check.
type PrismaClientLike = {
  educatorProfile: {
    findUniqueOrThrow: (args: { where: { id: string }; select: Record<string, boolean> }) => Promise<{ subscriptionPlan: string }>;
  };
  subscription: {
    findFirst: (args: {
      where: { educatorId: string; status: string; plan: { in: string[] } };
      select: { id: boolean };
    }) => Promise<{ id: string } | null>;
  };
};
