"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import type { BuilderProps } from "./index";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

function createQuestion(): Question {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    prompt: "", options: ["", "", "", ""], correctAnswer: "", explanation: "",
  };
}

export function QuizQuestionBuilder({ onChange, initial, onValidation, gameMeta, wordBank }: BuilderProps) {
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (initial?.questions) return initial.questions as Question[];
    return [createQuestion()];
  });
  const [optionsCount, setOptionsCount] = useState(4);

  useEffect(() => {
    const valid = questions.length >= 1 && questions.every(
      (q) => q.prompt.trim() && q.options.filter((o) => o.trim()).length >= 2 && q.correctAnswer.trim()
    );
    onValidation?.(valid);
    onChange({ questions, optionsCount });
  }, [questions, optionsCount, onChange, onValidation]);

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qId: string, optIdx: number, value: string) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.id !== qId) return q;
      const options = [...q.options];
      options[optIdx] = value;
      return { ...q, options };
    }));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, createQuestion()]);
  const removeQuestion = (id: string) => setQuestions((prev) => prev.filter((q) => q.id !== id));

  const changeOptionsCount = (newCount: number) => {
    setOptionsCount(newCount);
    setQuestions((prev) => prev.map((q) => {
      const options = [...q.options];
      while (options.length < newCount) options.push("");
      while (options.length > newCount) options.pop();
      return { ...q, options };
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/40">
        <label className="text-xs font-medium text-txt-secondary">Options:</label>
        <div className="flex gap-1">
          {[2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => changeOptionsCount(n)}
              className={cn("px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                optionsCount === n ? "bg-primary text-white border-primary" : "bg-card text-txt-secondary border-border/60 hover:border-primary/30")}>{n}</button>
          ))}
        </div>
        <span className="text-[10px] text-txt-secondary ml-auto">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
      </div>

      {questions.map((q, idx) => (
        <div key={q.id} className="relative rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-gradient-to-r from-primary/[0.02] to-transparent">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{idx + 1}</span>
              <span className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Question {idx + 1}</span>
            </div>
            {questions.length > 1 && (
              <button onClick={() => removeQuestion(q.id)} className="p-1 rounded hover:bg-red-50 text-txt-secondary hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-txt-secondary mb-1 block">Prompt</label>
              <Input value={q.prompt} onChange={(e) => updateQuestion(q.id, "prompt", e.target.value)}
                placeholder={gameMeta.type === "ERROR_SPOTTING" ? "e.g. He go to school yesterday." : "e.g. What does 'apple' mean?"} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-txt-secondary mb-1 block">Answer options</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button onClick={() => updateQuestion(q.id, "correctAnswer", opt)}
                      className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        q.correctAnswer === opt ? "border-green-500 bg-green-50" : "border-border hover:border-primary/40")}>
                      {q.correctAnswer === opt && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                    </button>
                    <Input value={opt} onChange={(e) => updateOption(q.id, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className={cn("text-sm h-9", q.correctAnswer === opt && "border-green-300 bg-green-50/50")} />
                  </div>
                ))}
              </div>
              {/* Quick add words from word bank as options */}
              {wordBank && wordBank.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {wordBank.slice(0, 8).map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => {
                        const emptyIdx = q.options.findIndex((o) => !o.trim());
                        if (emptyIdx >= 0) updateOption(q.id, emptyIdx, chip.word);
                      }}
                      className="text-[10px] bg-card hover:bg-primary/10 text-txt-secondary border border-border/40 px-2 py-0.5 rounded-md transition-colors"
                    >
                      + {chip.word}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-txt-secondary mb-1 block">Explanation (optional)</label>
              <Input value={q.explanation} onChange={(e) => updateQuestion(q.id, "explanation", e.target.value)}
                placeholder="Explain..." className="text-sm" />
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addQuestion} className="w-full"><Plus className="w-4 h-4" /> Add Question</Button>
    </div>
  );
}
