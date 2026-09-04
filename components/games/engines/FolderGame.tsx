"use client";
import React from "react";
import Mcq from "./Mcq";
import Flashcard from "./Flashcard";
import FillBlank from "./FillBlank";
import TextTask from "./TextTask";
import MatchPairs from "./MatchPairs";
import OrderChips from "./OrderChips";
import CategorySort from "./CategorySort";
import MemoryMatch from "./MemoryMatch";
import Crossword from "./Crossword";
import TapWord from "./TapWord";
import Writing from "./Writing";
import Speaking from "./Speaking";
import type { FolderGame as FG } from "./types";

/** Faithful port of the folder's Game.jsx engine mapper. */
const ENGINES: Record<string, any> = {
  mcq: Mcq,
  flashcard: Flashcard,
  fillblank: FillBlank,
  texttask: TextTask,
  match: MatchPairs,
  order: OrderChips,
  sort: CategorySort,
  memory: MemoryMatch,
  crossword: Crossword,
  tapword: TapWord,
  writing: Writing,
  speaking: Speaking,
};

class FolderGameErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[FolderGame] Game engine render exception caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-border/80 bg-card p-6 text-center shadow-sm max-w-md mx-auto my-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
            🎮
          </div>
          <h3 className="font-heading font-semibold text-base text-txt">
            Content Preview Not Ready
          </h3>
          <p className="text-xs text-txt-secondary leading-relaxed">
            The game content needs a bit more information or review before it can be played. Please check that all questions and options in the builder are filled.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors"
          >
            Retry Preview
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function FolderGame({
  game,
  onComplete,
  student,
}: {
  game: FG;
  onComplete: (c: number, t: number) => void;
  student?: { name: string; image?: string | null };
}) {
  const Engine = ENGINES[game.engine];
  if (!Engine) return <div className="fg card">Unknown game engine: {game.engine}</div>;

  return (
    <FolderGameErrorBoundary key={`${game.engine}-${game.id}`}>
      <Engine key={game.id} game={game} onComplete={onComplete} student={student} />
    </FolderGameErrorBoundary>
  );
}
