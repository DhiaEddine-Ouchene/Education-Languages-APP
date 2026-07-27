"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock, Trophy, RefreshCcw, Settings, History, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  exampleSentence?: string | null;
}

export interface GameSettings {
  difficulty?: string;
  timer?: number;
  hints?: boolean;
  audioAutoplay?: boolean;
  shuffle?: boolean;
}

export interface Flashcard3DProps {
  items: GameItem[];
  settings?: GameSettings;
  onComplete: (score: number, total: number) => void;
}

type CardType = "word" | "translation";

interface CardData {
  id: string;
  itemId: string;
  type: CardType;
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function Flashcard3DGame({ items, settings, onComplete }: Flashcard3DProps) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [matchHistory, setMatchHistory] = useState<GameItem[]>([]);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings?.timer ?? 60);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    initGame();
  }, [items]);

  useEffect(() => {
    if (gameOver || timeLeft <= 0) {
      if (!gameOver) handleGameOver();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameOver]);

  const initGame = () => {
    const newCards: CardData[] = [];
    const pool = settings?.shuffle === false ? items : [...items].sort(() => Math.random() - 0.5);
    const selected = pool.slice(0, 10); // max 10 pairs = 20 cards

    selected.forEach((item) => {
      newCards.push({ id: `${item.id}-w`, itemId: item.id, type: "word", text: item.word, isFlipped: false, isMatched: false });
      newCards.push({ id: `${item.id}-t`, itemId: item.id, type: "translation", text: item.translation, isFlipped: false, isMatched: false });
    });

    setCards(newCards.sort(() => Math.random() - 0.5));
    setFlippedIds([]);
    setMatches([]);
    setMatchHistory([]);
    setCombo(0);
    setScore(0);
    setTimeLeft(settings?.timer ?? 60);
    setGameOver(false);
  };

  const handleGameOver = () => {
    setGameOver(true);
    onComplete(matches.length, items.length);
  };

  const handleCardClick = (id: string) => {
    if (flippedIds.length >= 2 || gameOver) return;
    const cardIndex = cards.findIndex(c => c.id === id);
    if (cardIndex === -1 || cards[cardIndex].isMatched || cards[cardIndex].isFlipped) return;

    const newCards = [...cards];
    newCards[cardIndex].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setTimeout(() => checkMatch(newFlipped), 800);
    }
  };

  const checkMatch = (flipped: string[]) => {
    const [id1, id2] = flipped;
    const c1 = cards.find(c => c.id === id1);
    const c2 = cards.find(c => c.id === id2);

    if (c1 && c2 && c1.itemId === c2.itemId) {
      // Match
      setCards(cards.map(c => (c.id === id1 || c.id === id2 ? { ...c, isMatched: true, isFlipped: true } : c)));
      setMatches([...matches, c1.itemId]);
      const matchedItem = items.find(i => i.id === c1.itemId);
      if (matchedItem) setMatchHistory([matchedItem, ...matchHistory]);
      
      setCombo(c => c + 1);
      setScore(s => s + (100 * (combo + 1)));

      if (matches.length + 1 === cards.length / 2) {
        setTimeout(() => handleGameOver(), 1000);
      }
    } else {
      // No match
      setCards(cards.map(c => (c.id === id1 || c.id === id2 ? { ...c, isFlipped: false } : c)));
      setCombo(0);
    }
    setFlippedIds([]);
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans p-4 rounded-xl max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Header Stats */}
        <section className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e5eeff] shadow-sm p-4 rounded-xl flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1"><Clock className="w-4 h-4"/> Timer</div>
            <div className="text-3xl font-bold text-slate-800">00:{timeLeft.toString().padStart(2, '0')}</div>
          </div>
          <div className="bg-white border border-[#e5eeff] shadow-sm p-4 rounded-xl flex flex-col justify-center">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1"><Trophy className="w-4 h-4"/> Score</div>
            <div className="text-3xl font-bold text-slate-800">{score.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-primary/20 shadow-sm p-4 rounded-xl flex flex-col justify-center md:col-span-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Progress</div>
                <div className="text-xl font-bold text-slate-800">{matches.length} / {cards.length / 2} Matches</div>
              </div>
              <Button variant="outline" size="sm" onClick={initGame}><RefreshCcw className="w-4 h-4 mr-2"/> Restart</Button>
            </div>
          </div>
        </section>

        {/* Game Grid */}
        <section className="lg:col-span-8">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 min-h-[400px]">
            {cards.map((card) => (
              <div key={card.id} style={{ perspective: '1000px' }} className="h-32">
                <div 
                  onClick={() => handleCardClick(card.id)}
                  style={{
                    position: 'relative', width: '100%', height: '100%',
                    transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transformStyle: 'preserve-3d',
                    cursor: card.isMatched ? 'default' : 'pointer',
                    transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Front */}
                  <div style={{
                    position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                    background: '#eff4ff', border: '2px solid #d8e2ff', borderRadius: '12px'
                  }} className="hover:bg-blue-100/50 transition-colors"></div>
                  
                  {/* Back */}
                  <div style={{
                    position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: card.isMatched ? '#22c55e' : '#3b82f6',
                    boxShadow: card.isMatched ? '0 0 20px rgba(34, 197, 94, 0.3)' : 'none',
                    color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', textAlign: 'center'
                  }}>
                    <span className="font-bold text-sm leading-tight break-words">{card.text}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Combo Indicator */}
          {combo > 1 && (
            <div className="bg-white border-2 border-green-400/50 p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-right">
              <div className="w-14 h-14 rounded-full border-4 border-green-500 flex items-center justify-center bg-green-50">
                <span className="text-green-600 text-xl font-bold">x{combo}</span>
              </div>
              <div>
                <div className="text-green-600 font-bold uppercase text-[10px] tracking-widest">Combo Streak</div>
                <div className="text-slate-800 font-bold">Bonus active!</div>
              </div>
            </div>
          )}

          {/* Match History */}
          <div className="bg-white border border-[#e5eeff] p-5 rounded-xl flex-grow flex flex-col min-h-[300px]">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase mb-4">
              <History className="w-4 h-4"/> Match History
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
              {matchHistory.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-blue-50 border-l-4 border-primary animate-in fade-in">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-primary font-bold text-sm">{item.word}</span>
                    <span className="text-primary font-bold text-sm">{item.translation}</span>
                  </div>
                  {item.exampleSentence && (
                    <p className="text-xs text-slate-600 italic leading-tight">{item.exampleSentence}</p>
                  )}
                </div>
              ))}
              
              {matchHistory.length === 0 && (
                <div className="p-4 rounded-lg border border-dashed border-slate-300 text-center mt-8">
                  <span className="text-slate-400 font-bold text-xs tracking-widest uppercase">Awaiting Match...</span>
                </div>
              )}
            </div>
          </div>
          
        </aside>

      </div>
    </div>
  );
}
