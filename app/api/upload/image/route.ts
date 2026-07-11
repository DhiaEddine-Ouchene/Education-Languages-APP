import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/upload";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadToCloudinary(buffer, "eduplay/images", "image");
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload:image]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
