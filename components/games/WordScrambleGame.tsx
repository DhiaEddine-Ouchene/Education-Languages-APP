"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, ArrowRight, Lightbulb, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
}

export interface WordScrambleProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function WordScrambleGame({ items, settings, onComplete }: WordScrambleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  const [sourceLetters, setSourceLetters] = useState<{id: string, char: string}[]>([]);
  const [trayLetters, setTrayLetters] = useState<{id: string, char: string}[]>([]);
  
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!currentItem) return;
    
    // Scramble the target word
    const cleanWord = currentItem.word.toUpperCase().replace(/\s+/g, '');
    const letters = cleanWord.split('').map((char, index) => ({
      id: `char-${index}-${char}`,
      char
    }));
    
    // Shuffle
    const shuffled = [...letters].sort(() => 0.5 - Math.random());
    
    setSourceLetters(shuffled);
    setTrayLetters([]);
    setIsCorrect(null);
    setShowHint(false);
  }, [currentIndex, items]);

  const moveToTray = (letter: {id: string, char: string}) => {
    if (isCorrect !== null) return;
    setSourceLetters(prev => prev.filter(l => l.id !== letter.id));
    setTrayLetters(prev => [...prev, letter]);
  };

  const moveToSource = (letter: {id: string, char: string}) => {
    if (isCorrect !== null) return;
    setTrayLetters(prev => prev.filter(l => l.id !== letter.id));
    setSourceLetters(prev => [...prev, letter]);
  };

  const resetLetters = () => {
    if (isCorrect !== null) return;
    setSourceLetters(prev => [...prev, ...trayLetters].sort(() => 0.5 - Math.random()));
    setTrayLetters([]);
  };

  const checkAnswer = () => {
    if (trayLetters.length === 0 || isCorrect !== null) return;
    
    const formedWord = trayLetters.map(l => l.char).join('');
    const cleanTargetWord = currentItem.word.toUpperCase().replace(/\s+/g, '');
    
    const correct = formedWord === cleanTargetWord;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(s => s + 1);
    } else {
      // Auto-reset after a moment if incorrect
      setTimeout(() => {
        setIsCorrect(null);
      }, 1000);
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
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-4xl mx-auto flex flex-col items-center min-h-[600px] relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-300 blur-[100px]"></div>
        <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full bg-blue-400 blur-[100px]"></div>
      </div>

      {/* Progress Indicator */}
      <div className="w-full max-w-md space-y-2 mb-8 z-10">
        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Level {currentIndex + 1}</span>
          <span>{Math.round(((currentIndex) / items.length) * 100)}%</span>
        </div>
        <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#4edea3] transition-all duration-500 shadow-[0_0_12px_rgba(78,222,163,0.5)]" 
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Game Level Info */}
      <div className="text-center space-y-4 mb-12 z-10">
        <span className="bg-blue-100 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          Word Scramble
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Unscramble the word</h2>
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-500 text-lg">
            <span className="font-bold">Clue:</span> {currentItem.translation}
          </p>
          {showHint && currentItem.exampleSentence && (
            <p className="text-blue-600 italic bg-blue-50 px-4 py-2 rounded-lg max-w-md text-sm animate-in fade-in slide-in-from-top-2">
              "{currentItem.exampleSentence.replace(new RegExp(currentItem.word, 'gi'), '_____')}"
            </p>
          )}
        </div>
      </div>

      <div className="w-full max-w-2xl z-10 flex flex-col gap-10">
        
        {/* Scrambled Letters (Source) */}
        <div className="flex flex-wrap justify-center items-center gap-3 p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-sm border border-[#c2c6d6] min-h-[140px]">
          {sourceLetters.length === 0 && trayLetters.length > 0 && isCorrect === null && (
            <p className="text-slate-400 italic">All letters used</p>
          )}
          {sourceLetters.map((letter, i) => (
            <button
              key={letter.id}
              onClick={() => moveToTray(letter)}
              className="w-14 h-14 md:w-16 md:h-16 bg-primary text-white text-2xl font-bold rounded-2xl flex items-center justify-center shadow-[0_4px_0_#004395] active:shadow-[0_0px_0_#004395] active:translate-y-1 transition-all hover:brightness-110 animate-in zoom-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {letter.char}
            </button>
          ))}
        </div>

        {/* Answer Tray (Target) */}
        <div 
          className={cn(
            "w-full flex flex-wrap justify-center items-center gap-3 p-8 min-h-[140px] rounded-3xl border-4 border-dashed transition-colors duration-300 relative",
            isCorrect === true ? "border-green-500 bg-green-50" : isCorrect === false ? "border-red-500 bg-red-50 animate-[shake_0.4s_ease-in-out]" : "border-[#c2c6d6] bg-[#eff4ff]/50"
          )}
        >
          {trayLetters.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-slate-400 font-bold flex items-center gap-2">
                Click letters to spell the word
              </p>
            </div>
          )}
          
          {trayLetters.map(letter => (
            <button
              key={letter.id}
              onClick={() => moveToSource(letter)}
              disabled={isCorrect !== null}
              className={cn(
                "w-14 h-14 md:w-16 md:h-16 text-2xl font-bold rounded-2xl flex items-center justify-center transition-all shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-[0_0px_0_rgba(0,0,0,0.2)] active:translate-y-1 animate-in zoom-in",
                isCorrect === true ? "bg-green-500 text-white shadow-[0_4px_0_#166534]" : isCorrect === false ? "bg-red-500 text-white shadow-[0_4px_0_#991b1b]" : "bg-white text-primary shadow-[0_4px_0_#c2c6d6]"
              )}
            >
              {letter.char}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-12 flex flex-wrap justify-center gap-4 z-10 w-full max-w-2xl px-4">
        {isCorrect === null ? (
          <>
            <Button variant="outline" onClick={resetLetters} disabled={trayLetters.length === 0} className="w-14 h-14 rounded-full p-0 flex items-center justify-center shadow-sm">
              <RotateCcw className="w-6 h-6 text-slate-500" />
            </Button>
            <Button variant="outline" onClick={() => setShowHint(true)} disabled={showHint || !currentItem.exampleSentence} className="w-14 h-14 rounded-full p-0 flex items-center justify-center shadow-sm">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
            </Button>
            <Button size="lg" disabled={trayLetters.length === 0} onClick={checkAnswer} className="flex-1 max-w-xs rounded-full shadow-md text-lg h-14 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all">
              <CheckCircle className="w-5 h-5 mr-2" /> Check
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={handleNext} className="w-full max-w-xs rounded-full shadow-md text-lg h-14 bg-green-600 hover:bg-green-700 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all">
            {currentIndex < items.length - 1 ? "Next Word" : "Finish Game"} 
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
      `}} />
    </div>
  );
}
