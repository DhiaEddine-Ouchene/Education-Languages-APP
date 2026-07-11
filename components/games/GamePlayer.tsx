"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { FlashcardGame } from "./FlashcardGame";
import { FillBlankGame } from "./FillBlankGame";
import { DragDropGame } from "./DragDropGame";
import { QuizGame } from "./QuizGame";
import { DictationGame } from "./DictationGame";
import { MemoryGame } from "./MemoryGame";
import { SpeedRoundGame } from "./SpeedRoundGame";
import { StoryGame } from "./StoryGame";
import { GameResultScreen } from "./GameResultScreen";
import { LevelUpModal } from "./LevelUpModal";
import type { GameItem, GameSettings } from "./types";

const GAMES = {
  FLASHCARD: FlashcardGame,
  FILL_BLANK: FillBlankGame,
  DRAG_DROP: DragDropGame,
  QUIZ: QuizGame,
  DICTATION: DictationGame,
  MEMORY: MemoryGame,
  SPEED_ROUND: SpeedRoundGame,
  STORY: StoryGame,
} as const;

const gameMotion = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

type GameType = keyof typeof GAMES;
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
  type: GameType;
  items: GameItem[];
  settings: GameSettings | Record<string, unknown>;
  previewMode?: boolean;
};

const gameLabels: Record<GameType, string> = {
  FLASHCARD: "Flashcard",
  FILL_BLANK: "Fill the blank",
  DRAG_DROP: "Drag & drop",
  QUIZ: "Quiz",
  DICTATION: "Dictation",
  MEMORY: "Memory match",
  SPEED_ROUND: "Speed round",
  STORY: "Story builder",
};

export function GamePlayer({ gameId, title, type, items, settings, previewMode = false }: Props) {
  const [result, setResult] = useState<(Result & { score: number; timeTaken: number }) | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [round, setRound] = useState(0);
  const startRef = useRef(Date.now());
  const GameComponent = GAMES[type] ?? FlashcardGame;

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

  if (items.length < 2) {
    return (
      <div className="mx-auto max-w-xl rounded-card border border-dashed border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-pill bg-primary-light text-2xl">🎮</div>
        <h2 className="font-heading text-lg font-bold">Add more vocabulary to play</h2>
        <p className="mt-2 text-sm text-txt-secondary">This game needs at least 2 vocabulary words before students or teachers can try it.</p>
      </div>
    );
  }

  return (
    <motion.div
      key={round + (result ? "-result" : "-play")}
      variants={gameMotion}
      initial="hidden"
      animate="visible"
      transition= duration: 0.28, ease: "easeOut" 
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
          <GameComponent key={round} items={items} settings={settings as GameSettings} onComplete={onComplete} />
        )}
      </div>
    </motion.div>
  );
}
