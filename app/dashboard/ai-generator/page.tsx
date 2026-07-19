"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";

export default function AIGeneratorPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("English");
  const [level, setLevel] = useState("B1");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      toast("error", "Please select a file first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    formData.append("level", level);

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
      toast("success", "Successfully generated games and vocabulary!");
      
      // Redirect to the games page so they can see their newly created games
      router.push("/dashboard/games");
      router.refresh();
      
    } catch (err: any) {
      console.error(err);
      toast("error", err.message || "Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-txt">AI Course Generator</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Games from Course Material
          </CardTitle>
          <p className="text-sm text-txt-secondary mt-1">
            Upload a PDF, image, or text document containing your course content. 
            Our AI will automatically extract the vocabulary and grammar rules, and generate interactive games across 4 annexes (Vocabulary, Grammar, Listening/Writing, Speaking).
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <Label>Course Material File</Label>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-card-bg/50 transition-colors"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              {file ? (
                <>
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-txt-secondary mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-txt-secondary mb-2" />
                  <p className="font-medium text-txt">Click to upload or drag and drop</p>
                  <p className="text-sm text-txt-secondary mt-1">
                    PDF or Text documents
                  </p>
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
              onClick={handleGenerate} 
              disabled={loading || !file}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing & Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Games
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
