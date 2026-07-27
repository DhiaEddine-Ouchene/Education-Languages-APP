"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles, Hammer, Upload, FileText, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { GameBuilder } from "@/components/dashboard/GameBuilder";
import { GameTypeSelector, GameCategory, GameTemplate } from "@/components/dashboard/GameTypeSelector";

type VocabSet = {
  id: string;
  name: string;
  items: { id: string; word: string; translation: string }[];
};

interface Props {
  sets: VocabSet[];
}

export function NewGameTabs({ sets }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");

  // AI generation state
  const [aiStep, setAiStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("English");
  const [level, setLevel] = useState("B1");
  const [loading, setLoading] = useState(false);
  const [generatingGameTitle, setGeneratingGameTitle] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleNextStep = () => {
    if (!file) {
      toast("error", "Please select a file first.");
      return;
    }
    setAiStep(2);
  };

  const handleGenerateGame = async (category: GameCategory, template: GameTemplate) => {
    if (!file) return;

    setLoading(true);
    setGeneratingGameTitle(template.title);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    formData.append("level", level);
    formData.append("category", category);
    formData.append("gameType", template.type);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const data = await res.json();
      toast("success", `Successfully generated ${template.title}!`);
      router.push("/dashboard/games");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast("error", err.message || "Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
      setGeneratingGameTitle("");
    }
  };

  // Manual creation via GameTypeSelector
  const handleManualCreate = async (category: GameCategory, template: GameTemplate) => {
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.title,
          type: template.type,
          settings: { difficulty: "medium", timer: 30, hints: true, shuffle: true },
          isPublished: false,
          isMarketplace: false,
          price: 0,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create game");
      }
      const data = await res.json();
      toast("success", `Created ${template.title}!`);
      // Redirect to the game editor to fill in content
      router.push(`/dashboard/games/${data.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast("error", err.message || "Failed to create game.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <h2 className="text-2xl font-heading font-bold text-txt">Generating {generatingGameTitle}...</h2>
        <p className="text-txt-secondary">Our AI is reading your lesson and crafting the perfect game.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {activeTab === "ai" && aiStep === 2 && (
            <Button variant="outline" size="sm" onClick={() => setAiStep(1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h1 className="text-3xl font-heading font-bold text-txt">Create New Game</h1>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => { setActiveTab("manual"); setAiStep(1); }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all",
              activeTab === "manual"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Hammer className="w-4 h-4" />
            Build Manually
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all",
              activeTab === "ai"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Sparkles className="w-4 h-4" />
            AI Generate
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "manual" ? (
        <div className="space-y-4">
          <p className="text-slate-600">Pick a game type and we'll create a blank game for you to fill with content.</p>
          <GameTypeSelector onSelectGame={handleManualCreate} mode="manual" />
        </div>
      ) : (
        <>
          {aiStep === 1 ? (
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Upload Course Material
                </CardTitle>
                <p className="text-sm text-txt-secondary mt-1">
                  Upload a PDF or text document containing your course content.
                  We'll use this to generate targeted games for your students.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Target Language</Label>
                    <Input
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      placeholder="e.g., English, French, Spanish"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Target CEFR Level</Label>
                    <select
                      id="level"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="A1">A1 - Beginner</option>
                      <option value="A2">A2 - Elementary</option>
                      <option value="B1">B1 - Intermediate</option>
                      <option value="B2">B2 - Upper Intermediate</option>
                      <option value="C1">C1 - Advanced</option>
                      <option value="C2">C2 - Mastery</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Lesson Content File</Label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-card-bg/50 transition-colors bg-surface-container-low"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    {file ? (
                      <>
                        <FileText className="h-12 w-12 text-primary mb-3" />
                        <p className="font-medium text-lg">{file.name}</p>
                        <p className="text-sm text-txt-secondary mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-txt-secondary mb-3" />
                        <p className="font-medium text-lg text-txt">Click to upload or drag and drop</p>
                        <p className="text-sm text-txt-secondary mt-1">PDF or Text documents</p>
                      </>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.txt"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleNextStep}
                    disabled={!file}
                    className="w-full sm:w-auto"
                  >
                    Next Step: Choose Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <GameTypeSelector onSelectGame={handleGenerateGame} mode="ai" />
          )}
        </>
      )}
    </div>
  );
}
