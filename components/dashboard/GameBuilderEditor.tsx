"use client";

import { useState, Suspense } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WordBank } from "@/components/dashboard/builders/WordBank";
import type { ChipData } from "@/components/dashboard/builders/DraggableChip";
import type { GameTypeMeta } from "@/lib/game-type-metadata";
import type { BuilderComponent } from "@/components/dashboard/builders";
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  RotateCcw, RotateCw, Move, ZoomIn, ZoomOut,
  Play, SkipBack, SkipForward, StepForward,
  Grid3X3, List, Sparkles, Send,
  Settings, Timer, Lightbulb, Volume2, Shuffle, CheckCircle2,
  Save, BookOpen, Database,
} from "lucide-react";

type Props = {
  title: string;
  onTitleChange: (title: string) => void;
  gameMeta: GameTypeMeta;
  Builder: BuilderComponent;
  builderProps: any;
  wordBankWords: ChipData[];
  onWordBankChange: (words: ChipData[]) => void;
  language: string;
  level: string;
  onLanguageChange: (lang: string) => void;
  onLevelChange: (level: string) => void;
  existingSets: any[];
  settings: {
    difficulty: string;
    timer: number;
    hints: boolean;
    audioAutoplay: boolean;
    shuffle: boolean;
    isPublished: boolean;
  };
  onSettingsChange: (settings: any) => void;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
};

// ── Dark theme editor layout ──
export function GameBuilderEditor({
  title, onTitleChange, gameMeta, Builder, builderProps,
  wordBankWords, onWordBankChange, language, level,
  onLanguageChange, onLevelChange, existingSets,
  settings, onSettingsChange, saving, onSave, onBack,
}: Props) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<"vocab" | "course">("vocab");

  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#1A1A2E] text-gray-200 rounded-2xl overflow-hidden border border-[#2A2A4E]">
      {/* ═══ TOP TOOLBAR ═══ */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1E1E38] border-b border-[#2A2A4E] shrink-0">
        {/* Left cluster */}
        <div className="flex items-center gap-1">
          <ToolBtn icon={ArrowLeft} onClick={onBack} />
          <div className="w-px h-5 bg-[#2A2A4E] mx-1" />
          <ToolBtn icon={RotateCcw} disabled />
          <ToolBtn icon={RotateCw} disabled />
          <div className="w-px h-5 bg-[#2A2A4E] mx-1" />
          <ToolBtn icon={Move} disabled />
          <ToolBtn icon={ZoomIn} />
          <ToolBtn icon={ZoomOut} />
        </div>

        {/* Center: playback */}
        <div className="flex items-center gap-1 bg-[#252548] rounded-lg px-2 py-1">
          <ToolBtn icon={SkipBack} size="sm" />
          <ToolBtn icon={Play} size="sm" className="text-[#1D9E75]" />
          <ToolBtn icon={SkipForward} size="sm" />
          <ToolBtn icon={StepForward} size="sm" />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1">
          <ToolBtn icon={leftPanelOpen ? List : Grid3X3} onClick={() => setLeftPanelOpen(!leftPanelOpen)} active={leftPanelOpen} />
          <ToolBtn icon={rightPanelOpen ? Settings : Settings} onClick={() => setRightPanelOpen(!rightPanelOpen)} active={rightPanelOpen} />
          <div className="w-px h-5 bg-[#2A2A4E] mx-1" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7F77DD] to-[#534AB7] text-white text-xs font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
            <Sparkles className="w-4 h-4" /> AI Generate
          </button>
          <button onClick={onSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white text-xs font-semibold hover:bg-[#17845f] transition-colors">
            <Send className="w-4 h-4" /> {saving ? "Saving..." : "Publish"}
          </button>
        </div>
      </div>

      {/* ═══ THREE-PANEL BODY ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL — Content source */}
        {leftPanelOpen && (
          <div className="w-72 shrink-0 border-r border-[#2A2A4E] bg-[#1A1A2E] flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-[#2A2A4E]">
              <button onClick={() => setLeftTab("vocab")}
                className={cn("flex-1 text-xs font-medium py-2.5 transition-colors",
                  leftTab === "vocab" ? "text-[#7F77DD] border-b-2 border-[#7F77DD]" : "text-gray-500 hover:text-gray-300")}>
                <Database className="w-3.5 h-3.5 inline mr-1" /> Vocab
              </button>
              <button onClick={() => setLeftTab("course")}
                className={cn("flex-1 text-xs font-medium py-2.5 transition-colors",
                  leftTab === "course" ? "text-[#7F77DD] border-b-2 border-[#7F77DD]" : "text-gray-500 hover:text-gray-300")}>
                <BookOpen className="w-3.5 h-3.5 inline mr-1" /> Course
              </button>
            </div>

            {/* Word bank */}
            <div className="flex-1 overflow-hidden">
              <WordBank
                words={wordBankWords}
                onWordsChange={onWordBankChange}
                contentType={gameMeta.vocabContentType ?? "words"}
                existingSets={existingSets}
                language={language}
                level={level}
                onLanguageChange={onLanguageChange}
                onLevelChange={onLevelChange}
              />
            </div>
          </div>
        )}

        {/* CENTER PANEL — Builder workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#15152A]">
          {/* Title bar */}
          <div className="px-4 py-2 border-b border-[#2A2A4E] bg-[#1A1A2E]">
            <Input value={title} onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Game title..."
              className="h-8 text-sm bg-transparent border-[#2A2A4E] text-gray-200 placeholder-gray-600 focus:border-[#7F77DD] font-medium" />
          </div>

          {/* Builder workspace */}
          <div className="flex-1 overflow-y-auto p-4">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-gray-400">Loading builder...</span>
              </div>
            }>
              <Builder {...builderProps} />
            </Suspense>
          </div>
        </div>

        {/* RIGHT PANEL — Settings */}
        {rightPanelOpen && (
          <div className="w-64 shrink-0 border-l border-[#2A2A4E] bg-[#1A1A2E] overflow-y-auto p-3 space-y-3">
            {/* Difficulty */}
            <SettingsSection icon={Settings} title="Difficulty" defaultOpen>
              <div className="flex gap-2">
                {["easy", "medium", "hard"].map((d) => (
                  <button key={d} onClick={() => updateSetting("difficulty", d)}
                    className={cn("flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-all capitalize",
                      settings.difficulty === d
                        ? d === "easy" ? "bg-green-500/20 text-green-400 border-green-500/40"
                        : d === "medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        : "bg-red-500/20 text-red-400 border-red-500/40"
                        : "bg-[#252548] text-gray-500 border-[#2A2A4E] hover:border-[#3A3A5E]"
                    )}>{d}</button>
                ))}
              </div>
            </SettingsSection>

            {/* Timer */}
            <SettingsSection icon={Timer} title="Timer" defaultOpen>
              <div className="flex items-center gap-3">
                <input type="range" min={5} max={120} step={5} value={settings.timer}
                  onChange={(e) => updateSetting("timer", parseInt(e.target.value))}
                  className="flex-1 h-1.5 appearance-none bg-[#2A2A4E] rounded-full cursor-pointer accent-[#7F77DD]
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7F77DD] [&::-webkit-slider-thumb]:shadow-md" />
                <span className="text-xs font-medium text-gray-400 w-10 text-right">{settings.timer}s</span>
              </div>
            </SettingsSection>

            {/* Toggles */}
            <SettingsSection icon={Lightbulb} title="Features">
              <Toggle checked={settings.hints} onChange={(v) => updateSetting("hints", v)} label="Hints" />
              <Toggle checked={settings.audioAutoplay} onChange={(v) => updateSetting("audioAutoplay", v)} label="Audio autoplay" />
              <Toggle checked={settings.shuffle} onChange={(v) => updateSetting("shuffle", v)} label="Shuffle" />
            </SettingsSection>

            {/* Publish */}
            <SettingsSection icon={CheckCircle2} title="Publishing">
              <Toggle checked={settings.isPublished} onChange={(v) => updateSetting("isPublished", v)} label="Publish immediately" />
            </SettingsSection>

            {/* Save button */}
            <div className="pt-2">
              <button onClick={onSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7F77DD] to-[#534AB7] text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Create Game"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small icon button for toolbar ──
function ToolBtn({ icon: Icon, onClick, disabled, active, size = "md", className }: { icon: any; onClick?: () => void; disabled?: boolean; active?: boolean; size?: "sm" | "md"; className?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn(
        "flex items-center justify-center rounded-lg transition-colors",
        size === "sm" ? "w-7 h-7" : "w-8 h-8",
        active ? "text-[#7F77DD] bg-[#7F77DD]/10" : "text-gray-400 hover:text-gray-200 hover:bg-[#2A2A4E]",
        disabled && "opacity-30 cursor-not-allowed",
        className
      )}>
      <Icon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
    </button>
  );
}

// ── Collapsible settings section ──
function SettingsSection({ icon: Icon, title, children, defaultOpen }: { icon: any; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 w-full py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">{title}</span>
        <svg className={cn("w-3 h-3 transition-transform", open && "rotate-90")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
      </button>
      {open && <div className="pt-1.5 space-y-2">{children}</div>}
    </div>
  );
}

// ── Toggle switch ──
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between text-sm text-gray-300 cursor-pointer group py-0.5">
      <span>{label}</span>
      <div onClick={() => onChange(!checked)}
        className={cn("w-8 h-4 rounded-full transition-colors relative cursor-pointer",
          checked ? "bg-[#7F77DD]" : "bg-[#2A2A4E]")}>
        <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow-sm",
          checked ? "translate-x-[18px]" : "translate-x-[2px]")} />
      </div>
    </label>
  );
}
