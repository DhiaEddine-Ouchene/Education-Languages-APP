// EduPlay content pack — faithful copy of the folder's data/content.js so every
// built-in game is available immediately. Mechanics are language-agnostic.

export type FolderCategory = { id: string; name: string; emoji: string; color: string; blurb: string };
export type FolderGameContent = {
  id: string;
  cat: string;
  emoji: string;
  title: string;
  desc: string;
  engine: string;
  data: Record<string, any>;
};

export const CATEGORIES: FolderCategory[] = [
  { id: "vocabulary", name: "Vocabulary", emoji: "📚", color: "#7C5CFC", blurb: "Words, meanings and memory" },
  { id: "grammar", name: "Grammar", emoji: "🧩", color: "#FF7A59", blurb: "Build and fix sentences" },
  { id: "listening", name: "Listening", emoji: "🎧", color: "#2BB3A3", blurb: "Train your ears" },
  { id: "writing", name: "Writing", emoji: "✍️", color: "#F5A623", blurb: "Express yourself in text" },
  { id: "speaking", name: "Speaking", emoji: "🎤", color: "#E85D9B", blurb: "Practise out loud" },
];

export const GAMES: FolderGameContent[] = [
  // ---------- VOCABULARY ----------
  { id: "synonym-antonym", cat: "vocabulary", emoji: "🔗", title: "Synonym & Antonym Match", desc: "Pick the matching word", engine: "mcq", data: { rounds: [
    { sub: "Pick the synonym", prompt: "happy", options: ["glad", "angry", "tired", "hungry"], answer: "glad", explain: "'Glad' means the same as 'happy'." },
    { sub: "Pick the antonym", prompt: "begin", options: ["start", "end", "open", "carry"], answer: "end", explain: "'End' is the opposite of 'begin'." },
    { sub: "Pick the synonym", prompt: "quick", options: ["slow", "fast", "loud", "small"], answer: "fast", explain: "'Fast' means the same as 'quick'." },
    { sub: "Pick the antonym", prompt: "noisy", options: ["loud", "busy", "quiet", "fast"], answer: "quiet", explain: "'Quiet' is the opposite of 'noisy'." },
  ] } },
  { id: "memory-match", cat: "vocabulary", emoji: "🃏", title: "Memory Match", desc: "Flip cards to find synonym pairs", engine: "memory", data: {
    pairs: [["happy", "glad"], ["big", "large"], ["fast", "quick"], ["begin", "start"]],
    defs: {
      happy: "Feeling pleasure or joy. “She was happy to see her friends.”",
      big: "Of great size. “They live in a big house.”",
      fast: "Moving or able to move quickly. “A fast train.”",
      begin: "To start something. “The film begins at eight.”",
    },
  } },
  { id: "fill-gap-word", cat: "vocabulary", emoji: "🪣", title: "Fill the Gap", desc: "Complete the sentence from the word bank", engine: "fillblank", data: { rounds: [
    { text: "She drinks a cup of ___ every morning.", options: ["coffee", "shoe", "cloud", "chair"], answer: "coffee" },
    { text: "We took a ___ to the airport.", options: ["taxi", "banana", "pillow", "spoon"], answer: "taxi" },
    { text: "Please open the ___ , it is hot in here.", options: ["window", "carpet", "fridge", "book"], answer: "window" },
  ] } },
  { id: "word-meaning", cat: "vocabulary", emoji: "🧭", title: "Word & Meaning", desc: "Match words to their definitions", engine: "match", data: { task: "Match each word to its meaning", rounds: [
    { pairs: [["ancient", "very old"], ["rapid", "very fast"], ["fragile", "easily broken"], ["generous", "happy to give"]] },
    { pairs: [["curious", "eager to learn"], ["silent", "without sound"], ["brave", "not afraid"], ["tidy", "neat and organised"]] },
  ] } },
  { id: "dialogue-completion", cat: "vocabulary", emoji: "💬", title: "Complete the Dialogue", desc: "Fill the missing word in a conversation", engine: "fillblank", data: { rounds: [
    { task: "At the restaurant", dialogue: [
      { s: "A", name: "Waiter", line: "Good evening! A table for two?" },
      { s: "B", name: "You", line: "Yes, please. Could we see the ___ ?" },
    ], options: ["menu", "engine", "ticket", "umbrella"], answer: "menu" },
    { task: "Paying the bill", dialogue: [
      { s: "A", name: "Cashier", line: "How would you like to pay?" },
      { s: "B", name: "You", line: "By ___ , please." },
    ], options: ["card", "spoon", "letter", "window"], answer: "card" },
    { task: "Planning a trip", dialogue: [
      { s: "A", name: "Sam", line: "Our flight leaves at nine tomorrow." },
      { s: "B", name: "You", line: "Then we should pack our ___ tonight." },
    ], options: ["suitcase", "oven", "garden", "homework"], answer: "suitcase" },
  ] } },
  { id: "word-example", cat: "vocabulary", emoji: "📝", title: "Word in a Sentence", desc: "Pick the sentence that uses the word correctly", engine: "mcq", data: { rounds: [
    { sub: "Which sentence uses it correctly?", prompt: "borrow", stack: true, options: ["Can I borrow your pen for a minute?", "She borrowed to the shop yesterday.", "The sky borrowed very blue."], answer: "Can I borrow your pen for a minute?", explain: "'Borrow' means to take something temporarily: borrow + a thing." },
    { sub: "Which sentence uses it correctly?", prompt: "delicious", stack: true, options: ["The soup was delicious.", "He ran delicious to school.", "I will delicious my homework."], answer: "The soup was delicious.", explain: "'Delicious' is an adjective describing taste, so it follows 'was'." },
  ] } },
  { id: "word-scramble", cat: "vocabulary", emoji: "🅰️", title: "Word Scramble", desc: "Unscramble the letters", engine: "order", data: { mode: "letters", rounds: [
    { answer: "apple", hint: "A fruit that keeps the doctor away 🍎" },
    { answer: "school", hint: "Where students learn 🏫" },
    { answer: "orange", hint: "A fruit and a colour 🍊" },
  ] } },
  { id: "odd-one-out", cat: "vocabulary", emoji: "🎯", title: "Odd One Out", desc: "Find the word that doesn't belong", engine: "mcq", data: { rounds: [
    { sub: "Which word does NOT belong?", options: ["apple", "banana", "cherry", "spoon"], answer: "spoon", explain: "The others are fruits; a spoon is cutlery." },
    { sub: "Which word does NOT belong?", options: ["dog", "cat", "horse", "table"], answer: "table", explain: "The others are animals; a table is furniture." },
    { sub: "Which word does NOT belong?", options: ["run", "jump", "swim", "chair"], answer: "chair", explain: "The others are verbs of movement; 'chair' is a noun." },
    { sub: "Which word does NOT belong?", options: ["red", "blue", "green", "loud"], answer: "loud", explain: "The others are colours; 'loud' describes sound." },
  ] } },
  { id: "picture-word", cat: "vocabulary", emoji: "🖼️", title: "Picture to Word", desc: "Name what you see", engine: "mcq", data: { rounds: [
    { sub: "What do you see?", image: "🐘", options: ["elephant", "mouse", "giraffe", "lion"], answer: "elephant" },
    { sub: "What do you see?", image: "🌧️", options: ["rain", "sun", "snow", "wind"], answer: "rain" },
    { sub: "What do you see?", image: "🚲", options: ["bicycle", "car", "train", "boat"], answer: "bicycle" },
  ] } },
  { id: "category-sort", cat: "vocabulary", emoji: "🗂️", title: "Category Sort", desc: "Sort words into the right buckets", engine: "sort", data: { rounds: [
    { categories: ["Kitchen", "Travel", "Office"], items: [
      { word: "spoon", cat: "Kitchen" }, { word: "passport", cat: "Travel" }, { word: "stapler", cat: "Office" },
      { word: "oven", cat: "Kitchen" }, { word: "suitcase", cat: "Travel" }, { word: "keyboard", cat: "Office" },
    ] },
  ] } },
  { id: "collocation", cat: "vocabulary", emoji: "🤝", title: "Collocation Builder", desc: "Pick the natural word pair", engine: "mcq", data: { rounds: [
    { sub: "Complete the phrase", prompt: "___ a decision", options: ["make", "do", "run", "say"], answer: "make", explain: "We say 'make a decision', not 'do a decision'." },
    { sub: "Complete the phrase", prompt: "___ your homework", options: ["do", "make", "take", "give"], answer: "do", explain: "We say 'do homework', not 'make homework'." },
    { sub: "Complete the phrase", prompt: "___ a photo", options: ["take", "do", "catch", "put"], answer: "take", explain: "We say 'take a photo'." },
    { sub: "Complete the phrase", prompt: "___ attention", options: ["pay", "spend", "make", "give?"], answer: "pay", explain: "We say 'pay attention'." },
  ] } },
  { id: "crossword", cat: "vocabulary", emoji: "🧩", title: "Travel Crossword", desc: "End-of-unit vocabulary review", engine: "crossword", data: { entries: [
    { word: "TICKET", clue: "You need this to board a train or plane.", row: 0, col: 0, dir: "across" },
    { word: "AIRPORT", clue: "Where planes take off and land.", row: 2, col: 0, dir: "across" },
    { word: "NIGHT", clue: "The opposite of day.", row: 4, col: 0, dir: "across" },
    { word: "TRAIN", clue: "It runs on rails.", row: 0, col: 0, dir: "down" },
    { word: "CAR", clue: "A vehicle with four wheels that you drive.", row: 0, col: 2, dir: "down" },
    { word: "TAXI", clue: "A car you pay to ride in.", row: 2, col: 6, dir: "down" },
  ] } },

  // ---------- GRAMMAR ----------
  { id: "build-sentence", cat: "grammar", emoji: "🧱", title: "Build the Sentence", desc: "Drag the words into order", engine: "order", data: { rounds: [
    { answer: "She is reading a book", hint: "Put the words in order" },
    { answer: "They went to the beach yesterday", hint: "Put the words in order" },
    { answer: "I have never seen snow", hint: "Put the words in order" },
  ] } },
  { id: "error-spotting", cat: "grammar", emoji: "🔍", title: "Error Spotting", desc: "Tap the mistake, then fix it", engine: "tapword", data: { rounds: [
    { words: ["She", "go", "to", "school", "every", "day."], errorIndex: 1, corrections: ["goes", "going", "gone"], correction: "goes", explain: "Third person singular in the present simple adds -s: 'she goes'." },
    { words: ["I", "have", "saw", "that", "film."], errorIndex: 2, corrections: ["seen", "see", "sees"], correction: "seen", explain: "The present perfect uses the past participle: 'have seen'." },
    { words: ["There", "is", "many", "cars", "outside."], errorIndex: 1, corrections: ["are", "be", "am"], correction: "are", explain: "'Cars' is plural, so we use 'there are'." },
  ] } },
  { id: "grammar-fill", cat: "grammar", emoji: "🪤", title: "Grammar Gap", desc: "Choose the right tense, article or preposition", engine: "fillblank", data: { rounds: [
    { text: "I have lived here ___ 2015.", options: ["since", "for", "at", "on"], answer: "since", explain: "Use 'since' with a point in time, 'for' with a duration." },
    { text: "She is interested ___ music.", options: ["in", "on", "at", "about"], answer: "in", explain: "'Interested' takes the preposition 'in'." },
    { text: "If it rains, we ___ stay home.", options: ["will", "would", "did", "were"], answer: "will", explain: "First conditional: if + present simple, 'will' + verb." },
  ] } },
  { id: "verb-conjugation", cat: "grammar", emoji: "🔤", title: "Verb Conjugation", desc: "Conjugate the verb, learn the rule", engine: "fillblank", data: { rounds: [
    { task: "to go — she, present simple", text: "She ___ to work by bus.", answer: "goes", rule: "Present simple, 3rd person singular: verb + s/es. go → goes" },
    { task: "to eat — they, past simple", text: "They ___ dinner at eight last night.", answer: "ate", rule: "Irregular past simple: eat → ate. Irregular verbs don't take -ed." },
    { task: "to be — I, present simple", text: "I ___ a student.", answer: "am", rule: "The verb 'to be' in the present: I am, you are, he/she/it is, we/they are." },
  ] } },
  { id: "grammar-mcq", cat: "grammar", emoji: "✅", title: "Grammar Choice", desc: "Pick the correct answer, see why", engine: "mcq", data: { rounds: [
    { sub: "Which sentence is correct?", stack: true, options: ["He don't like tea.", "He doesn't likes tea.", "He doesn't like tea."], answer: "He doesn't like tea.", explain: "With 'doesn't', the main verb stays in its base form: doesn't + like." },
    { sub: "Choose the correct word", prompt: "___ you ever been to Japan?", options: ["Have", "Has", "Did", "Are"], answer: "Have", explain: "Present perfect question with 'you' uses 'Have': Have you ever…?" },
    { sub: "Choose the correct word", prompt: "This book is ___ than that one.", options: ["better", "more good", "gooder", "best"], answer: "better", explain: "'Good' has an irregular comparative: good → better." },
  ] } },
  { id: "transformation", cat: "grammar", emoji: "🔄", title: "Transformation", desc: "Rewrite the sentence as instructed", engine: "texttask", data: { rounds: [
    { instruction: "Make this sentence negative", prompt: "She likes coffee.", answers: ["She doesn't like coffee", "She does not like coffee"], explain: "Present simple negative: doesn't/does not + base verb." },
    { instruction: "Change to the past tense", prompt: "I walk to school.", answers: ["I walked to school"], explain: "Regular past simple: walk → walked." },
    { instruction: "Make this a question", prompt: "He is a doctor.", answers: ["Is he a doctor"], explain: "With 'to be', invert subject and verb to form a question." },
  ] } },
  { id: "grammar-odd-one-out", cat: "grammar", emoji: "🚨", title: "Pattern Breaker", desc: "Find the sentence that breaks the pattern", engine: "mcq", data: { rounds: [
    { sub: "Three follow the pattern — one breaks it", stack: true, options: ["I have eaten.", "She has left.", "They have arrived.", "He have finished."], answer: "He have finished.", explain: "'He' takes 'has', not 'have': he has finished." },
    { sub: "Three follow the pattern — one breaks it", stack: true, options: ["She walked home.", "They played chess.", "He watched TV.", "We goed to town."], answer: "We goed to town.", explain: "'Go' is irregular: the past simple is 'went', not 'goed'." },
  ] } },
  { id: "pattern-match", cat: "grammar", emoji: "🏷️", title: "Name that Tense", desc: "Match sentences to their structure", engine: "match", data: { task: "Match each sentence to its tense", rounds: [
    { pairs: [["I have eaten", "present perfect"], ["She is running", "present continuous"], ["They will travel", "future simple"], ["He walked home", "past simple"]] },
  ] } },

  // ---------- LISTENING ----------
  { id: "listen-fill", cat: "listening", emoji: "🔊", title: "Listen & Fill the Gap", desc: "Hear the sentence, fill the blank", engine: "fillblank", data: { rounds: [
    { audioText: "The train leaves at seven o’clock.", maxReplays: 3, text: "The train leaves at ___ o’clock.", options: ["seven", "eleven", "four", "nine"], answer: "seven" },
    { audioText: "She bought a beautiful dress.", maxReplays: 3, text: "She bought a ___ dress.", options: ["beautiful", "broken", "boring", "blue"], answer: "beautiful" },
  ] } },
  { id: "listen-select", cat: "listening", emoji: "👂", title: "Listen & Select", desc: "Pick what the audio means", engine: "mcq", data: { rounds: [
    { sub: "What does the speaker want?", audioText: "Could you close the door, please?", stack: true, options: ["They want the door shut", "They want the window open", "They are asking the time"], answer: "They want the door shut" },
    { sub: "What is the speaker describing?", audioText: "I usually get up at six in the morning.", stack: true, options: ["Their daily routine", "Their favourite food", "Their holiday plans"], answer: "Their daily routine" },
  ] } },
  { id: "listen-order", cat: "listening", emoji: "🔢", title: "Listen & Order", desc: "Put the phrases in the order you hear", engine: "order", data: { rounds: [
    { audioText: "We woke up early, packed our bags, and drove to the coast.", maxReplays: 3, fragments: ["We woke up early,", "packed our bags,", "and drove to the coast."], hint: "Order the phrases" },
    { audioText: "First I make coffee, then I read the news, and finally I start work.", maxReplays: 3, fragments: ["First I make coffee,", "then I read the news,", "and finally I start work."], hint: "Order the phrases" },
  ] } },
  { id: "dictation", cat: "listening", emoji: "⌨️", title: "Dictation", desc: "Type exactly what you hear", engine: "texttask", data: { rounds: [
    { instruction: "Type what you hear", audioText: "The weather is very nice today.", maxReplays: 3, answers: ["The weather is very nice today"] },
    { instruction: "Type what you hear", audioText: "My brother works in a hospital.", maxReplays: 3, answers: ["My brother works in a hospital"] },
  ] } },
  { id: "minimal-pair", cat: "listening", emoji: "🐑", title: "Minimal Pairs", desc: "Which word did you hear?", engine: "mcq", data: { rounds: [
    { sub: "Which word did you hear?", audioText: "ship", options: ["ship", "sheep"], answer: "ship", explain: "'Ship' has the short /ɪ/ sound; 'sheep' has the long /iː/." },
    { sub: "Which word did you hear?", audioText: "pan", options: ["pen", "pan"], answer: "pan", explain: "'Pan' has the /æ/ sound; 'pen' has /e/." },
    { sub: "Which word did you hear?", audioText: "leave", options: ["live", "leave"], answer: "leave", explain: "'Leave' has the long /iː/ sound; 'live' has the short /ɪ/." },
  ] } },

  // ---------- WRITING ----------
  { id: "guided-paragraph", cat: "writing", emoji: "📄", title: "Guided Paragraph", desc: "Write with a word bank and rubric", engine: "writing", data: {
    prompt: "Describe your last holiday. Use at least 3 words from the word bank.",
    wordBank: ["visited", "delicious", "beautiful", "relaxed", "memorable"],
    rubric: [
      { label: "Uses the past tense", check: (t: string) => /\b(visited|went|was|were|ate|saw|stayed|relaxed|enjoyed)\b/i.test(t) },
      { label: "At least 3 sentences", check: (t: string) => t.split(/[.!?]+/).filter((s) => s.trim()).length >= 3 },
      { label: "Uses at least 3 word-bank words", check: (t: string) => ["visited", "delicious", "beautiful", "relaxed", "memorable"].filter((w) => t.toLowerCase().includes(w)).length >= 3 },
    ],
  } },
  { id: "sentence-expansion", cat: "writing", emoji: "🌱", title: "Sentence Expansion", desc: "Grow a simple sentence with detail", engine: "writing", data: {
    prompt: "Expand this sentence by adding where, how and why: “The dog ran.”",
    rubric: [
      { label: "Still mentions the dog", check: (t: string) => /\bdog\b/i.test(t) },
      { label: "At least 8 words", check: (t: string) => t.trim().split(/\s+/).filter(Boolean).length >= 8 },
      { label: "Ends with a full stop", check: (t: string) => t.trim().endsWith(".") },
    ],
  } },
  { id: "rewrite-correct", cat: "writing", emoji: "🩹", title: "Rewrite & Correct", desc: "Fix the planted errors in the text", engine: "writing", data: {
    prompt: "This paragraph has 4 errors. Edit the text below to fix them all.",
    prefill: "Yesterday I go to the park with my freind. We plays football and ate a sandwichs.",
    rubric: [
      { label: "Fixed 'go' → 'went'", check: (t: string) => /\bwent\b/i.test(t) },
      { label: "Fixed 'freind' → 'friend'", check: (t: string) => /\bfriend\b/i.test(t) && !/freind/i.test(t) },
      { label: "Fixed 'plays' → 'played'", check: (t: string) => /\bplayed\b/i.test(t) },
      { label: "Fixed 'sandwichs' → 'sandwiches'", check: (t: string) => /\bsandwiches\b/i.test(t) },
    ],
  } },
  { id: "sentence-completion", cat: "writing", emoji: "💡", title: "Finish the Sentence", desc: "Creative completion, teacher-reviewed", engine: "writing", data: {
    prompt: "Finish the sentence in your own words. There is no single right answer — your teacher will review it.",
    starter: "If I could travel anywhere, I would ",
    note: "Reviewed by your teacher, not auto-graded.",
    teacherReview: true,
    rubric: [
      { label: "Keeps the sentence starter", check: (t: string) => t.trim().toLowerCase().startsWith("if i could travel anywhere") },
      { label: "At least 8 words in total", check: (t: string) => t.trim().split(/\s+/).filter(Boolean).length >= 8 },
    ],
  } },

  // ---------- SPEAKING ----------
  { id: "speak-gap", cat: "speaking", emoji: "🗣️", title: "Speak the Gap", desc: "Say the missing word aloud", engine: "speaking", data: { rounds: [
    { task: "Say the missing word", display: "I would like a cup of ___ , please.", target: "coffee", mode: "gap" },
    { task: "Say the missing word", display: "Can you open the ___ ? It is hot in here.", target: "window", mode: "gap" },
  ] } },
  { id: "shadowing", cat: "speaking", emoji: "🔁", title: "Listen & Repeat", desc: "Shadow the audio", engine: "speaking", data: { rounds: [
    { task: "Listen, then repeat", audioText: "Nice to meet you.", target: "Nice to meet you", mode: "repeat" },
    { task: "Listen, then repeat", audioText: "Could you say that again, please?", target: "Could you say that again please", mode: "repeat" },
  ] } },
  { id: "read-aloud", cat: "speaking", emoji: "📖", title: "Read Aloud", desc: "Read the text, get a fluency score", engine: "speaking", data: { rounds: [
    { task: "Read this aloud", display: "The quick brown fox jumps over the lazy dog.", target: "The quick brown fox jumps over the lazy dog", mode: "read" },
    { task: "Read this aloud", display: "Every morning she walks along the river before breakfast.", target: "Every morning she walks along the river before breakfast", mode: "read" },
  ] } },
  { id: "roleplay", cat: "speaking", emoji: "🎭", title: "Roleplay Response", desc: "Answer the speaker naturally", engine: "speaking", data: { rounds: [
    { task: "Someone asks you for directions — reply aloud", audioText: "Excuse me, how do I get to the station?", keywords: ["left", "right", "straight", "turn", "go"], mode: "roleplay", note: "Scored on key phrases like turn left / go straight, not exact words." },
    { task: "A waiter asks for your order — reply aloud", audioText: "Good evening, what would you like to order?", keywords: ["like", "have", "please", "want"], mode: "roleplay", note: "Scored on key phrases like 'I would like… please'." },
  ] } },
  { id: "picture-description", cat: "speaking", emoji: "🏞️", title: "Picture Description", desc: "Describe freely, teacher-reviewed", engine: "speaking", data: { rounds: [
    { task: "Describe this scene aloud for about 30 seconds", image: "🏖️", mode: "describe", note: "Not auto-scored — your recording transcript is flagged for teacher review." },
    { task: "Describe this scene aloud for about 30 seconds", image: "🌧️☔🌃", mode: "describe", note: "Not auto-scored — your recording transcript is flagged for teacher review." },
  ] } },
];

export function getBuiltinGame(id: string): FolderGameContent | undefined {
  return GAMES.find((g) => g.id === id);
}
