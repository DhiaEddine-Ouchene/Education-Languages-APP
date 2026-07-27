"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  synonym?: string | null;
  antonym?: string | null;
  translation?: string | null; // For fallback compatibility
}

export interface SynonymAntonymProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function SynonymAntonymGame({ items, settings, onComplete }: SynonymAntonymProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Randomly select whether this turn is asking for a synonym or antonym
  const [mode, setMode] = useState<"synonym" | "antonym">("synonym");
  
  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!currentItem) return;
    
    // Determine what field we are targeting (synonym or antonym)
    // Fallback to "translation" if the item is from the old builder
    const hasAntonym = !!currentItem.antonym;
    const hasSynonym = !!currentItem.synonym;
    
    let currentMode: "synonym" | "antonym" = "synonym";
    if (hasAntonym && hasSynonym) {
      currentMode = Math.random() > 0.5 ? "synonym" : "antonym";
    } else if (hasAntonym) {
      currentMode = "antonym";
    }
    setMode(currentMode);
    
    // Determine the correct answer string based on the chosen mode
    let correctAnswer = "";
    let decoysSource: string[] = [];
    
    if (currentMode === "synonym") {
      correctAnswer = currentItem.synonym || currentItem.translation || "";
      decoysSource = items.filter((_, i) => i !== currentIndex).map(item => item.synonym || item.translation || "");
    } else {
      correctAnswer = currentItem.antonym || "";
      decoysSource = items.filter((_, i) => i !== currentIndex).map(item => item.antonym || "");
    }
      
    // Shuffle and pick 3 decoys
    const shuffledDecoys = decoysSource.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Add correct option and shuffle all
    const allOptions = [...shuffledDecoys, correctAnswer].sort(() => 0.5 - Math.random());
    while (allOptions.length < 4) {
      allOptions.push("decoy_" + Math.random().toString(36).substring(7));
    }
    
    setOptions(allOptions.slice(0, 4));
    setSelectedWord(null);
    setIsCorrect(null);
  }, [currentIndex, items]);

  // Determine correct answer based on current mode for checking logic
  const getCorrectAnswer = () => {
    if (!currentItem) return "";
    return mode === "synonym" ? (currentItem.synonym || currentItem.translation || "") : (currentItem.antonym || "");
  };

  const selectWord = (word: string) => {
    if (isCorrect !== null) return;
    setSelectedWord(word);
    
    // Auto check
    const correct = word === getCorrectAnswer();
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      onComplete(score, items.length);
    }
  };

  if (!currentItem) return null;

  const modeTheme = mode === "synonym" ? "bg-green-500 text-white" : "bg-red-500 text-white";
  const modeText = mode === "synonym" ? "Find the SYNONYM (Same meaning)" : "Find the ANTONYM (Opposite meaning)";

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-5xl mx-auto flex flex-col min-h-[600px] relative overflow-hidden">
      
      {/* Atmosphere Decor */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Progress */}
      <div className="w-full max-w-2xl mx-auto mb-8 z-10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Level {currentIndex + 1}</span>
          <span className="text-xs font-bold text-primary">{Math.round(((currentIndex) / items.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-[#dce9ff] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#4edea3] shadow-[0_0_15px_rgba(78,222,163,0.5)] rounded-full transition-all duration-700" 
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="mb-12 flex flex-col items-center gap-4 z-10">
        <div className={cn("px-8 py-2.5 rounded-full text-sm font-bold shadow-md uppercase tracking-wide", modeTheme)}>
          {modeText}
        </div>
        <p className="text-slate-500 animate-pulse text-lg">Choose the correct match!</p>
      </div>

      {/* Gameplay Canvas */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 gap-12 z-10 flex-grow">
        
        {/* Target Word Card */}
        <div className="flex justify-center">
          <div className="bg-white border border-[#c2c6d6] rounded-2xl p-12 w-full max-w-md flex flex-col items-center gap-4 shadow-sm text-center relative">
            <span className="absolute top-4 left-4 text-xs font-bold text-primary tracking-widest uppercase">Target Word</span>
            <h2 className="text-2xl font-bold text-slate-500 opacity-70">
              What is the <strong className={mode === "synonym" ? "text-green-500" : "text-red-500"}>{mode}</strong> for:
            </h2>
            <div className="text-4xl font-bold text-primary py-4">
              {currentItem.word}
            </div>
            <div className="w-16 h-1 bg-primary/20 rounded-full"></div>
          </div>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0">
          {options.map((opt, i) => {
            const isSelected = selectedWord === opt;
            const isWinner = isSelected && isCorrect;
            const isLoser = isSelected && !isCorrect;
            const showCorrect = selectedWord !== null && opt === getCorrectAnswer();

            return (
              <button 
                key={i}
                disabled={selectedWord !== null}
                onClick={() => selectWord(opt)}
                className={cn(
                  "group p-8 rounded-2xl flex flex-col items-center justify-center gap-4 shadow-sm transition-all duration-200 border-b-4 active:translate-y-1 active:border-b-0",
                  selectedWord === null ? "bg-white border-[#c2c6d6] hover:border-blue-400 hover:-translate-y-1 hover:shadow-md cursor-pointer" : "cursor-default opacity-90",
                  isWinner || showCorrect ? "border-green-500 bg-green-100 text-green-800 animate-bounce" : "",
                  isLoser ? "border-red-500 bg-red-100 text-red-800 animate-[shake_0.4s_ease-in-out]" : ""
                )}
              >
                <span className="text-2xl font-bold transition-colors">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {selectedWord !== null && (
        <div className="mt-8 flex justify-center gap-4 animate-in fade-in z-10">
          <Button size="lg" onClick={handleNext} className="px-8 rounded-full shadow-md text-lg h-14 bg-green-600 hover:bg-green-700">
            {currentIndex < items.length - 1 ? "Next Word" : "Finish Game"} 
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}} />
    </div>
  );
}
