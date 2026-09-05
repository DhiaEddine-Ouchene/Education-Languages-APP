import { NextResponse } from "next/server";
import { requireEducator } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const course = await prisma.course.findFirst({
      where: { id: params.id, educatorId: profile!.id },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { fileName, fileUrl } = await req.json();
      if (!fileName || !fileUrl) {
        return NextResponse.json({ error: "fileName and fileUrl are required" }, { status: 400 });
      }

      const courseSource = await prisma.courseSource.create({
        data: {
          courseId: params.id,
          fileName,
          fileType: "VIDEO_URL",
          extractedText: "Video Course",
          fileUrl,
        },
      });

      return NextResponse.json({
        success: true,
        sources: [
          {
            id: courseSource.id,
            fileName: courseSource.fileName,
            fileType: courseSource.fileType,
            extractedText: courseSource.extractedText,
            fileUrl: courseSource.fileUrl,
            uploadedAt: courseSource.uploadedAt.toISOString(),
          },
        ],
      }, { status: 200 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let extractedText = "";
        let fileType = "";

        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          fileType = "PDF";
          try {
            const pdfParse = require("pdf-parse");
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text || "";
          } catch (e: any) {
            console.error("PDF Parse error:", e);
            extractedText = "";
          }
          if (!extractedText.trim()) {
            extractedText = `PDF Document: ${file.name}`;
          }
        } else if (
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.toLowerCase().endsWith(".docx") ||
          file.name.toLowerCase().endsWith(".doc")
        ) {
          fileType = "DOCX";
          try {
            const mammoth = require("mammoth");
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value || "";
          } catch (e: any) {
            console.error("DOCX Parse error:", e);
            extractedText = "";
          }
          if (!extractedText.trim()) {
            extractedText = `Word Document: ${file.name}`;
          }
        } else if (file.type.startsWith("image/") || /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(file.name)) {
          fileType = "IMAGE";
          try {
            const Tesseract = require("tesseract.js");
            const { data: { text } } = await Tesseract.recognize(buffer, "eng", {
              logger: () => {},
            });
            extractedText = text || "";
          } catch (e: any) {
            console.error("OCR error:", e);
            extractedText = "";
          }
          if (!extractedText.trim()) {
            extractedText = `Image: ${file.name}`;
          }
        } else if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
          extractedText = buffer.toString("utf-8");
          fileType = "TEXT";
        } else if (file.type.startsWith("video/") || /\.(mp4|webm|ogg)$/i.test(file.name)) {
          extractedText = "Video Course";
          fileType = "VIDEO";
        } else {
          results.push({ fileName: file.name, error: "Unsupported file type. Please upload PDF, DOCX, image, video, or text file." });
          continue;
        }

        if (!extractedText.trim()) {
          extractedText = `${fileType || "Course"} Material: ${file.name}`;
        }

        const fileUrl = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString("base64")}`;

        const courseSource = await prisma.courseSource.create({
          data: {
            courseId: params.id,
            fileName: file.name,
            fileType,
            extractedText,
            fileUrl,
          },
        });

        results.push({
          id: courseSource.id,
          fileName: courseSource.fileName,
          fileType: courseSource.fileType,
          extractedText: courseSource.extractedText,
          fileUrl: courseSource.fileUrl,
          uploadedAt: courseSource.uploadedAt.toISOString(),
        });
      } catch (fileError: any) {
        console.error(`Error processing file ${file.name}:`, fileError);
        results.push({ fileName: file.name, error: fileError.message || "Processing failed" });
      }
    }

    return NextResponse.json({ success: true, sources: results }, { status: 200 });
  } catch (err: any) {
    console.error("[upload-sources]", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const course = await prisma.course.findFirst({
      where: { id: params.id, educatorId: profile!.id },
      include: { sources: { orderBy: { uploadedAt: "desc" } } },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ sources: course.sources }, { status: 200 });
  } catch (err: any) {
    console.error("[get-sources]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch sources" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, profile } = await requireEducator();
  if (error) return error;

  try {
    const { sourceId } = await req.json();
    if (!sourceId) {
      return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
    }

    const source = await prisma.courseSource.findFirst({
      where: { id: sourceId, course: { educatorId: profile!.id } },
    });
    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    await prisma.courseSource.delete({ where: { id: sourceId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[delete-source]", err);
    return NextResponse.json({ error: err.message || "Failed to delete source" }, { status: 500 });
  }
}
