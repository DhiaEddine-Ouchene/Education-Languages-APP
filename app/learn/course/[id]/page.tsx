import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { TYPE_EMOJI } from "@/lib/game-type-metadata";
import { StudentCourseContent } from "./StudentCourseContent";

export const dynamic = "force-dynamic";

export default async function StudentCourseDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      games: { orderBy: { createdAt: "desc" } },
      sources: { orderBy: { uploadedAt: "desc" } },
      lessons: { orderBy: { order: "asc" } },
    },
  });

  if (!course) notFound();

  // Verify student access
  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        { game: { courseId: course.id } },
        { gameId: { in: course.games.map((g) => g.id) } },
      ],
    },
    select: { classId: true },
  });

  const assignedClassIds = assignments.map((a) => a.classId);
  const isMember = await prisma.classMember.findFirst({
    where: { classId: { in: assignedClassIds }, studentId: session.user.id },
  });

  if (!isMember && !course.isPublished) notFound();

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      {/* Slim header bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-txt-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <div className="w-px h-4 bg-border" />
        <span className="text-xs font-semibold text-txt-primary truncate">{course.title}</span>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
          {course.language} · {course.level}
        </span>
      </div>

      {/* Full-height viewer */}
      <div className="flex-1 overflow-hidden">
        <StudentCourseContent
          courseId={course.id}
          studentName={session.user.name || "Student"}
          studentEmail={session.user.email || "student@eduplay.app"}
          sources={course.sources.map((s) => ({
            id: s.id,
            fileName: s.fileName,
            fileType: s.fileType,
            extractedText: s.extractedText,
            fileUrl: s.fileUrl,
          }))}
          lessons={course.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            content: l.content,
          }))}
          games={course.games.map((g) => ({
            id: g.id,
            title: g.title,
            type: g.type,
            emoji: TYPE_EMOJI[g.type] || "🎮",
          }))}
        />
      </div>
    </div>
  );
}
