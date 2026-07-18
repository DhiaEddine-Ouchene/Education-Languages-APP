import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, avatar: true, role: true, createdAt: true },
  });
  if (!user) redirect("/auth/login");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold text-txt-primary">Profile</h1>
      <ProfileForm
        name={user.name}
        email={user.email}
        avatar={user.avatar}
        role={user.role}
        createdAt={user.createdAt.toISOString()}
      />
    </div>
  );
}
