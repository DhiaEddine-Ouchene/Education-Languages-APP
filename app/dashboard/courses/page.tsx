import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CoursesPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const courses = await prisma.course.findMany({
    where: { educatorId: profile.id, ...(searchParams.q ? { title: { contains: searchParams.q, mode: "insensitive" } } : {}) },
    include: { _count: { select: { lessons: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading font-bold text-2xl">Courses</h1>
        <div className="flex gap-2">
          <form method="get"><input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search courses..." className="h-9 rounded-btn border border-border bg-card px-3 text-sm" /></form>
          <Link href="/dashboard/courses/new"><Button size="sm"><Plus className="h-4 w-4" /> New course</Button></Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState title="No courses yet" description="Create your first course with lessons, games, and vocabulary." ctaLabel="Create course" ctaHref="/dashboard/courses/new" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <Link key={c.id} href={`/dashboard/courses/${c.id}`}>
              <Card className="h-full">
                <div className="h-28 bg-primary-light rounded-t-card flex items-center justify-center text-3xl">📚</div>
                <CardContent className="pt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={c.isPublished ? "accent" : "outline"}>{c.isPublished ? "Published" : "Draft"}</Badge>
                    {c.isMarketplace && <Badge>Marketplace</Badge>}
                  </div>
                  <h3 className="font-heading font-semibold">{c.title}</h3>
                  <p className="text-xs text-txt-secondary">{c.language} · {c.level} · {c._count.lessons} lessons · {c.price > 0 ? formatCurrency(c.price) : "Free"}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
