import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  const classes = await prisma.class.findMany({
    where: { educatorId: profile.id },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl">Classes</h1>
        <Link href="/dashboard/classes/new"><Button size="sm"><Plus className="h-4 w-4" /> New class</Button></Link>
      </div>
      {classes.length === 0 ? (
        <EmptyState title="No classes yet" description="Create a class and share the invite code with students." ctaLabel="Create class" ctaHref="/dashboard/classes/new" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <Badge variant="outline">Code: {c.inviteCode}</Badge>
                </div>
                <h3 className="font-heading font-semibold">{c.name}</h3>
                <p className="text-xs text-txt-secondary mb-3">{c.language} · {c.level} · {c._count.members} students</p>
                <Link href={`/dashboard/classes/${c.id}`}><Button size="sm" variant="outline" className="w-full">Manage</Button></Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
