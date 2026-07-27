"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Play, Pause, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
}

export interface DictationChallengeProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function DictationChallengeGame({ items, settings, onComplete }: DictationChallengeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  const [inputValue, setInputValue] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // 0: no hint, 1: word count, 2: some letters
  
  const currentItem = items[currentIndex];
  
  // Use example sentence if available, else fallback to a generic sentence using the word
  const targetText = currentItem?.exampleSentence || `The word is ${currentItem?.word}.`;

  useEffect(() => {
    setInputValue("");
    setIsCorrect(null);
    setShowHint(false);
    setHintLevel(0);
    setIsPlaying(false);
  }, [currentIndex, items]);

  const cleanString = (str: string) => {
    return str.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
  };

  const checkAnswer = () => {
    if (isCorrect !== null) return;
    
    const isMatch = cleanString(inputValue) === cleanString(targetText);
    setIsCorrect(isMatch);
    
    if (isMatch) {
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
      utterance.rate = 0.9; // Slightly slower for dictation
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.cancel(); // Stop any current speech
      window.speechSynthesis.speak(utterance);
    }
  };

  const requestHint = () => {
    setShowHint(true);
    setHintLevel(l => Math.min(l + 1, 2));
  };

  const getHintText = () => {
    if (hintLevel === 1) {
      const words = targetText.split(' ');
      return `The sentence has ${words.length} words.`;
    }
    if (hintLevel === 2) {
      const words = targetText.split(' ');
      return words.map(w => w.length > 3 ? w.substring(0, 2) + '*'.repeat(w.length - 2) : '*'.repeat(w.length)).join(' ');
    }
    return "";
  };

  if (!currentItem) return null;

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-4xl mx-auto flex flex-col items-center min-h-[600px] relative">
      
      {/* Progress */}
      <div className="w-full max-w-2xl mb-10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dictation • Level {currentIndex + 1}</span>
          <span className="text-lg font-bold text-primary">{Math.round(((currentIndex) / items.length) * 100)}%</span>
        </div>
        <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] rounded-full transition-all duration-500" 
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Play Button Focal Point */}
      <div className="flex flex-col items-center mb-12">
        <div className="relative group">
          <div className={cn(
            "absolute -inset-4 rounded-full blur-xl transition-all duration-300",
            isPlaying ? "bg-blue-400/40 animate-pulse" : "bg-blue-500/10 group-hover:bg-blue-500/20"
          )}></div>
          <button 
            onClick={playAudio}
            className="relative w-24 h-24 md:w-32 md:h-32 bg-primary rounded-full flex items-center justify-center shadow-[0_6px_0_#004395] active:translate-y-[4px] active:shadow-none transition-all"
          >
            {isPlaying ? (
              <Pause className="w-12 h-12 md:w-16 md:h-16 text-white" />
            ) : (
              <Play className="w-12 h-12 md:w-16 md:h-16 text-white ml-2" />
            )}
          </button>
        </div>
        <p className="mt-6 text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Listen and Type</p>
      </div>

      {/* Input Section */}
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <div className="relative">
          <textarea 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isCorrect !== null}
            placeholder="Type what you hear..."
            className={cn(
              "w-full min-h-[160px] p-6 bg-white border-2 rounded-xl text-xl focus:ring-0 transition-all resize-none shadow-sm outline-none",
              isCorrect === true ? "border-green-500 bg-green-50 text-green-900" :
              isCorrect === false ? "border-red-500 bg-red-50 text-red-900" :
              "border-[#c2c6d6] focus:border-primary"
            )}
          />
          <div className="absolute bottom-4 right-4 text-slate-400 text-sm font-bold">
            {inputValue.length} chars
          </div>
        </div>

        {/* Feedback / Correct Answer display */}
        {isCorrect !== null && (
          <div className={cn(
            "p-4 rounded-xl border animate-in fade-in slide-in-from-top-2",
            isCorrect ? "bg-green-100 border-green-200" : "bg-red-100 border-red-200"
          )}>
            <p className="font-bold mb-1">{isCorrect ? "Excellent!" : "Not quite. Here is the correct sentence:"}</p>
            <p className="text-lg">{targetText}</p>
          </div>
        )}

        {/* Hint Section */}
        {isCorrect === null && (
          <div className="flex flex-col items-start gap-2">
            <button 
              onClick={requestHint}
              disabled={hintLevel >= 2}
              className="flex items-center gap-2 text-primary text-sm font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Need a Hint?</span>
            </button>
            {showHint && (
              <p className="text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg text-sm border border-yellow-200 ml-4 italic">
                {getHintText()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center w-full max-w-2xl animate-in fade-in">
        {isCorrect === null ? (
          <Button 
            size="lg" 
            disabled={inputValue.trim().length === 0} 
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

    </div>
  );
}
