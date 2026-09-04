import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus } from "lucide-react";
import { CoursesGridClient } from "./CoursesGridClient";

export const dynamic = "force-dynamic";

export default async function CoursesPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  let courses: any[] = [];
  try {
    courses = await prisma.course.findMany({
      where: { educatorId: profile.id, ...(searchParams.q ? { title: { contains: searchParams.q, mode: "insensitive" } } : {}) },
      include: { _count: { select: { lessons: true, games: true } } },
      orderBy: { updatedAt: "desc" },
    });
  } catch (err) {
    console.error("[dashboard:courses:page] Failed to fetch courses:", err);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="font-heading font-bold text-2xl text-txt">Courses</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form method="get" className="flex-1 sm:w-64">
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search courses..."
              className="w-full h-9 rounded-btn border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary/50"
            />
          </form>
          <Link href="/dashboard/courses/new" className="shrink-0">
            <Button size="sm" className="whitespace-nowrap shrink-0 gap-1.5 px-3">
              <Plus className="h-4 w-4 shrink-0" />
              <span>New course</span>
            </Button>
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState title="No courses yet" description="Create your first course with lessons, games, and vocabulary." ctaLabel="Create course" ctaHref="/dashboard/courses/new" />
      ) : (
        <CoursesGridClient courses={courses} />
      )}
    </div>
  );
}
