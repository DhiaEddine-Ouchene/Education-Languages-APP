"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
}

export interface WordMeaningMatchProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function WordMeaningMatchGame({ items, settings, onComplete }: WordMeaningMatchProps) {
  const PAIRS_PER_ROUND = 4;
  
  const [round, setRound] = useState(0);
  const [words, setWords] = useState<GameItem[]>([]);
  const [definitions, setDefinitions] = useState<GameItem[]>([]);
  
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState<{id: string, y1: number, y2: number}[]>([]);

  const wordRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const defRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadRound();
  }, [round, items]);

  const loadRound = () => {
    const startIndex = round * PAIRS_PER_ROUND;
    const currentItems = items.slice(startIndex, startIndex + PAIRS_PER_ROUND);
    
    if (currentItems.length === 0) {
      onComplete(score, items.length);
      return;
    }

    setWords(currentItems);
    setDefinitions([...currentItems].sort(() => 0.5 - Math.random()));
    setSelectedWord(null);
    setSelectedDef(null);
    setMatches([]);
    setErrors([]);
    setLines([]);
  };

  const handleWordClick = (id: string) => {
    if (matches.includes(id)) return;
    if (selectedWord === id) {
      setSelectedWord(null);
      return;
    }
    setSelectedWord(id);
    checkMatch(id, selectedDef);
  };

  const handleDefClick = (id: string) => {
    if (matches.includes(id)) return;
    if (selectedDef === id) {
      setSelectedDef(null);
      return;
    }
    setSelectedDef(id);
    checkMatch(selectedWord, id);
  };

  const checkMatch = (wId: string | null, dId: string | null) => {
    if (!wId || !dId) return;

    if (wId === dId) {
      // Match!
      setMatches(prev => [...prev, wId]);
      setScore(s => s + 1);
      
      // Calculate line positions
      const wEl = wordRefs.current[wId];
      const dEl = defRefs.current[dId];
      
      if (wEl && dEl) {
        // Find relative center Y positions based on container
        const container = wEl.closest('.game-container');
        if (container) {
          const cRect = container.getBoundingClientRect();
          const wRect = wEl.getBoundingClientRect();
          const dRect = dEl.getBoundingClientRect();
          
          const y1 = (wRect.top - cRect.top) + wRect.height / 2;
          const y2 = (dRect.top - cRect.top) + dRect.height / 2;
          
          setLines(prev => [...prev, { id: wId, y1, y2 }]);
        }
      }

      setSelectedWord(null);
      setSelectedDef(null);
    } else {
      // Error
      setErrors([wId, dId]);
      setTimeout(() => setErrors([]), 500);
      setSelectedWord(null);
      setSelectedDef(null);
    }
  };

  const handleNext = () => {
    if ((round + 1) * PAIRS_PER_ROUND < items.length) {
      setRound(r => r + 1);
    } else {
      onComplete(score, items.length);
    }
  };

  if (words.length === 0) return null;

  const totalProgress = (round * PAIRS_PER_ROUND + matches.length) / items.length;

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-5xl mx-auto flex flex-col min-h-[600px]">
      
      {/* Progress */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Word Match</span>
          <span className="text-lg font-bold text-green-700">{Math.round(totalProgress * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-400 transition-all duration-500 shadow-[0_0_8px_rgba(78,222,163,0.5)]" 
            style={{ width: `${totalProgress * 100}%` }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32 relative game-container flex-grow">
        
        {/* Connector Lines (Desktop Only) */}
        <div className="absolute inset-0 hidden md:block pointer-events-none z-0">
          <svg className="w-full h-full">
            {lines.map(line => (
              <line 
                key={line.id} 
                x1="45%" y1={line.y1} 
                x2="55%" y2={line.y2} 
                stroke="#2170e4" 
                strokeWidth="4" 
                strokeLinecap="round"
                strokeDasharray="10,5"
                className="animate-[dash_1s_linear_infinite]"
              />
            ))}
          </svg>
        </div>

        {/* Words Column */}
        <div className="flex flex-col gap-6 z-10">
          <h2 className="text-xl font-bold text-slate-400 mb-2">Words</h2>
          {words.map(item => {
            const isMatched = matches.includes(item.id);
            const isSelected = selectedWord === item.id;
            const isError = errors.includes(item.id);

            return (
              <div 
                key={item.id}
                ref={el => { wordRefs.current[item.id] = el; }}
                onClick={() => handleWordClick(item.id)}
                className={cn(
                  "p-6 bg-white border rounded-xl shadow-sm cursor-pointer flex items-center justify-between transition-all duration-200 select-none",
                  isSelected ? "border-primary border-2 bg-blue-50 ring-4 ring-blue-500/10" : "border-[#c2c6d6] hover:-translate-y-1 hover:shadow-md",
                  isMatched ? "border-green-500 bg-green-50 cursor-default opacity-80" : "",
                  isError ? "border-red-500 bg-red-50 animate-[shake_0.2s_ease-in-out_2]" : ""
                )}
              >
                <span className="text-2xl font-bold text-slate-800">{item.word}</span>
                {isMatched ? <CheckCircle className="text-green-600" /> : <Circle className={cn(isSelected ? "text-primary fill-primary/20" : "text-slate-300")} />}
              </div>
            );
          })}
        </div>

        {/* Definitions Column */}
        <div className="flex flex-col gap-6 z-10">
          <h2 className="text-xl font-bold text-slate-400 mb-2">Definitions</h2>
          {definitions.map(item => {
            const isMatched = matches.includes(item.id);
            const isSelected = selectedDef === item.id;
            const isError = errors.includes(item.id);

            return (
              <div 
                key={item.id}
                ref={el => { defRefs.current[item.id] = el; }}
                onClick={() => handleDefClick(item.id)}
                className={cn(
                  "p-6 bg-white border rounded-xl shadow-sm cursor-pointer flex items-center justify-between transition-all duration-200 select-none",
                  isSelected ? "border-primary border-2 bg-blue-50 ring-4 ring-blue-500/10" : "border-[#c2c6d6] hover:-translate-y-1 hover:shadow-md",
                  isMatched ? "border-green-500 bg-green-50 cursor-default opacity-80" : "",
                  isError ? "border-red-500 bg-red-50 animate-[shake_0.2s_ease-in-out_2]" : ""
                )}
              >
                <span className="text-lg text-slate-800 leading-snug">{item.translation}</span>
                {isMatched ? <CheckCircle className="text-green-600" /> : <Circle className={cn(isSelected ? "text-primary fill-primary/20" : "text-slate-300")} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      {matches.length === words.length && (
        <div className="mt-12 flex justify-center animate-in fade-in slide-in-from-bottom-4">
          <Button size="lg" onClick={handleNext} className="px-10 rounded-full shadow-md text-lg h-14 bg-green-600 hover:bg-green-700 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all">
            {(round + 1) * PAIRS_PER_ROUND < items.length ? "Next Round" : "Finish Game"} 
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -15; }
        }
      `}} />
    </div>
  );
}
