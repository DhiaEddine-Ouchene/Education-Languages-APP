import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { JoinClassForm } from "@/components/student/JoinClassForm";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentClassesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const memberships = await prisma.classMember.findMany({
    where: { studentId: session.user.id },
    include: { class: { include: { educator: { include: { user: true } }, _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">My classes</h1>
      <JoinClassForm />
      {memberships.length === 0 ? (
        <p className="text-sm text-txt-secondary text-center py-6">You haven&apos;t joined any classes yet. Ask your teacher for an invite code.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {memberships.map((m) => (
            <Card key={m.id}><CardContent className="pt-4">
              <h3 className="font-heading font-semibold">{m.class.name}</h3>
              <p className="text-xs text-txt-secondary">
                {m.class.language} · {m.class.level} · taught by {m.class.educator.brandName ?? m.class.educator.user.name}
              </p>
              <p className="text-xs text-txt-secondary mt-1">{m.class._count.members} students · joined {formatDate(m.joinedAt)}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
