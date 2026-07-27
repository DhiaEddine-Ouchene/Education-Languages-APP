"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Play, Pause, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
}

export interface ListenOrderProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function ListenOrderGame({ items, settings, onComplete }: ListenOrderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  const [sourceFragments, setSourceFragments] = useState<{id: string, text: string}[]>([]);
  const [trayFragments, setTrayFragments] = useState<{id: string, text: string}[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const currentItem = items[currentIndex];
  
  // Use example sentence if available, else fallback to a generic sentence
  const targetText = currentItem?.exampleSentence || `I am learning the word ${currentItem?.word} today.`;

  useEffect(() => {
    if (!currentItem) return;
    
    // Split sentence into words/fragments
    const words = targetText.split(' ').filter(w => w.trim().length > 0);
    const fragments = words.map((text, index) => ({
      id: `frag-${index}`,
      text
    }));
    
    // Shuffle
    const shuffled = [...fragments].sort(() => 0.5 - Math.random());
    
    setSourceFragments(shuffled);
    setTrayFragments([]);
    setIsCorrect(null);
    setIsPlaying(false);
  }, [currentIndex, items]);

  const moveToTray = (fragment: {id: string, text: string}) => {
    if (isCorrect !== null) return;
    setSourceFragments(prev => prev.filter(f => f.id !== fragment.id));
    setTrayFragments(prev => [...prev, fragment]);
  };

  const moveToSource = (fragment: {id: string, text: string}) => {
    if (isCorrect !== null) return;
    setTrayFragments(prev => prev.filter(f => f.id !== fragment.id));
    setSourceFragments(prev => [...prev, fragment]);
  };

  const resetFragments = () => {
    if (isCorrect !== null) return;
    setSourceFragments(prev => [...prev, ...trayFragments].sort(() => 0.5 - Math.random()));
    setTrayFragments([]);
  };

  const checkAnswer = () => {
    if (trayFragments.length === 0 || isCorrect !== null) return;
    
    const formedSentence = trayFragments.map(f => f.text).join(' ');
    
    const correct = formedSentence === targetText;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(s => s + 1);
    } else {
      setTimeout(() => setIsCorrect(null), 1500);
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
      utterance.rate = 0.85; // Slower for listening clearly
      
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
      <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-[300px] h-[300px] rounded-full bg-blue-400 blur-[80px]"></div>
      </div>

      {/* Progress */}
      <div className="w-full max-w-2xl mb-10 z-10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Listen & Order • {currentIndex + 1} of {items.length}</span>
          <span className="text-lg font-bold text-primary">{Math.round(((currentIndex) / items.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] rounded-full transition-all duration-500" 
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Play Button Focal Point */}
      <div className="flex flex-col items-center mb-10 z-10">
        <div className="relative group cursor-pointer active:scale-95 transition-transform duration-150" onClick={playAudio}>
          <div className={cn(
            "absolute inset-0 rounded-full transition-all duration-500 opacity-20",
            isPlaying ? "bg-primary animate-ping scale-150" : "bg-primary group-hover:scale-110"
          )}></div>
          <button className="relative w-28 h-28 md:w-32 md:h-32 bg-primary rounded-full flex items-center justify-center shadow-[0_6px_0_#004395] active:shadow-[0_0px_0_#004395] active:translate-y-[6px] transition-all">
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 text-white ml-2" />
            )}
          </button>
        </div>
        <p className="mt-6 text-sm font-bold text-slate-500 uppercase tracking-widest text-center max-w-xs">Listen to the sentence and order the fragments</p>
      </div>

      <div className="w-full max-w-2xl z-10 flex flex-col gap-6">
        
        {/* Source Fragments */}
        <div className="flex flex-wrap justify-center items-center gap-2 p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-[#c2c6d6] min-h-[120px]">
          {sourceFragments.length === 0 && trayFragments.length > 0 && isCorrect === null && (
            <p className="text-slate-400 italic">All fragments used</p>
          )}
          {sourceFragments.map((frag, i) => (
            <button
              key={frag.id}
              onClick={() => moveToTray(frag)}
              className="px-4 py-2 bg-white border border-[#c2c6d6] text-slate-800 text-lg font-bold rounded-xl shadow-[0_4px_0_#e2e8f0] active:shadow-none active:translate-y-1 transition-all hover:border-primary hover:text-primary animate-in zoom-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {frag.text}
            </button>
          ))}
        </div>

        {/* Answer Tray */}
        <div 
          className={cn(
            "w-full flex flex-wrap justify-center items-center gap-2 p-6 min-h-[120px] rounded-2xl border-4 border-dashed transition-colors duration-300 relative",
            isCorrect === true ? "border-green-500 bg-green-50" : isCorrect === false ? "border-red-500 bg-red-50 animate-[shake_0.4s_ease-in-out]" : "border-[#c2c6d6] bg-[#eff4ff]/50"
          )}
        >
          {trayFragments.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-slate-400 font-bold">Click fragments to build sentence</p>
            </div>
          )}
          
          {trayFragments.map(frag => (
            <button
              key={frag.id}
              onClick={() => moveToSource(frag)}
              disabled={isCorrect !== null}
              className={cn(
                "px-4 py-2 text-lg font-bold rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all animate-in zoom-in",
                isCorrect === true ? "bg-green-500 text-white shadow-[0_4px_0_#166534]" : isCorrect === false ? "bg-red-500 text-white shadow-[0_4px_0_#991b1b]" : "bg-primary text-white shadow-[0_4px_0_#004395]"
              )}
            >
              {frag.text}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 z-10 w-full max-w-2xl px-4">
        {isCorrect === null ? (
          <>
            <Button variant="outline" onClick={resetFragments} disabled={trayFragments.length === 0} className="w-14 h-14 rounded-full p-0 flex items-center justify-center shadow-sm">
              <RotateCcw className="w-6 h-6 text-slate-500" />
            </Button>
            <Button size="lg" disabled={trayFragments.length === 0} onClick={checkAnswer} className="flex-1 max-w-xs rounded-full shadow-md text-lg h-14 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all">
              <CheckCircle className="w-5 h-5 mr-2" /> Check
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={handleNext} className="w-full max-w-xs rounded-full shadow-md text-lg h-14 bg-green-600 hover:bg-green-700 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all">
            {currentIndex < items.length - 1 ? "Next Sentence" : "Finish Game"} 
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
