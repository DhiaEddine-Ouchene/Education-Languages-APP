import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClassesGridClient } from "./ClassesGridClient";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  let classes: any[] = [];
  try {
    classes = await prisma.class.findMany({
      where: { educatorId: profile.id },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("[dashboard:classes:page] Failed to fetch classes:", err);
  }

  return <ClassesGridClient classes={classes} />;
}
