"use client";
import Link from "next/link";
import { CATEGORIES, GAMES } from "@/lib/folder-content";

/** Faithful port of the folder's Home.jsx category grid. */
export function FolderHome() {
  return (
    <div className="fg">
      <div className="hero">
        <div className="hero-badge">🎓 EduPlay</div>
        <h1>Learn languages through play</h1>
        <p>Pick a skill and start a game. Short rounds, instant feedback.</p>
      </div>
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <Link key={c.id} className="cat-card" href={`/play/category/${c.id}`} style={{ "--accent": c.color } as React.CSSProperties}>
            <span className="cat-emoji">{c.emoji}</span>
            <span className="cat-name">{c.name}</span>
            <span className="cat-blurb">{c.blurb}</span>
            <span className="cat-count">{GAMES.filter((g) => g.cat === c.id).length} games</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
