import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/auth/login");

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-heading font-bold text-2xl">Profile &amp; Settings</h1>
      <SettingsForm name={user.name} email={user.email} avatar={user.avatar} role={user.role} createdAt={user.createdAt.toISOString()} />
    </div>
  );
}
