"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Play, Pause, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
  imageUrl?: string | null;
}

export interface MinimalPairProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function MinimalPairMatchGame({ items, settings, onComplete }: MinimalPairProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  const [options, setOptions] = useState<GameItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!currentItem) return;
    
    // Find a decoy that is somewhat similar (same length or starts with same letter) if possible
    const others = items.filter(item => item.id !== currentItem.id);
    
    let decoy = others.find(item => item.word.charAt(0).toLowerCase() === currentItem.word.charAt(0).toLowerCase());
    
    if (!decoy && others.length > 0) {
      decoy = others[Math.floor(Math.random() * others.length)];
    }
    
    // Fallback if there is literally no other item
    if (!decoy) {
      decoy = {
        id: `mock-${Math.random()}`,
        word: currentItem.word + "s", // simple plural as minimal pair decoy
        translation: "Similar word"
      };
    }
    
    const allOptions = [decoy, currentItem].sort(() => 0.5 - Math.random());
    
    setOptions(allOptions);
    setSelectedItemId(null);
    setIsCorrect(null);
    setIsPlaying(false);
  }, [currentIndex, items]);

  const selectCard = (id: string) => {
    if (isCorrect !== null) return;
    setSelectedItemId(id);
  };

  const checkAnswer = () => {
    if (!selectedItemId || isCorrect !== null) return;
    
    const correct = selectedItemId === currentItem.id;
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

  const playAudio = () => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(currentItem.word);
      utterance.rate = 0.85; // Slower for clear pronunciation
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!currentItem) return null;

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-4xl mx-auto flex flex-col items-center min-h-[600px] relative overflow-hidden">
      
      {/* Progress */}
      <div className="w-full max-w-2xl mb-10 z-10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sound Match • {currentIndex + 1} of {items.length}</span>
          <span className="text-lg font-bold text-primary">{Math.round(((currentIndex) / items.length) * 100)}%</span>
        </div>
        <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] rounded-full transition-all duration-500" 
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Instruction */}
      <div className="text-center space-y-2 mb-10 z-10">
        <h2 className="text-3xl font-bold text-primary">Which word did you hear?</h2>
        <p className="text-slate-500 font-medium">Tap the speaker to play the audio.</p>
      </div>

      {/* Big Play Button */}
      <div className="flex justify-center mb-12 z-10">
        <div className="relative group cursor-pointer active:scale-95 transition-transform duration-150" onClick={playAudio}>
          <div className={cn(
            "absolute -inset-4 bg-primary/10 rounded-full blur-xl transition-opacity duration-300",
            isPlaying ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100"
          )}></div>
          <button className={cn(
            "relative w-28 h-28 md:w-32 md:h-32 bg-primary rounded-full flex items-center justify-center text-white shadow-[0_8px_0_#004395] hover:shadow-[0_10px_0_#004395] active:translate-y-2 active:shadow-none transition-all",
            isPlaying ? "animate-[pulse-ring_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" : ""
          )}>
            {isPlaying ? (
              <Pause className="w-14 h-14" />
            ) : (
              <Play className="w-14 h-14 ml-2" />
            )}
          </button>
        </div>
      </div>

      {/* Grid Selection (Minimal Pairs are usually just 2 options) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg z-10">
        {options.map((opt, i) => {
          const isSelected = selectedItemId === opt.id;
          const showCorrect = isCorrect !== null && opt.id === currentItem.id;
          const showWrong = isCorrect === false && isSelected;
          
          return (
            <button 
              key={i}
              disabled={isCorrect !== null}
              onClick={() => selectCard(opt.id)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl transition-all shadow-[0_6px_0_rgba(114,119,133,0.2)] active:translate-y-1 active:shadow-[0_2px_0_rgba(114,119,133,0.2)]",
                isSelected && isCorrect === null ? "bg-blue-100 border-2 border-primary shadow-[0_6px_0_#adc6ff]" : "bg-white border-2 border-[#c2c6d6] hover:border-blue-400",
                showCorrect ? "bg-green-100 border-green-500 shadow-[0_6px_0_#86efac] animate-[pulse-correct_1s_infinite]" : "",
                showWrong ? "bg-red-100 border-red-500 shadow-[0_6px_0_#fca5a5] animate-[shake_0.4s_ease-in-out]" : "",
                isCorrect !== null && !showCorrect && !showWrong ? "opacity-50" : ""
              )}
            >
              {/* Image if available */}
              {opt.imageUrl && (
                <div className="w-full h-32 rounded-xl overflow-hidden mb-2">
                  <img src={opt.imageUrl} alt={opt.word} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              
              <span className={cn(
                "text-3xl font-bold tracking-wide capitalize",
                isSelected && isCorrect === null ? "text-blue-800" : "text-slate-800",
                showCorrect ? "text-green-800" : "",
                showWrong ? "text-red-800" : ""
              )}>
                {opt.word}
              </span>
              
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">{opt.translation}</span>
              
              {/* Indicator Overlay */}
              {showCorrect && (
                <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-1 shadow-md">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-12 flex justify-center w-full max-w-2xl animate-in fade-in z-10">
        {isCorrect === null ? (
          <Button 
            size="lg" 
            disabled={!selectedItemId} 
            onClick={checkAnswer} 
            className="w-full md:w-auto md:px-20 rounded-full shadow-md text-lg h-14 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            <CheckCircle className="w-5 h-5 mr-2" /> Check
          </Button>
        ) : (
          <Button 
            size="lg" 
            onClick={handleNext} 
            className="w-full md:w-auto md:px-20 rounded-full shadow-md text-lg h-14 bg-green-600 hover:bg-green-700 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            {currentIndex < items.length - 1 ? "Next Word" : "Finish Game"} 
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes pulse-correct {
          0%, 100% { border-color: #22c55e; }
          50% { border-color: #16a34a; box-shadow: 0 0 15px rgba(34, 197, 94, 0.5); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}} />
    </div>
  );
}
