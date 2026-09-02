"use client";

import { useEffect, useRef, useState } from "react";
import { Video, AlertCircle, Maximize2, Minimize2, ZoomIn, ZoomOut, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function SecureDocumentViewer({
  sourceId,
  courseId,
  fileName,
  fileType,
  extractedText,
  fileUrl,
  studentName,
  studentEmail,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);

  const isImage = fileType === "IMAGE" || /\.(png|jpg|jpeg|gif|webp)$/i.test(fileName);
  const isVideo = fileType === "VIDEO" || /\.(mp4|webm|ogg)$/i.test(fileName);
  const isVideoUrl = fileType === "VIDEO_URL";

  const serveUrl = `/api/courses/${courseId}/sources/${sourceId}`;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      return `https://www.youtube.com/embed/${url.split("v=")[1].split("&")[0]}?autoplay=0`;
    }
    if (url.includes("youtu.be/")) {
      return `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split("?")[0]}`;
    }
    const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
    const vimeo = url.match(/vimeo\.com\/([0-9]+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return url;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col w-full h-full bg-black",
        isFullscreen && "fixed inset-0 z-50"
      )}
    >
      {/* Slim toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3a3a3a] text-white shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {(isVideoUrl || isVideo)
            ? <Video className="h-4 w-4 text-primary shrink-0" />
            : <FileText className="h-4 w-4 text-primary shrink-0" />
          }
          <span className="text-sm font-medium truncate text-slate-100">{fileName}</span>
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold uppercase shrink-0">
            {fileType.replace("_URL", "")}
          </span>
        </div>

        {/* Zoom for images */}
        {isImage && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setZoom(z => Math.max(z - 25, 25))} className="p-1.5 rounded hover:bg-white/10 text-slate-300">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-300 w-10 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 25, 300))} className="p-1.5 rounded hover:bg-white/10 text-slate-300">
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="w-px h-4 bg-white/20 mx-1" />
          </div>
        )}

        <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-white/10 text-slate-300">
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Content — fills all remaining height */}
      <div className="flex-1 overflow-hidden relative bg-black">

        {/* VIDEO URL (YouTube, Vimeo, Drive) — full height iframe */}
        {isVideoUrl && fileUrl && (
          <iframe
            src={getEmbedUrl(fileUrl)}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={fileName}
          />
        )}

        {/* Uploaded VIDEO file — full height */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <video
              src={serveUrl}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* IMAGE */}
        {isImage && fileUrl && (
          <div className="absolute inset-0 overflow-auto flex items-center justify-center p-6 bg-[#404040]">
            <img
              src={serveUrl}
              alt={fileName}
              draggable={false}
              onContextMenu={e => e.preventDefault()}
              className="object-contain shadow-lg rounded pointer-events-none select-none"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center", transition: "transform 0.2s", maxWidth: "100%", maxHeight: "100%" }}
            />
          </div>
        )}

        {/* Plain text */}
        {!isVideo && !isVideoUrl && !isImage && (
          <div className="absolute inset-0 overflow-y-auto p-8 max-w-4xl mx-auto">
            {!fileUrl && (
              <div className="bg-amber-900/20 border border-amber-700/30 text-amber-400 p-3 rounded-lg text-sm mb-6 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                Original file not available. Ask your teacher to re-upload. Showing extracted text.
              </div>
            )}
            <div className="whitespace-pre-wrap leading-relaxed text-slate-200 select-none text-sm">
              {extractedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
