import { generateGameFromWordBank } from "./lib/generate-game";

async function run() {
  const result = await generateGameFromWordBank("FILL_GAP_WORD", null, 2, {
    topic: "Food",
    targetLang: "English",
    nativeLang: "English"
  });
  console.log("Raw Result:", JSON.stringify(result, null, 2));
}

run();
