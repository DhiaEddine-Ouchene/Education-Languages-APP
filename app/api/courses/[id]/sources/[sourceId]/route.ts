import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Increase body size limit for large file responses
export const maxDuration = 30;

export async function GET(
  req: Request,
  { params }: { params: { id: string; sourceId: string } }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const source = await prisma.courseSource.findFirst({
      where: { id: params.sourceId, courseId: params.id },
      select: { fileUrl: true, fileName: true, fileType: true },
    });

    if (!source || !source.fileUrl) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Parse base64 data URL: "data:<mime>;base64,<data>"
    const commaIdx = source.fileUrl.indexOf(",");
    if (commaIdx === -1) {
      return NextResponse.json({ error: "Invalid file data format" }, { status: 400 });
    }

    const header = source.fileUrl.slice(0, commaIdx); // "data:application/pdf;base64"
    const mimeMatch = header.match(/^data:([^;]+)/);
    if (!mimeMatch) {
      return NextResponse.json({ error: "Cannot determine MIME type" }, { status: 400 });
    }

    const mimeType = mimeMatch[1];
    const base64Data = source.fileUrl.slice(commaIdx + 1);

    // Convert in chunks to avoid stack overflow on very large files
    const buffer = Buffer.from(base64Data, "base64");

    const safeFileName = encodeURIComponent(source.fileName).replace(/'/g, "%27");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${safeFileName}"`,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (err: any) {
    console.error("[source-serve] Error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
