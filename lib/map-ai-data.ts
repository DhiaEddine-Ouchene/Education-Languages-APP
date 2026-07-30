// ── Map AI Response Data to Builder Data ──
// Takes raw output from AI generation (from lib/generate-game.ts)
// and maps it to the exact data structure expected by each builder component and API endpoint.

export function mapAiResponseToBuilderData(gameType: string, aiData: any): Record<string, unknown> {
  if (!aiData) return {};

  // 1. SYNONYM_ANTONYM
  if (gameType === "SYNONYM_ANTONYM") {
    const rawItems = Array.isArray(aiData.items) ? aiData.items : (Array.isArray(aiData) ? aiData : []);
    const synonymItems = rawItems.map((item: any, i: number) => ({
      id: item.id || `syn-${i}-${Math.random().toString(36).slice(2, 6)}`,
      word: item.word || item.word_target || "",
      synonym: item.synonym || item.word_native || item.translation || "",
      antonym: item.antonym || "",
    }));
    return { synonymItems };
  }

  // 2. CROSSWORD
  if (gameType === "CROSSWORD") {
    const rawWords = Array.isArray(aiData.words) ? aiData.words : (Array.isArray(aiData.items) ? aiData.items : []);
    const words = rawWords.map((w: any, i: number) => ({
      id: w.id || `cw-${i}-${Math.random().toString(36).slice(2, 6)}`,
      word: (w.word || w.word_target || "").toUpperCase(),
      clue: w.clue || w.clue_target || "",
      direction: w.direction === "down" ? "down" : "across",
      row: typeof w.row === "number" ? w.row : 0,
      col: typeof w.col === "number" ? w.col : 0,
    }));
    return { gridSize: aiData.gridSize || 8, words };
  }

  // 3. VERB_CONJUGATION
  if (gameType === "VERB_CONJUGATION") {
    const forms: Record<string, string> = {};
    if (Array.isArray(aiData.forms)) {
      aiData.forms.forEach((f: any) => {
        if (f.pronoun) forms[f.pronoun] = f.form_target || f.form || "";
      });
    } else if (aiData.forms && typeof aiData.forms === "object") {
      Object.entries(aiData.forms).forEach(([k, v]) => {
        forms[k] = String(v);
      });
    }
    return {
      verb: aiData.verb || "",
      tense: aiData.tense || "Present",
      forms,
    };
  }

  // 4. STORY
  if (gameType === "STORY") {
    const firstItem = Array.isArray(aiData.items) && aiData.items.length > 0 ? aiData.items[0] : aiData;
    return {
      prompt: firstItem.prompt || firstItem.prompt_target || "",
      template: firstItem.template || firstItem.template_target || "",
      wordBank: Array.isArray(firstItem.wordBank) ? firstItem.wordBank : [],
    };
  }

  // 5. ODD_ONE_OUT
  if (gameType === "ODD_ONE_OUT") {
    const rawItems = Array.isArray(aiData.items) ? aiData.items : (Array.isArray(aiData) ? aiData : []);
    const oddOneOutItems = rawItems.map((item: any, i: number) => ({
      id: item.id || `odd-${i}-${Math.random().toString(36).slice(2, 6)}`,
      groupWords: Array.isArray(item.groupWords) ? item.groupWords : [],
      oddWord: item.oddWord || "",
      category: item.categoryName_target || item.categoryName || "",
    }));
    return { oddOneOutItems };
  }

  // 6. QUIZ_BUILDER_TYPES ("QUIZ", "MULTIPLE_CHOICE_GRAMMAR", "ERROR_SPOTTING", "WORD_IN_CONTEXT")
  const QUIZ_TYPES = ["QUIZ", "MULTIPLE_CHOICE_GRAMMAR", "ERROR_SPOTTING", "WORD_IN_CONTEXT"];
  if (QUIZ_TYPES.includes(gameType)) {
    const rawItems = Array.isArray(aiData.items) ? aiData.items : (Array.isArray(aiData) ? aiData : []);
    const questions = rawItems.map((q: any, i: number) => {
      let prompt = q.prompt || q.prompt_target || "";
      let correctAnswer = q.correctAnswer || "";
      let explanation = q.explanation || q.explanation_target || "";
      let options: string[] = [];

      if (gameType === "ERROR_SPOTTING") {
        prompt = q.sentenceWithError_target || q.sentenceWithError || prompt;
        correctAnswer = q.correction || correctAnswer;
        explanation = q.ruleExplanation_target || q.ruleExplanation || explanation;
        options = [q.correction || "", q.wrongPart || ""].filter(Boolean);
      } else if (gameType === "WORD_IN_CONTEXT") {
        prompt = q.word_target ? `Which sentence uses "${q.word_target}" correctly?` : (q.word ? `Which sentence uses "${q.word}" correctly?` : prompt);
        correctAnswer = q.correctSentence || correctAnswer;
        options = [q.correctSentence || "", ...(Array.isArray(q.incorrectSentences) ? q.incorrectSentences : [])].filter(Boolean);
      } else {
        if (Array.isArray(q.options)) {
          options = q.options.map((o: any) => typeof o === "string" ? o : (o.option_target || o.option || ""));
        }
      }

      // Pad options to 4 if needed
      while (options.length < 4) options.push("");

      return {
        id: q.id || `q-${i}-${Math.random().toString(36).slice(2, 6)}`,
        prompt,
        options,
        correctAnswer,
        explanation,
      };
    });
    return { questions, optionsCount: aiData.optionsCount || 4 };
  }

  // 6. SENTENCE_FILL_BUILDER_TYPES
  const SENTENCE_FILL_TYPES = [
    "FILL_GAP_WORD", "FILL_BLANK", "FILL_BLANK_GRAMMAR",
    "DRAG_DROP", "SITUATION_DIALOGUE_FILL", "SENTENCE_BUILDER",
    "LISTEN_FILL_WORD", "LISTEN_FILL_SENTENCE",
    "SPEAK_FILL_WORD", "SPEAK_FILL_SENTENCE",
    "DICTATION",
  ];
  if (SENTENCE_FILL_TYPES.includes(gameType)) {
    const rawItems = Array.isArray(aiData.items) ? aiData.items : (Array.isArray(aiData) ? aiData : []);
    let sentenceItems: any[] = [];

    if (gameType === "DRAG_DROP" && rawItems.length > 0 && rawItems[0].items && rawItems[0].categories) {
      // Unpack Drag & Drop structure
      const dd = rawItems[0];
      const categoryMap = new Map<string, string>();
      (dd.categories || []).forEach((c: any) => categoryMap.set(c.categoryId, c.categoryLabel_target || c.categoryLabel || ""));
      
      const itemMap = new Map<string, string>();
      (dd.items || []).forEach((it: any) => itemMap.set(it.itemId, it.itemText_target || it.itemText || ""));

      (dd.placements || []).forEach((p: any, i: number) => {
        const itemText = itemMap.get(p.itemId) || "";
        const catLabel = categoryMap.get(p.categoryId) || "";
        sentenceItems.push({
          id: `sf-${i}`,
          sentence: `${itemText} → ___`,
          correctAnswer: catLabel,
          options: Array.from(categoryMap.values()),
        });
      });
    } else if (gameType === "SITUATION_DIALOGUE_FILL" && rawItems.length > 0 && rawItems[0].lines) {
      // Unpack Dialogue structure (supports old "text_target"/"options" and new "text"/"distractors" formats)
      rawItems.forEach((dialogue: any) => {
        (dialogue.lines || []).forEach((line: any, i: number) => {
          const lineText = line.text || line.text_target || "";
          if (line.blanks && line.blanks.length > 0) {
            line.blanks.forEach((b: any, bi: number) => {
              const distractors = b.distractors || b.options || [];
              sentenceItems.push({
                id: `sf-${i}-${bi}`,
                sentence: `${line.speaker || "A"}: ${lineText}`,
                correctAnswer: b.correctAnswer || "",
                options: Array.isArray(distractors) ? distractors.slice(0, 3) : [],
              });
            });
          } else if (line.isBlank && !line.blanks) {
            // Line with isBlank=true but no blanks array — use line text as answer
            sentenceItems.push({
              id: `sf-${i}`,
              sentence: `${line.speaker || "A"}: ${lineText}`,
              correctAnswer: lineText,
              options: [],
            });
          }
        });
      });
    } else {
      sentenceItems = rawItems.map((item: any, i: number) => {
        let sentence = item.sentence || item.sentence_target || "";
        let correctAnswer = item.correctAnswer || "";
        let distractors: string[] = [];

        if (gameType === "FILL_BLANK_GRAMMAR") {
          correctAnswer = item.correctConjugation || correctAnswer;
          if (item.baseVerb) distractors.push(item.baseVerb);
        } else if (gameType === "FILL_BLANK") {
          sentence = item.flawedSentence_target || item.flawedSentence || sentence;
          correctAnswer = item.guideline_target || item.guideline || correctAnswer || "Improve this sentence";
        } else if (["DICTATION", "SENTENCE_BUILDER", "LISTEN_FILL_SENTENCE", "SPEAK_FILL_SENTENCE"].includes(gameType)) {
          if (!correctAnswer) correctAnswer = sentence;
        }

        if (Array.isArray(item.options) && item.options.length > 0) {
          distractors = item.options.filter((o: string) => o.toLowerCase() !== correctAnswer.toLowerCase());
        }
        while (distractors.length < 3) distractors.push("");
        distractors = distractors.slice(0, 3);

        return {
          id: item.id || `sf-${i}-${Math.random().toString(36).slice(2, 6)}`,
          sentence,
          correctAnswer,
          options: distractors,
        };
      });
    }

    return { sentenceItems };
  }

  // 7. PAIR_BUILDER_TYPES (DEFAULT)
  const rawItems = Array.isArray(aiData.items) ? aiData.items : (Array.isArray(aiData) ? aiData : []);
  const pairs = rawItems.map((item: any, i: number) => {
    let word = item.word || item.word_target || "";
    let translation = item.translation || item.word_native || "";
    let exampleSentence = item.exampleSentence || item.exampleSentence_target || "";

    if (gameType === "COLLOCATION_BUILDER") {
      const baseWord = item.baseWord_target || item.baseWord || word;
      word = baseWord;
      // Show correct partners as comma-separated for compact display
      const partners = Array.isArray(item.correctPartners) ? item.correctPartners : [];
      translation = partners.length > 0 ? partners.join(", ") : translation;
      // Make wrong partners available via exampleSentence for preview
      const wrong = Array.isArray(item.wrongPartners) ? item.wrongPartners : [];
      if (wrong.length > 0) {
        exampleSentence = `Wrong: ${wrong.join(", ")}`;
      }
    } else if (gameType === "MINIMAL_PAIR") {
      word = item.word1 || word;
      translation = item.word2 || translation;
      exampleSentence = item.phonemeContrast || exampleSentence;
    } else if (gameType === "PICTURE_TO_WORD") {
      if (item.imageSearchTerm) exampleSentence = `Image search: ${item.imageSearchTerm}`;
    }

    return {
      id: item.id || `pair-${i}-${Math.random().toString(36).slice(2, 6)}`,
      word,
      translation,
      exampleSentence,
    };
  });

  return { pairs };
}
