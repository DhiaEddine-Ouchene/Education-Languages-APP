// ── Resilient JSON completion ──
// One entry point for every AI JSON call in the app. It does NOT depend on any
// hard-coded model name, because those rot: Groq decommissions/renames models
// (llama-3.3-70b-versatile, llama3-70b-8192, gemma2-9b-it have all 404'd) and
// Gemini retires them too (gemini-2.0-flash → 404 "no longer available"). Every
// time we pin a name, it eventually breaks and "the AI stops working".
//
// Instead we DISCOVER models at runtime: ask each provider which models the key
// can actually use right now (Groq `GET /openai/v1/models`, Gemini
// `GET /v1beta/models`), rank the chat-capable ones, and try them in order. If
// discovery is unreachable we fall back to a small chain of best-guess defaults.
// As long as ANY provider/model works, generation succeeds — and it self-heals
// across future model rotations without a code change.
//
// Configure via env (all optional):
//   GROQ_MODEL   — force a specific Groq model, tried first
//   GEMINI_MODEL — force a specific Gemini model, tried first
//
// Usage:
//   const { text } = await completeJSON([
//     { role: "system", content: "..." },
//     { role: "user", content: "..." },
//   ], { temperature: 0.3 });
//   const parsed = JSON.parse(text);

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type CompleteOptions = {
  /** Sampling temperature. Default 0.3. */
  temperature?: number;
  /** Ask the provider for strict JSON output. Default true. */
  json?: boolean;
  /** Force a specific Groq model chain (tried before discovery). */
  groqModels?: string[];
  /** Force a specific Gemini model chain (tried before discovery). */
  geminiModels?: string[] | string;
};

export type CompleteResult = {
  text: string;
  provider: "groq" | "gemini";
  model: string;
};

// Best-guess fallbacks, used ONLY if live discovery is unreachable. Discovery is
// the real source of truth; these just keep the app limping if the list endpoint
// is blocked. Kept short and spanning a few generations on purpose.
const FALLBACK_GROQ_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
];
const FALLBACK_GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

// How many discovered models to actually attempt (avoid hammering 30 models).
const MAX_ATTEMPTS_PER_PROVIDER = 6;
// Discovery is cached per-process so we pay the list call at most once every TTL.
const DISCOVERY_TTL_MS = 10 * 60 * 1000;

let _groq: Groq | null = null;
function groqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

let _gemini: GoogleGenerativeAI | null = null;
function geminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!_gemini) _gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return _gemini;
}

function uniqueTruthy(arr: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

/** An auth failure means every model on that provider will fail the same way — stop trying it. */
function isAuthError(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  const code = err?.code ?? err?.error?.code ?? "";
  if (status === 401 || status === 403) return true;
  return /invalid_api_key|api key not valid|authentication|unauthorized|permission[_ ]denied/i.test(
    String(code) + " " + String(err?.message || "")
  );
}

// ── Groq model discovery ────────────────────────────────────────────────────
// Drop non-chat models (speech, moderation, embeddings) and rank the rest so the
// fastest, most reliable general model is tried first.
function isGroqChatModel(id: string): boolean {
  const l = id.toLowerCase();
  return !/whisper|tts|guard|embed|distil|moderation|playai|allam/.test(l);
}
function groqScore(id: string): number {
  const l = id.toLowerCase();
  let s = 0;
  if (l.includes("instant")) s += 100; // fast, cheap, longest-lived
  if (l.includes("versatile")) s += 60;
  if (l.includes("llama-3.3")) s += 40;
  if (l.includes("llama-4") || l.includes("llama4")) s += 45;
  if (l.includes("llama")) s += 20;
  if (l.includes("70b")) s += 10;
  if (l.includes("gemma")) s += 8;
  if (l.includes("qwen")) s += 6;
  if (l.includes("preview") || l.includes("beta")) s -= 15; // prefer stable
  return s;
}

let _groqModelsCache: { at: number; models: string[] } | null = null;
async function discoverGroqModels(apiKey: string, errors: string[]): Promise<string[]> {
  if (_groqModelsCache && Date.now() - _groqModelsCache.at < DISCOVERY_TTL_MS) {
    return _groqModelsCache.models;
  }
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      errors.push(`groq: model discovery failed (${res.status} ${res.statusText})${body ? " — " + body.slice(0, 160) : ""}`);
      return [];
    }
    const json: any = await res.json();
    const ids: string[] = (json?.data || []).map((m: any) => m?.id).filter(Boolean);
    const chat = ids.filter(isGroqChatModel).sort((a, b) => groqScore(b) - groqScore(a));
    _groqModelsCache = { at: Date.now(), models: chat };
    if (chat.length === 0) errors.push("groq: discovery returned no chat-capable models");
    return chat;
  } catch (err: any) {
    errors.push(`groq: model discovery error — ${err?.message || String(err)}`);
    return [];
  }
}

// ── Gemini model discovery ──────────────────────────────────────────────────
function geminiScore(id: string): number {
  const l = id.toLowerCase();
  let s = 0;
  if (l.includes("flash")) s += 50; // fast + cheap, ideal for structured JSON
  if (l.includes("pro")) s += 30;
  if (l.includes("latest")) s += 6; // alias that tracks the current release
  if (l.includes("lite")) s += 3;
  if (l.includes("exp") || l.includes("preview")) s -= 20; // prefer GA
  if (l.includes("thinking")) s -= 12;
  if (l.includes("vision") || l.includes("image") || l.includes("tts") || l.includes("audio")) s -= 40;
  const m = l.match(/gemini-(\d+(?:\.\d+)?)/);
  if (m) s += parseFloat(m[1]) * 2; // prefer newer generations
  return s;
}

let _geminiModelsCache: { at: number; models: string[] } | null = null;
async function discoverGeminiModels(apiKey: string, errors: string[]): Promise<string[]> {
  if (_geminiModelsCache && Date.now() - _geminiModelsCache.at < DISCOVERY_TTL_MS) {
    return _geminiModelsCache.models;
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=100`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      errors.push(`gemini: model discovery failed (${res.status} ${res.statusText})${body ? " — " + body.slice(0, 160) : ""}`);
      return [];
    }
    const json: any = await res.json();
    const models: string[] = (json?.models || [])
      .filter((m: any) => (m?.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: any) => String(m?.name || "").replace(/^models\//, ""))
      .filter((id: string) => id && id.includes("gemini") && !id.includes("embedding"))
      .sort((a: string, b: string) => geminiScore(b) - geminiScore(a));
    _geminiModelsCache = { at: Date.now(), models };
    if (models.length === 0) errors.push("gemini: discovery returned no generateContent models");
    return models;
  } catch (err: any) {
    errors.push(`gemini: model discovery error — ${err?.message || String(err)}`);
    return [];
  }
}

function asArray(v: string[] | string | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export async function completeJSON(
  messages: ChatMessage[],
  opts: CompleteOptions = {}
): Promise<CompleteResult> {
  const temperature = opts.temperature ?? 0.3;
  const json = opts.json ?? true;
  const errors: string[] = [];

  // ── 1. Groq (discovered models first, then fallbacks) ──
  const groq = groqClient();
  if (groq) {
    const discovered = await discoverGroqModels(process.env.GROQ_API_KEY as string, errors);
    const models = uniqueTruthy([
      process.env.GROQ_MODEL,
      ...asArray(opts.groqModels),
      ...discovered,
      ...FALLBACK_GROQ_MODELS,
    ]).slice(0, MAX_ATTEMPTS_PER_PROVIDER);

    for (const model of models) {
      try {
        const completion = await groq.chat.completions.create({
          messages,
          model,
          temperature,
          ...(json ? { response_format: { type: "json_object" as const } } : {}),
        });
        const text = completion.choices[0]?.message?.content;
        if (text && text.trim()) {
          if (process.env.NODE_ENV !== "production") console.log(`[ai-complete] served by groq/${model}`);
          return { text, provider: "groq", model };
        }
        errors.push(`groq/${model}: empty content`);
      } catch (err: any) {
        errors.push(`groq/${model}: ${err?.message || String(err)}`);
        if (isAuthError(err)) {
          errors.push("groq: auth error — skipping remaining Groq models (check GROQ_API_KEY)");
          break;
        }
        // model decommissioned / not found / transient → try the next candidate
      }
    }
  } else {
    errors.push("groq: GROQ_API_KEY not set");
  }

  // ── 2. Gemini fallback (discovered models first, then fallbacks) ──
  const gemini = geminiClient();
  if (gemini) {
    const discovered = await discoverGeminiModels(process.env.GEMINI_API_KEY as string, errors);
    const models = uniqueTruthy([
      process.env.GEMINI_MODEL,
      ...asArray(opts.geminiModels),
      ...discovered,
      ...FALLBACK_GEMINI_MODELS,
    ]).slice(0, MAX_ATTEMPTS_PER_PROVIDER);

    // Gemini has no dedicated "system" role in this SDK — fold system text into a
    // leading preamble so the instruction is still honored.
    const systemText = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const bodyText = messages.filter((m) => m.role !== "system").map((m) => m.content).join("\n\n");
    const prompt = systemText ? `${systemText}\n\n${bodyText}` : bodyText;

    for (const modelName of models) {
      try {
        const model = gemini.getGenerativeModel({
          model: modelName,
          generationConfig: json
            ? { responseMimeType: "application/json", temperature }
            : { temperature },
        });
        const res = await model.generateContent(prompt);
        const text = res.response.text();
        if (text && text.trim()) {
          if (process.env.NODE_ENV !== "production") console.log(`[ai-complete] served by gemini/${modelName}`);
          return { text, provider: "gemini", model: modelName };
        }
        errors.push(`gemini/${modelName}: empty content`);
      } catch (err: any) {
        errors.push(`gemini/${modelName}: ${err?.message || String(err)}`);
        if (isAuthError(err)) {
          errors.push("gemini: auth error — skipping remaining Gemini models (check GEMINI_API_KEY)");
          break;
        }
      }
    }
  } else {
    errors.push("gemini: GEMINI_API_KEY not set");
  }

  throw new Error(
    "AI generation failed — no provider responded. Check GROQ_API_KEY / GEMINI_API_KEY. " +
      "Model names are auto-discovered, so this usually means the key is missing/invalid or the network is blocked. Attempts:\n" +
      errors.map((e) => "  • " + e).join("\n")
  );
}

export default completeJSON;
