// ── Per-Game-Type Guides ──
// Rich explanations shown in the Game Preview modal's "Game Guide" tab.
// Each guide explains how the game works, what to prepare, and how to use it.

export type GameGuide = {
  summary: string;
  howToPlay: string[];
  teacherPrep: string;
  classroomUse: string;
  scoring: string;
  difficultyLabel: string;
  timeEstimate: string;
};

export const GAME_GUIDES: Record<string, GameGuide> = {
  // ─── FLASHCARD ───
  FLASHCARD: {
    summary: "Students see a word (or image) on a card and try to recall its meaning before flipping to reveal the translation. A simple, fast-paced recall drill.",
    howToPlay: [
      "A card appears showing a word in the target language",
      "Student thinks about what it means — tries to recall the translation",
      "Taps the card to flip it and reveal the answer",
      "Marks 'Know it' or 'Don't know it' to track progress",
      "Known cards appear less often; unknown ones repeat for reinforcement"
    ],
    teacherPrep: "Provide a list of word-translation pairs. For better results, include an example sentence per word so students see the word in context even before flipping.",
    classroomUse: "Ideal as a warm-up (5 min) or as an independent study station. Students can run through a deck in pairs — one quizzes, the other answers, then they swap.",
    scoring: "Self-assessed: students mark their own recall. The game tracks known vs unknown words per session and can show a percentage score at the end.",
    difficultyLabel: "Beginner-friendly",
    timeEstimate: "5-10 min per 10 words"
  },

  // ─── SYNONYM_ANTONYM ───
  SYNONYM_ANTONYM: {
    summary: "Students match a target word to its synonym (same meaning) or antonym (opposite meaning). Builds vocabulary depth and word relationship awareness.",
    howToPlay: [
      "A target word is shown (e.g. 'happy')",
      "The student must pick between synonym or antonym mode",
      "Options appear — some are synonyms, some are antonyms, some are unrelated",
      "Student selects the correct match for the chosen mode",
      "Each correct answer earns points; wrong answers show the correct pairing"
    ],
    teacherPrep: "Provide words along with their synonyms AND antonyms. The AI can generate these automatically when you enter a topic, or you can add them manually in the builder.",
    classroomUse: "Great for vocabulary expansion lessons. Use after introducing new words — students deepen understanding by connecting words to related terms.",
    scoring: "Points per correct match. Bonus points for speed. The game shows a final accuracy percentage and highlights which word relationships need more practice.",
    difficultyLabel: "Intermediate",
    timeEstimate: "10-12 min per 10 words"
  },

  // ─── FILL_GAP_WORD ───
  FILL_GAP_WORD: {
    summary: "A sentence is shown with a missing word. Students choose the correct word from multiple options to complete the sentence. Tests contextual understanding.",
    howToPlay: [
      "A sentence appears with a blank (e.g. 'I eat an ___ every morning.')",
      "Below the sentence, 3-4 word options are displayed",
      "Student taps the correct word to fill the gap",
      "Immediate feedback: correct turns green, wrong turns red and shows the right answer",
      "Progresses to the next sentence automatically"
    ],
    teacherPrep: "Provide sentences with one word removed, plus the correct word and 2-3 distractors (wrong but plausible words). The AI can generate these from any topic.",
    classroomUse: "Excellent for reading comprehension and contextual vocabulary. Use after introducing new vocabulary to check understanding in context.",
    scoring: "Points per correct fill. Streak bonus for consecutive correct answers. Final score shows how many blanks were filled correctly out of total.",
    difficultyLabel: "Beginner-Intermediate",
    timeEstimate: "8-10 min per 10 sentences"
  },

  // ─── WORD_MEANING_MATCH ───
  WORD_MEANING_MATCH: {
    summary: "A two-column matching game: words on the left, definitions or translations on the right. Students draw lines or tap pairs to connect them.",
    howToPlay: [
      "Left column shows target-language words",
      "Right column shows shuffled translations or definitions",
      "Student taps one item from each column to create a match",
      "Correct pairs lock together with a visible line/connector",
      "All pairs must be matched to complete the round"
    ],
    teacherPrep: "The game uses word-translation pairs from your vocabulary set. Optionally, write short definitions instead of translations for a harder challenge.",
    classroomUse: "Perfect for review sessions before a quiz. Students work individually or in pairs racing against the clock to match all pairs.",
    scoring: "Score based on time to complete and number of incorrect attempts. Faster completions with fewer mistakes earn higher scores.",
    difficultyLabel: "Beginner-friendly",
    timeEstimate: "8-10 min per 8-10 words"
  },

  // ─── SITUATION_DIALOGUE_FILL ───
  SITUATION_DIALOGUE_FILL: {
    summary: "Students complete a real-life conversation by filling in missing words. Builds practical conversational fluency in context.",
    howToPlay: [
      "A dialogue between two or more people is shown (e.g. at a restaurant, in a shop)",
      "Some words or phrases are replaced with blanks",
      "Students choose the correct word from options to complete each line",
      "The dialogue progresses naturally — each answer reveals the next part",
      "After completion, the full correct dialogue is displayed"
    ],
    teacherPrep: "Create a short dialogue (4-8 lines) with a real-world scenario. Remove key vocabulary words. The AI can generate situational dialogues from a topic description.",
    classroomUse: "Excellent for practicing practical language skills. Use before a speaking activity — students learn the dialogue structure, then practice it aloud.",
    scoring: "Points per correct fill. Bonus for completing the dialogue without any mistakes. The final screen shows the complete corrected dialogue.",
    difficultyLabel: "Intermediate",
    timeEstimate: "12-15 min per dialogue"
  },

  // ─── WORD_IN_CONTEXT ───
  WORD_IN_CONTEXT: {
    summary: "Students see a vocabulary word and must choose the sentence where it fits correctly. Tests deeper understanding of word usage.",
    howToPlay: [
      "A vocabulary word is displayed (e.g. 'apple')",
      "Multiple sentences are shown — only one uses the word correctly",
      "Student selects the sentence where the word fits naturally",
      "Feedback explains why the correct sentence works and others don't",
      "Next word appears with new sentence options"
    ],
    teacherPrep: "For each vocabulary word, write 3-4 sentences — one correct usage and 2-3 incorrect/illogical uses. The AI can generate these from your word list.",
    classroomUse: "Use after initial vocabulary introduction to check if students truly understand word meanings — not just translations but actual usage.",
    scoring: "Points per correct selection. Progress bar shows how many words mastered. End screen shows words that need review.",
    difficultyLabel: "Intermediate-Advanced",
    timeEstimate: "10 min per 8-10 words"
  },

  // ─── WORD_SCRAMBLE ───
  WORD_SCRAMBLE: {
    summary: "Letters of a word are jumbled. Students drag or tap letters into the correct order to form the vocabulary word. Great for spelling practice.",
    howToPlay: [
      "A word's letters appear scrambled (e.g. 'P L E A P' for 'APPLE')",
      "A hint may be shown — the translation or a picture",
      "Student taps letters in sequence or drags them into position",
      "Each correctly placed letter locks in place",
      "When all letters are correct, the word is complete and the next one appears"
    ],
    teacherPrep: "Simply provide a word list — the game automatically scrambles the letters. Add example sentences as optional hints for struggling students.",
    classroomUse: "Fun spelling warm-up or brain break. Students enjoy the puzzle-like challenge. Works well as a competitive game — who can unscramble fastest?",
    scoring: "Score based on speed and number of letter attempts. Fewer wrong placements and faster completion = higher score.",
    difficultyLabel: "Beginner-friendly",
    timeEstimate: "5-8 min per 8-10 words"
  },

  // ─── ODD_ONE_OUT ───
  ODD_ONE_OUT: {
    summary: "A group of words is shown. Students must identify which word doesn't belong. Develops categorization and critical thinking skills.",
    howToPlay: [
      "4-5 words are displayed together (e.g. 'apple, banana, carrot, grape')",
      "Student must identify the word that doesn't belong with the others",
      "Tap the odd word to select it",
      "If correct: explanation shows why it's different (e.g. 'carrot is a vegetable, the rest are fruits')",
      "If wrong: a helpful hint points to the category"
    ],
    teacherPrep: "Create groups of 4-5 words where 3-4 share a category and one doesn't. The AI can generate these from your vocabulary sets.",
    classroomUse: "Great for critical thinking and categorization skills. Use as a warm-up discussion starter — ask students to explain WHY it's the odd one.",
    scoring: "Points per correct identification. Bonus for speed. The game tracks which categories (e.g. fruits vs vegetables) need more practice.",
    difficultyLabel: "Beginner-Intermediate",
    timeEstimate: "5-8 min per 10 rounds"
  },

  // ─── CROSSWORD ───
  CROSSWORD: {
    summary: "A classic crossword puzzle where clues are vocabulary definitions or translations. Students type letters into the grid to form words.",
    howToPlay: [
      "A grid is shown with numbered cells for each word",
      "Clues are listed: Across (horizontal) and Down (vertical)",
      "Tap a clue to highlight its cells in the grid",
      "Type letters into the highlighted cells",
      "Words intersect — already-placed letters help solve other words",
      "The grid fills gradually as words are completed"
    ],
    teacherPrep: "Define grid size (6x6 to 12x12) and provide words with clues. Position words so they intersect at shared letters. The AI can auto-generate crossword layouts.",
    classroomUse: "Excellent for review sessions or as a quiet independent activity. Students can work in pairs — one reads clues, the other fills the grid.",
    scoring: "Score based on correctly filled words and time to complete. Hints used reduce the potential score. Bonus for solving without any hints.",
    difficultyLabel: "Intermediate-Advanced",
    timeEstimate: "15-20 min per puzzle"
  },

  // ─── COLLOCATION_BUILDER ───
  COLLOCATION_BUILDER: {
    summary: "Students match words that naturally go together (collocations). Builds natural-sounding language skills by teaching which words pair with which.",
    howToPlay: [
      "A base word is shown (e.g. 'make')",
      "Several possible word partners are shown (e.g. 'a decision', 'a cake', 'homework')",
      "Student selects which words correctly collocate with the base",
      "Correct pairings are highlighted green, wrong ones in red",
      "The game explains why certain words pair together naturally"
    ],
    teacherPrep: "Provide common collocation pairs from your lesson content. Example: make + decision, take + break, do + homework. The AI can extract collocations from any text.",
    classroomUse: "Perfect for intermediate learners who need to sound more natural. Use before a writing task so students have ready-made word combinations.",
    scoring: "Points per correct match. The game highlights which collocations are most useful for the student's level.",
    difficultyLabel: "Intermediate",
    timeEstimate: "10-12 min per 10 pairs"
  },

  // ─── FLASHCARD_3D ───
  FLASHCARD_3D: {
    summary: "Cards float in a 3D space. Students tap to flip them and match words with their translations. A visually engaging memory challenge.",
    howToPlay: [
      "Cards appear arranged in a 3D layout with subtle rotation/depth",
      "Each card shows either a word or its translation",
      "Student taps a card to flip it and see what's on the other side",
      "Find matching word-translation pairs by flipping two cards per turn",
      "Matched pairs disappear; the goal is to clear all cards"
    ],
    teacherPrep: "Same as standard flashcards — provide word-translation pairs. The 3D effect is visual only and doesn't change the content needed.",
    classroomUse: "Use as a fun alternative to standard flashcards. The 3D visual style makes it feel game-like, great for motivating reluctant learners.",
    scoring: "Score based on number of flips (fewer = better) and time. Combo streak for consecutive matches. Final score with star rating (1-3 stars).",
    difficultyLabel: "Beginner-friendly",
    timeEstimate: "8-10 min per 6-8 pairs"
  },

  // ─── PICTURE_TO_WORD ───
  PICTURE_TO_WORD: {
    summary: "An image is displayed. Students select the correct vocabulary word from multiple choices. Perfect for visual learners and young students.",
    howToPlay: [
      "An image (or icon placeholder) appears on screen",
      "Below the image, 3-4 word options are shown",
      "Student taps the word that matches the image",
      "Correct answer: green confirmation + next image appears",
      "Wrong answer: the correct word is highlighted for learning"
    ],
    teacherPrep: "Provide images for each vocabulary word. If images aren't available, the game shows a descriptive icon placeholder. Words alone still work.",
    classroomUse: "Ideal for young learners or beginners who benefit from visual association. Use for introducing new vocabulary — image + word creates a strong memory link.",
    scoring: "Points per correct match. Speed bonus. End screen shows all words with their images for reinforcement.",
    difficultyLabel: "Beginner-friendly",
    timeEstimate: "5-8 min per 10 words"
  },

  // ─── SENTENCE_BUILDER ───
  SENTENCE_BUILDER: {
    summary: "Words are scrambled. Students drag them into the correct order to form a proper sentence. Teaches syntax and word order.",
    howToPlay: [
      "A set of words appears in random order (e.g. 'to / go / I / school / every / day')",
      "Student drags words into the correct sequence",
      "A target area shows where to place each word",
      "When all words are in position, the student taps 'Check'",
      "Correct sentences are highlighted; errors show the right order"
    ],
    teacherPrep: "Write complete sentences, then the game automatically scrambles the words. Use sentences from your lesson content for relevance.",
    classroomUse: "Excellent for teaching sentence structure and word order. Use after introducing a new grammar point — students practice by building correct sentences.",
    scoring: "Points per correctly ordered sentence. Speed bonus. The game tracks common word-order mistakes for targeted review.",
    difficultyLabel: "Intermediate",
    timeEstimate: "10 min per 8-10 sentences"
  },

  // ─── ERROR_SPOTTING ───
  ERROR_SPOTTING: {
    summary: "A sentence with a grammatical error is shown. Students must identify and fix the error. Tests active grammar knowledge.",
    howToPlay: [
      "A sentence appears with a grammar mistake (e.g. 'He go to school yesterday.')",
      "Student must tap the incorrect word or area",
      "Then type or select the correction",
      "Feedback explains the grammar rule behind the correction",
      "Progress to the next sentence"
    ],
    teacherPrep: "Write sentences with one deliberate grammar error each. Include the correction and a brief rule explanation. The AI can generate error-spotting sentences from any topic.",
    classroomUse: "Perfect for grammar review sessions. Use after teaching a grammar rule — students apply their knowledge by detecting real errors.",
    scoring: "Points per correctly spotted and corrected error. Bonus for identifying the error quickly. End summary shows which grammar rules need review.",
    difficultyLabel: "Intermediate-Advanced",
    timeEstimate: "10-12 min per 10 sentences"
  },

  // ─── FILL_BLANK_GRAMMAR ───
  FILL_BLANK_GRAMMAR: {
    summary: "A sentence with a missing grammatical form. Students type the correct word in the right tense or form. Focuses on grammar accuracy.",
    howToPlay: [
      "A sentence is shown with a grammatical blank (e.g. 'She ___ (play) tennis every Sunday.')",
      "The base form of the verb is shown in parentheses",
      "Student types the correct conjugated form ('plays')",
      "Correct: confirmation with the full correct sentence",
      "Wrong: the correct form is shown with a brief grammar rule"
    ],
    teacherPrep: "Provide sentences where one word needs to be conjugated or changed grammatically. Include the base form for reference. Perfect for verb tense practice.",
    classroomUse: "Use after teaching a specific grammar point (e.g. present simple vs past simple). Students practice by applying the rule to fill the blank.",
    scoring: "Points per correct answer. The game tracks which tenses/forms are mastered and which need more practice.",
    difficultyLabel: "Intermediate",
    timeEstimate: "10 min per 10 sentences"
  },

  // ─── VERB_CONJUGATION ───
  VERB_CONJUGATION: {
    summary: "Students fill in a conjugation table for a given verb and tense. Essential for mastering verb forms across different pronouns.",
    howToPlay: [
      "A verb and tense are specified (e.g. 'to be' — Past tense)",
      "A table shows pronouns (I, You, He/She, We, They) in one column",
      "The adjacent column has empty fields — one per pronoun",
      "Student types or selects the correct conjugated form for each pronoun",
      "When all forms are filled, tap 'Check' to verify",
      "Correct forms turn green; errors show the right conjugation"
    ],
    teacherPrep: "Select a verb and tense. The game handles the pronoun table automatically. Optionally provide the correct conjugations for validation.",
    classroomUse: "Core tool for teaching verb conjugations. Use after explaining a tense — students practice by filling the table. Repeat for multiple verbs.",
    scoring: "Points per correctly conjugated pronoun. The game shows a percentage score and lists which pronouns still need practice.",
    difficultyLabel: "Intermediate-Advanced",
    timeEstimate: "5 min per verb tense"
  },

  // ─── MULTIPLE_CHOICE_GRAMMAR ───
  MULTIPLE_CHOICE_GRAMMAR: {
    summary: "A sentence with a grammar choice. Students pick the correct option from 4 choices. Quick grammar assessment tool.",
    howToPlay: [
      "A sentence appears with a blank (e.g. 'She ___ to school yesterday.')",
      "Multiple options are shown (e.g. 'go / goes / went / going')",
      "Student selects the grammatically correct option",
      "Immediate feedback with explanation",
      "Next question appears automatically"
    ],
    teacherPrep: "Write sentences with one grammar choice point. Provide 4 options where only one is correct. Add explanations for each answer. AI can generate these.",
    classroomUse: "Quick checks during or after a grammar lesson. Use as an exit ticket — 5 questions to confirm understanding before the lesson ends.",
    scoring: "Points per correct answer. End screen shows score percentage and lists incorrect answers with the correct grammar rule.",
    difficultyLabel: "All levels",
    timeEstimate: "5-8 min per 10 questions"
  },

  // ─── DRAG_DROP ───
  DRAG_DROP: {
    summary: "Students drag and drop words or sentence parts into the correct positions. Can be used for sentence building, matching, or categorizing.",
    howToPlay: [
      "Items appear in a source area (words, sentence fragments, or categories)",
      "A target area shows where items should be placed",
      "Student drags each item to its correct position",
      "Items snap into place when dropped on the correct target",
      "Check button verifies all placements"
    ],
    teacherPrep: "Prepare items and their correct targets. This can be: words → categories, sentence fragments → full sentence, or questions → answers.",
    classroomUse: "Highly flexible — use for sorting (nouns vs verbs), sequencing (story order), or matching (questions to answers). Adaptable to any lesson.",
    scoring: "Points based on correct placements and time. Incorrect placements can be retried but reduce the potential score.",
    difficultyLabel: "Beginner-Intermediate",
    timeEstimate: "8-10 min per 10 items"
  },

  // ─── QUIZ ───
  QUIZ: {
    summary: "A general multiple-choice quiz. Mixed questions covering vocabulary, grammar, reading comprehension, or any subject. The most flexible game type.",
    howToPlay: [
      "A question is displayed (vocabulary, grammar, reading, etc.)",
      "4 answer options are shown",
      "Student selects the correct answer",
      "Feedback explains why the answer is correct",
      "Progress bar shows how many questions remain"
    ],
    teacherPrep: "Write questions with one correct answer and 3 distractors. Add explanations for reinforcement. AI can generate quiz questions from any lesson content.",
    classroomUse: "Use for comprehensive review sessions, unit tests, or fun competitive quizzes. Students can play individually or in teams.",
    scoring: "Points per correct answer. Timer bonus for faster responses. Final grade with percentage and question-by-question review.",
    difficultyLabel: "All levels",
    timeEstimate: "10-15 min per 10 questions"
  },

  // ─── DICTATION ───
  DICTATION: {
    summary: "Audio plays a word or sentence. Students listen and type exactly what they hear. Trains listening accuracy and spelling simultaneously.",
    howToPlay: [
      "An audio clip plays — could be a word, phrase, or full sentence",
      "Student listens carefully (can replay a limited number of times)",
      "Types what they heard into the text input",
      "Comparison shows what the student typed vs what was actually said",
      "Errors are highlighted for correction"
    ],
    teacherPrep: "Provide the text content to be read aloud. TTS (text-to-speech) handles the audio automatically. Optionally upload custom audio recordings.",
    classroomUse: "Essential for listening skills development. Use regularly (5 min per day) for steady improvement. Great for minimal pairs and tricky sounds.",
    scoring: "Score based on accuracy (words correctly transcribed). Partial credit for near-matches (one letter off). Progress tracking over time.",
    difficultyLabel: "All levels",
    timeEstimate: "10-15 min per 8-10 items"
  },

  // ─── LISTEN_FILL_WORD ───
  LISTEN_FILL_WORD: {
    summary: "Audio plays a sentence with a missing word. Students fill in the blank with the word they heard. Combines listening with contextual understanding.",
    howToPlay: [
      "Audio plays a sentence — one word is beeped or omitted",
      "The written sentence is shown with a blank in the missing word's position",
      "Student types or selects the missing word",
      "Correct: the full sentence plays back with the word included",
      "Wrong: the correct word is revealed and the sentence plays again"
    ],
    teacherPrep: "Provide sentences with one target word per sentence. The game handles the audio via TTS. Best with short, clear sentences.",
    classroomUse: "Focus on specific vocabulary in context. Use to practice listening for key information — students learn to listen for specific words.",
    scoring: "Points per correct word. Audio replays are tracked (fewer replays = better). Progress shown per session.",
    difficultyLabel: "Intermediate",
    timeEstimate: "10 min per 10 sentences"
  },

  // ─── LISTEN_FILL_SENTENCE ───
  LISTEN_FILL_SENTENCE: {
    summary: "Audio plays a full sentence. The written form appears scrambled. Students arrange the words in the correct order based on what they heard.",
    howToPlay: [
      "Audio plays a complete sentence",
      "The words from the sentence appear scrambled",
      "Student must arrange them in the exact order spoken",
      "Words snap into the correct sequence when placed",
      "Check verifies the full sentence order"
    ],
    teacherPrep: "Write complete sentences at the appropriate level. The game scrambles the words automatically. TTS handles audio generation.",
    classroomUse: "Advanced listening practice — students must understand the full sentence structure, not just individual words. Great for complex sentences.",
    scoring: "Points per correctly ordered sentence. Partial credit for partially correct sequences. Speed bonus.",
    difficultyLabel: "Intermediate-Advanced",
    timeEstimate: "12 min per 8-10 sentences"
  },

  // ─── SPEED_ROUND ───
  SPEED_ROUND: {
    summary: "Fast-paced: audio plays, students must quickly pick the correct answer before time runs out. Tests rapid recognition.",
    howToPlay: [
      "Audio plays a word or short phrase",
      "Options appear on screen — images or text",
      "Student must select the correct match quickly",
      "A countdown timer adds urgency (5-15 seconds per round)",
      "Each correct answer before the timer boosts the score multiplier"
    ],
    teacherPrep: "Word-translation pairs or word-image pairs work best. Fast-paced nature means content should be review (not new material).",
    classroomUse: "Fun review activity, especially competitive. Students love the speed element. Use after initial learning as a recall booster.",
    scoring: "Score multiplier for speed (faster = more points). Streak bonus for consecutive quick answers. Final high score displayed.",
    difficultyLabel: "All levels",
    timeEstimate: "5-8 min per 15-20 rounds"
  },

  // ─── MINIMAL_PAIR ───
  MINIMAL_PAIR: {
    summary: "Students hear one of two similar-sounding words (e.g. 'ship' vs 'sheep') and must identify which was spoken. Essential for pronunciation training.",
    howToPlay: [
      "Audio plays one word from a minimal pair (two words that differ by one sound)",
      "Both word options are displayed (e.g. 'ship' and 'sheep')",
      "Student selects which word they heard",
      "Correct: confirmation + the word is shown with its pronunciation guide",
      "Wrong: both words play back-to-back to highlight the difference"
    ],
    teacherPrep: "Create minimal pairs — words that differ by one phoneme (e.g. 'ship/sheep', 'bat/bet', 'pin/pen'). AI can generate these for any target language.",
    classroomUse: "Essential for pronunciation lessons. Use when teaching specific phonemes that don't exist in the students' native language.",
    scoring: "Points per correct discrimination. The game tracks which sound pairs are most difficult for the student.",
    difficultyLabel: "All levels",
    timeEstimate: "5-8 min per 10 rounds"
  },

  // ─── STORY ───
  STORY: {
    summary: "A writing prompt is shown. Students write a story or paragraph following the prompt and optionally using a provided word bank. Creative writing practice.",
    howToPlay: [
      "A prompt is displayed (e.g. 'Write about your last vacation')",
      "Optional word bank shows words to include (e.g. 'beach, family, hotel')",
      "Student writes their response in the text editor",
      "Word count and timer are shown",
      "On submit, the story is saved and can be reviewed"
    ],
    teacherPrep: "Create engaging writing prompts related to your lesson theme. Add a word bank of target vocabulary students should use in their writing.",
    classroomUse: "End-of-unit writing assessment or creative writing practice. Students can share and peer-review each other's stories after writing.",
    scoring: "Completion-based (story submitted). Word count target. Optional: teacher reviews manually. The game tracks time spent writing.",
    difficultyLabel: "Intermediate-Advanced",
    timeEstimate: "15-25 min per prompt"
  },

  // ─── FILL_BLANK (Writing) ───
  FILL_BLANK: {
    summary: "Writing improvement: students are shown a simple or incorrect sentence and must rewrite it to be better. Builds writing skills.",
    howToPlay: [
      "A simple or flawed sentence is shown (e.g. 'The cat is big.')",
      "Student rewrites the sentence to improve it — more detail, better grammar, etc.",
      "A text area is provided for the rewritten version",
      "On submit, the original and revised versions are shown side by side",
      "Optional guidelines help students know what to improve"
    ],
    teacherPrep: "Provide simple sentences that can be improved. Add guidelines for what to focus on (adding adjectives, correcting tense, making it longer, etc.)",
    classroomUse: "Gradual writing skill development. Start with small improvements (add one adjective) and progress to full rewrites.",
    scoring: "Completion-based. Teachers can review submissions. The game tracks number of sentences improved per session.",
    difficultyLabel: "Intermediate",
    timeEstimate: "10-12 min per 5-8 sentences"
  },

  // ─── SPEAK_FILL_WORD ───
  SPEAK_FILL_WORD: {
    summary: "Students hear a sentence with a missing word and must SPEAK (or type) the correct word. Combines listening with oral response.",
    howToPlay: [
      "Audio plays a sentence with a missing word",
      "The sentence is shown with a blank",
      "Student speaks the missing word aloud (or types it)",
      "The game reveals the correct word",
      "Next sentence loads automatically"
    ],
    teacherPrep: "Provide sentences with one missing vocabulary word each. The game handles audio via TTS. Best for practicing new vocabulary in context.",
    classroomUse: "Transition activity between listening and speaking. Use after a vocabulary lesson to encourage active recall and oral production.",
    scoring: "Completion-based. The game tracks which words were answered correctly and which need more practice.",
    difficultyLabel: "Beginner-Intermediate",
    timeEstimate: "8-10 min per 10 sentences"
  },

  // ─── SPEAK_FILL_SENTENCE ───
  SPEAK_FILL_SENTENCE: {
    summary: "Advanced: students listen to a sentence and must repeat it aloud from memory. Tests listening comprehension, memory, and speaking fluency.",
    howToPlay: [
      "Audio plays a complete sentence at normal speed",
      "The sentence is then hidden",
      "Student must repeat the sentence aloud from memory",
      "The original sentence is shown for comparison",
      "Self-assess or use speech recognition for accuracy"
    ],
    teacherPrep: "Use sentences from your current lesson content. Progress from short sentences (3-4 words) to longer ones (8-10 words) as students improve.",
    classroomUse: "Advanced speaking practice. Use in pairs — one listens and repeats, the other checks accuracy. Builds both listening and speaking skills.",
    scoring: "Self-assessed or teacher-assessed. Track progress by sentence length over time.",
    difficultyLabel: "Intermediate-Advanced",
    timeEstimate: "10-15 min per 8-10 sentences"
  },

  // ─── MEMORY ───
  MEMORY: {
    summary: "Classic memory card game: cards are face-down, students flip two at a time to find matching word-translation pairs.",
    howToPlay: [
      "Cards are arranged face-down in a grid (e.g. 4x4 for 8 pairs)",
      "Student taps a card to flip it and reveal the word",
      "Then taps another card to find its matching pair",
      "If the two cards match (word ↔ translation), they stay face-up",
      "If they don't match, both cards flip back after a moment",
      "Goal: find all matching pairs with the fewest flips"
    ],
    teacherPrep: "Provide word-translation pairs. The game creates matching cards — one card has the word, its pair has the translation. Minimum 4 pairs recommended.",
    classroomUse: "Fun vocabulary review, especially for visual learners. Students can play competitively — who can match all pairs in the fewest moves?",
    scoring: "Score based on total flips (fewer = better), matches found, and time. Star rating (1-3 stars) based on efficiency.",
    difficultyLabel: "Beginner-friendly",
    timeEstimate: "8-12 min per game"
  }
};

export function getGameGuide(type: string): GameGuide | null {
  return GAME_GUIDES[type] ?? null;
}
