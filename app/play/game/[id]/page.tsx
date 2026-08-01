"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBuiltinGame } from "@/lib/folder-content";
import FolderGame from "@/components/games/engines/FolderGame";

export default function PlayGamePage({ params }: { params: { id: string } }) {
  const game = getBuiltinGame(params.id);
  if (!game) {
    return (
      <div className="fg card">
        Game not found. <Link href="/play">Home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-2 py-4">
      <Link
        href={`/play/category/${game.cat}`}
        className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-txt-secondary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {game.title}
      </Link>
      <FolderGame game={game} onComplete={() => {}} />
    </div>
  );
}
