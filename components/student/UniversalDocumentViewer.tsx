"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FileText, Video, Image, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy-load the heavy PDF viewer
const PdfCanvasViewer = dynamic(
  () => import("./PdfCanvasViewer").then(m => m.PdfCanvasViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[#525659]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm">Loading PDF viewer…</span>
        </div>
      </div>
    )
  }
);

type Props = {
  sourceId: string;
  courseId: string;
  fileName: string;
  fileType: string;
  extractedText: string;
  fileUrl?: string | null;
  studentName: string;
  studentEmail: string;
};

export function UniversalDocumentViewer({
  sourceId, courseId, fileName, fileType, extractedText, fileUrl, studentName, studentEmail
}: Props) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = fileType === "PDF" || ext === "pdf";
  const isDocx = fileType === "DOCX" || ext === "docx" || ext === "doc";
  const isPptx = fileType === "PPTX" || ext === "pptx" || ext === "ppt";
  const isImage = fileType === "IMAGE" || /^(png|jpg|jpeg|gif|webp|svg)$/.test(ext);
  const isVideo = fileType === "VIDEO" || /^(mp4|webm|ogg|mov)$/.test(ext);
  const isVideoUrl = fileType === "VIDEO_URL";

  const serveUrl = `/api/courses/${courseId}/sources/${sourceId}`;

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) return `https://www.youtube.com/embed/${url.split("v=")[1].split("&")[0]}`;
    if (url.includes("youtu.be/")) return `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split("?")[0]}`;
    const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
    const vimeo = url.match(/vimeo\.com\/([0-9]+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return url;
  };

  // Full-height PDF viewer (has its own toolbar/sidebar)
  if (isPdf && fileUrl) {
    return <PdfCanvasViewer sourceId={sourceId} courseId={courseId} fileName={fileName} />;
  }

  // DOCX viewer
  if (isDocx && fileUrl) {
    return <DocxViewer serveUrl={serveUrl} fileName={fileName} />;
  }

  // Video URL (YouTube, Vimeo, Drive)
  if (isVideoUrl && fileUrl) {
    return (
      <div className="flex flex-col w-full h-full bg-black">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3a3a3a] text-white shrink-0 select-none">
          <Video className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium truncate text-slate-100">{fileName}</span>
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold uppercase shrink-0">VIDEO</span>
        </div>
        <div className="flex-1 relative bg-black">
          <iframe
            src={getEmbedUrl(fileUrl)}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen title={fileName}
          />
        </div>
      </div>
    );
  }

  // Uploaded video file
  if (isVideo) {
    return (
      <div className="flex flex-col w-full h-full bg-black">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3a3a3a] text-white shrink-0 select-none">
          <Video className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium truncate text-slate-100">{fileName}</span>
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold uppercase shrink-0">VIDEO</span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-black">
          <video src={serveUrl} controls controlsList="nodownload" disablePictureInPicture className="w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  // Image
  if (isImage && fileUrl) {
    return <ImageViewer serveUrl={serveUrl} fileName={fileName} />;
  }

  // PPTX / other: show text content + badge
  return (
    <div className="flex flex-col w-full h-full bg-[#1a1a1a]">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3a3a3a] text-white shrink-0 select-none">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium truncate text-slate-100">{fileName}</span>
        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold uppercase shrink-0">{fileType}</span>
      </div>
      {!fileUrl && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/20 border-b border-amber-800/30 text-amber-400 text-xs shrink-0">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Original file not available. Showing extracted text. Ask your teacher to re-upload.
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto whitespace-pre-wrap leading-relaxed text-slate-200 text-sm select-none">
          {extractedText || "No content available."}
        </div>
      </div>
    </div>
  );
}

/* ── DOCX renderer using docx-preview ── */
function DocxViewer({ serveUrl, fileName }: { serveUrl: string; fileName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(serveUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;

        const { renderAsync } = await import("docx-preview");
        if (cancelled || !containerRef.current) return;

        await renderAsync(blob, containerRef.current, undefined, {
          className: "docx-render",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          useBase64URL: true,
        });
        if (!cancelled) setStatus("done");
      } catch (e: any) {
        if (!cancelled) { setError(e.message || "Failed to render document"); setStatus("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [serveUrl]);

  return (
    <div className="flex flex-col w-full h-full bg-[#525659]">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3a3a3a] text-white shrink-0 select-none">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium truncate text-slate-100">{fileName}</span>
        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold uppercase shrink-0">DOCX</span>
      </div>
      <div className="flex-1 overflow-auto bg-[#525659] p-6">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 text-slate-400 mt-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm">Rendering document…</span>
          </div>
        )}
        {status === "error" && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 max-w-sm mx-auto text-center mt-20">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="font-medium text-red-300">Failed to render document</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
          </div>
        )}
        {/* docx-preview renders into this div */}
        <div
          ref={containerRef}
          className={cn("mx-auto", status !== "done" && "hidden")}
          style={{ maxWidth: "900px" }}
        />
      </div>
      <style>{`
        .docx-render { font-family: 'Segoe UI', sans-serif; }
        .docx-render section { background: white; margin-bottom: 24px; border-radius: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
      `}</style>
    </div>
  );
}

/* ── Image viewer with zoom ── */
function ImageViewer({ serveUrl, fileName }: { serveUrl: string; fileName: string }) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggleFs = () => {
    if (!ref.current) return;
    if (!document.fullscreenElement) ref.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  return (
    <div ref={ref} className="flex flex-col w-full h-full bg-[#1a1a1a]">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3a3a3a] text-white shrink-0 select-none">
        <Image className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium truncate text-slate-100 flex-1">{fileName}</span>
        <button onClick={() => setZoom(z => Math.max(z - 25, 25))} className="p-1.5 rounded hover:bg-white/10 text-slate-300 text-xs">-</button>
        <span className="text-xs text-slate-300 w-10 text-center">{zoom}%</span>
        <button onClick={() => setZoom(z => Math.min(z + 25, 400))} className="p-1.5 rounded hover:bg-white/10 text-slate-300 text-xs">+</button>
        <button onClick={() => setZoom(100)} className="px-2 py-0.5 rounded hover:bg-white/10 text-slate-300 text-xs">Reset</button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button onClick={toggleFs} className="p-1.5 rounded hover:bg-white/10 text-slate-300">
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center bg-[#2d2d2d] p-6">
        <img
          src={serveUrl} alt={fileName} draggable={false}
          onContextMenu={e => e.preventDefault()}
          className="object-contain shadow-2xl rounded pointer-events-none select-none transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center", maxWidth: "100%", maxHeight: "100%" }}
        />
      </div>
    </div>
  );
}
