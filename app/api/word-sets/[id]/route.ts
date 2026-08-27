import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

// DELETE /api/word-sets/[id] — remove one of the teacher's saved content lists.
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  // Scope the delete to the owner so a teacher can only remove their own sets.
  // `wordSet` is a new model — cast until `prisma generate` runs on the host so
  // this file type-checks against the currently-committed generated client.
  const result = await (prisma as any).wordSet.deleteMany({
    where: { id: params.id, educatorId: profile!.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
