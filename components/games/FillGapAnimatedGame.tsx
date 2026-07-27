"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, SkipForward, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
}

export interface FillGapAnimatedProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function FillGapAnimatedGame({ items, settings, onComplete }: FillGapAnimatedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!currentItem) return;
    
    // Generate decoys from other items
    const decoys = items
      .filter((_, i) => i !== currentIndex)
      .map(item => item.word);
      
    // Shuffle and pick 3 decoys
    const shuffledDecoys = decoys.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Add correct option and shuffle all
    const allOptions = [...shuffledDecoys, currentItem.word].sort(() => 0.5 - Math.random());
    while (allOptions.length < 4) {
      allOptions.push("decoy_" + Math.random().toString(36).substring(7));
    }
    
    setOptions(allOptions.slice(0, 4));
    setSelectedWord(null);
    setIsCorrect(null);
  }, [currentIndex, items]);

  const selectWord = (word: string) => {
    if (isCorrect !== null) return; // locked after checking
    setSelectedWord(word);
  };

  const checkAnswer = () => {
    if (!selectedWord || isCorrect !== null) return;
    const correct = selectedWord === currentItem.word;
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

  // Prepare sentence
  const sentence = currentItem.exampleSentence || `The correct answer is ${currentItem.word} in this sentence.`;
  // Simple replacement, ignoring case optionally but here assuming exact or close
  const parts = sentence.split(new RegExp(`(${currentItem.word})`, 'gi'));
  
  const hasWord = parts.length > 1;
  const beforeText = hasWord ? parts[0] : "I need to ";
  const afterText = hasWord ? parts.slice(2).join(currentItem.word) : " this blank.";

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-4xl mx-auto flex flex-col items-center min-h-[500px]">
      
      {/* Progress */}
      <div className="w-full max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-bold text-primary uppercase">Question {currentIndex + 1}/{items.length}</span>
        </div>
        <div className="h-3 w-full bg-[#e5eeff] rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-full transition-all duration-700 relative overflow-hidden"
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer-pulse_2s_infinite]" />
          </div>
        </div>
      </div>

      {/* Game Card */}
      <div className="w-full max-w-3xl bg-white border border-[#c2c6d6] rounded-xl p-8 md:p-12 shadow-lg flex flex-col items-center gap-10 animate-in fade-in zoom-in-95">
        
        {/* The Sentence */}
        <div className="text-center leading-relaxed">
          <p className="text-2xl md:text-3xl font-semibold text-slate-800 leading-loose">
            {beforeText}
            <span 
              className={cn(
                "inline-flex min-w-[140px] h-[40px] md:h-[50px] mx-2 align-bottom rounded-t-lg transition-all duration-300 items-center justify-center border-b-4",
                selectedWord 
                  ? isCorrect === true
                    ? "border-green-500 text-green-700 bg-green-100/50 animate-[success-pop_0.4s_ease-out]"
                    : isCorrect === false
                      ? "border-red-500 text-red-700 bg-red-100/50 animate-[shake_0.2s_ease-in-out_2]"
                      : "border-primary text-primary bg-blue-50"
                  : "bg-[#eff4ff] border-blue-200 text-transparent"
              )}
              style={!selectedWord ? {
                backgroundImage: 'linear-gradient(to right, #3b82f6 50%, transparent 50%)',
                backgroundSize: '15px 4px',
                backgroundRepeat: 'repeat-x',
                backgroundPosition: 'bottom',
                borderBottom: 'none'
              } : {}}
            >
              {selectedWord || "___"}
            </span> 
            {afterText}
          </p>
        </div>

        {/* Word Bank */}
        <div className="w-full">
          <p className="text-center text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">Select the correct word</p>
          <div className="flex flex-wrap justify-center gap-4">
            {options.map((opt, i) => (
              <button 
                key={i}
                onClick={() => selectWord(opt)}
                disabled={isCorrect !== null}
                className={cn(
                  "border rounded-xl px-6 py-3 text-lg font-bold shadow-sm transition-all duration-200",
                  selectedWord === opt
                    ? isCorrect === true
                      ? "bg-green-100 border-green-500 text-green-700"
                      : isCorrect === false
                        ? "bg-red-100 border-red-500 text-red-700"
                        : "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-[#c2c6d6] text-blue-600 hover:border-blue-500 hover:bg-[#eff4ff] hover:scale-105 active:scale-95",
                  isCorrect !== null && selectedWord !== opt ? "opacity-50" : ""
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-4 animate-in fade-in">
        {isCorrect === null ? (
          <Button size="lg" disabled={!selectedWord} onClick={checkAnswer} className="px-8 rounded-full shadow-md text-lg h-14">
            <CheckCircle className="w-5 h-5 mr-2" /> Check Answer
          </Button>
        ) : (
          <Button size="lg" onClick={handleNext} className="px-8 rounded-full shadow-md text-lg h-14 bg-green-600 hover:bg-green-700">
            {currentIndex < items.length - 1 ? "Next Question" : "Finish Game"} 
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer-pulse {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes success-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }
          100% { transform: scale(1); }
        }
      `}} />
    </div>
  );
}
