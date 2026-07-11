"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/toast";
import { Eye } from "lucide-react";
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

type Result = { xpEarned: number; totalXP: number; level: number; leveledUp: boolean; streak: number; newBadges: string[] };

export function GamePlayer({ gameId, title, type, items, settings, previewMode = false }: {
  gameId: string; title: string; type: keyof typeof GAMES; items: GameItem[]; settings: GameSettings;
  previewMode?: boolean;
}) {
  const [result, setResult] = useState<(Result & { score: number; timeTaken: number }) | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [round, setRound] = useState(0);
  const startRef = useRef(Date.now());
  const GameComponent = GAMES[type];

  const onComplete = async (correct: number, total: number) => {
    const timeTaken = Math.round((Date.now() - startRef.current) / 1000);
    const score = Math.round((correct / Math.max(total, 1)) * 100);

    // Preview mode: show results locally without saving anything
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
    return <p className="text-center text-sm text-txt-secondary py-10">This game needs at least 2 vocabulary words.</p>;
  }

  return (
    <motion.div key={round + (result ? "-r" : "")} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="py-6">
      {previewMode && (
        <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2.5 rounded-card bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
          <Eye className="h-4 w-4" />
          Preview Mode — results will not be saved
        </div>
      )}
      <h1 className="font-heading font-bold text-xl text-center mb-6">{title}</h1>
      {result ? (
        <>
          <GameResultScreen score={result.score} xpEarned={result.xpEarned} timeTaken={result.timeTaken} streak={result.streak} newBadges={result.newBadges} onPlayAgain={playAgain} />
          <LevelUpModal level={result.level} open={showLevelUp} onClose={() => setShowLevelUp(false)} />
        </>
      ) : (
        <GameComponent key={round} items={items} settings={settings} onComplete={onComplete} />
      )}
    </motion.div>
  );
}
