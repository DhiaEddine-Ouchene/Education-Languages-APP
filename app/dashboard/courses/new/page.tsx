import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CourseBuilder } from "@/components/dashboard/CourseBuilder";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");
  const games = await prisma.game.findMany({ where: { educatorId: profile.id }, select: { id: true, title: true } });

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Create course</h1>
      <CourseBuilder games={games} />
    </div>
  );
}
