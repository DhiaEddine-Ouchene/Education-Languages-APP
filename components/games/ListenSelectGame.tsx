"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Play, Pause, ArrowRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
  imageUrl?: string | null;
}

export interface ListenSelectProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function ListenSelectGame({ items, settings, onComplete }: ListenSelectProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  const [options, setOptions] = useState<GameItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const currentItem = items[currentIndex];
  const targetText = currentItem?.word || "";

  useEffect(() => {
    if (!currentItem) return;
    
    // Generate 3 decoys
    const decoys = items.filter(item => item.id !== currentItem.id);
    const shuffledDecoys = decoys.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Fallback if not enough decoys (we just make mock items)
    while (shuffledDecoys.length < 3) {
      shuffledDecoys.push({
        id: `mock-${Math.random()}`,
        word: `Decoy Word`,
        translation: `Decoy ${shuffledDecoys.length + 1}`
      });
    }
    
    const allOptions = [...shuffledDecoys, currentItem].sort(() => 0.5 - Math.random());
    
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
      const utterance = new SpeechSynthesisUtterance(targetText);
      utterance.rate = 0.9;
      
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
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Listen & Select • {currentIndex + 1} of {items.length}</span>
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
      <div className="text-center space-y-2 mb-8 z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Listen and Select</h2>
        <p className="text-slate-500 font-medium">Tap the button to hear the word, then pick the matching translation.</p>
      </div>

      {/* Big Play Button */}
      <div className="flex justify-center mb-10 z-10">
        <div className="relative group cursor-pointer active:scale-95 transition-transform duration-150" onClick={playAudio}>
          <div className={cn(
            "absolute -inset-2 rounded-full border-2 border-primary transition-all duration-500 opacity-20",
            isPlaying ? "animate-ping border-4 scale-150" : "group-hover:scale-110"
          )}></div>
          <button className="relative w-28 h-28 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_6px_0_#1e40af] active:shadow-none active:translate-y-[6px] transition-all">
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 text-white ml-2" />
            )}
          </button>
        </div>
      </div>

      {/* Grid Selection */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg z-10">
        {options.map((opt, i) => {
          const isSelected = selectedItemId === opt.id;
          const showCorrect = isCorrect !== null && opt.id === currentItem.id;
          const showWrong = isCorrect === false && isSelected;
          
          return (
            <div 
              key={i}
              onClick={() => selectCard(opt.id)}
              className={cn(
                "group relative flex flex-col bg-white border-2 rounded-2xl p-2 cursor-pointer transition-all shadow-sm active:scale-[0.98]",
                isSelected && isCorrect === null ? "bg-blue-50 border-blue-600" : "border-[#c2c6d6] hover:border-blue-400",
                showCorrect ? "bg-green-50 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-[pulse-correct_1s_infinite]" : "",
                showWrong ? "bg-red-50 border-red-500 animate-[shake_0.4s_ease-in-out]" : "",
                isCorrect !== null && !showCorrect && !showWrong ? "opacity-50" : ""
              )}
            >
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-3 flex items-center justify-center relative">
                {opt.imageUrl ? (
                  <img src={opt.imageUrl} alt={opt.translation} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex flex-col items-center justify-center p-4">
                    <ImageIcon className="w-10 h-10 text-indigo-300 mb-2 opacity-50" />
                    <span className="font-bold text-center text-indigo-900 break-words line-clamp-3 w-full capitalize text-lg">{opt.translation}</span>
                  </div>
                )}
                
                {/* Correct/Wrong Indicator Overlay */}
                {showCorrect && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-md">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <span className={cn(
                "font-bold text-center pb-2 px-2 capitalize",
                isSelected && isCorrect === null ? "text-blue-700" : "text-slate-600",
                showCorrect ? "text-green-700" : "",
                showWrong ? "text-red-700" : ""
              )}>
                {opt.translation}
              </span>
            </div>
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
        @keyframes pulse-correct {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
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
