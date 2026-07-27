"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, SkipForward, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
}

export interface DialogueCompletionProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function DialogueCompletionGame({ items, settings, onComplete }: DialogueCompletionProps) {
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
    if (isCorrect !== null) return;
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

  // Prepare dialogue
  const speakerA = `How do you use the word for "${currentItem.translation}"?`;
  const sentence = currentItem.exampleSentence || `I can use ${currentItem.word} in this sentence.`;
  const parts = sentence.split(new RegExp(`(${currentItem.word})`, 'gi'));
  
  const hasWord = parts.length > 1;
  const beforeText = hasWord ? parts[0] : "I am thinking of the word ";
  const afterText = hasWord ? parts.slice(2).join(currentItem.word) : " right now.";

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-4xl mx-auto flex flex-col min-h-[600px]">
      
      {/* Progress */}
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Level {currentIndex + 1}</span>
          <span className="text-xs font-bold text-primary">{Math.round(((currentIndex) / items.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-[#dce9ff] rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(59,130,246,0.6)]" 
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Gameplay Canvas */}
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 flex-grow">
        
        {/* Dialogue Section */}
        <div className={cn(
          "bg-[#eff4ff] rounded-3xl p-6 md:p-10 shadow-sm border relative overflow-hidden transition-all duration-300",
          isCorrect === true ? "border-green-500 ring-4 ring-green-500/20" : isCorrect === false ? "border-red-500 ring-4 ring-red-500/20" : "border-blue-200"
        )}>
          {/* Abstract background ornament */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col gap-6 relative z-10">
            
            {/* Character A */}
            <div className="flex items-end gap-3 self-start max-w-[85%]">
              <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-blue-200 border-2 border-blue-400 shadow-sm flex items-center justify-center">
                <User className="text-blue-500 w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-slate-500 px-2">Alex</span>
                <div className="relative bg-white p-4 shadow-sm border border-[#c2c6d6]/50 rounded-[1.5rem_1.5rem_1.5rem_0.25rem]">
                  <p className="text-slate-800 text-lg">{speakerA}</p>
                </div>
              </div>
            </div>

            {/* Character B */}
            <div className="flex items-end flex-row-reverse gap-3 self-end max-w-[85%]">
              <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-green-200 border-2 border-green-400 shadow-sm flex items-center justify-center">
                <User className="text-green-600 w-8 h-8" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[12px] font-bold text-slate-500 px-2 text-right">Sam</span>
                <div className="relative bg-primary text-white p-4 shadow-md rounded-[1.5rem_1.5rem_0.25rem_1.5rem]">
                  <p className="text-lg flex items-center flex-wrap gap-2">
                    {beforeText}
                    <span 
                      className={cn(
                        "inline-flex items-center justify-center min-w-[120px] h-9 px-3 transition-all duration-300 font-bold",
                        selectedWord 
                          ? isCorrect === true
                            ? "bg-green-400 text-green-900 rounded-lg shadow-sm"
                            : isCorrect === false
                              ? "bg-red-400 text-red-900 rounded-lg shadow-sm"
                              : "bg-white text-primary rounded-lg shadow-sm animate-bounce"
                          : "bg-white/20 border-2 border-dashed border-white/40 rounded-lg"
                      )}
                    >
                      {selectedWord || ""}
                    </span>
                    {afterText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <button 
              key={i}
              disabled={isCorrect !== null}
              onClick={() => selectWord(opt)}
              className={cn(
                "p-6 rounded-2xl flex items-center justify-between group transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1 active:mt-1",
                selectedWord === opt
                  ? "bg-blue-100 border-primary shadow-md"
                  : "bg-white border-[#c2c6d6] hover:border-primary hover:bg-blue-50"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
                  selectedWord === opt ? "bg-primary text-white" : "bg-[#eff4ff] text-primary group-hover:bg-primary group-hover:text-white"
                )}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="text-xl font-bold text-slate-800">{opt}</span>
              </div>
              {selectedWord === opt && (
                <CheckCircle className="text-primary w-6 h-6" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center gap-4 animate-in fade-in">
        {isCorrect === null ? (
          <Button size="lg" disabled={!selectedWord} onClick={checkAnswer} className="px-8 rounded-full shadow-md text-lg h-14">
            <CheckCircle className="w-5 h-5 mr-2" /> Check Match
          </Button>
        ) : (
          <Button size="lg" onClick={handleNext} className="px-8 rounded-full shadow-md text-lg h-14 bg-green-600 hover:bg-green-700">
            {currentIndex < items.length - 1 ? "Next Dialogue" : "Finish Game"} 
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

    </div>
  );
}
