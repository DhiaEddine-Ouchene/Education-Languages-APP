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
}

export interface ListenFillGapProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function ListenFillGapGame({ items, settings, onComplete }: ListenFillGapProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  const [options, setOptions] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const currentItem = items[currentIndex];
  
  // Use example sentence if available, else fallback to a generic sentence using the word
  const targetText = currentItem?.exampleSentence || `The word is ${currentItem?.word}.`;
  
  // Split the sentence into parts for the gap
  const regex = new RegExp(`(${currentItem?.word})`, 'gi');
  const sentenceParts = targetText.split(regex);

  useEffect(() => {
    if (!currentItem) return;
    
    // Generate decoys from other items' words
    const decoys = items
      .filter(item => item.id !== currentItem.id)
      .map(item => item.word);
      
    // Shuffle and pick 2 decoys (for 3 total options)
    const shuffledDecoys = decoys.sort(() => 0.5 - Math.random()).slice(0, 2);
    
    // Fallback if not enough decoys
    while (shuffledDecoys.length < 2) {
      shuffledDecoys.push("decoy_" + Math.random().toString(36).substring(7));
    }
    
    const allOptions = [...shuffledDecoys, currentItem.word].sort(() => 0.5 - Math.random());
    
    setOptions(allOptions);
    setSelectedWord(null);
    setIsCorrect(null);
    setIsPlaying(false);
  }, [currentIndex, items]);

  const selectWord = (word: string) => {
    if (isCorrect !== null) return;
    setSelectedWord(word);
  };

  const checkAnswer = () => {
    if (!selectedWord || isCorrect !== null) return;
    
    const correct = selectedWord.toLowerCase() === currentItem.word.toLowerCase();
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
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-300 blur-[100px]"></div>
      </div>

      {/* Progress */}
      <div className="w-full max-w-2xl mb-10 z-10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Listen & Fill Gap • {currentIndex + 1} of {items.length}</span>
          <span className="text-lg font-bold text-primary">{Math.round(((currentIndex) / items.length) * 100)}%</span>
        </div>
        <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.6)] rounded-full transition-all duration-500" 
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Play Button Focal Point */}
      <div className="flex flex-col items-center mb-12 z-10">
        <div className="relative group cursor-pointer active:scale-95 transition-transform duration-150" onClick={playAudio}>
          <div className={cn(
            "absolute inset-0 rounded-full transition-all duration-500 opacity-20",
            isPlaying ? "bg-primary animate-ping scale-150" : "bg-primary group-hover:scale-110"
          )}></div>
          <button className="relative w-32 h-32 md:w-40 md:h-40 bg-primary rounded-full flex items-center justify-center shadow-[0_8px_0_#004395] active:shadow-[0_0px_0_#004395] active:translate-y-[8px] transition-all">
            {isPlaying ? (
              <Pause className="w-16 h-16 text-white" />
            ) : (
              <Play className="w-16 h-16 text-white ml-2" />
            )}
          </button>
        </div>
      </div>

      {/* Sentence Display */}
      <div className="w-full text-center space-y-6 max-w-3xl z-10">
        <div className="bg-white p-8 rounded-3xl border-2 border-[#c2c6d6] shadow-sm inline-block w-full max-w-2xl animate-[floating_3s_ease-in-out_infinite]">
          <p className="text-2xl md:text-3xl text-slate-800 leading-relaxed font-medium">
            {sentenceParts.map((part, index) => {
              if (part.toLowerCase() === currentItem.word.toLowerCase()) {
                return (
                  <span 
                    key={index}
                    className={cn(
                      "inline-block min-w-[120px] px-4 py-1 mx-2 transition-colors duration-300 border-b-4",
                      selectedWord 
                        ? (isCorrect === true ? "text-green-600 border-green-600 bg-green-50 font-bold" : isCorrect === false ? "text-red-600 border-red-600 bg-red-50 font-bold" : "text-primary border-primary bg-blue-50 font-bold")
                        : "border-[#c2c6d6] text-[#c2c6d6]"
                    )}
                  >
                    {selectedWord || "_______"}
                  </span>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </p>
        </div>

        {/* Word Bank Chips */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {options.map((opt, i) => {
            const isSelected = selectedWord === opt;
            const disabled = isCorrect !== null;
            
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => selectWord(opt)}
                className={cn(
                  "px-8 py-4 rounded-2xl text-xl font-bold transition-all",
                  disabled && !isSelected ? "opacity-50" : "",
                  isSelected 
                    ? (isCorrect === true ? "bg-green-500 text-white shadow-[0_4px_0_#166534]" : isCorrect === false ? "bg-red-500 text-white shadow-[0_4px_0_#991b1b] animate-[shake_0.4s_ease-in-out]" : "bg-blue-600 text-white shadow-[0_4px_0_#004395]")
                    : "bg-white border border-[#c2c6d6] text-slate-800 shadow-[0_4px_0_#e2e8f0] hover:bg-slate-50 hover:-translate-y-1 active:shadow-none active:translate-y-1"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-12 flex justify-center w-full max-w-2xl animate-in fade-in z-10">
        {isCorrect === null ? (
          <Button 
            size="lg" 
            disabled={!selectedWord} 
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
            {currentIndex < items.length - 1 ? "Next Audio" : "Finish Game"} 
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
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
