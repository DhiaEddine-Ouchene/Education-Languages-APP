"use client";
import Mcq from "./Mcq";
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

export default function FolderGame({ game, onComplete }: { game: FG; onComplete: (c: number, t: number) => void }) {
  const Engine = ENGINES[game.engine];
  if (!Engine) return <div className="fg card">Unknown game engine.</div>;
  return <Engine key={game.id} game={game} onComplete={onComplete} />;
}
