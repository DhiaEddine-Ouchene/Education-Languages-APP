import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UnifiedGameCreator } from "@/components/dashboard/UnifiedGameCreator";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <UnifiedGameCreator educatorId={profile.id} />
    </div>
  );
}
