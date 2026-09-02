import { prisma } from "@/lib/prisma";

/**
 * Check for expired Chargily subscriptions and downgrade to FREE
 * Returns array of downgraded educator IDs
 */
export async function checkExpiredSubscriptions(): Promise<string[]> {
  const now = new Date();

  // Find active Chargily subscriptions that have passed their expiry date
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      paymentProvider: "CHARGILY",
      status: "ACTIVE",
      currentPeriodEnd: {
        lt: now,
      },
    },
    include: {
      educator: {
        select: {
          id: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const downgradedIds: string[] = [];

  for (const sub of expiredSubs) {
    try {
      await prisma.$transaction([
        // Downgrade educator to FREE
        prisma.educatorProfile.update({
          where: { id: sub.educatorId },
          data: {
            subscriptionPlan: "FREE",
            paymentProvider: null,
          },
        }),
        // Mark subscription as cancelled
        prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "CANCELLED",
          },
        }),
      ]);

      downgradedIds.push(sub.educatorId);

      console.log(
        `[subscription-checker] Downgraded educator ${sub.educatorId} (${sub.educator.user.email}) - subscription expired on ${sub.currentPeriodEnd?.toISOString()}`
      );

      // TODO: Send expiry notification email
      // await sendSubscriptionExpiredEmail({
      //   to: sub.educator.user.email,
      //   name: sub.educator.user.name,
      //   plan: sub.plan,
      //   expiredAt: sub.currentPeriodEnd,
      // });
    } catch (err) {
      console.error(
        `[subscription-checker] Failed to downgrade educator ${sub.educatorId}:`,
        err
      );
    }
  }

  return downgradedIds;
}
