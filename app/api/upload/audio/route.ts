import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/upload";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.type.startsWith("audio/")) return NextResponse.json({ error: "File must be audio" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Audio must be under 10MB" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadToCloudinary(buffer, "eduplay/audio", "video");
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload:audio]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
