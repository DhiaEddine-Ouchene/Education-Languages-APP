import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "@/components/admin/UserActions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Search = { role?: string; plan?: string; q?: string };

export default async function AdminUsersPage({ searchParams }: { searchParams: Search }) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    where: {
      ...(searchParams.role ? { role: searchParams.role as never } : {}),
      ...(searchParams.plan ? { educatorProfile: { subscriptionPlan: searchParams.plan as never } } : {}),
      ...(searchParams.q ? { OR: [{ name: { contains: searchParams.q, mode: "insensitive" } }, { email: { contains: searchParams.q, mode: "insensitive" } }] } : {}),
    },
    include: { educatorProfile: { select: { subscriptionPlan: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">Users</h1>
      <form method="get" className="flex flex-wrap gap-2">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search name or email..." className="h-9 rounded-btn border border-border bg-card px-3 text-sm" />
        <select name="role" defaultValue={searchParams.role ?? ""} className="h-9 rounded-btn border border-border bg-card px-2 text-sm">
          <option value="">All roles</option>
          {["SUPER_ADMIN", "EDUCATOR", "STUDENT"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select name="plan" defaultValue={searchParams.plan ?? ""} className="h-9 rounded-btn border border-border bg-card px-2 text-sm">
          <option value="">All plans</option>
          {["FREE", "STARTER", "PRO", "SCHOOL"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="h-9 px-4 rounded-btn bg-primary text-white text-sm">Filter</button>
      </form>
      <Card><CardContent className="pt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead><tr className="text-left text-xs text-txt-secondary border-b border-border"><th className="py-2">User</th><th>Role</th><th>Plan</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0">
              <td className="py-2.5"><p className="font-medium">{u.name}</p><p className="text-xs text-txt-secondary">{u.email}</p></td>
              <td><Badge variant={u.role === "SUPER_ADMIN" ? "error" : u.role === "EDUCATOR" ? "default" : "accent"}>{u.role}</Badge></td>
              <td>{u.educatorProfile?.subscriptionPlan ?? "-"}</td>
              <td className="text-xs text-txt-secondary">{formatDate(u.createdAt)}</td>
              <td><UserActions userId={u.id} role={u.role} plan={u.educatorProfile?.subscriptionPlan ?? null} /></td>
            </tr>
          ))}</tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
