"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Lightbulb, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
}

export interface CrosswordProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function CrosswordGame({ items, settings, onComplete }: CrosswordProps) {
  // Use a simplified "stacked" crossword approach where words don't intersect
  // but use the same UI style as the crossword design.
  
  const [gridValues, setGridValues] = useState<Record<string, string>>({});
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [hintsUsed, setHintsUsed] = useState<Set<string>>(new Set());
  const [isGameOver, setIsGameOver] = useState(false);
  
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    // Reset state when items change
    setGridValues({});
    setCompletedWords(new Set());
    setHintsUsed(new Set());
    setIsGameOver(false);
  }, [items]);

  const handleInputChange = (wordIdx: number, charIdx: number, value: string) => {
    const key = `${wordIdx}-${charIdx}`;
    const cleanValue = value.slice(-1).toUpperCase(); // only take last char
    
    setGridValues(prev => ({ ...prev, [key]: cleanValue }));

    if (cleanValue) {
      // Move to next input
      const nextKey = `${wordIdx}-${charIdx + 1}`;
      if (inputRefs.current[nextKey]) {
        inputRefs.current[nextKey]?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, wordIdx: number, charIdx: number) => {
    const key = `${wordIdx}-${charIdx}`;
    if (e.key === 'Backspace' && !gridValues[key]) {
      // Move to previous input
      const prevKey = `${wordIdx}-${charIdx - 1}`;
      if (inputRefs.current[prevKey]) {
        inputRefs.current[prevKey]?.focus();
      }
    }
  };

  const checkGrid = () => {
    let score = 0;
    const newCompleted = new Set<number>();

    items.forEach((item, wIdx) => {
      const cleanWord = item.word.replace(/\s+/g, '').toUpperCase();
      let isWordCorrect = true;
      for (let cIdx = 0; cIdx < cleanWord.length; cIdx++) {
        const val = gridValues[`${wIdx}-${cIdx}`] || "";
        if (val.toUpperCase() !== cleanWord[cIdx]) {
          isWordCorrect = false;
          break;
        }
      }
      if (isWordCorrect) {
        score++;
        newCompleted.add(wIdx);
      }
    });

    setCompletedWords(newCompleted);

    if (newCompleted.size === items.length) {
      setIsGameOver(true);
    }
  };

  const revealHint = () => {
    // Find first uncompleted word
    const targetIdx = items.findIndex((_, i) => !completedWords.has(i));
    if (targetIdx === -1) return;

    const cleanWord = items[targetIdx].word.replace(/\s+/g, '').toUpperCase();
    // Find first empty or wrong char
    for (let cIdx = 0; cIdx < cleanWord.length; cIdx++) {
      const key = `${targetIdx}-${cIdx}`;
      if ((gridValues[key] || "").toUpperCase() !== cleanWord[cIdx]) {
        setGridValues(prev => ({ ...prev, [key]: cleanWord[cIdx] }));
        setHintsUsed(prev => new Set(Array.from(prev).concat([key])));
        break;
      }
    }
  };

  const handleNext = () => {
    onComplete(completedWords.size, items.length);
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-6xl mx-auto flex flex-col min-h-[600px]">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
        
        {/* Left Side: The Grid Area */}
        <section className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-[#c2c6d6] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Word Master</h2>
              <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Fill in the blanks</p>
            </div>
            <div className="flex items-center gap-3 bg-green-100 px-4 py-2 rounded-full text-green-800 font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>{Math.round((completedWords.size / items.length) * 100)}%</span>
            </div>
          </div>

          <div className="flex-grow flex flex-col justify-center items-center gap-6 my-8">
            {items.map((item, wIdx) => {
              const cleanWord = item.word.replace(/\s+/g, '').toUpperCase();
              const isCompleted = completedWords.has(wIdx);
              
              return (
                <div key={wIdx} className={cn("flex gap-1", isCompleted ? "opacity-100 animate-[pulse-success_2s_infinite]" : "")}>
                  {/* Number Indicator */}
                  <div className="w-8 flex items-center justify-end pr-2 text-slate-400 font-bold text-sm">
                    {wIdx + 1}.
                  </div>
                  
                  {/* Word Cells */}
                  {Array.from(cleanWord).map((char, cIdx) => {
                    const key = `${wIdx}-${cIdx}`;
                    const isHinted = hintsUsed.has(key);
                    
                    return (
                      <div 
                        key={key} 
                        className={cn(
                          "relative w-10 h-10 md:w-12 md:h-12 bg-white rounded-md border shadow-sm flex items-center justify-center transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary",
                          isCompleted ? "border-green-500 bg-green-50 text-green-700" : "border-[#c2c6d6]",
                          isHinted && !isCompleted ? "bg-yellow-50 text-yellow-700" : ""
                        )}
                      >
                        <input 
                          ref={(el) => { inputRefs.current[key] = el; }}
                          type="text"
                          value={gridValues[key] || ""}
                          onChange={(e) => handleInputChange(wIdx, cIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, wIdx, cIdx)}
                          disabled={isCompleted}
                          className="w-full h-full text-center font-bold text-xl uppercase bg-transparent border-none focus:ring-0 p-0 outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="mt-auto flex justify-center gap-4 pt-4">
            <Button variant="outline" onClick={revealHint} disabled={isGameOver} className="px-6 py-6 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100">
              <Lightbulb className="w-5 h-5 text-yellow-500" /> Reveal Hint
            </Button>
            {isGameOver ? (
              <Button onClick={handleNext} className="px-8 py-6 rounded-xl font-bold flex items-center gap-2 bg-green-600 hover:bg-green-700 text-lg">
                <CheckCircle className="w-5 h-5" /> Finish
              </Button>
            ) : (
              <Button onClick={checkGrid} className="px-8 py-6 rounded-xl font-bold flex items-center gap-2 bg-primary hover:bg-blue-700 text-lg">
                <CheckCircle className="w-5 h-5" /> Check Grid
              </Button>
            )}
          </div>
        </section>

        {/* Right Side: Clues */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="bg-[#eff4ff] p-6 rounded-xl shadow-sm border border-[#c2c6d6]/50 h-full max-h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">?</div>
              <h3 className="text-xl font-bold text-slate-800">Clues</h3>
            </div>
            
            <div className="space-y-3 overflow-y-auto pr-2 flex-grow">
              {items.map((item, idx) => {
                const isCompleted = completedWords.has(idx);
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "p-4 border-l-4 rounded-r-lg transition-all duration-300",
                      isCompleted 
                        ? "bg-green-50 border-green-500 opacity-60" 
                        : "bg-white border-primary shadow-sm hover:translate-x-1"
                    )}
                  >
                    <p className={cn("text-xs font-bold mb-1 uppercase tracking-wider", isCompleted ? "text-green-700" : "text-primary")}>
                      Word {idx + 1}
                    </p>
                    <p className={cn("text-base font-medium leading-tight", isCompleted ? "text-green-900 line-through" : "text-slate-800")}>
                      {item.translation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-success {
          0% { border-color: #727785; }
          50% { border-color: #22c55e; box-shadow: 0 0 10px rgba(34, 197, 94, 0.3); }
          100% { border-color: #727785; }
        }
      `}} />
    </div>
  );
}
