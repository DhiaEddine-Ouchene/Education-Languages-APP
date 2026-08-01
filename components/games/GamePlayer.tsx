"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/toast";
import FolderGame from "./engines/FolderGame";
import { buildFolderGame } from "@/lib/folder-game-data";
// Shared result / UI
import { GameResultScreen } from "./GameResultScreen";
import { LevelUpModal } from "./LevelUpModal";
import type { GameItem, GameSettings } from "./types";

const gameMotion = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const gameTransition = {
  duration: 0.28,
  ease: "easeOut" as const,
};

type Result = {
  xpEarned: number;
  totalXP: number;
  level: number;
  leveledUp: boolean;
  streak: number;
  newBadges: string[];
};

type Props = {
  gameId: string;
  title: string;
  type: string;
  items: GameItem[];
  settings: GameSettings | Record<string, unknown>;
  previewMode?: boolean;
};

const gameLabels: Record<string, string> = {
  // Classic
  FLASHCARD: "Flashcard",
  FILL_BLANK: "Fill the blank",
  DRAG_DROP: "Drag & drop",
  QUIZ: "Quiz",
  DICTATION: "Dictation Challenge",
  MEMORY: "Memory match",
  SPEED_ROUND: "Speed round / Listen & Select",
  STORY: "Story builder",
  // Vocabulary
  SYNONYM_ANTONYM: "Synonym & Antonym",
  FILL_GAP_WORD: "Fill the Gap",
  WORD_MEANING_MATCH: "Word Meaning Match",
  SITUATION_DIALOGUE_FILL: "Dialogue Fill",
  WORD_IN_CONTEXT: "Word in Context",
  WORD_SCRAMBLE: "Word Scramble",
  ODD_ONE_OUT: "Odd One Out",
  // Grammar
  SENTENCE_BUILDER: "Sentence Builder",
  ERROR_SPOTTING: "Error Spotting",
  FILL_BLANK_GRAMMAR: "Fill the Blank (Grammar)",
  VERB_CONJUGATION: "Verb Conjugation",
  MULTIPLE_CHOICE_GRAMMAR: "Multiple Choice Grammar",
  // Listening & Speaking
  LISTEN_FILL_WORD: "Listen & Fill Word",
  LISTEN_FILL_SENTENCE: "Listen & Fill Sentence",
  SPEAK_FILL_WORD: "Speak & Fill Word",
  SPEAK_FILL_SENTENCE: "Speak & Fill Sentence",
  // Extra
  CROSSWORD: "Crossword",
  COLLOCATION_BUILDER: "Collocation Builder",
  FLASHCARD_3D: "3D Word Matcher",
  MINIMAL_PAIR: "Minimal Pair Match",
  PICTURE_TO_WORD: "Picture to Word",
  // Ported engines
  CATEGORY_SORT: "Category Sort",
  TRANSFORMATION: "Sentence Transformation",
  WRITING_RUBRIC: "Writing with Rubric",
  SPEAKING: "Speaking Practice",
};

export function GamePlayer({ gameId, title, type, items, settings, previewMode = false }: Props) {
  const [result, setResult] = useState<(Result & { score: number; timeTaken: number }) | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [round, setRound] = useState(0);
  const startRef = useRef(Date.now());
  const folderGame = useMemo(
    () => buildFolderGame(type, settings as Record<string, any>, items),
    [type, settings, items, round] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onComplete = async (correct: number, total: number) => {
    const timeTaken = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
    const score = Math.round((correct / Math.max(total, 1)) * 100);

    if (previewMode) {
      setResult({ score, timeTaken, xpEarned: 0, totalXP: 0, level: 0, leveledUp: false, streak: 0, newBadges: [] });
      return;
    }

    try {
      const res = await fetch(`/api/games/${gameId}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, timeTaken }),
      });
      if (!res.ok) {
        toast("error", "Could not save your progress");
        setResult({ score, timeTaken, xpEarned: 0, totalXP: 0, level: 1, leveledUp: false, streak: 0, newBadges: [] });
        return;
      }
      const data: Result = await res.json();
      setResult({ ...data, score, timeTaken });
      if (data.leveledUp) setShowLevelUp(true);
    } catch {
      toast("error", "Network error saving progress");
      setResult({ score, timeTaken, xpEarned: 0, totalXP: 0, level: 1, leveledUp: false, streak: 0, newBadges: [] });
    }
  };

  const playAgain = () => {
    startRef.current = Date.now();
    setResult(null);
    setRound((r) => r + 1);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-card border border-dashed border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-pill bg-primary-light text-2xl">🎮</div>
        <h2 className="font-heading text-lg font-bold">Add content to play</h2>
        <p className="mt-2 text-sm text-txt-secondary">This game has no content yet. Add vocabulary or task items before students or teachers can try it.</p>
      </div>
    );
  }

  return (
    <motion.div
      key={round + (result ? "-result" : "-play")}
      variants={gameMotion}
      initial="hidden"
      animate="visible"
      transition={gameTransition}
      className="py-4"
    >
      <div className="mx-auto mb-5 max-w-4xl rounded-card border border-border bg-card/90 p-4 shadow-card backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-pill bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
              <Sparkles className="h-3.5 w-3.5" /> {gameLabels[type] ?? "Language game"}
            </div>
            <h1 className="font-heading text-2xl font-bold leading-tight text-txt-primary">{title}</h1>
            <p className="mt-1 text-sm text-txt-secondary">{items.length} words · Clean practice mode · Instant feedback</p>
          </div>
          {previewMode && (
            <div className="inline-flex items-center gap-2 rounded-card border border-warning/30 bg-orange-50 px-3 py-2 text-sm font-medium text-warning">
              <Eye className="h-4 w-4" /> Teacher preview — progress is not saved
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl rounded-card border border-border bg-gradient-to-br from-white via-white to-primary-light/40 p-4 shadow-card sm:p-6">
        {result ? (
          <>
            <GameResultScreen
              score={result.score}
              xpEarned={result.xpEarned}
              timeTaken={result.timeTaken}
              streak={result.streak}
              newBadges={result.newBadges}
              onPlayAgain={playAgain}
              previewMode={previewMode}
            />
            <LevelUpModal level={result.level} open={showLevelUp} onClose={() => setShowLevelUp(false)} />
          </>
        ) : (
          <FolderGame key={round} game={folderGame} onComplete={onComplete} />
        )}
      </div>
    </motion.div>
  );
}
