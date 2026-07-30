import { prisma } from "./prisma";
import type { Plan } from "@prisma/client";

const FREE_TIER_MONTHLY_LIMIT = 15;

export type AIGenerationStatus =
  | { allowed: true; remaining: number; resetAt: Date | null }
  | { allowed: false; remaining: 0; resetAt: Date | null };

/**
 * Check whether an educator can perform an AI generation this month.
 *
 * - PRO and ULTIMATE → always allowed (no counting).
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
    if (p.subscriptionPlan === "PRO" || p.subscriptionPlan === "ULTIMATE") {
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

  if (profile.subscriptionPlan === "PRO" || profile.subscriptionPlan === "ULTIMATE") {
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

    // Only count for FREE tier
    if (p.subscriptionPlan !== "FREE") return;

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
