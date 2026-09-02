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

  const course = await prisma.course.findFirst({
    where: { id: params.id, educatorId: profile.id },
  });
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Edit course</h1>
      <CourseBuilder
        initial={{
          id: course.id,
          title: course.title,
          description: course.description,
          language: course.language,
          level: course.level,
          coverImage: course.coverImage,
          isPublished: course.isPublished,
        }}
      />
    </div>
  );
}
