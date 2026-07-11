import { NextResponse } from "next/server";
import { auth } from "./auth";
import { prisma } from "./prisma";

export async function requireEducator() {
  const session = await auth();
  if (!session?.user || session.user.role !== "EDUCATOR") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), profile: null, session: null };
  }
  const profile = await prisma.educatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return { error: NextResponse.json({ error: "Educator profile not found" }, { status: 403 }), profile: null, session: null };
  }
  return { error: null, profile, session };
}

export async function requireStudent() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}
