"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload/image", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const { url } = await res.json();
  return url;
}

/** Reusable image upload control backed by the app's Cloudinary upload route. */
export function ImageUpload({ value, onChange, label = "Image" }: { value?: string; onChange: (url: string) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch {
      setError("Could not upload image.");
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        {value ? (
          <div className="relative">
            <img src={value} alt="uploaded" className="h-14 w-14 rounded-lg border border-border object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-error text-white shadow-sm"
              aria-label="Remove image"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border bg-card text-txt-secondary">
            <ImagePlus className="h-5 w-5" />
          </span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-btn border border-border bg-card px-3 py-1.5 text-xs font-medium text-txt-secondary hover:bg-primary-light disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          {value ? "Change" : `Upload ${label}`}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {error && <p className="mt-1 text-[11px] text-error">{error}</p>}
    </div>
  );
}
