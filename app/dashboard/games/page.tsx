import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GamesGridClient } from "./GamesGridClient";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const games = await prisma.game.findMany({
    where: { educatorId: profile.id },
    include: {
      vocabularySet: { select: { name: true } },
      _count: { select: { progress: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const publishedCount = games.filter((g) => g.isPublished).length;
  const totalPlays = games.reduce((sum, g) => sum + g._count.progress, 0);

  return (
    <GamesGridClient
      games={games}
      stats={{ total: games.length, published: publishedCount, plays: totalPlays }}
    />
  );
}
