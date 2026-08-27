"use client";

// ── GamePoster ──
// Renders the REAL play engine as a static, non-interactive thumbnail so a game
// card always shows exactly what the student will see — never a hand-drawn
// approximation that drifts from the actual UI. It reuses the same engine +
// example-data path as the live builder preview (schemaForType + exampleEngineData),
// scaled to fit the card via a ResizeObserver. All engine side effects (audio,
// timers, mic) are click-gated, so mounting the engine here is inert.

import React, { useEffect, useMemo, useRef, useState } from "react";
import FolderGame from "@/components/games/engines/FolderGame";
import { schemaForType, exampleEngineData } from "@/lib/builder-schemas";
import { getGameTypeMeta, CATEGORY_META } from "@/lib/game-type-metadata";
import { cn } from "@/lib/utils";

// Natural width of the `.fg` game stage (see folder.css `.fg { max-width: 480px }`).
const STAGE_W = 480;

type Props = {
  type: string;
  title: string;
  className?: string;
};

// Clean branded placeholder — used before mount (avoids SSR/CSR hydration
// mismatch from engines that shuffle) and if an engine throws on example data.
function PosterFallback({ type, title }: { type: string; title: string }) {
  const meta = getGameTypeMeta(type);
  const cat = meta?.category ?? "vocabulary";
  const gradient = CATEGORY_META[cat]?.gradient ?? "from-primary to-primary-dark";
  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br p-4 text-center", gradient)}>
      <span className="text-5xl drop-shadow-sm">{meta?.emoji ?? "🎮"}</span>
      <span className="mt-2 line-clamp-2 text-sm font-bold text-white/95">{title || meta?.title || "Game"}</span>
    </div>
  );
}

class PosterBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { err: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { err: false };
  }
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

export function GamePoster({ type, title, className }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(256 / STAGE_W); // sensible default until measured
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w) setScale(w / STAGE_W);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const game = useMemo(() => {
    const schema = schemaForType(type);
    return { id: `poster:${type}`, engine: schema.engine, title, data: exampleEngineData(type) };
  }, [type, title]);

  return (
    <div
      ref={frameRef}
      aria-hidden
      tabIndex={-1}
      className={cn("relative aspect-square overflow-hidden bg-[#f4f2ff]", className)}
    >
      {mounted ? (
        <PosterBoundary fallback={<PosterFallback type={type} title={title} />}>
          <div
            className="pointer-events-none absolute left-0 top-0 origin-top-left select-none"
            style={{ width: STAGE_W, transform: `scale(${scale})` }}
          >
            <FolderGame game={game as any} onComplete={() => {}} />
          </div>
        </PosterBoundary>
      ) : (
        <PosterFallback type={type} title={title} />
      )}
    </div>
  );
}

export default GamePoster;
