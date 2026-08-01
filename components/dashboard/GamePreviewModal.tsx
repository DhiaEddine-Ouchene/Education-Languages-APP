"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GamePlayer } from "@/components/games/GamePlayer";
import { getGameTypeMeta } from "@/lib/game-type-metadata";
import { getGameGuide } from "@/lib/game-guides";
import { X, Eye, PlayCircle, Lightbulb, Target, BookOpen, ListChecks, ClipboardCheck, GraduationCap } from "lucide-react";
import type { GameItem } from "@/components/games/types";

// ── Sample demo items for preview ──
const DEMO_ITEMS: GameItem[] = [
  { id: "1", word: "Apple", translation: "تفاحة", audioUrl: null, imageUrl: null, exampleSentence: "I eat an apple every morning." },
  { id: "2", word: "Book", translation: "كتاب", audioUrl: null, imageUrl: null, exampleSentence: "She reads a book before bed." },
  { id: "3", word: "Cat", translation: "قطة", audioUrl: null, imageUrl: null, exampleSentence: "The cat is sleeping on the sofa." },
  { id: "4", word: "Dog", translation: "كلب", audioUrl: null, imageUrl: null, exampleSentence: "The dog runs in the park." },
  { id: "5", word: "Water", translation: "ماء", audioUrl: null, imageUrl: null, exampleSentence: "Please drink more water." },
  { id: "6", word: "School", translation: "مدرسة", audioUrl: null, imageUrl: null, exampleSentence: "I go to school every day." },
  { id: "7", word: "Friend", translation: "صديق", audioUrl: null, imageUrl: null, exampleSentence: "My best friend lives next door." },
  { id: "8", word: "House", translation: "بيت", audioUrl: null, imageUrl: null, exampleSentence: "Our house is painted blue." },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  gameType: string;
  gameTitle: string;
  /** Optional custom items to preview (from builder data) */
  customItems?: GameItem[];
  /** Optional real game settings so the preview matches the actual game content */
  settings?: Record<string, unknown>;
};

export function GamePreviewModal({ isOpen, onClose, gameType, gameTitle, customItems, settings }: Props) {
  const [activeTab, setActiveTab] = useState<"guide" | "play">("guide");
  const [mounted, setMounted] = useState(false);
  const meta = getGameTypeMeta(gameType);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const previewItems = customItems && customItems.length >= 2 ? customItems : DEMO_ITEMS;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-border/40">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-background shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-txt">{gameTitle}</h2>
              <p className="text-xs text-txt-secondary">How to play & preview</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-border/50 transition-colors">
            <X className="w-5 h-5 text-txt-secondary" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border/40 bg-background/50 shrink-0">
          <button
            onClick={() => setActiveTab("guide")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2",
              activeTab === "guide"
                ? "text-primary border-b-2 border-primary bg-primary/[0.03]"
                : "text-txt-secondary hover:text-txt"
            )}
          >
            <BookOpen className="w-4 h-4" /> Game Guide
          </button>
          <button
            onClick={() => setActiveTab("play")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2",
              activeTab === "play"
                ? "text-primary border-b-2 border-primary bg-primary/[0.03]"
                : "text-txt-secondary hover:text-txt"
            )}
          >
            <PlayCircle className="w-4 h-4" /> Try the Game
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "guide" ? (
            /* ── Guide Tab ── */
            <div className="p-5 space-y-5">
              {/* Description */}
              {meta?.description && (
                <p className="text-sm text-txt leading-relaxed">{meta.description}</p>
              )}

              {/* Learning Objectives */}
              {meta?.objectives && meta.objectives.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Learning Objectives</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.objectives.map((obj) => (
                      <Badge key={obj} variant="outline" className="bg-accent/5 text-accent border-accent/20 text-xs">
                        {obj}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Tip */}
              {meta?.teacherTip && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary mb-0.5">Teacher Tip</p>
                    <p className="text-sm text-txt-secondary leading-relaxed">{meta.teacherTip}</p>
                  </div>
                </div>
              )}

              {/* Example */}
              {meta?.example && (
                <div className="rounded-xl bg-background border border-border/40 p-4">
                  <p className="text-xs font-semibold text-txt-secondary mb-1.5 uppercase tracking-wider">Example</p>
                  <p className="text-sm text-txt leading-relaxed">{meta.example}</p>
                </div>
              )}

              {/* ── Rich Game Guide ── */}
              {(() => {
                const guide = getGameGuide(gameType);
                if (!guide) return null;
                return (
                  <div className="space-y-5 border-t border-border/40 pt-5">
                    {/* Summary */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">How It Works</span>
                      </div>
                      <p className="text-sm text-txt leading-relaxed">{guide.summary}</p>
                    </div>

                    {/* How to Play steps */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ListChecks className="w-4 h-4 text-accent" />
                        <span className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Step by Step</span>
                      </div>
                      <ol className="space-y-2">
                        {guide.howToPlay.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-txt">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Teacher Prep */}
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 flex items-start gap-3">
                      <ClipboardCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-primary mb-0.5">Teacher Preparation</p>
                        <p className="text-sm text-txt-secondary leading-relaxed">{guide.teacherPrep}</p>
                      </div>
                    </div>

                    {/* Classroom Use */}
                    <div className="rounded-xl bg-accent/5 border border-accent/10 p-4 flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-accent mb-0.5">Classroom Use</p>
                        <p className="text-sm text-txt-secondary leading-relaxed">{guide.classroomUse}</p>
                      </div>
                    </div>

                    {/* Scoring */}
                    <div className="rounded-xl bg-background border border-border/40 p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Target className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Scoring & Assessment</span>
                      </div>
                      <p className="text-sm text-txt leading-relaxed">{guide.scoring}</p>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-txt-secondary pt-1">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{guide.difficultyLabel}</span>
                      <span>⏱ {guide.timeEstimate}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Try the Game CTA */}
              <div className="flex justify-center pt-2">
                <Button onClick={() => setActiveTab("play")} size="lg" className="px-8">
                  <PlayCircle className="w-5 h-5" /> Try the Game
                </Button>
              </div>

              {/* Difficulty & Time Estimate */}
              {meta && (
                <div className="flex items-center gap-4 text-xs text-txt-secondary">
                  <span>Difficulty: {new Array(meta.difficulty).fill("●").join("")}{new Array(3 - meta.difficulty).fill("○").join("")}</span>
                  <span>Estimated time: {meta.estimatedTime}</span>
                </div>
              )}
            </div>
          ) : (
            /* ── Play Tab ── */
            <div className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Live Preview</span>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">
                  Teacher preview — progress is not saved
                </span>
              </div>
              <GamePlayer
                gameId="preview"
                title={gameTitle}
                type={gameType}
                items={previewItems}
                settings={{ difficulty: "medium", timer: 30, hints: true, audioAutoplay: false, shuffle: false, ...(settings ?? {}) }}
                previewMode={true}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 bg-background flex justify-end gap-2 shrink-0">
          {activeTab === "play" ? (
            <Button variant="outline" onClick={() => setActiveTab("guide")}>
              <BookOpen className="w-4 h-4" /> Show Guide
            </Button>
          ) : (
            <Button onClick={() => setActiveTab("play")}>
              <PlayCircle className="w-4 h-4" /> Try the Game
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
