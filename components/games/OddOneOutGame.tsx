"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GameItem {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string | null;
}

export interface OddOneOutProps {
  items: GameItem[];
  settings?: any;
  onComplete: (score: number, total: number) => void;
}

export function OddOneOutGame({ items, settings, onComplete }: OddOneOutProps) {
  const ROWS_PER_PAGE = 3;
  const [currentPage, setCurrentPage] = useState(0);
  const [rowStatus, setRowStatus] = useState<Record<string, { selected: string, isCorrect: boolean }>>({});
  const [score, setScore] = useState(0);

  const [pageData, setPageData] = useState<{item: GameItem, options: string[]}[]>([]);

  useEffect(() => {
    loadPage();
  }, [currentPage, items]);

  const loadPage = () => {
    const startIndex = currentPage * ROWS_PER_PAGE;
    const currentItems = items.slice(startIndex, startIndex + ROWS_PER_PAGE);
    
    if (currentItems.length === 0) {
      onComplete(score, items.length);
      return;
    }

    const newPageData = currentItems.map((item, idx) => {
      // 1 correct, 3 decoys
      const decoys = items
        .filter(i => i.id !== item.id)
        .map(i => i.translation);
      
      const shuffledDecoys = decoys.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      // Pad if not enough items
      while (shuffledDecoys.length < 3) {
        shuffledDecoys.push("decoy_" + Math.random().toString(36).substring(7));
      }
      
      const options = [...shuffledDecoys, item.translation].sort(() => 0.5 - Math.random());
      
      return { item, options };
    });

    setPageData(newPageData);
    setRowStatus({});
  };

  const selectWord = (itemId: string, option: string, correctOption: string) => {
    if (rowStatus[itemId]) return; // already answered
    
    const isCorrect = option === correctOption;
    
    setRowStatus(prev => ({
      ...prev,
      [itemId]: { selected: option, isCorrect }
    }));

    if (isCorrect) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if ((currentPage + 1) * ROWS_PER_PAGE < items.length) {
      setCurrentPage(c => c + 1);
    } else {
      onComplete(score, items.length);
    }
  };

  if (pageData.length === 0) return null;

  const totalProgress = (currentPage * ROWS_PER_PAGE + Object.keys(rowStatus).length) / items.length;
  const allRowsCompleted = Object.keys(rowStatus).length === pageData.length;

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 rounded-xl max-w-4xl mx-auto flex flex-col min-h-[600px]">
      
      {/* Header & Progress */}
      <div className="w-full mb-8 text-center animate-in fade-in slide-in-from-top-4">
        <h2 className="text-3xl font-bold mb-4 text-slate-800">Match the <span className="text-primary">Translation</span></h2>
        
        <div className="w-full bg-[#dce9ff] rounded-full h-2 overflow-hidden mb-2">
          <div 
            className="bg-green-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" 
            style={{ width: `${totalProgress * 100}%` }}
          />
        </div>
        
        <div className="flex justify-between px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vocabulary Mastery</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Page {currentPage + 1} of {Math.ceil(items.length / ROWS_PER_PAGE)}
          </span>
        </div>
      </div>

      {/* Game Rows */}
      <div className="w-full space-y-8 flex-grow">
        {pageData.map((row, idx) => {
          const status = rowStatus[row.item.id];
          
          return (
            <div 
              key={row.item.id}
              className={cn(
                "p-6 rounded-2xl border transition-colors duration-300 relative overflow-hidden",
                status?.isCorrect === true ? "bg-green-50 border-green-200" :
                status?.isCorrect === false ? "bg-red-50 border-red-200" :
                "bg-white border-[#c2c6d6]"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-primary uppercase tracking-wider">
                  {row.item.word}
                </span>
                <div className={cn("transition-opacity duration-300", status ? "opacity-100" : "opacity-0")}>
                  {status?.isCorrect ? (
                    <CheckCircle className="text-green-600 w-6 h-6" />
                  ) : (
                    <XCircle className="text-red-500 w-6 h-6" />
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center">
                {row.options.map((opt, i) => {
                  const isSelected = status?.selected === opt;
                  const isCorrectAnswer = opt === row.item.translation;
                  
                  // If answered, highlight the correct one, and the selected wrong one
                  const showCorrect = status && isCorrectAnswer;
                  const showWrong = status && isSelected && !isCorrectAnswer;
                  const disabled = !!status;

                  return (
                    <button
                      key={i}
                      disabled={disabled}
                      onClick={() => selectWord(row.item.id, opt, row.item.translation)}
                      className={cn(
                        "px-6 py-3 rounded-xl text-lg md:text-xl font-bold shadow-sm transition-all duration-200 border-2 outline-none",
                        disabled ? "" : "hover:-translate-y-1 hover:bg-blue-100 hover:border-blue-300 active:translate-y-0",
                        showCorrect ? "bg-green-600 text-white border-green-600 shadow-md" :
                        showWrong ? "bg-red-500 text-white border-red-500 shadow-md" :
                        "bg-[#eff4ff] text-slate-800 border-transparent"
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center animate-in fade-in">
        <Button 
          size="lg" 
          disabled={!allRowsCompleted} 
          onClick={handleNext} 
          className={cn(
            "px-12 rounded-full shadow-md text-lg h-14 border-b-4 active:border-b-0 active:translate-y-1 transition-all",
            allRowsCompleted ? "bg-primary border-blue-800 hover:bg-blue-700 text-white" : "bg-slate-200 text-slate-400 border-slate-300"
          )}
        >
          {((currentPage + 1) * ROWS_PER_PAGE < items.length) ? "Next Page" : "Finish Game"} 
          {allRowsCompleted && <ArrowRight className="w-5 h-5 ml-2" />}
        </Button>
      </div>
      
    </div>
  );
}
