"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, ArrowRight, Lightbulb, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
  imageUrl?: string | null; // Added for future support
}

export interface PictureToWordProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function PictureToWordGame({ items, settings, onComplete }: PictureToWordProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  
  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!currentItem) return;
    
    // Generate decoys
    const decoys = items
      .filter((_, i) => i !== currentIndex)
      .map(item => item.word);
      
    const shuffledDecoys = decoys.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Pad if not enough items
    while (shuffledDecoys.length < 3) {
      shuffledDecoys.push("Decoy " + Math.random().toString(36).substring(7));
    }
    
    const allOptions = [...shuffledDecoys, currentItem.word].sort(() => 0.5 - Math.random());
    
    setOptions(allOptions);
    setSelectedWord(null);
    setIsCorrect(null);
    setShowHint(false);
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

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-6xl mx-auto flex flex-col min-h-[600px]">
      
      {/* Progress Indicator */}
      <div className="w-full max-w-2xl mx-auto mb-10">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Level {currentIndex + 1} • Picture Quiz</span>
          <span className="text-lg font-bold text-primary">{Math.round(((currentIndex) / items.length) * 100)}%</span>
        </div>
        <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#4edea3] shadow-[0_0_15px_rgba(108,248,187,0.4)] rounded-full transition-all duration-500" 
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Grid Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-5xl mx-auto flex-grow">
        
        {/* Left Col: Image / Visual */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white border border-[#c2c6d6] rounded-xl overflow-hidden shadow-sm p-2 transition-all duration-300 hover:-translate-y-1">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center group">
              {currentItem.imageUrl ? (
                <img src={currentItem.imageUrl} alt={currentItem.word} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                  <div className="text-center p-8 z-10 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <ImageIcon className="w-16 h-16 text-white/80 mx-auto mb-4" />
                    <p className="text-white text-2xl font-bold italic tracking-wide drop-shadow-md">"{currentItem.translation}"</p>
                  </div>
                </div>
              )}
              
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setShowHint(true)}
                  disabled={showHint || !currentItem.exampleSentence}
                  className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 hover:bg-white transition-colors disabled:opacity-50"
                >
                  <Lightbulb className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-bold text-slate-700">Hint</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-slate-600 text-center font-medium">
              Identify the concept in the visual and select the most accurate term.
            </p>
          </div>
          
          {showHint && currentItem.exampleSentence && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
              <Lightbulb className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <p className="text-yellow-800 text-sm">
                <span className="font-bold">Usage Hint:</span> {currentItem.exampleSentence.replace(new RegExp(currentItem.word, 'gi'), '_____')}
              </p>
            </div>
          )}
        </div>
        
        {/* Right Col: Options */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4">
            {options.map((opt, i) => {
              const isSelected = selectedWord === opt;
              const showCorrect = isCorrect !== null && opt === currentItem.word;
              const showWrong = isCorrect === false && isSelected;
              
              return (
                <button 
                  key={i}
                  disabled={isCorrect !== null}
                  onClick={() => selectWord(opt)}
                  className={cn(
                    "group w-full text-left p-6 rounded-xl shadow-sm transition-all duration-200 active:translate-y-0.5",
                    isSelected 
                      ? "bg-blue-50 border-2 border-primary shadow-md" 
                      : "bg-white border border-[#c2c6d6] hover:bg-[#eff4ff] hover:border-blue-300",
                    showCorrect ? "bg-green-100 border-2 border-green-500 animate-[pulse-correct_1s_infinite]" : "",
                    showWrong ? "bg-red-100 border-2 border-red-500 animate-[shake_0.4s_ease-in-out]" : "",
                    isCorrect !== null && !isSelected && !showCorrect ? "opacity-50" : ""
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xl font-bold capitalize transition-colors",
                      isSelected ? "text-primary" : "text-slate-700 group-hover:text-primary",
                      showCorrect ? "text-green-800" : "",
                      showWrong ? "text-red-800" : ""
                    )}>
                      {opt}
                    </span>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected ? "border-primary" : "border-slate-300 group-hover:border-primary",
                      showCorrect ? "border-transparent bg-green-500" : "",
                      showWrong ? "border-transparent bg-red-500" : ""
                    )}>
                      {showCorrect && <CheckCircle className="w-6 h-6 text-white" />}
                      {isSelected && !showCorrect && !showWrong && <div className="w-3 h-3 bg-primary rounded-full" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center animate-in fade-in">
        {isCorrect === null ? (
          <Button size="lg" disabled={!selectedWord} onClick={checkAnswer} className="px-12 rounded-full shadow-md text-lg h-14 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all">
            <CheckCircle className="w-5 h-5 mr-2" /> Check
          </Button>
        ) : (
          <Button size="lg" onClick={handleNext} className="px-12 rounded-full shadow-md text-lg h-14 bg-green-600 hover:bg-green-700 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all">
            {currentIndex < items.length - 1 ? "Next Question" : "Finish Game"} 
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes pulse-correct {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
        }
      `}} />
    </div>
  );
}
