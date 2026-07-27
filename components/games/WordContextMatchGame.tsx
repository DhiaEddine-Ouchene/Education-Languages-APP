"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Volume2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
}

export interface WordContextMatchProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function WordContextMatchGame({ items, settings, onComplete }: WordContextMatchProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!currentItem) return;
    
    // The correct sentence is the current item's example sentence
    const correctSentence = currentItem.exampleSentence || `The word ${currentItem.word} is very interesting.`;
    
    // Generate decoy sentences by taking other items' sentences and swapping in the current word
    const decoys = items
      .filter((_, i) => i !== currentIndex)
      .map(item => {
        const sentence = item.exampleSentence || `I have a ${item.word} in my house.`;
        // Replace the original word with our target word to make a grammatically/semantically wrong sentence
        const regex = new RegExp(item.word, "gi");
        return sentence.replace(regex, currentItem.word);
      });
      
    // If not enough items, generate generic decoys
    while (decoys.length < 3) {
      decoys.push(`The ${currentItem.word} decided to eat a sandwich for lunch.`);
      decoys.push(`She painted the entire wall ${currentItem.word}.`);
      decoys.push(`I need to buy a new ${currentItem.word} for my computer.`);
    }
      
    // Shuffle and pick 3 decoys
    const shuffledDecoys = decoys.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Add correct option and shuffle all
    const allOptions = [...shuffledDecoys, correctSentence].sort(() => 0.5 - Math.random());
    
    setOptions(allOptions);
    setSelectedOption(null);
    setIsCorrect(null);
  }, [currentIndex, items]);

  const selectOption = (opt: string) => {
    if (isCorrect !== null) return;
    setSelectedOption(opt);
  };

  const checkAnswer = () => {
    if (!selectedOption || isCorrect !== null) return;
    
    const correctSentence = currentItem.exampleSentence || `The word ${currentItem.word} is very interesting.`;
    const correct = selectedOption === correctSentence;
    
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

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!currentItem) return null;

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-4xl mx-auto flex flex-col items-center min-h-[600px]">
      
      {/* Target Word Card */}
      <section className="w-full max-w-2xl mb-10">
        <div className="bg-white border border-[#c2c6d6] rounded-xl p-8 text-center shadow-md transform transition-all duration-300">
          <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">Target Word</span>
          <h2 className="text-4xl font-bold text-blue-700 mb-4 capitalize">{currentItem.word}</h2>
          
          <div className="flex justify-center gap-2 mb-6">
            <button 
              onClick={() => speak(currentItem.word)}
              className="flex items-center gap-2 bg-[#eff4ff] hover:bg-blue-100 px-4 py-2 rounded-full text-primary transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-bold">Listen</span>
            </button>
          </div>
          
          <p className="text-lg text-slate-500 max-w-md mx-auto italic">
            "{currentItem.translation}"
          </p>
        </div>
      </section>

      {/* Question Title */}
      <div className="w-full max-w-2xl mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">?</span>
          Which sentence uses the word correctly?
        </h3>
      </div>

      {/* Options Bento Grid / List */}
      <section className="w-full max-w-2xl grid grid-cols-1 gap-4 mb-8">
        {options.map((opt, i) => {
          const isSelected = selectedOption === opt;
          const isWinner = isSelected && isCorrect;
          const isLoser = isSelected && !isCorrect;
          
          // Try to highlight the target word in the sentence
          const regex = new RegExp(`(${currentItem.word})`, 'gi');
          const parts = opt.split(regex);

          return (
            <button 
              key={i}
              disabled={isCorrect !== null}
              onClick={() => selectOption(opt)}
              className={cn(
                "border rounded-xl p-6 text-left flex items-start gap-4 focus:ring-3 focus:ring-primary/30 outline-none group transition-all duration-200",
                isSelected 
                  ? "bg-blue-50 border-primary border-2 shadow-sm" 
                  : "bg-white border-[#c2c6d6] hover:border-primary hover:-translate-y-1 hover:shadow-md",
                isWinner ? "bg-green-50 border-green-500 animate-[pulse-correct_0.6s_ease_forwards]" : "",
                isLoser ? "bg-red-50 border-red-500 animate-[shake_0.4s_ease-in-out]" : "",
                isCorrect !== null && !isSelected ? "opacity-50" : ""
              )}
            >
              <div className={cn(
                "mt-1 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                isSelected ? "border-primary" : "border-[#c2c6d6] group-hover:border-primary",
                isWinner ? "border-green-500" : "",
                isLoser ? "border-red-500" : ""
              )}>
                <div className={cn(
                  "w-3 h-3 rounded-full transition-transform duration-200",
                  isSelected ? "bg-primary scale-100" : "bg-transparent scale-0",
                  isWinner ? "bg-green-500" : "",
                  isLoser ? "bg-red-500" : ""
                )} />
              </div>
              <p className="text-lg text-slate-800 leading-relaxed">
                {parts.map((part, j) => 
                  part.toLowerCase() === currentItem.word.toLowerCase() 
                    ? <span key={j} className="font-bold text-primary">{part}</span> 
                    : <span key={j}>{part}</span>
                )}
              </p>
            </button>
          );
        })}
      </section>

      {/* Actions */}
      <div className="mt-4 flex gap-4 animate-in fade-in">
        {isCorrect === null ? (
          <Button size="lg" disabled={!selectedOption} onClick={checkAnswer} className="px-10 rounded-full shadow-md text-lg h-14 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all">
            <CheckCircle className="w-5 h-5 mr-2" /> Check
          </Button>
        ) : (
          <Button size="lg" onClick={handleNext} className="px-10 rounded-full shadow-md text-lg h-14 bg-green-600 hover:bg-green-700 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all">
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
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}} />
    </div>
  );
}
