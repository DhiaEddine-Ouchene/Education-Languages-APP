import { buildFolderGame } from "@/lib/folder-game-data";
import { exampleEngineData, hasEngineContent } from "@/lib/builder-schemas";
import type { GameItem } from "@/components/games/types";
import type { ChipData } from "@/components/dashboard/builders/WordBank";

// Game TYPES whose engine content can be built WELL from a plain content list
// (word/phrase + translation, and an optional example sentence) with NO AI call —
// these fill the builder instantly. Everything else is a "structured" type
// (crossword grids, category buckets, dialogues, grammar transforms, error
// spotting, writing prompts, MCQ questions, gap-fill sentences, …) that reads
// much better and generates full fields when the AI shapes it.
const INSTANT_FILL_TYPES = new Set<string>([
  "FLASHCARD", "FLASHCARD_3D",           // flashcard: word ↔ meaning cards
  "MEMORY",                               // memory: word ↔ meaning pairs
  "WORD_MEANING_MATCH", "DRAG_DROP",      // match: word ↔ meaning pairs
  "WORD_SCRAMBLE",                        // order (letters): unscramble the word
]);

/** True when a plain content list is enough to build a good game with no AI. */
export function isInstantFillType(type: string): boolean {
  return INSTANT_FILL_TYPES.has(type);
}

/** Normalise word-bank chips (or anything word-shaped) into engine GameItems. */
export function itemsFromChips(chips: ChipData[]): GameItem[] {
  return chips.map((c, i) => ({
    id: c.id || `item-${i}`,
    word: c.word,
    translation: c.translation,
    audioUrl: null,
    imageUrl: null,
    exampleSentence: c.exampleSentence || null,
  }));
}

export type FillResult = {
  /** Engine-ready data for this game type — always non-empty. */
  data: Record<string, any>;
  /** True when the AI generator would produce meaningfully better content. */
  viaAI: boolean;
  /** True when `data` was built instantly from the items with no AI needed. */
  instant: boolean;
};

/**
 * Turn a portable content list into engine-ready `data` for one game type.
 *
 * This is the single bridge that lets ONE content list fill ANY game: it reuses
 * the exact same derivation the player/preview use (`buildFolderGame`), so filled
 * content renders identically everywhere.
 *
 * - Instant types (see `INSTANT_FILL_TYPES`) get real, playable content with no AI.
 * - Structured types return `viaAI: true` so the caller can ask the AI to shape the
 *   items, plus a best-effort deterministic `data` as an offline fallback.
 * - `data` is guaranteed non-empty: if nothing can be derived from the items it
 *   falls back to the curated concept example so previews/saves are never blank.
 */
export function buildEngineDataFromItems(type: string, items: GameItem[]): FillResult {
  const derived = (buildFolderGame(type, {}, items).data || {}) as Record<string, any>;
  const derivedHasContent = hasEngineContent(type, derived);

  if (INSTANT_FILL_TYPES.has(type) && derivedHasContent) {
    return { data: derived, viaAI: false, instant: true };
  }

  // Structured type → the AI generator does a far better job. Still hand back a
  // usable fallback so, if the AI is unavailable, the builder is never left empty.
  const fallback = derivedHasContent ? derived : exampleEngineData(type);
  return { data: fallback, viaAI: true, instant: false };
}
