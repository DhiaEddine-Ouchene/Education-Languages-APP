import { notFound, redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CourseBuilder } from "@/components/dashboard/CourseBuilder";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const [course, games] = await Promise.all([
    prisma.course.findFirst({ where: { id: params.id, educatorId: profile.id }, include: { lessons: { orderBy: { order: "asc" } } } }),
    prisma.game.findMany({ where: { educatorId: profile.id }, select: { id: true, title: true } }),
  ]);
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Edit course</h1>
      <CourseBuilder
        games={games}
        initial={{
          id: course.id, title: course.title, description: course.description, language: course.language,
          level: course.level, coverImage: course.coverImage, price: course.price,
          isPublished: course.isPublished, isMarketplace: course.isMarketplace,
          lessons: course.lessons.map((l) => ({ title: l.title, type: l.type, content: l.content })),
        }}
      />
    </div>
  );
}
