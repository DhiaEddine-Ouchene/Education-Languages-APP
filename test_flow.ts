import { mapAiResponseToBuilderData } from "./lib/map-ai-data";

const aiData = { items: [{ sentenceWithBlank: "The weather is ___ today.", correctWord: "beautiful" }] };
const mappedData = mapAiResponseToBuilderData("FILL_GAP_WORD", aiData);
console.log("Mapped Data:", JSON.stringify(mappedData, null, 2));

const rawItems = mappedData.sentenceItems || mappedData.items || [];
const finalItems = (rawItems as any[]).map((s, i) => {
  const sentence = s.sentence || s.sentence_target || s.flawedSentence_target || s.flawedSentence || "";
  let correctAnswer = s.correctAnswer || s.correctConjugation || s.expectedResponse_target || s.guideline_target || s.guideline || "";
  if (!correctAnswer && (s.sentence_target || s.sentence)) {
    correctAnswer = s.sentence_target || s.sentence || "";
  }
  return { sentence, correctAnswer };
});

console.log("Final Items:", JSON.stringify(finalItems, null, 2));
