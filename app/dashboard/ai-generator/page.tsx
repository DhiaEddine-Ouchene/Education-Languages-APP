import { redirect } from "next/navigation";

// AI Generator is now integrated into the unified game creation page
export default function AIGeneratorPage() {
  redirect("/dashboard/games/new");
}
