"use client";
import Link from "next/link";
import { CATEGORIES, GAMES } from "@/lib/folder-content";

/** Faithful port of the folder's Category.jsx game list. */
export function FolderCategory({ id }: { id: string }) {
  const cat = CATEGORIES.find((c) => c.id === id);
  if (!cat) {
    return (
      <div className="fg card">
        Category not found. <Link href="/play">Home</Link>
      </div>
    );
  }
  const games = GAMES.filter((g) => g.cat === id);
  return (
    <div className="fg">
      <div className="page-head">
        <Link className="back" href="/play" aria-label="Home">←</Link>
        <div>
          <h2>{cat.emoji} {cat.name}</h2>
          <p>{cat.blurb}</p>
        </div>
      </div>
      <div className="game-list">
        {games.map((g) => (
          <Link key={g.id} className="game-card" href={`/play/game/${g.id}`}>
            <span className="g-emoji">{g.emoji}</span>
            <span>
              <strong>{g.title}</strong>
              <span className="g-desc">{g.desc}</span>
            </span>
            <span className="chev">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
