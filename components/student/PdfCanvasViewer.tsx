"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize2, Minimize2, RotateCw, SlidersHorizontal, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const ZOOM_LEVELS = [50, 67, 75, 90, 100, 110, 125, 150, 175, 200, 250, 300];

type Props = { sourceId: string; courseId: string; fileName: string };

export function PdfCanvasViewer({ sourceId, courseId, fileName }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [pdfDoc,      setPdfDoc]      = useState<any>(null);
  const [numPages,    setNumPages]    = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom,        setZoom]        = useState(100);
  const [rotation,    setRotation]    = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [fullscreen,  setFullscreen]  = useState(false);
  const [sidebar,     setSidebar]     = useState(true); // Will be controlled by screen size
  const [pageAspects, setPageAspects] = useState<number[]>([]); // per-page aspect ratios
  const [isMobile,    setIsMobile]    = useState(false);

  const pdfUrl = `/api/courses/${courseId}/sources/${sourceId}`;

  /* ─── Detect mobile and set sidebar accordingly ─── */
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebar(!mobile); // Hide sidebar on mobile, show on desktop
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /* ─── Load PDF.js + document ─── */
  useEffect(() => {
    let dead = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc =
          `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        if (dead) return;

        const doc = await pdfjs.getDocument({ data: buf }).promise;
        if (dead) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        
        // Get aspect ratio for ALL pages to prevent scroll jumping and handle variable page sizes
        if (doc.numPages > 0) {
          const aspects = await Promise.all(
            Array.from({ length: doc.numPages }, (_, i) => i + 1).map(async (n) => {
              try {
                const page = await doc.getPage(n);
                const vp = page.getViewport({ scale: 1, rotation: 0 });
                return vp.width / vp.height;
              } catch (e) {
                return 0.75; // fallback
              }
            })
          );
          setPageAspects(aspects);
        }
        
        setLoading(false);
      } catch (e: any) {
        if (!dead) { setError(e.message); setLoading(false); }
      }
    })();
    return () => { dead = true; };
  }, [pdfUrl]);


  /* ─── Track current page via scroll ─── */
  useEffect(() => {
    if (!pdfDoc || !scrollAreaRef.current) return;
    
    const root = scrollAreaRef.current;
    
    // We observe all page containers to update the current page indicator
    const obs = new IntersectionObserver(entries => {
      let best = { ratio: 0, page: currentPage };
      entries.forEach(e => {
        const p = parseInt(e.target.getAttribute("data-page") ?? "0");
        if (p && e.intersectionRatio > best.ratio) best = { ratio: e.intersectionRatio, page: p };
      });
      if (best.ratio > 0) setCurrentPage(best.page);
    }, { root, threshold: [0.1, 0.3, 0.5, 0.7, 0.9] });

    root.querySelectorAll("[data-page]").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [pdfDoc, numPages, zoom]); // Re-bind on zoom so heights are stable

  /* ─── Scroll to page ─── */
  const scrollToPage = useCallback((n: number) => {
    const el = scrollAreaRef.current?.querySelector(`[data-page="${n}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(n);
  }, []);

  /* ─── Fullscreen ─── */
  const toggleFs = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };
  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=") { e.preventDefault(); setZoom(z => ZOOM_LEVELS.find(l => l > z) ?? 300); }
        if (e.key === "-") { e.preventDefault(); setZoom(z => [...ZOOM_LEVELS].reverse().find(l => l < z) ?? 50); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const viewH = fullscreen ? "100dvh" : "calc(100dvh - 36px)";

  // Responsive base width: smaller on mobile, larger on desktop
  const baseWidth = isMobile ? 350 : 800;

  return (
    <div ref={containerRef} className="flex flex-col bg-[#1a1a1a]" style={{ height: viewH }}>

      {/* ══ TOOLBAR ══ */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#252526] border-b border-[#3a3a3a] text-white shrink-0 select-none">

        <button onClick={() => setSidebar(s => !s)}
          className={cn("p-1.5 rounded hover:bg-white/10", sidebar ? "text-primary" : "text-slate-400")}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>

        {/* File name */}
        <span className="text-xs text-slate-400 truncate max-w-[200px] ml-1 mr-2">{fileName}</span>

        <div className="flex-1" />

        {/* Page navigation */}
        <button onClick={() => scrollToPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 text-slate-300">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <input
          type="number" value={currentPage} min={1} max={numPages || 1}
          onChange={e => { const v = +e.target.value; if (v >= 1 && v <= numPages) scrollToPage(v); }}
          className="w-9 text-center bg-[#3c3c3c] border border-[#555] rounded px-1 py-0.5 text-white text-xs focus:outline-none focus:border-primary"
        />
        <span className="text-xs text-slate-400 mx-1">/ {numPages || "—"}</span>

        <button onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 text-slate-300">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <div className="w-px h-4 bg-white/10 mx-2" />

        {/* Zoom */}
        <button onClick={() => setZoom(z => [...ZOOM_LEVELS].reverse().find(l => l < z) ?? 50)}
          className="p-1.5 rounded hover:bg-white/10 text-slate-300">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <select value={zoom} onChange={e => setZoom(+e.target.value)}
          className="text-xs bg-[#3c3c3c] border border-[#555] rounded px-1.5 py-0.5 text-white focus:outline-none cursor-pointer">
          {ZOOM_LEVELS.map(z => <option key={z} value={z}>{z}%</option>)}
        </select>

        <button onClick={() => setZoom(z => ZOOM_LEVELS.find(l => l > z) ?? 300)}
          className="p-1.5 rounded hover:bg-white/10 text-slate-300">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        <div className="w-px h-4 bg-white/10 mx-2" />

        <button onClick={() => setRotation(r => (r + 90) % 360)}
          className="p-1.5 rounded hover:bg-white/10 text-slate-300" title="Rotate">
          <RotateCw className="h-3.5 w-3.5" />
        </button>

        <div className="w-px h-4 bg-white/10 mx-2" />

        <button onClick={toggleFs} className="p-1.5 rounded hover:bg-white/10 text-slate-300">
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ══ BODY ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* Thumbnail sidebar */}
        {sidebar && (
          <div className="w-44 bg-[#252526] border-r border-[#3a3a3a] flex flex-col shrink-0 overflow-hidden">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#3a3a3a]">
              Pages
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {pdfDoc && Array.from({ length: numPages }, (_, i) => i + 1).map(p => {
                const pageAspect = pageAspects[p - 1] || 0.75;
                return (
                  <button key={p} onClick={() => scrollToPage(p)}
                    className={cn(
                      "w-full flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all",
                      currentPage === p ? "bg-primary/20 ring-1 ring-primary/60" : "hover:bg-white/5"
                    )}>
                    <div 
                      className="w-full bg-white rounded shadow-sm relative overflow-hidden"
                      style={{ aspectRatio: rotation % 180 !== 0 ? 1/pageAspect : pageAspect }}
                    >
                      <PdfPage doc={pdfDoc} pageNumber={p} scale={0.2} rotation={rotation} isThumb />
                    </div>
                    <span className={cn("text-[9px] font-semibold", currentPage === p ? "text-primary" : "text-slate-500")}>
                      {p}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PDF scroll area */}
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto bg-[#525659] relative"
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm">Loading document…</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <FileText className="h-10 w-10 text-red-400" />
              <p className="font-medium text-red-300">Failed to load PDF</p>
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Pages — using intersection observer internally so they only render when visible */}
          {!loading && !error && pdfDoc && (
            <div className="flex flex-col items-center py-4 md:py-6 gap-3 md:gap-5 px-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map(n => {
                const pageAspect = pageAspects[n - 1] || 0.75;
                const isRotated = rotation % 180 !== 0;
                const activeAspect = isRotated ? 1 / pageAspect : pageAspect;
                const width = baseWidth * (zoom / 100);
                
                return (
                  <div
                    key={n}
                    data-page={n}
                    id={`pdf-page-${n}`}
                    className="relative shadow-2xl rounded-sm overflow-hidden bg-white flex-shrink-0 max-w-full"
                    style={{ width: `${Math.min(width, window.innerWidth - 32)}px`, aspectRatio: activeAspect }}
                  >
                    <PdfPage 
                      doc={pdfDoc} 
                      pageNumber={n} 
                      scale={zoom / 100} 
                      rotation={rotation} 
                    />
                    
                    {/* Subtle page number badge */}
                    <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded select-none pointer-events-none z-10">
                      {n}
                    </div>
                  </div>
                );
              })}
              <div className="h-6 shrink-0" /> {/* bottom padding */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component for lazily rendering a single PDF page
function PdfPage({ doc, pageNumber, scale, rotation, isThumb = false }: { doc: any, pageNumber: number, scale: number, rotation: number, isThumb?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(isThumb);
  
  // Use IntersectionObserver to delay rendering until the page is near the viewport
  useEffect(() => {
    if (isThumb) return; // Thumbs always render
    
    const el = canvasRef.current;
    if (!el) return;
    
    // We wrap the canvas in its parent, so we observe the parent
    const parent = el.parentElement;
    if (!parent) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        // Optional: you could disconnect here if you don't want to unmount pages that go out of view
        // obs.disconnect(); 
      } else {
        // Free up memory for pages far out of view
        setIsVisible(false);
      }
    }, { rootMargin: "1000px 0px" }); // Pre-load pages 1000px before they scroll into view
    
    obs.observe(parent);
    return () => obs.disconnect();
  }, [isThumb]);

  // Actual rendering logic
  useEffect(() => {
    if (!isVisible || !doc || !canvasRef.current) return;
    let dead = false;
    
    const render = async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (dead) return;
        
        const dpr = isThumb ? 1 : (window.devicePixelRatio || 1);
        const viewport = page.getViewport({ scale: scale * dpr, rotation });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        // Clear previous render
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (e) {
        console.error("Page render error:", e);
      }
    };
    
    render();
    return () => { dead = true; };
  }, [isVisible, doc, pageNumber, scale, rotation, isThumb]);

  return (
    <canvas 
      ref={canvasRef} 
      className="block absolute inset-0 w-full h-full"
    />
  );
}
