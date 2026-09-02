import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentCoursesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  // Get all courses that the student has access to via assignments
  const memberships = await prisma.classMember.findMany({
    where: { studentId: session.user.id },
    select: { classId: true },
  });
  
  const classIds = memberships.map(m => m.classId);

  const assignments = await prisma.assignment.findMany({
    where: { classId: { in: classIds } },
    select: { gameId: true },
  });

  const assignedGameIds = assignments.map((a) => a.gameId);

  const courseGames = await prisma.game.findMany({
    where: { id: { in: assignedGameIds }, courseId: { not: null } },
    select: { courseId: true },
  });

  const assignedCourseIds = Array.from(new Set(courseGames.map((g) => g.courseId).filter(Boolean))) as string[];
  
  const studentCourses = await prisma.course.findMany({
    where: { id: { in: assignedCourseIds } },
    include: {
      games: { select: { id: true } },
      lessons: { select: { id: true } },
      sources: { select: { id: true } },
      educator: { select: { user: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-heading font-bold text-txt-primary">My Courses</h1>
        <p className="text-sm text-txt-secondary">
          Courses containing games and documents assigned by your teachers.
        </p>
      </div>

      {studentCourses.length === 0 ? (
        <EmptyState 
          title="No courses yet" 
          description="You haven't been assigned any games that belong to a course. Join a class using an invite code from your teacher to unlock course materials." 
          ctaLabel="Join a class" 
          ctaHref="/learn/classes" 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {studentCourses.map((c) => (
            <Card key={c.id} className="overflow-hidden flex flex-col hover:shadow-md transition-all hover:border-primary/50 group">
              {c.coverImage ? (
                <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border-b border-border">
                  <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="w-full h-40 bg-primary-light text-primary font-bold text-4xl flex items-center justify-center shrink-0 border-b border-border group-hover:scale-105 transition-transform duration-500">
                  <BookOpen className="w-12 h-12" />
                </div>
              )}
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-lg text-txt-primary line-clamp-1 mb-1">{c.title}</h3>
                  <p className="text-sm text-txt-secondary line-clamp-2">{c.description || "No description provided."}</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-txt-secondary">
                  <span className="truncate max-w-[120px]">
                    {c.educator?.user?.name || "Teacher"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {c.games.length + c.lessons.length + c.sources.length} items
                    </span>
                  </div>
                </div>

                <Link href={`/learn/course/${c.id}`} className="mt-4 block">
                  <Button variant="primary" className="w-full shadow-sm">View Course Materials</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
