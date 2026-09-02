"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Upload, Trash2, FileText, Sparkles, Loader2, Edit, X,
  ChevronDown, ChevronRight, Plus, CheckCircle2, Gamepad2, Link as LinkIcon, Eye
} from "lucide-react";
import { GameSelectionModal, GameDefinition } from "./GameSelectionModal";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  language: z.string().min(2, "Language is required"),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

type CourseSource = {
  id: string;
  fileName: string;
  fileType: string;
  extractedText: string;
  uploadedAt: string;
  error?: string;
};

type AttachedGame = {
  id: string;
  title: string;
  type: string;
  isPublished: boolean;
};

type ExistingGame = {
  id: string;
  title: string;
  type: string;
  isPublished: boolean;
};

type Props = {
  initial?: {
    id: string;
    title: string;
    description: string;
    language: string;
    level: string;
    coverImage: string | null;
    isPublished: boolean;
  };
};

const steps = ["Basics", "Upload Content", "Attach & Create Games", "Publish"];

export function CourseBuilder({ initial }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [courseId, setCourseId] = useState(initial?.id ?? "");
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    language: initial?.language ?? "Spanish",
    level: initial?.level ?? "A1",
    coverImage: initial?.coverImage ?? "",
    isPublished: initial?.isPublished ?? false,
  });

  const [sources, setSources] = useState<CourseSource[]>([]);
  const [uploading, setUploading] = useState(false);
  const [attachedGames, setAttachedGames] = useState<AttachedGame[]>([]);
  const [existingGames, setExistingGames] = useState<ExistingGame[]>([]);
  const [selectedExistingIds, setSelectedExistingIds] = useState<string[]>([]);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Load sources and attached games when editing an existing course or courseId changes
  useEffect(() => {
    const cid = courseId || initial?.id;
    if (!cid) return;

    fetch(`/api/courses/${cid}/upload-sources`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sources) setSources(data.sources);
      })
      .catch(() => {});

    fetch(`/api/courses/${cid}/games`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.games) setAttachedGames(data.games);
      })
      .catch(() => {});
  }, [courseId, initial?.id]);

  const validateStep1 = () => {
    const res = courseSchema.safeParse(form);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const uploadCover = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/image", { method: "POST", body: fd });
    if (!res.ok) return toast("error", "Cover upload failed");
    const { url } = await res.json();
    set("coverImage", url);
    toast("success", "Cover uploaded");
  };

  const saveCourse = async () => {
    if (!validateStep1()) {
      setStep(0);
      return null;
    }
    setSaving(true);
    try {
      const targetId = courseId || initial?.id;
      const res = await fetch(targetId ? `/api/courses/${targetId}` : "/api/courses", {
        method: targetId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast("error", "Failed to save course");
        return null;
      }
      const data = await res.json();
      setCourseId(data.id);
      return data.id;
    } finally {
      setSaving(false);
    }
  };

  const ensureCourseId = async () => {
    if (courseId) return courseId;
    if (initial?.id) {
      setCourseId(initial.id);
      return initial.id;
    }
    return await saveCourse();
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const cid = await ensureCourseId();
    if (!cid) return;

    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((file) => fd.append("files", file));

      const res = await fetch(`/api/courses/${cid}/upload-sources`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast("error", body.error || "Upload failed");
        return;
      }

      const { sources: uploadedSources } = await res.json();
      const successfulSources = uploadedSources.filter((s: CourseSource) => !s.error);
      setSources((prev) => [...prev, ...successfulSources]);

      const errorSources = uploadedSources.filter((s: CourseSource) => s.error);
      if (errorSources.length > 0) {
        errorSources.forEach((s: CourseSource) => toast("error", `${s.fileName}: ${s.error}`));
      }

      if (successfulSources.length > 0) {
        toast("success", `${successfulSources.length} file(s) uploaded successfully`);
      }
    } catch (err: any) {
      toast("error", err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAddVideoUrl = async () => {
    if (!videoUrl || !videoTitle) return toast("error", "Please enter a title and URL");
    const cid = await ensureCourseId();
    if (!cid) return;

    setUploading(true);
    try {
      const res = await fetch(`/api/courses/${cid}/upload-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: videoTitle, fileUrl: videoUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast("error", body.error || "Failed to add video URL");
        return;
      }

      const { sources: newSources } = await res.json();
      if (newSources && newSources.length > 0) {
        setSources((prev) => [...prev, ...newSources]);
        setVideoUrl("");
        setVideoTitle("");
        toast("success", "Video URL added successfully");
      }
    } catch (err: any) {
      toast("error", err.message || "Failed to add video URL");
    } finally {
      setUploading(false);
    }
  };

  const deleteSource = async (sourceId: string) => {
    const cid = await ensureCourseId();
    if (!cid) return;
    try {
      const res = await fetch(`/api/courses/${cid}/upload-sources`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });
      if (!res.ok) {
        toast("error", "Failed to delete source");
        return;
      }
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      toast("success", "Source deleted");
    } catch (err: any) {
      toast("error", err.message || "Failed to delete source");
    }
  };

  // Fetch all existing games owned by educator to attach
  const openAttachExistingModal = async () => {
    const cid = await ensureCourseId();
    if (!cid) return;

    try {
      const res = await fetch("/api/games");
      if (res.ok) {
        const data = await res.json();
        setExistingGames(data);
        setShowAttachModal(true);
      }
    } catch (err: any) {
      toast("error", "Failed to load existing games");
    }
  };

  const handleAttachExistingGames = async () => {
    if (selectedExistingIds.length === 0) return;
    const cid = await ensureCourseId();
    if (!cid) return;

    try {
      const res = await fetch(`/api/courses/${cid}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "attach_existing", gameIds: selectedExistingIds }),
      });

      if (!res.ok) return toast("error", "Failed to attach games");

      toast("success", "Games attached to course");
      setShowAttachModal(false);
      setSelectedExistingIds([]);

      // Refresh attached games
      const refreshRes = await fetch(`/api/courses/${cid}/games`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setAttachedGames(data.games);
      }
    } catch (err: any) {
      toast("error", err.message || "Failed to attach games");
    }
  };

  const detachGame = async (gameId: string) => {
    const cid = await ensureCourseId();
    if (!cid) return;

    try {
      const res = await fetch(`/api/courses/${cid}/games`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });

      if (!res.ok) return toast("error", "Failed to detach game");

      setAttachedGames((prev) => prev.filter((g) => g.id !== gameId));
      toast("success", "Game detached from course");
    } catch (err: any) {
      toast("error", err.message || "Failed to detach game");
    }
  };

  const handleGamesSelected = (selectedDefs: GameDefinition[]) => {
    if (selectedDefs.length > 0) {
      const firstGame = selectedDefs[0];
      router.push(`/dashboard/games/new?type=${firstGame.type}&courseId=${courseId || initial?.id}`);
    }
    setIsModalOpen(false);
  };

  const publish = async () => {
    const cid = await ensureCourseId();
    if (!cid) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${cid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isPublished: true }),
      });
      if (!res.ok) {
        toast("error", "Failed to publish course");
        return;
      }
      toast("success", "Course published successfully");
      router.push("/dashboard/courses");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Preview Banner - Shows when editing an existing course */}
      {(courseId || initial?.id) && (
        <div className="bg-primary-light/50 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-heading font-semibold text-sm text-txt-primary">Preview Your Course</p>
              <p className="text-xs text-txt-secondary">See exactly how this course appears to your students</p>
            </div>
          </div>
          <Link href={`/dashboard/courses/${courseId || initial?.id}/preview`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Open Preview
            </Button>
          </Link>
        </div>
      )}

      {/* Modal to Select Any Game Type to Build */}
      <GameSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lessonTitle={form.title}
        lessonContent={form.description}
        onGamesSelected={handleGamesSelected}
      />

      {/* Modal to Attach Existing Games */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 bg-background border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-heading font-bold text-lg text-txt-primary">Attach Existing Games</h3>
                <p className="text-xs text-txt-secondary">Select games from your library to attach to this course.</p>
              </div>
              <button onClick={() => setShowAttachModal(false)} className="p-1 rounded-full text-txt-secondary hover:bg-border">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {existingGames.length === 0 ? (
                <p className="text-center py-8 text-sm text-txt-secondary">No games found in your library. Create one first!</p>
              ) : (
                existingGames.map((game) => {
                  const isAttached = attachedGames.some((g) => g.id === game.id);
                  const isChecked = selectedExistingIds.includes(game.id) || isAttached;

                  return (
                    <label
                      key={game.id}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-colors",
                        isChecked ? "border-primary bg-primary-light/30" : "border-border bg-card hover:bg-background/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          disabled={isAttached}
                          checked={isChecked}
                          onChange={(e) => {
                            if (isAttached) return;
                            if (e.target.checked) {
                              setSelectedExistingIds((prev) => [...prev, game.id]);
                            } else {
                              setSelectedExistingIds((prev) => prev.filter((id) => id !== game.id));
                            }
                          }}
                          className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                        />
                        <div>
                          <p className="font-medium text-sm text-txt-primary">{game.title}</p>
                          <p className="text-xs text-txt-secondary">{game.type.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      {isAttached && (
                        <span className="text-xs bg-accent-light text-accent px-2.5 py-1 rounded-full font-semibold">
                          Already Attached
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-background border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAttachModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAttachExistingGames} disabled={selectedExistingIds.length === 0}>
                Attach {selectedExistingIds.length} Game(s)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Header */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={cn(
              "flex-1 min-w-[140px] text-sm py-3 px-4 rounded-lg border font-medium transition-all",
              i === step
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-border bg-card text-txt-secondary hover:border-primary/50"
            )}
          >
            <span className="block text-xs opacity-80 mb-0.5">Step {i + 1}</span>
            {s}
          </button>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6 space-y-6">
          {/* STEP 1: BASICS */}
          {step === 0 && (
            <>
              <div>
                <Label className="text-base font-semibold">Course Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g., Spanish for Beginners"
                  className="mt-1.5"
                />
                <FieldError message={errors.title} />
              </div>

              <div>
                <Label className="text-base font-semibold">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="What will students learn in this course?"
                  rows={4}
                  className="mt-1.5"
                />
                <FieldError message={errors.description} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-semibold">Language</Label>
                  <Select value={form.language} onChange={(e) => set("language", e.target.value)} className="mt-1.5">
                    {["Spanish", "French", "German", "English", "Italian", "Japanese", "Chinese", "Arabic"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label className="text-base font-semibold">Level</Label>
                  <Select value={form.level} onChange={(e) => set("level", e.target.value)} className="mt-1.5">
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Cover Image (Optional)</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
                  className="mt-1.5 block w-full text-sm text-txt-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-light file:text-primary hover:file:bg-primary-light/80 cursor-pointer"
                />
                {form.coverImage && (
                  <img src={form.coverImage} alt="cover" className="mt-3 h-32 w-full object-cover rounded-lg" />
                )}
              </div>
            </>
          )}

          {/* STEP 2: UPLOAD COURSE CONTENT */}
          {step === 1 && (
            <>
              <div>
                <Label className="text-base font-semibold mb-2 block">Upload Course Files</Label>
                <p className="text-sm text-txt-secondary mb-3">
                  Upload PDF, DOCX, images, or text files to include as course materials and references.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,image/*,.txt,video/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    disabled={uploading}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className={cn(
                      "flex items-center justify-center gap-3 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
                      uploading ? "border-border bg-background cursor-not-allowed" : "border-primary/30 hover:border-primary bg-primary-light/20 hover:bg-primary-light/30"
                    )}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm font-medium text-txt-secondary">Uploading course files...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-primary">Click to upload files or drag and drop</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <Label className="text-base font-semibold mb-2 block">Add Video URL</Label>
                <p className="text-sm text-txt-secondary mb-3">
                  Embed a YouTube, Vimeo, or direct video URL instead of uploading a file.
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs">Video Title</Label>
                    <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="e.g. Introduction to Spanish" />
                  </div>
                  <div className="flex-[2] min-w-[250px]">
                    <Label className="text-xs">Video URL</Label>
                    <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                  </div>
                  <Button onClick={handleAddVideoUrl} disabled={uploading || !videoTitle || !videoUrl}>
                    Add Video
                  </Button>
                </div>
              </div>

              {sources.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Uploaded Course Materials ({sources.length})</Label>
                  <div className="space-y-2">
                    {sources.map((source) => (
                      <div
                        key={source.id}
                        className="border border-border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">{source.fileName}</span>
                              <span className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                {source.fileType}
                              </span>
                            </div>
                            <p className="text-xs text-txt-secondary line-clamp-2">
                              {source.extractedText.substring(0, 150)}
                              {source.extractedText.length > 150 && "..."}
                            </p>
                            {source.extractedText.length > 150 && (
                              <button
                                onClick={() => setExpandedSource(expandedSource === source.id ? null : source.id)}
                                className="text-xs text-primary mt-1.5 flex items-center gap-1 hover:underline"
                              >
                                {expandedSource === source.id ? (
                                  <>
                                    <ChevronDown className="h-3 w-3" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="h-3 w-3" />
                                    Show more
                                  </>
                                )}
                              </button>
                            )}
                            {expandedSource === source.id && (
                              <p className="text-xs text-txt-secondary mt-2 p-3 bg-background rounded-lg whitespace-pre-wrap max-h-60 overflow-y-auto">
                                {source.extractedText}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSource(source.id)}
                            className="flex-shrink-0 text-error hover:bg-error/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 3: ATTACH & CREATE GAMES */}
          {step === 2 && (
            <>
              <div className="space-y-5">
                <div>
                  <Label className="text-base font-semibold mb-1 block">Course Games</Label>
                  <p className="text-sm text-txt-secondary mb-4">
                    Attach existing games from your library or create new games (manually or using AI) for any game type.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={openAttachExistingModal} variant="outline" className="flex-1 min-w-[200px]">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Attach Existing Games
                    </Button>
                    <Button
                      onClick={async () => {
                        const cid = await ensureCourseId();
                        if (!cid) return;
                        router.push(`/dashboard/games/new?courseId=${cid}`);
                      }}
                      variant="primary"
                      className="flex-1 min-w-[200px]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Game
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <Label className="text-base font-semibold">Attached Games ({attachedGames.length})</Label>

                  {attachedGames.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg bg-background/50">
                      <Gamepad2 className="h-8 w-8 text-txt-secondary mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium text-txt-secondary">No games attached to this course yet.</p>
                      <p className="text-xs text-txt-secondary mt-1">Use the buttons above to attach existing games or build new ones.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {attachedGames.map((game) => (
                        <div
                          key={game.id}
                          className="flex items-center justify-between border border-border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                              <Gamepad2 className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{game.title}</p>
                              <p className="text-xs text-txt-secondary mt-0.5">{game.type.replace(/_/g, " ")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/games/${game.id}`)}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => detachGame(game.id)}
                              className="text-error hover:bg-error/10"
                              title="Detach game from course"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 4: PUBLISH */}
          {step === 3 && (
            <>
              <div className="space-y-5 text-center py-6">
                <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl mb-2">Ready to Publish Course!</h3>
                  <p className="text-sm text-txt-secondary max-w-md mx-auto">
                    Your course contains <strong>{attachedGames.length} game(s)</strong> and{" "}
                    <strong>{sources.length} source material(s)</strong>.
                  </p>
                </div>

                <div className="bg-primary-light/50 rounded-lg p-4 max-w-md mx-auto">
                  <label className="flex items-center justify-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => set("isPublished", e.target.checked)}
                      className="w-5 h-5 rounded border-primary text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Publish course (make available for class assignments)</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          ← Back
        </Button>

        {step < steps.length - 1 ? (
          <Button
            onClick={async () => {
              if (step === 0) {
                if (!validateStep1()) return;
                await ensureCourseId();
              }
              setStep(step + 1);
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Next →"}
          </Button>
        ) : (
          <Button onClick={publish} disabled={saving} variant="accent">
            {saving ? "Publishing..." : "Publish Course"}
          </Button>
        )}
      </div>
    </div>
  );
}
