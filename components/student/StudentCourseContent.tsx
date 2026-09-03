"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Gamepad2, FileText, Video, BookOpen, PlayCircle,
  ChevronRight, X, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalDocumentViewer } from "@/components/student/UniversalDocumentViewer";

type SourceItem = {
  id: string;
  fileName: string;
  fileType: string;
  extractedText: string;
  fileUrl?: string | null;
};
type LessonItem = { id: string; title: string; content: string };
type GameItem = { id: string; title: string; type: string; emoji: string };

type Props = {
  courseId: string;
  sources: SourceItem[];
  lessons: LessonItem[];
  games: GameItem[];
  studentName: string;
  studentEmail: string;
  isPreview?: boolean; // Teacher preview mode
};

type ActiveItem =
  | { kind: "source"; source: SourceItem }
  | { kind: "lesson"; lesson: LessonItem }
  | { kind: "game"; game: GameItem }
  | null;

export function StudentCourseContent({ courseId, sources, lessons, games, studentName, studentEmail, isPreview = false }: Props) {
  const [active, setActive] = useState<ActiveItem>(
    sources[0] ? { kind: "source", source: sources[0] } :
    lessons[0] ? { kind: "lesson", lesson: lessons[0] } :
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start open on all devices

  const isEmpty = sources.length === 0 && lessons.length === 0 && games.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <BookOpen className="h-12 w-12 text-primary/30" />
        <h3 className="font-heading font-bold text-xl text-txt-primary">No content yet</h3>
        <p className="text-txt-secondary text-sm max-w-sm">
          Your teacher hasn&apos;t uploaded any materials or games for this course yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex bg-[#1a1a1a] rounded-none md:rounded-xl overflow-hidden border-0 md:border border-border shadow-sm relative"
      style={{ height: "calc(100dvh - 64px)" }}
    >
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════ LEFT SIDEBAR ══════════ */}
      <aside
        className={cn(
          "flex flex-col bg-[#252526] border-r border-[#3a3a3a] overflow-hidden transition-all duration-300",
          // Mobile: fixed overlay, Desktop: static sidebar
          "fixed md:relative top-0 bottom-0 left-0 z-50",
          // Width handling
          sidebarOpen ? "w-72 md:w-64" : "w-0",
          // Mobile transform
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#3a3a3a] shrink-0">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Course Content</span>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-white/10 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">

          {/* Documents & Materials */}
          {(sources.length > 0 || lessons.length > 0) && (
            <div className="mb-2">
              <p className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Documents ({sources.length + lessons.length})
              </p>
              {sources.map((source) => {
                const isActive = active?.kind === "source" && active.source.id === source.id;
                return (
                  <button
                    key={source.id}
                    onClick={() => {
                      setActive({ kind: "source", source });
                      // Only auto-close on mobile
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                      isActive ? "bg-primary/20 text-primary" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded flex items-center justify-center shrink-0",
                      isActive ? "bg-primary/30" : "bg-white/5"
                    )}>
                      {(source.fileType === "VIDEO" || source.fileType === "VIDEO_URL" || /\.(mp4|webm|ogg|mov)$/i.test(source.fileName))
                        ? <Video className="h-3.5 w-3.5" />
                        : <FileText className="h-3.5 w-3.5" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{source.fileName}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{source.fileType.replace("_URL", "")}</p>
                    </div>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </button>
                );
              })}

              {lessons.map((lesson) => {
                const isActive = active?.kind === "lesson" && active.lesson.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setActive({ kind: "lesson", lesson });
                      // Only auto-close on mobile
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                      isActive ? "bg-primary/20 text-primary" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded flex items-center justify-center shrink-0", isActive ? "bg-primary/30" : "bg-white/5")}>
                      <BookOpen className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{lesson.title}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Lesson</p>
                    </div>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Games */}
          {games.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Games ({games.length})
              </p>
              {games.map((game) => {
                const isActive = active?.kind === "game" && active.game.id === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => {
                      setActive({ kind: "game", game });
                      // Only auto-close on mobile
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                      isActive ? "bg-primary/20 text-primary" : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded flex items-center justify-center text-base shrink-0", isActive ? "bg-primary/30" : "bg-white/5")}>
                      {game.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{game.title}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{game.type.replace(/_/g, " ")}</p>
                    </div>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT AREA ══════════ */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 relative">

        {/* Menu button (always visible when sidebar closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-30 bg-[#252526] border border-[#3a3a3a] rounded-lg px-3 py-2.5 text-slate-300 hover:text-white transition-colors shadow-xl flex items-center gap-2"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs font-semibold">Menu</span>
          </button>
        )}

        {/* ── Universal Document / Video Viewer ── */}
        {active?.kind === "source" && (
          <UniversalDocumentViewer
            sourceId={active.source.id}
            courseId={courseId}
            fileName={active.source.fileName}
            fileType={active.source.fileType}
            extractedText={active.source.extractedText}
            fileUrl={active.source.fileUrl}
            studentName={studentName}
            studentEmail={studentEmail}
          />
        )}

        {/* ── Lesson text ── */}
        {active?.kind === "lesson" && (
          <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-heading font-bold text-xl sm:text-2xl text-txt-primary mb-4 sm:mb-6">{active.lesson.title}</h2>
              <div className="prose dark:prose-invert max-w-none text-txt-secondary leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {active.lesson.content}
              </div>
            </div>
          </div>
        )}

        {/* ── Game card ── */}
        {active?.kind === "game" && (
          <div className="flex-1 flex items-center justify-center bg-[#404040] p-4">
            <div className="bg-[#252526] border border-[#3a3a3a] rounded-2xl p-6 sm:p-10 max-w-sm w-full text-center shadow-2xl">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">{active.game.emoji}</div>
              <h3 className="font-heading font-bold text-lg sm:text-xl text-white mb-1">{active.game.title}</h3>
              <p className="text-xs sm:text-sm text-slate-400 mb-4 sm:mb-6">{active.game.type.replace(/_/g, " ")}</p>

              {isPreview ? (
                <div className="space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-200 text-xs">
                    <p className="font-semibold mb-1">👁️ Preview Mode</p>
                    <p className="opacity-90">Preview this game interactively as your students will experience it.</p>
                  </div>
                  <Link href={`/dashboard/games/${active.game.id}/preview`}>
                    <Button variant="primary" size="lg" className="w-full gap-2 rounded-xl">
                      <PlayCircle className="h-5 w-5" />
                      Preview Game
                    </Button>
                  </Link>
                </div>
              ) : (
                <Link href={`/learn/game/${active.game.id}`}>
                  <Button variant="primary" size="lg" className="w-full gap-2 rounded-xl">
                    <PlayCircle className="h-5 w-5" />
                    Play Game
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Nothing selected ── */}
        {!active && (
          <div className="flex-1 flex items-center justify-center bg-[#404040] text-slate-500">
            <p className="text-sm">Select a document or game from the sidebar</p>
          </div>
        )}
      </main>
    </div>
  );
}
