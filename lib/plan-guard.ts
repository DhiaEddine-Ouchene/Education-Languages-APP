import { prisma } from "./prisma";
import type { Plan } from "@prisma/client";

export const FREE_TIER_MONTHLY_AI_LIMIT = 3;
export const FREE_TIER_PUBLISHED_GAMES_LIMIT = 5;
export const FREE_TIER_CLASS_LIMIT = 1;
export const FREE_TIER_STUDENTS_PER_CLASS_LIMIT = 20;
export const FREE_CORE_GAME_TYPES: string[] = ["FLASHCARD", "QUIZ", "MEMORY"];

export type AIGenerationStatus =
  | { allowed: true; remaining: number; resetAt: Date | null }
  | { allowed: false; remaining: 0; resetAt: Date | null };

export type GamePublishStatus =
  | { allowed: true; publishedCount: number; limit: number; remaining: number }
  | { allowed: false; publishedCount: number; limit: number; remaining: 0 };

export type GameTypeStatus =
  | { allowed: true; tier: Plan }
  | { allowed: false; tier: "FREE"; reason: string };

export type PdfImportStatus =
  | { allowed: true; maxPages: number }
  | { allowed: false; reason: string };

export type PlanLimitStatus =
  | { allowed: true }
  | { allowed: false; reason: string };

// Helper to check if a plan string is paid
export function isPaidPlan(plan: string | null | undefined): boolean {
  return plan === "PRO" || plan === "ULTIMATE";
}

/**
 * Resolve whether an educator is on a paid (unlimited) tier.
 * Checks both the profile's `subscriptionPlan` field AND any ACTIVE paid
 * subscription in the `subscription` table.
 */
export async function educatorIsPaid(
  tx: PrismaClientLike,
  educatorId: string
): Promise<boolean> {
  if (!educatorId) return false;
  const p = await tx.educatorProfile.findUnique({
    where: { id: educatorId },
    select: { subscriptionPlan: true },
  });
  if (p && isPaidPlan(p.subscriptionPlan)) return true;

  const active = await tx.subscription.findFirst({
    where: { educatorId, status: "ACTIVE", plan: { in: ["PRO", "ULTIMATE"] } },
    select: { id: true },
  });
  return !!active;
}

/**
 * Get the effective Plan for an educator (resolving active subscriptions).
 */
export async function getEffectivePlan(educatorId: string): Promise<Plan> {
  if (!educatorId) return "FREE";
  const p = await prisma.educatorProfile.findUnique({
    where: { id: educatorId },
    select: { subscriptionPlan: true },
  });
  if (!p) return "FREE";

  if (p.subscriptionPlan === "ULTIMATE") return "ULTIMATE";
  if (p.subscriptionPlan === "PRO") return "PRO";

  const active = await prisma.subscription.findFirst({
    where: { educatorId, status: "ACTIVE", plan: { in: ["PRO", "ULTIMATE"] } },
    select: { plan: true },
  });

  return active?.plan ?? "FREE";
}

/**
 * Check whether an educator can publish a game under their plan.
 * FREE tier is capped at 5 published games LIFETIME (manual + AI combined).
 * PRO and ULTIMATE are unlimited.
 */
export async function checkGamePublishLimit(
  educatorId: string
): Promise<GamePublishStatus> {
  if (!educatorId) {
    return { allowed: false, publishedCount: 0, limit: FREE_TIER_PUBLISHED_GAMES_LIMIT, remaining: 0 };
  }
  const paid = await educatorIsPaid(prisma as any, educatorId);
  const publishedCount = await prisma.game.count({
    where: { educatorId, isPublished: true },
  });

  if (paid) {
    return {
      allowed: true,
      publishedCount,
      limit: Infinity,
      remaining: Infinity,
    };
  }

  if (publishedCount >= FREE_TIER_PUBLISHED_GAMES_LIMIT) {
    return {
      allowed: false,
      publishedCount,
      limit: FREE_TIER_PUBLISHED_GAMES_LIMIT,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    publishedCount,
    limit: FREE_TIER_PUBLISHED_GAMES_LIMIT,
    remaining: FREE_TIER_PUBLISHED_GAMES_LIMIT - publishedCount,
  };
}

/**
 * Check whether an educator is allowed to create or play a specific game type.
 * FREE tier: Flashcards, Quiz, Memory Match only.
 * PRO & ULTIMATE: All game types.
 */
export async function checkGameTypeAllowed(
  educatorId: string,
  gameType: string
): Promise<GameTypeStatus> {
  const plan = await getEffectivePlan(educatorId);
  if (plan !== "FREE") {
    return { allowed: true, tier: plan };
  }

  const normalized = gameType.toUpperCase();
  if (FREE_CORE_GAME_TYPES.includes(normalized)) {
    return { allowed: true, tier: "FREE" };
  }

  return {
    allowed: false,
    tier: "FREE",
    reason: `The "${gameType}" game type requires a Pro or Ultimate subscription. Free accounts have access to Flashcards, Quiz, and Memory Match.`,
  };
}

/**
 * Check whether PDF import is allowed and whether the page count fits the tier.
 * FREE: No PDF import.
 * PRO: Up to 10 pages.
 * ULTIMATE: Unlimited / multi-chapter.
 */
export async function checkPdfImportAllowed(
  educatorId: string,
  pageCount?: number
): Promise<PdfImportStatus> {
  const plan = await getEffectivePlan(educatorId);

  if (plan === "FREE") {
    return {
      allowed: false,
      reason: "PDF import requires a Pro or Ultimate plan. Upgrade to convert PDFs into interactive games.",
    };
  }

  if (plan === "PRO") {
    if (pageCount !== undefined && pageCount > 10) {
      return {
        allowed: false,
        reason: `Your document has ${pageCount} pages. Pro plan supports up to 10 pages. Upgrade to Ultimate for multi-chapter PDF import.`,
      };
    }
    return { allowed: true, maxPages: 10 };
  }

  // ULTIMATE
  return { allowed: true, maxPages: Infinity };
}

/**
 * Check whether analytics export (PDF / CSV) is allowed.
 * Only ULTIMATE tier includes exportable analytics.
 */
export async function checkAnalyticsExportAllowed(
  educatorId: string
): Promise<PlanLimitStatus> {
  const plan = await getEffectivePlan(educatorId);
  if (plan === "ULTIMATE") {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Exportable analytics (PDF and CSV) requires an Ultimate subscription.",
  };
}

/**
 * Check whether class creation is allowed.
 * FREE: Max 1 class.
 * PRO / ULTIMATE: Unlimited.
 */
export async function checkClassLimit(
  educatorId: string
): Promise<PlanLimitStatus> {
  if (!educatorId) return { allowed: false, reason: "Educator profile required" };
  const paid = await educatorIsPaid(prisma as any, educatorId);
  if (paid) return { allowed: true };

  const classCount = await prisma.class.count({
    where: { educatorId },
  });

  if (classCount >= FREE_TIER_CLASS_LIMIT) {
    return {
      allowed: false,
      reason: `Free plan allows up to ${FREE_TIER_CLASS_LIMIT} class. Upgrade to Pro for unlimited classes.`,
    };
  }

  return { allowed: true };
}

/**
 * Check whether a student can join a class under the educator's plan.
 * FREE: Max 20 students.
 * PRO / ULTIMATE: Unlimited.
 */
export async function checkStudentLimit(
  classId: string
): Promise<PlanLimitStatus> {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { educatorId: true, _count: { select: { members: true } } },
  });
  if (!cls) return { allowed: false, reason: "Class not found" };

  const paid = await educatorIsPaid(prisma as any, cls.educatorId);
  if (paid) return { allowed: true };

  if (cls._count.members >= FREE_TIER_STUDENTS_PER_CLASS_LIMIT) {
    return {
      allowed: false,
      reason: `This class has reached the maximum of ${FREE_TIER_STUDENTS_PER_CLASS_LIMIT} students allowed on the teacher's Free plan.`,
    };
  }

  return { allowed: true };
}

/**
 * Check whether an educator can perform an AI generation this month.
 * - PRO and ULTIMATE → always allowed.
 * - FREE → allowed up to 3/month; resets on the 1st of each calendar month.
 */
export async function checkAIGenerationLimit(
  educatorId: string
): Promise<AIGenerationStatus> {
  if (!educatorId) {
    return { allowed: false, remaining: 0, resetAt: null };
  }
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Use a transaction for atomic read-and-reset
  const profile = await prisma.$transaction(async (tx) => {
    const p = await tx.educatorProfile.findUnique({
      where: { id: educatorId },
      select: {
        subscriptionPlan: true,
        aiGenerationsThisMonth: true,
        aiGenerationsResetAt: true,
      },
    });

    if (!p) return null;

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

  if (!profile) {
    return { allowed: false, remaining: 0, resetAt: null };
  }

  const paid = await educatorIsPaid(prisma as any, educatorId);
  if (paid) {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: null,
    };
  }

  if (profile.aiGenerationsThisMonth >= FREE_TIER_MONTHLY_AI_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: profile.aiGenerationsResetAt ?? startOfMonth,
    };
  }

  return {
    allowed: true,
    remaining: FREE_TIER_MONTHLY_AI_LIMIT - profile.aiGenerationsThisMonth,
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
  if (!educatorId) return;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  await prisma.$transaction(async (tx) => {
    const p = await tx.educatorProfile.findUnique({
      where: { id: educatorId },
      select: {
        subscriptionPlan: true,
        aiGenerationsThisMonth: true,
        aiGenerationsResetAt: true,
      },
    });

    if (!p) return;

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
    findUnique: (args: { where: { id: string }; select: Record<string, boolean> }) => Promise<{ subscriptionPlan: string } | null>;
  };
  subscription: {
    findFirst: (args: {
      where: { educatorId: string; status: string; plan: { in: string[] } };
      select: { id: boolean };
    }) => Promise<{ id: string } | null>;
  };
};
