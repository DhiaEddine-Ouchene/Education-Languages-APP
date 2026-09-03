import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";
import { checkGamePublishLimit } from "@/lib/plan-guard";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  const game = await prisma.game.findFirst({ where: { id: params.id, educatorId: profile!.id } });
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If currently draft and attempting to publish, verify limit
  if (!game.isPublished) {
    const publishCheck = await checkGamePublishLimit(profile!.id);
    if (!publishCheck.allowed) {
      return NextResponse.json(
        {
          error: `Published game limit reached (${publishCheck.limit} games max on Free). Upgrade to Pro for unlimited published games.`,
          requiresUpgrade: true,
          publishedCount: publishCheck.publishedCount,
          limit: publishCheck.limit,
        },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.game.update({
    where: { id: params.id },
    data: { isPublished: !game.isPublished },
  });

  return NextResponse.json(updated);
}
