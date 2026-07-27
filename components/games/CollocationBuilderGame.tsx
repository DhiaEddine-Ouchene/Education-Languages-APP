"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Lightbulb, PlayCircle, SkipForward, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
}

export interface CollocationBuilderProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function CollocationBuilderGame({ items, settings, onComplete }: CollocationBuilderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [baseWord, setBaseWord] = useState("");
  const [correctSuffix, setCorrectSuffix] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!currentItem) return;
    
    // Attempt to split the word into base and suffix (e.g. "make a mistake" -> "make", "a mistake")
    // If it's a single word, just use the translation as base
    const parts = currentItem.word.split(" ");
    let base = parts[0];
    let suffix = parts.slice(1).join(" ");
    
    if (parts.length === 1) {
      base = currentItem.translation;
      suffix = currentItem.word;
    }
    
    setBaseWord(base);
    setCorrectSuffix(suffix);

    // Generate decoys from other items
    const allSuffixes = items
      .filter((_, i) => i !== currentIndex)
      .map(item => {
        const p = item.word.split(" ");
        return p.length > 1 ? p.slice(1).join(" ") : item.word;
      });
      
    // Shuffle and pick 3 decoys
    const shuffledSuffixes = allSuffixes.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Add correct option and shuffle all
    const allOptions = [...shuffledSuffixes, suffix].sort(() => 0.5 - Math.random());
    // Ensure we have 4 options even if there weren't enough items
    while (allOptions.length < 4) {
      allOptions.push("some " + Math.random().toString(36).substring(7));
    }
    
    setOptions(allOptions.slice(0, 4));
    setSelectedOption(null);
    setIsCorrect(null);
  }, [currentIndex, items]);

  const handleSelect = (opt: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt);
    const correct = opt === correctSuffix;
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

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-4xl mx-auto flex flex-col gap-8 min-h-[600px]">
      
      {/* Progress Bar */}
      <div className="w-full bg-[#e5eeff] rounded-full h-3 overflow-hidden">
        <div 
          className="bg-primary h-full transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          style={{ width: `${((currentIndex) / items.length) * 100}%` }}
        />
      </div>
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Collocation Builder</span>
        <h2 className="text-3xl font-bold text-slate-800">Which one sounds right?</h2>
        <p className="text-slate-500 max-w-xl mx-auto">Pair the base word with its most natural partner to build a common expression.</p>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-grow">
        
        {/* Base Word Card */}
        <div className="md:col-span-4 flex flex-col">
          <div className="bg-primary p-8 rounded-xl flex flex-col items-center justify-center text-center h-full border-b-4 border-blue-800 shadow-lg">
            <span className="text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">Base Word</span>
            <div className="text-4xl font-bold text-white capitalize">{baseWord}</div>
          </div>
        </div>
        
        {/* Visual Connection */}
        <div className="hidden md:flex md:col-span-1 items-center justify-center">
          <div className="w-full h-1 bg-gradient-to-r from-primary to-blue-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.4)]"></div>
        </div>
        
        {/* Options Grid */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((opt, i) => {
            const isSelected = selectedOption === opt;
            const isWinner = isSelected && isCorrect;
            const isLoser = isSelected && !isCorrect;
            const showCorrect = selectedOption !== null && opt === correctSuffix;

            return (
              <button 
                key={i}
                onClick={() => handleSelect(opt)}
                disabled={selectedOption !== null}
                className={cn(
                  "bg-white border-2 p-6 rounded-xl flex items-center justify-between group transition-all text-left",
                  selectedOption === null ? "border-[#c2c6d6] hover:border-primary hover:shadow-md hover:-translate-y-1 cursor-pointer" : "cursor-default opacity-80",
                  isWinner || showCorrect ? "bg-green-50 border-green-500 text-green-700 opacity-100" : "",
                  isLoser ? "bg-red-50 border-red-500 text-red-700 animate-[shake_0.2s_ease-in-out_2]" : ""
                )}
              >
                <div className="flex flex-col">
                  <span className="text-lg font-medium">{opt}</span>
                </div>
                {isWinner || showCorrect ? (
                  <CheckCircle className="text-green-500 w-6 h-6" />
                ) : isLoser ? (
                  <XCircle className="text-red-500 w-6 h-6" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-primary/50" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tip section */}
      {currentItem.exampleSentence && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mt-4">
          <Lightbulb className="text-primary w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Example Usage</div>
            <p className="text-slate-700 text-sm italic">"{currentItem.exampleSentence}"</p>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      {selectedOption !== null && (
        <div className="flex justify-end mt-4 animate-in fade-in slide-in-from-bottom-4">
          <Button size="lg" onClick={handleNext} className="w-full sm:w-auto text-lg px-8">
            {currentIndex < items.length - 1 ? "Next Word" : "Finish Game"} 
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}} />
    </div>
  );
}
