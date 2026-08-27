import { mapAiResponseToBuilderData } from "./lib/map-ai-data";

const res = mapAiResponseToBuilderData("FILL_GAP_WORD", { items: [{ sentenceWithBlank: "I ___ to school.", correctWord: "go" }] });
console.log(JSON.stringify(res, null, 2));
