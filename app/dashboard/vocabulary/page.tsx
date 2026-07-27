import { redirect } from "next/navigation";

// Vocabulary management is now integrated into the unified game creation page
export default function VocabularyPage() {
  redirect("/dashboard/games/new");
}
