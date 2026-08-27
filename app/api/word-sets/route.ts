import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEducator } from "@/lib/api";

const itemSchema = z.object({
  word: z.string(),
  translation: z.string().default(""),
  exampleSentence: z.string().optional().default(""),
});

const schema = z.object({
  name: z.string().min(1),
  language: z.string().default("English"),
  nativeLanguage: z.string().default("English"),
  level: z.string().default("B1"),
  contentType: z.string().default("words"),
  sourceType: z.string().default("MANUAL"),
  items: z.array(itemSchema).min(1),
});

// The WordSet table/model only exists after the host runs `prisma migrate`
// (+`prisma generate`). Until then the accessor is undefined or the table is
// missing — detect that so we can return a clear, actionable message instead of
// a cryptic 500, and so GET can degrade to an empty list.
const MIGRATION_HINT =
  "Word Sets need a one-time database migration. In the project folder run:  npx prisma migrate deploy && npx prisma generate   (or: npx prisma db push), then restart the dev server.";

function isMissingWordSet(err: unknown): boolean {
  const msg = String((err as any)?.message ?? err ?? "");
  const code = (err as any)?.code;
  return (
    code === "P2021" || // table does not exist
    /wordSet/.test(msg) && /undefined|not a function/.test(msg) || // client not regenerated
    /does not exist|relation .* does not exist|no such table/i.test(msg)
  );
}

// GET /api/word-sets — the current teacher's reusable, game-agnostic content lists.
export async function GET() {
  const { error, profile } = await requireEducator();
  if (error) return error;
  try {
    // `wordSet` is a new model — cast until `prisma generate` runs on the host so
    // this file type-checks against the currently-committed generated client.
    const sets = await (prisma as any).wordSet.findMany({
      where: { educatorId: profile!.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sets);
  } catch (err) {
    // Table/model not migrated yet — degrade gracefully so the Sets tab just
    // shows "no saved sets" instead of erroring the whole builder.
    if (isMissingWordSet(err)) return NextResponse.json([]);
    console.error("[word-sets:GET]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/word-sets — save a content list so it can fill any game later.
export async function POST(req: Request) {
  const { error, profile } = await requireEducator();
  if (error) return error;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }
    const set = await (prisma as any).wordSet.create({
      data: {
        educatorId: profile!.id,
        name: body.data.name,
        language: body.data.language,
        nativeLanguage: body.data.nativeLanguage,
        level: body.data.level,
        contentType: body.data.contentType,
        sourceType: body.data.sourceType,
        items: body.data.items as object,
      },
    });
    return NextResponse.json(set, { status: 201 });
  } catch (err) {
    if (isMissingWordSet(err)) {
      return NextResponse.json({ error: MIGRATION_HINT }, { status: 503 });
    }
    console.error("[word-sets:POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
