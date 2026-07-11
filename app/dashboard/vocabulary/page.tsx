import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VocabularyManager } from "@/components/dashboard/VocabularyManager";

export const dynamic = "force-dynamic";

export default async function VocabularyPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const sets = await prisma.vocabularySet.findMany({
    where: { educatorId: profile.id },
    include: { items: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Vocabulary</h1>
      <VocabularyManager sets={sets} />
    </div>
  );
}
