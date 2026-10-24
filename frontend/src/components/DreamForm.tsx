"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Mic, Type, Star, X, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { dreamsApi } from "@/lib/api";
import type { DreamType, Mood, DreamFormData } from "@/types";
import { DREAM_TYPES, DREAM_TYPE_LABELS, MOOD_LABELS, MOOD_EMOJIS, getYesterdayDateString } from "@/lib/utils";
import { VoiceRecorderButton } from "@/components/VoiceRecorder";

const MOOD_OPTIONS: Mood[] = ["peaceful", "anxious", "joyful", "confusing", "scary", "neutral"];

// Simple keyword → tag suggestion map
const KEYWORD_TAG_MAP: Record<string, string[]> = {
  flying: ["flying", "freedom"],
  falling: ["falling"],
  water: ["water", "ocean"],
  ocean: ["water", "ocean"],
  sea: ["water"],
  fire: ["fire"],
  chase: ["chase", "running"],
  running: ["chase", "running"],
  school: ["school"],
  teeth: ["teeth"],
  house: ["house"],
  family: ["family"],
  death: ["death", "loss"],
  dead: ["death"],
  monster: ["monster", "scary"],
};

function suggestTags(text: string): string[] {
  const lower = text.toLowerCase();
  const suggested = new Set<string>();
  for (const [kw, tags] of Object.entries(KEYWORD_TAG_MAP)) {
    if (lower.includes(kw)) tags.forEach((t) => suggested.add(t));
  }
  return Array.from(suggested);
}

interface DreamFormProps {
  initialData?: Partial<DreamFormData>;
  dreamId?: string;
  mode: "new" | "edit";
}

export function DreamForm({ initialData, dreamId, mode }: DreamFormProps) {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<"type" | "speak">("type");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const [form, setForm] = useState<DreamFormData>(() => ({
    title: "",
    body: "",
    dream_date: getYesterdayDateString(),
    dream_type: "normal",
    mood: "neutral",
    sleep_quality: null,
    is_lucid: false,
    is_recurring: false,
    input_method: "text",
    tags: [],
    ...initialData,
  }));

  function update<K extends keyof DreamFormData>(key: K, value: DreamFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleBodyChange(text: string) {
    update("body", text);
    const suggestions = suggestTags(text).filter((t) => !form.tags.includes(t));
    setSuggestedTags(suggestions);
  }

  function addTag(name: string) {
    name = name.trim().toLowerCase();
    if (name && !form.tags.includes(name)) {
      update("tags", [...form.tags, name]);
    }
    setSuggestedTags((s) => s.filter((t) => t !== name));
  }

  function removeTag(name: string) {
    update("tags", form.tags.filter((t) => t !== name));
  }

  function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  }

  function handleVoiceTranscript(text: string) {
    update("body", text);
    update("input_method", "voice");
    handleBodyChange(text);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (mode === "edit" && dreamId) {
        await dreamsApi.update(dreamId, form);
      } else {
        await dreamsApi.create(form);
      }
      router.push("/journal");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save dream. Make sure the backend is running.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/journal" className="btn-ghost py-2 px-3" aria-label="Back to journal">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Quicksand, sans-serif" }}
          >
            {mode === "edit" ? "Edit Dream" : "Log a Dream"}
          </h1>
          <p className="text-sm" style={{ color: "#7781ac" }}>
            {mode === "edit" ? "Update your dream entry" : "Capture what you remember"}
          </p>
        </div>
      </div>

      {/* Input mode toggle */}
      <div
        className="flex rounded-xl p-1 w-fit"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {(["type", "speak"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setInputMode(m)}
            className="flex items-center gap-2 py-2 px-4 rounded-lg text-sm transition-all"
            style={{
              fontFamily: "Quicksand, sans-serif",
              fontWeight: 600,
              background: inputMode === m ? "rgba(108,142,255,0.2)" : "transparent",
              color: inputMode === m ? "#6c8eff" : "#7781ac",
            }}
          >
            {m === "type" ? <Type size={15} /> : <Mic size={15} />}
            {m === "type" ? "Type" : "Speak"}
          </button>
        ))}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="dream-title" className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>
          Dream title
        </label>
        <input
          id="dream-title"
          type="text"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className="input-glass"
          placeholder="Give this dream a name…"
          required
        />
      </div>

      {/* Dream body */}
      <div>
        <label htmlFor="dream-body" className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>
          What happened?
        </label>
        {inputMode === "speak" ? (
          <div className="glass-card p-8 flex flex-col items-center gap-6">
            <VoiceRecorderButton onTranscript={handleVoiceTranscript} />
            {form.body && (
              <div className="w-full">
                <p className="text-xs mb-2" style={{ color: "#7781ac" }}>
                  Transcript (editable):
                </p>
                <textarea
                  id="dream-body-voice"
                  value={form.body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  className="input-glass"
                  rows={6}
                  style={{ resize: "vertical" }}
                />
              </div>
            )}
          </div>
        ) : (
          <textarea
            id="dream-body"
            value={form.body}
            onChange={(e) => handleBodyChange(e.target.value)}
            className="input-glass"
            rows={8}
            placeholder="Describe your dream in as much detail as you remember…"
            style={{ resize: "vertical" }}
          />
        )}
      </div>

      {/* Row: Date + Type */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dream-date" className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>
            Dream date
          </label>
          <input
            id="dream-date"
            type="date"
            value={form.dream_date}
            onChange={(e) => update("dream_date", e.target.value)}
            className="input-glass"
            required
          />
        </div>
        <div>
          <label htmlFor="dream-type" className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>
            Dream type
          </label>
          <select
            id="dream-type"
            value={form.dream_type}
            onChange={(e) => update("dream_type", e.target.value as DreamType)}
            className="input-glass"
          >
            {DREAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {DREAM_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mood picker */}
      <div>
        <label className="block text-sm mb-3" style={{ color: "#aeb8e0" }}>
          How did the dream feel?
        </label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => update("mood", m)}
              className={`badge badge-${m} cursor-pointer transition-all inline-flex items-center gap-1.5`}
              style={{
                fontSize: "0.85rem",
                padding: "0.45rem 0.95rem",
                opacity: form.mood === m ? 1 : 0.5,
                transform: form.mood === m ? "scale(1.05)" : "scale(1)",
              }}
            >
              <span className="text-base leading-none">{MOOD_EMOJIS[m]}</span>
              <span>{MOOD_LABELS[m]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sleep quality */}
      <div>
        <label className="block text-sm mb-3" style={{ color: "#aeb8e0" }}>
          Sleep quality
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => update("sleep_quality", form.sleep_quality === v ? null : v)}
              aria-label={`Sleep quality ${v}`}
            >
              <Star
                size={28}
                style={{
                  color: (form.sleep_quality ?? 0) >= v ? "#f3d98b" : "#7781ac",
                  fill: (form.sleep_quality ?? 0) >= v ? "#f3d98b" : "transparent",
                  transition: "all 0.15s ease",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-6 flex-wrap">
        {(
          [
            { key: "is_lucid", label: "Lucid dream" },
            { key: "is_recurring", label: "Recurring dream" },
          ] as const
        ).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <span className="toggle-switch">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => update(key, e.target.checked)}
              />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </span>
            <span className="text-sm" style={{ color: "#aeb8e0" }}>
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tag-input" className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              #{tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            className="input-glass flex-1"
            placeholder="Add tags (press Enter or comma)"
          />
          <button
            type="button"
            onClick={() => { addTag(tagInput); setTagInput(""); }}
            className="btn-ghost py-2 px-3"
            disabled={!tagInput.trim()}
          >
            <Plus size={16} />
          </button>
        </div>
        {/* Suggested tags */}
        {suggestedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs" style={{ color: "#7781ac" }}>Suggested:</span>
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="tag-chip cursor-pointer"
                style={{ opacity: 0.7, borderStyle: "dashed" }}
              >
                + #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p
          className="text-sm rounded-xl p-3"
          style={{
            color: "#f2a6c5",
            background: "rgba(242,166,197,0.08)",
            border: "1px solid rgba(242,166,197,0.2)",
          }}
        >
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="btn-primary"
          disabled={saving}
          id="save-dream-btn"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="spinner" style={{ borderTopColor: "#fff" }} /> Saving…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={16} /> {mode === "edit" ? "Update dream" : "Save dream"}
            </span>
          )}
        </button>
        <Link href="/journal" className="btn-ghost text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}
