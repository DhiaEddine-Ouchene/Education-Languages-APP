"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";

interface SentenceBuilderProps {
  prompt: string;
  correctAnswer: string;
  onComplete: (isCorrect: boolean) => void;
}

export function SentenceBuilderGame({ prompt, correctAnswer, onComplete }: SentenceBuilderProps) {
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    // Basic scrambling logic based on the correct answer.
    const words = (prompt && prompt.includes(" ")) ? prompt.split(" ") : correctAnswer.split(" ");
    
    // Fisher-Yates shuffle
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    
    setAvailableWords(shuffled);
    setSelectedWords(Array(shuffled.length).fill(""));
    setIsCorrect(null);
    setIsChecking(false);
  }, [prompt, correctAnswer]);

  const handleWordClick = (word: string, index: number) => {
    if (isChecking) return;
    
    // Find first empty slot
    const emptyIndex = selectedWords.findIndex(w => w === "");
    if (emptyIndex !== -1) {
      const newSelected = [...selectedWords];
      newSelected[emptyIndex] = word;
      setSelectedWords(newSelected);
      
      const newAvailable = [...availableWords];
      newAvailable[index] = "";
      setAvailableWords(newAvailable);
    }
  };

  const handleSlotClick = (word: string, index: number) => {
    if (isChecking || !word) return;
    
    // Return to available pool
    const emptyIndex = availableWords.findIndex(w => w === "");
    if (emptyIndex !== -1) {
      const newAvailable = [...availableWords];
      newAvailable[emptyIndex] = word;
      setAvailableWords(newAvailable);
      
      const newSelected = [...selectedWords];
      newSelected[index] = "";
      setSelectedWords(newSelected);
    }
  };

  const handleCheck = () => {
    if (selectedWords.includes("")) return; // Must fill all slots
    
    setIsChecking(true);
    const formedSentence = selectedWords.join(" ");
    const correct = formedSentence === correctAnswer;
    setIsCorrect(correct);
    
    setTimeout(() => {
      onComplete(correct);
    }, 2000);
  };

  const handleReset = () => {
    setIsChecking(false);
    setIsCorrect(null);
    const allWords = [...availableWords, ...selectedWords].filter(Boolean);
    setAvailableWords(allWords.sort(() => Math.random() - 0.5));
    setSelectedWords(Array(allWords.length).fill(""));
  };

  const allFilled = !selectedWords.includes("");

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      <section className="text-center mb-10">
        <h2 className="font-heading text-3xl font-bold text-slate-900 mb-3">Sentence Builder</h2>
        <p className="text-slate-600 text-lg">Build the correct sentence by tapping the word chips.</p>
      </section>

      {/* Available Words */}
      <div className="w-full max-w-3xl bg-slate-50 rounded-2xl p-8 mb-8 flex flex-wrap justify-center gap-4 min-h-[120px] items-center border border-slate-200">
        {availableWords.map((word, i) => (
          word ? (
            <button
              key={`avail-${i}`}
              onClick={() => handleWordClick(word, i)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-heading font-bold text-lg cursor-pointer select-none transition-all active:translate-y-1 hover:-translate-y-0.5 shadow-[0_4px_0_0_#004395] active:shadow-[0_0px_0_0_#004395]"
            >
              {word}
            </button>
          ) : (
            <div key={`empty-${i}`} className="w-24 h-14" />
          )
        ))}
      </div>

      {/* Drop Slots */}
      <div className="w-full max-w-4xl bg-white rounded-3xl p-10 shadow-lg border border-slate-100 flex flex-wrap justify-center gap-4 relative overflow-hidden mb-8">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0058be 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        {selectedWords.map((word, i) => (
          <button
            key={`slot-${i}`}
            onClick={() => handleSlotClick(word, i)}
            className={cn(
              "w-auto min-w-[100px] h-14 rounded-xl flex items-center justify-center font-heading font-bold text-lg transition-all",
              word 
                ? "bg-primary text-white border-2 border-primary cursor-pointer shadow-sm" 
                : "border-2 border-dashed border-slate-300 bg-slate-50"
            )}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {isCorrect !== null && (
        <div className={cn(
          "w-full max-w-md p-4 rounded-xl flex items-center justify-center gap-3 animate-in zoom-in duration-300",
          isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        )}>
          <CheckCircle2 className="w-6 h-6" />
          <span className="font-heading font-bold text-lg">
            {isCorrect ? "Perfect! That's correct." : "Not quite right. Try again!"}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={handleReset}
          disabled={isChecking}
          className="rounded-full px-8"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset
        </Button>
        <Button 
          size="lg"
          onClick={handleCheck}
          disabled={!allFilled || isChecking}
          className={cn(
            "rounded-full px-10 border-b-4 transition-all",
            allFilled && !isChecking ? "border-primary-dark active:border-b-0 active:translate-y-1" : ""
          )}
        >
          Check <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Temporary Button wrapper for the local component
function Button({ children, onClick, disabled, className, variant = "default", size = "default" }: any) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={cn(
        "flex items-center justify-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "outline" ? "border-2 border-slate-200 hover:bg-slate-50 text-slate-700" : "bg-primary text-white hover:bg-primary/90",
        size === "lg" ? "h-14 text-lg" : "h-10 text-sm",
        className
      )}
    >
      {children}
    </button>
  );
}
