// ── AI response → engine-ready `data` ──
// Converts the raw output of the AI generator (lib/generate-game.ts, validated by
// lib/game-schemas.ts — always `{ items: [...] }` in a per-type shape) DIRECTLY into
// the engine `data` shape that the play engines consume and that the SchemaBuilder can
// round-trip for editing.
//
// CRITICAL: every field emitted here must exist in the target engine's schema
// (lib/builder-schemas.ts). SchemaBuilder re-derives `data` from the form via
// `buildEngineData`, which drops any key not declared as a schema field — so an
// off-schema field (e.g. a fillblank `dialogue`) would vanish the moment the builder
// mounts. We therefore keep strictly to schema fields.

import { folderEngineForType } from "@/lib/folder-game-data";

type AnyItem = Record<string, any>;

// ── small helpers ─────────────────────────────────────────────
const S = (x: any): string => String(x ?? "").trim();

function itemsOf(aiData: any): AnyItem[] {
  if (Array.isArray(aiData?.items)) return aiData.items;
  if (Array.isArray(aiData)) return aiData;
  return [];
}

function uniq(xs: any[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const s = S(x);
    const key = s.toLowerCase();
    if (s && !seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick up to n distinct distractors from `pool`, excluding `answer`. */
function distractorsFrom(pool: any[], answer: string, n: number): string[] {
  const ans = S(answer).toLowerCase();
  return uniq(shuffle(pool.map(S)).filter((s) => s.toLowerCase() !== ans)).slice(0, n);
}

/** Build a 3-4 option MCQ option list around a correct answer (answer position randomised). */
function optionSet(answer: string, distractors: any[], desired = 4): string[] {
  const opts = uniq([S(answer), ...distractors.map(S)]);
  return shuffle(opts.slice(0, Math.max(2, desired)));
}

// ── crossword auto-layout (AI returns only word+clue, no coordinates) ──
type Entry = { word: string; clue: string; row: number; col: number; dir: "across" | "down" };

function layoutCrossword(words: AnyItem[]): Entry[] {
  const items = words
    .map((w) => ({ word: S(w.word).toUpperCase().replace(/[^A-ZÀ-ÿ]/gi, ""), clue: S(w.clue) }))
    .filter((w) => w.word.length >= 2)
    .sort((a, b) => b.word.length - a.word.length);
  if (!items.length) return [];

  const grid = new Map<string, string>();
  const placed: Entry[] = [];
  const key = (r: number, c: number) => r + "," + c;

  const canPlace = (word: string, row: number, col: number, dir: "across" | "down"): boolean => {
    let crosses = false;
    for (let i = 0; i < word.length; i++) {
      const r = dir === "down" ? row + i : row;
      const c = dir === "down" ? col : col + i;
      const cur = grid.get(key(r, c));
      if (cur) {
        if (cur !== word[i]) return false;
        crosses = true;
      } else {
        // neighbouring cells perpendicular to the run must be empty (no accidental words)
        if (dir === "across") {
          if (grid.get(key(r - 1, c)) || grid.get(key(r + 1, c))) return false;
        } else {
          if (grid.get(key(r, c - 1)) || grid.get(key(r, c + 1))) return false;
        }
      }
    }
    // the cell just before the start and just after the end must be empty (word boundaries)
    const bR = dir === "down" ? row - 1 : row;
    const bC = dir === "down" ? col : col - 1;
    const aR = dir === "down" ? row + word.length : row;
    const aC = dir === "down" ? col : col + word.length;
    if (grid.get(key(bR, bC)) || grid.get(key(aR, aC))) return false;
    return crosses;
  };

  const put = (word: string, clue: string, row: number, col: number, dir: "across" | "down") => {
    for (let i = 0; i < word.length; i++) {
      const r = dir === "down" ? row + i : row;
      const c = dir === "down" ? col : col + i;
      grid.set(key(r, c), word[i]);
    }
    placed.push({ word, clue, row, col, dir });
  };

  // first word: across at origin
  put(items[0].word, items[0].clue, 0, 0, "across");

  for (let idx = 1; idx < items.length; idx++) {
    const { word, clue } = items[idx];
    let done = false;
    for (const p of placed) {
      if (done) break;
      for (let pi = 0; pi < p.word.length && !done; pi++) {
        for (let wi = 0; wi < word.length && !done; wi++) {
          if (p.word[pi] !== word[wi]) continue;
          if (p.dir === "across") {
            const row2 = p.row - wi;
            const col2 = p.col + pi;
            if (canPlace(word, row2, col2, "down")) {
              put(word, clue, row2, col2, "down");
              done = true;
            }
          } else {
            const row2 = p.row + pi;
            const col2 = p.col - wi;
            if (canPlace(word, row2, col2, "across")) {
              put(word, clue, row2, col2, "across");
              done = true;
            }
          }
        }
      }
    }
    // words that can't interlock are dropped rather than corrupt the grid
  }

  // normalise to non-negative coordinates
  let minR = Infinity;
  let minC = Infinity;
  placed.forEach((p) => {
    minR = Math.min(minR, p.row);
    minC = Math.min(minC, p.col);
  });
  return placed.map((p) => ({ ...p, row: p.row - minR, col: p.col - minC }));
}

// ── per-engine builders ───────────────────────────────────────

/** flashcard: front (word) / back (meaning) study cards with optional hint + example. */
function flashcardCards(items: AnyItem[]): any {
  const cards = items
    .map((it) => ({
      front: S(it.front || it.word || it.term),
      back: S(it.back || it.translation || it.meaning || it.definition),
      hint: S(it.hint || it.partOfSpeech || it.pos) || undefined,
      example: S(it.example || it.exampleSentence || it.sentence) || undefined,
    }))
    .filter((c) => c.front || c.back);
  return { task: "Study these words", cards };
}

/** mcq: "what does X mean" from word/translation pairs. */
function mcqVocab(items: AnyItem[]): any {
  const translations = items.map((i) => i.translation || i.word);
  return {
    rounds: items.map((it) => {
      const answer = S(it.translation || it.word);
      const prompt = S(it.word);
      return {
        sub: `What does “${prompt}” mean?`,
        prompt,
        options: optionSet(answer, distractorsFrom(translations, answer, 3)),
        answer,
        explain: S(it.explanation || it.explain || `“${prompt}” means “${answer}”.`),
      };
    }),
  };
}

function mcqSynonymAntonym(items: AnyItem[]): any {
  const rounds: any[] = [];
  for (const it of items) {
    const word = S(it.word);
    const syn = S(it.synonym);
    const ant = S(it.antonym);
    const dis = Array.isArray(it.distractors) ? it.distractors.map(S) : [];
    if (syn) {
      rounds.push({
        sub: `Pick the synonym of “${word}”`,
        prompt: word,
        options: optionSet(syn, [ant, ...dis]),
        answer: syn,
        explain: S(it.explanation || `“${syn}” means the same as “${word}”.`),
      });
    }
    if (ant) {
      rounds.push({
        sub: `Pick the opposite of “${word}”`,
        prompt: word,
        options: optionSet(ant, [syn, ...dis]),
        answer: ant,
        explain: S(it.explanation || `“${ant}” is the opposite of “${word}”.`),
      });
    }
  }
  return { rounds };
}

function mcqOddOneOut(items: AnyItem[]): any {
  return {
    rounds: items.map((it) => {
      const words = Array.isArray(it.words) ? it.words.map(S) : Array.isArray(it.groupWords) ? it.groupWords.map(S) : [];
      const odd = S(it.oddWord);
      return {
        sub: "Which word does NOT belong?",
        options: uniq(words),
        answer: odd,
        explain: it.category ? `“${odd}” doesn’t fit — the others are ${S(it.category)}.` : S(it.explanation || `“${odd}” is the odd one out.`),
        stack: true,
      };
    }),
  };
}

function mcqPictureToWord(items: AnyItem[]): any {
  const words = items.map((i) => i.word);
  return {
    rounds: items.map((it) => {
      const answer = S(it.word);
      const dis = Array.isArray(it.distractors) ? it.distractors.map(S) : distractorsFrom(words, answer, 3);
      // The mcq engine renders `image` as a large picture (emoji). We ask the AI for a
      // representative emoji; fall back to a neutral placeholder so the word is NEVER
      // revealed in the prompt (which would make the question trivial).
      const image = S(it.emoji) || S(it.image) || "🖼️";
      return {
        sub: "Which word matches the picture?",
        image,
        options: optionSet(answer, dis),
        answer,
        explain: S(it.explanation || `“${answer}” is represented in the image.`),
      };
    }),
  };
}

function mcqCollocation(items: AnyItem[]): any {
  const rounds: any[] = [];
  for (const it of items) {
    const base = S(it.baseWord || it.word);
    const correct = Array.isArray(it.correctPartners) ? it.correctPartners.map(S).filter(Boolean) : [];
    const wrong = Array.isArray(it.wrongPartners) ? it.wrongPartners.map(S) : [];
    for (const good of correct) {
      rounds.push({
        sub: `Which word goes with “${base}”?`,
        prompt: base,
        options: optionSet(good, wrong),
        answer: good,
        explain: S(it.explanation || `“${base} ${good}” is a natural pairing.`),
      });
    }
  }
  return { rounds };
}

function mcqWordInContext(items: AnyItem[]): any {
  return {
    rounds: items.map((it) => {
      const correct = S(it.correctSentence);
      const wrong = Array.isArray(it.incorrectSentences) ? it.incorrectSentences.map(S) : [];
      return {
        sub: `Which sentence uses “${S(it.word)}” correctly?`,
        options: optionSet(correct, wrong),
        answer: correct,
        explain: S(it.explanation || `“${correct}” uses “${S(it.word)}” correctly.`),
        stack: true,
      };
    }),
  };
}

function mcqMinimalPair(items: AnyItem[]): any {
  return {
    rounds: items.map((it) => {
      const a = S(it.wordA || it.word1 || it.word);
      const b = S(it.wordB || it.word2 || it.translation);
      return {
        sub: "Which word do you hear?",
        prompt: a,
        audioText: a,
        options: uniq([a, b]),
        answer: a,
        explain: S(it.explanation || `The spoken word was “${a}”.`),
      };
    }),
  };
}

function mcqSpeedRound(items: AnyItem[]): any {
  const words = items.map((i) => i.word);
  return {
    rounds: items.map((it) => {
      const answer = S(it.word);
      const dis = Array.isArray(it.distractors) ? it.distractors.map(S) : distractorsFrom(words, answer, 3);
      return {
        sub: "Quick — pick the word",
        prompt: answer,
        audioText: answer,
        options: optionSet(answer, dis),
        answer,
        explain: S(it.explanation || `The correct word is “${answer}”.`),
      };
    }),
  };
}

function mcqQuestions(items: AnyItem[], sub: string): any {
  return {
    rounds: items.map((q) => ({
      sub: S(q.sub) || sub,
      prompt: S(q.question || q.prompt),
      options: (Array.isArray(q.options) ? q.options.map(S) : []).filter(Boolean),
      answer: S(q.correctOption || q.correctAnswer || q.answer),
      explain: S(q.explanation || q.explain || "Review this question."),
      stack: true,
    })),
  };
}

// fillblank
function fbFillWord(items: AnyItem[], opts: { audio?: boolean } = {}): any {
  const words = items.map((i) => i.correctWord || i.answer || i.word);
  return {
    rounds: items.map((it) => {
      const answer = S(it.correctWord || it.answer || it.word);
      const text = S(it.sentenceWithBlank || it.sentence || it.text);
      const dis = Array.isArray(it.distractors)
        ? it.distractors.map(S)
        : Array.isArray(it.options)
          ? it.options.map(S).filter((o) => o !== answer)
          : distractorsFrom(words, answer, 3);
      const round: any = {
        task: S(it.task) || (opts.audio ? "Listen and choose the missing word" : "Choose the missing word"),
        text: text || `${answer} means ___`,
        options: optionSet(answer, dis),
        answer,
        explain: S(it.explanation || it.explain || `“${answer}” fits correctly into the sentence.`),
      };
      if (opts.audio) round.audioText = text.replace(/_{2,}/, answer);
      return round;
    }),
  };
}

function fbVerbConjugation(items: AnyItem[]): any {
  const rounds: any[] = [];
  for (const it of items) {
    const verb = S(it.verb);
    const tense = S(it.tense) || "Present";
    const forms: AnyItem[] = Array.isArray(it.forms)
      ? it.forms
      : it.forms && typeof it.forms === "object"
        ? Object.entries(it.forms).map(([pronoun, form]) => ({ pronoun, form }))
        : [];
    const allForms = forms.map((f) => S(f.form));
    for (const f of forms) {
      const answer = S(f.form);
      if (!answer) continue;
      rounds.push({
        task: `${verb} — ${tense}`,
        text: `${S(f.pronoun)} ___`,
        options: optionSet(answer, distractorsFrom(allForms, answer, 3)),
        answer,
        explain: S(f.explanation || it.explanation || `${verb} (${S(f.pronoun)}) in ${tense} is “${answer}”.`),
      });
    }
  }
  return { rounds };
}

function fbDialogue(items: AnyItem[]): any {
  const rounds: any[] = [];
  // Insert a ___ gap where the answer word sits (or append one), without using the
  // answer as a regex (so punctuation/regex chars in the answer are safe).
  const gap = (text: string, ans: string): string => {
    if (/_{2,}/.test(text)) return text;
    if (ans) {
      const at = text.toLowerCase().indexOf(ans.toLowerCase());
      if (at >= 0) return text.slice(0, at) + "___" + text.slice(at + ans.length);
    }
    return `${text} ___`.trim();
  };
  const fill = (text: string, ans: string): string => (/_{2,}/.test(text) ? text.replace(/_{2,}/, ans) : text);

  // Collect all available words to ensure we can always provide 4 distinct options
  const allWords = items.flatMap((it) => [
    ...(Array.isArray(it.blanks) ? it.blanks.map((b: any) => S(b.correctAnswer)) : []),
    ...(Array.isArray(it.blanks) ? it.blanks.flatMap((b: any) => (Array.isArray(b.distractors) ? b.distractors.map(S) : [])) : []),
    S(it.word),
    S(it.translation),
  ]).filter(Boolean);

  for (const it of items) {
    const scenario = S(it.scenario) || "Conversation practice";
    const lines: AnyItem[] = Array.isArray(it.lines) ? it.lines : [];
    let blanks: AnyItem[] = Array.isArray(it.blanks) ? it.blanks : [];
    if (!blanks.length) {
      blanks = lines
        .map((l, i) => (l.isBlank ? { lineIndex: i, correctAnswer: S(l.answer || l.text), distractors: [] } : null))
        .filter(Boolean) as AnyItem[];
    }
    // Map answers by line so earlier blanks read as complete context in later rounds.
    const answerByLine: Record<number, string> = {};
    for (const b of blanks) if (typeof b.lineIndex === "number") answerByLine[b.lineIndex] = S(b.correctAnswer);

    for (const b of blanks) {
      const li = typeof b.lineIndex === "number" ? b.lineIndex : lines.length - 1;
      const answer = S(b.correctAnswer);
      if (!answer) continue;
      // Show the conversation up to AND INCLUDING the current turn — no future reveal.
      const dialogue = lines.slice(0, li + 1).map((l, idx) => {
        const isYou = l.role != null ? S(l.role).toLowerCase() === "you" : idx === li;
        const raw = S(l.text);
        const line = idx === li ? gap(raw, answer) : answerByLine[idx] ? fill(raw, answerByLine[idx]) : raw;
        return { s: isYou ? "B" : "A", name: S(l.speaker) || (isYou ? "You" : "Them"), line };
      });
      const rawDis = Array.isArray(b.distractors) ? b.distractors.map(S) : Array.isArray(b.options) ? b.options.map(S) : [];
      const pool = distractorsFrom(allWords, answer, 3);
      const combinedDis = uniq([...rawDis, ...pool]);
      const opts = optionSet(answer, combinedDis, 4);
      rounds.push({
        task: scenario,
        dialogue,
        options: opts,
        answer,
        explain: S(b.explanation || it.explanation || `“${answer}” is the natural phrase in this dialogue.`),
      });
    }
  }
  return { rounds };
}

// texttask
function ttTransformation(items: AnyItem[]): any {
  return {
    rounds: items.map((it) => ({
      instruction: S(it.instruction) || "Transform the sentence",
      prompt: S(it.prompt || it.sentence || it.flawedSentence),
      answers: (Array.isArray(it.answers) ? it.answers.map(S) : [S(it.answer || it.correctSentence)]).filter(Boolean),
      explain: S(it.explanation || it.explain),
    })),
  };
}

function ttSentence(items: AnyItem[], mode: "dictation" | "listen" | "speak"): any {
  return {
    rounds: items.map((it) => {
      const sentence = S(it.sentence || it.correctSentence || it.text);
      const round: any = { answers: [sentence], explain: S(it.explanation || it.explain) };
      if (mode === "dictation") {
        round.instruction = "Listen and type what you hear";
        round.audioText = sentence;
      } else if (mode === "listen") {
        round.instruction = "Listen, then type the sentence";
        round.audioText = sentence;
      } else {
        round.instruction = "Read the sentence aloud, then type it";
        round.prompt = sentence;
      }
      return round;
    }),
  };
}

// tapword
function twErrorSpotting(items: AnyItem[]): any {
  return {
    rounds: items.map((it) => {
      const words = S(it.sentenceWithError).split(/\s+/).filter(Boolean);
      const wrong = S(it.wrongPart);
      const wrongFirst = wrong.split(/\s+/)[0] || wrong;
      let errorIndex = words.findIndex((w) => w.replace(/[.,!?;:]/g, "").toLowerCase() === wrongFirst.toLowerCase());
      if (errorIndex < 0) errorIndex = words.findIndex((w) => w.toLowerCase().includes(wrongFirst.toLowerCase()));
      if (errorIndex < 0) errorIndex = 0;
      const correction = S(it.correction);
      return {
        words,
        errorIndex,
        corrections: uniq([correction, wrong]),
        correction,
        explain: S(it.ruleExplanation || it.explanation),
      };
    }),
  };
}

// order
function orderScramble(items: AnyItem[]): any {
  return {
    mode: "letters",
    rounds: items.map((it) => ({
      hint: S(it.hint) || "Unscramble the letters",
      answer: S(it.word || it.answer),
      explain: S(it.explanation || it.explain || `The word is “${S(it.word || it.answer)}”.`),
    })),
  };
}

function orderSentence(items: AnyItem[]): any {
  return {
    mode: "words",
    rounds: items.map((it) => ({
      hint: S(it.hint) || "Put the words in order",
      answer: S(it.correctSentence || it.sentence || it.answer),
      explain: S(it.explanation || it.explain),
    })),
  };
}

// match
function matchPairs(items: AnyItem[], task: string, toPair: (it: AnyItem) => [string, string][]): any {
  const pairs: [string, string][] = [];
  for (const it of items) pairs.push(...toPair(it));
  const clean = pairs.filter(([a, b]) => S(a) && S(b));
  // chunk into rounds of up to 5 pairs (engine renders one round at a time)
  const rounds: any[] = [];
  for (let i = 0; i < clean.length; i += 5) rounds.push({ pairs: clean.slice(i, i + 5) });
  return { task, rounds: rounds.length ? rounds : [{ pairs: [] }] };
}

// sort
function sortCategories(items: AnyItem[]): any {
  const categories = uniq(items.map((c) => c.category || c.name || c.cat));
  const sortItems = items.flatMap((c) =>
    (Array.isArray(c.words) ? c.words : Array.isArray(c.items) ? c.items : []).map((w: any) => ({
      word: S(typeof w === "object" ? w.word : w),
      cat: S(c.category || c.name || c.cat),
    }))
  );
  return { rounds: [{ categories, items: sortItems }] };
}

// memory
function memoryPairs(items: AnyItem[]): any {
  const pairs = items.map((it) => [S(it.word), S(it.translation || it.word)]).filter(([a, b]) => a && b).slice(0, 6);
  const defs: Record<string, string> = {};
  for (const it of items.slice(0, 6)) {
    const ex = S(it.exampleSentence);
    if (ex) defs[S(it.word)] = ex;
  }
  return { pairs, defs };
}

// writing
function writingTask(items: AnyItem[], mode: "story" | "rubric" | "rewrite"): any {
  const first = items[0] || {};
  if (mode === "rewrite") {
    const sentences = items
      .map((it) => {
        const t = S(it.sentenceWithBlank || it.sentence);
        const w = S(it.correctWord);
        return w && /_{2,}/.test(t) ? t.replace(/_{2,}/, w) : t;
      })
      .filter(Boolean);
    return {
      prompt: `Rewrite each sentence to make it clearer, more correct, or more descriptive:\n\n${sentences.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
      rules: [
        { op: "minWords", a: String(Math.max(20, sentences.length * 8)) },
        { op: "minSentences", a: String(Math.max(2, sentences.length)) },
      ],
      teacherReview: true,
    };
  }
  const prompt = S(first.prompt || first.writingPrompt) || "Write a short paragraph.";
  const wordBank = Array.isArray(first.wordBank) ? first.wordBank.map(S).filter(Boolean) : [];
  const rules: any[] = [{ op: "minWords", a: mode === "story" ? "40" : "30" }, { op: "minSentences", a: "3" }];
  if (wordBank.length) rules.push({ op: "includes", a: wordBank.join(", "), b: String(Math.min(3, wordBank.length)) });
  const data: any = { prompt, rules, teacherReview: mode === "rubric" };
  if (wordBank.length) data.wordBank = wordBank;
  if (S(first.starter)) data.starter = S(first.starter);
  return data;
}

// speaking
function speakingRounds(items: AnyItem[]): any {
  return {
    rounds: items.map((it) => {
      const mode = ["gap", "repeat", "read", "roleplay", "describe"].includes(S(it.mode)) ? S(it.mode) : "repeat";
      const round: any = { mode };
      if (S(it.task)) round.task = S(it.task);
      if (S(it.display)) round.display = S(it.display);
      if (S(it.audioText)) round.audioText = S(it.audioText);
      if (S(it.target)) round.target = S(it.target);
      if (Array.isArray(it.keywords) && it.keywords.length) round.keywords = it.keywords.map(S);
      if (S(it.image)) round.image = S(it.image);
      if (S(it.note)) round.note = S(it.note);
      // sensible defaults so every round is playable
      if (!round.task) round.task = mode === "repeat" ? "Listen, then repeat" : mode === "read" ? "Read aloud" : "Speak";
      if ((mode === "repeat") && !round.audioText && round.display) round.audioText = round.display;
      if (!round.target && (round.display || round.audioText)) round.target = round.display || round.audioText;
      return round;
    }),
  };
}

// SPEAK_FILL_WORD → speaking "gap": hear the full sentence, then SAY the missing word.
// AI item shape: { sentenceWithBlank, correctWord }. Graded by similarity(target, speech).
function speakGap(items: AnyItem[]): any {
  return {
    rounds: items.map((it) => {
      const withBlank = S(it.sentenceWithBlank || it.sentence || it.text);
      const word = S(it.correctWord || it.answer);
      const full = /_{2,}/.test(withBlank) ? withBlank.replace(/_{2,}/, word) : withBlank;
      return {
        mode: "gap",
        task: "Listen, then say the missing word",
        display: withBlank,
        audioText: full,
        target: word,
      };
    }),
  };
}

// SPEAK_FILL_SENTENCE → speaking "repeat": hear the sentence, then SAY the whole thing back.
// AI item shape: { sentence }. Graded by similarity(target, speech).
function speakSentence(items: AnyItem[]): any {
  return {
    rounds: items.map((it) => {
      const sentence = S(it.sentence || it.correctSentence || it.text);
      return {
        mode: "repeat",
        task: "Listen, then say the whole sentence",
        display: sentence,
        audioText: sentence,
        target: sentence,
      };
    }),
  };
}

// ── main dispatcher ───────────────────────────────────────────
/**
 * Convert AI generator output into engine-ready `data` for a given game type.
 * The result is safe to pass to <SchemaBuilder initial={...}/> and to store in
 * `settings.data` for `buildFolderGame` passthrough.
 */
export function aiToEngineData(type: string, aiData: any): Record<string, any> {
  const items = itemsOf(aiData);
  if (!items.length) {
    // Some types carry data at the top level (crossword words, verb forms, story).
    if (aiData && (Array.isArray(aiData.words) || Array.isArray(aiData.forms) || aiData.prompt)) {
      // fall through with a single synthetic item
    } else {
      return {};
    }
  }

  switch (type) {
    // ── vocabulary ──
    case "FLASHCARD":
    case "FLASHCARD_3D":
      return flashcardCards(items);
    case "SYNONYM_ANTONYM":
      return mcqSynonymAntonym(items);
    case "ODD_ONE_OUT":
      return mcqOddOneOut(items);
    case "PICTURE_TO_WORD":
      return mcqPictureToWord(items);
    case "COLLOCATION_BUILDER":
      return mcqCollocation(items);
    case "WORD_IN_CONTEXT":
      return mcqWordInContext(items);
    case "MINIMAL_PAIR":
      return mcqMinimalPair(items);
    case "SPEED_ROUND":
      return mcqSpeedRound(items);
    case "MEMORY":
      return memoryPairs(items);
    case "WORD_SCRAMBLE":
      return orderScramble(items);
    case "CROSSWORD": {
      const words = items.length ? items : Array.isArray(aiData?.words) ? aiData.words : [];
      return { entries: layoutCrossword(words) };
    }
    case "CATEGORY_SORT":
      return sortCategories(items);
    case "WORD_MEANING_MATCH":
      return matchPairs(items, "Match each word to its meaning", (it) => [[S(it.word), S(it.translation)]]);

    // ── grammar ──
    case "QUIZ":
      return mcqQuestions(items, "Answer the question");
    case "MULTIPLE_CHOICE_GRAMMAR":
      return mcqQuestions(items, "Choose the correct answer");
    case "ERROR_SPOTTING":
      return twErrorSpotting(items);
    case "VERB_CONJUGATION":
      return fbVerbConjugation(items.length ? items : [aiData]);
    case "SENTENCE_BUILDER":
      return orderSentence(items);
    case "TRANSFORMATION":
      return ttTransformation(items);
    case "DRAG_DROP":
      return matchPairs(items, "Match each item to its category", (it) => {
        const map = it.correctMapping && typeof it.correctMapping === "object" ? it.correctMapping : {};
        return Object.entries(map).map(([k, v]) => [S(k), S(v)] as [string, string]);
      });
    case "FILL_BLANK_GRAMMAR":
      return fbFillWord(items);

    // ── listening ──
    case "FILL_GAP_WORD":
      return fbFillWord(items);
    case "LISTEN_FILL_WORD":
      return fbFillWord(items, { audio: true });
    case "DICTATION":
      return ttSentence(items, "dictation");
    case "LISTEN_FILL_SENTENCE":
      return ttSentence(items, "listen");
    case "SITUATION_DIALOGUE_FILL":
      return fbDialogue(items);

    // ── speaking ──
    case "SPEAKING":
      return speakingRounds(items);
    case "SPEAK_FILL_WORD":
      return speakGap(items);
    case "SPEAK_FILL_SENTENCE":
      return speakSentence(items);

    // ── writing ──
    case "STORY":
      return writingTask(items.length ? items : [aiData], "story");
    case "WRITING_RUBRIC":
      return writingTask(items.length ? items : [aiData], "rubric");
    case "FILL_BLANK":
      return writingTask(items, "rewrite");

    default:
      break;
  }

  // Fallback by engine — best effort so an unmapped type still produces something.
  switch (folderEngineForType(type)) {
    case "flashcard":
      return flashcardCards(items);
    case "mcq":
      return mcqVocab(items);
    case "fillblank":
      return fbFillWord(items);
    case "texttask":
      return ttTransformation(items);
    case "tapword":
      return twErrorSpotting(items);
    case "order":
      return orderSentence(items);
    case "match":
      return matchPairs(items, "Match the pairs", (it) => [[S(it.word), S(it.translation)]]);
    case "sort":
      return sortCategories(items);
    case "memory":
      return memoryPairs(items);
    case "crossword":
      return { entries: layoutCrossword(items) };
    case "writing":
      return writingTask(items, "rubric");
    case "speaking":
      return speakingRounds(items);
    default:
      return {};
  }
}
