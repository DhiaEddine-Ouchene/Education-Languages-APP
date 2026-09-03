import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Eye } from "lucide-react";
import { StudentCourseContent } from "@/components/student/StudentCourseContent";
import { TYPE_EMOJI } from "@/lib/game-type-metadata";

export const dynamic = "force-dynamic";

export default async function PreviewCoursePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const course = await prisma.course.findFirst({
    where: { id: params.id, educatorId: profile.id },
    include: {
      games: { orderBy: { createdAt: "desc" } },
      sources: { orderBy: { uploadedAt: "desc" } },
      lessons: { orderBy: { order: "asc" } },
    },
  });

  if (!course) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              <strong>Preview Mode</strong> — You&apos;re seeing how this course appears to your students
            </span>
          </div>
          <Link
            href={`/dashboard/courses/${course.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </Link>
        </div>
      </div>

      {/* Course Content - Same as Student View */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <StudentCourseContent
          courseId={course.id}
          studentName={session.user.name || "Teacher Preview"}
          studentEmail={session.user.email || "teacher@lingokit.app"}
          isPreview={true}
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