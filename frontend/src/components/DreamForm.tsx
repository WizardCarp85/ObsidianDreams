"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Mic,
  Type,
  Star,
  X,
  Plus,
  ArrowLeft,
  Sparkles,
  Repeat,
  Calendar,
  Hash,
  AlertTriangle,
  Loader2,
  Feather,
  Smile,
  CloudRain,
  Zap,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { dreamsApi } from "@/lib/api";
import type { DreamType, Mood, DreamFormData } from "@/types";
import {
  DREAM_TYPES,
  DREAM_TYPE_LABELS,
  DREAM_TYPE_ICONS,
  MOOD_LABELS,
  getYesterdayDateString,
} from "@/lib/utils";
import { VoiceRecorderButton } from "@/components/VoiceRecorder";

const MOOD_OPTIONS: Mood[] = [
  "peaceful",
  "joyful",
  "neutral",
  "confusing",
  "anxious",
  "scary",
];

const MOOD_CONFIG: Record<Mood, { icon: LucideIcon; bg: string }> = {
  peaceful: { icon: Feather, bg: "#64dfd0" },
  joyful: { icon: Smile, bg: "#ffe082" },
  neutral: { icon: Sparkles, bg: "#94adff" },
  confusing: { icon: CloudRain, bg: "#8ec5ff" },
  anxious: { icon: Zap, bg: "#ffb3c6" },
  scary: { icon: Zap, bg: "#ff859d" },
};

const KEYWORD_TAG_MAP: Record<string, string[]> = {
  flying: ["flying", "freedom"],
  falling: ["falling"],
  water: ["water", "ocean"],
  ocean: ["water", "ocean"],
  sea: ["water"],
  fire: ["fire"],
  chase: ["chase", "running"],
  running: ["chase", "running"],
  school: ["school", "exam"],
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
  const [inputMode, setInputMode] = useState<"type" | "speak">(
    initialData?.input_method === "voice" ? "speak" : "type"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

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
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save dream. Make sure the backend is running."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 max-w-3xl text-[#eef6ff]"
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      <style>{`
        .cartoon-form-card {
          border: 2.5px solid #081326;
          box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
        }
        .cartoon-form-input {
          width: 100%;
          border: 2.5px solid #081326;
          border-radius: 1rem;
          background: #0f2040;
          color: #eef6ff;
          font-weight: 600;
          padding: 0.75rem 1rem;
          outline: none;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }
        .cartoon-form-input:focus {
          border-color: #5bb8ff;
          background: #102347;
          box-shadow: 0 0 0 3px rgba(91, 184, 255, 0.24);
        }
        .cartoon-form-btn-primary {
          background-color: #5bb8ff;
          color: #081326;
          border: 2.5px solid #081326;
          box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.45);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .cartoon-form-btn-primary:hover:not(:disabled) {
          background-color: #77c6ff;
          transform: translateY(-2px);
          box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.55);
        }
        .cartoon-form-btn-primary:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 1px 0 0 #081326;
        }
        .cartoon-form-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          white-space: nowrap;
          background-color: #162f5c;
          color: #eef6ff;
          border: 2.5px solid #081326;
          box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .cartoon-form-btn-secondary:hover {
          background-color: #1f417d;
          transform: translateY(-2px);
          box-shadow: 0 6px 0 0 #081326;
        }
        .cartoon-form-btn-secondary:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 0 #081326;
        }
      `}</style>

      {/* Main Storybook Form Card */}
      <div className="cartoon-form-card rounded-[28px] bg-[#162e59] p-6 sm:p-8 space-y-6">
        {/* Input Mode Selector */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b-2 border-[#081326]/50">
          <div>
            <span className="block text-xs font-extrabold uppercase tracking-wider text-[#7ea4d4]">
              Recording Style
            </span>
            <span className="text-sm font-bold text-white">How do you want to record?</span>
          </div>

          <div className="inline-flex rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-1 shadow-[0_2px_0_0_#081326]">
            {(["type", "speak"] as const).map((m) => {
              const active = inputMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setInputMode(m);
                    update("input_method", m === "speak" ? "voice" : "text");
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    active
                      ? "bg-[#5bb8ff] text-[#081326] border-2 border-[#081326] shadow-[0_2px_0_0_#081326]"
                      : "text-[#8cb2e0] hover:text-white border-2 border-transparent"
                  }`}
                >
                  {m === "type" ? (
                    <Type size={14} strokeWidth={2.8} />
                  ) : (
                    <Mic size={14} strokeWidth={2.8} />
                  )}
                  {m === "type" ? "Type it out" : "Speak it out"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title Field */}
        <div>
          <label htmlFor="dream-title" className="block text-sm font-extrabold text-[#cfe3fc] mb-2">
            Dream Title <span className="text-[#ffe082]">*</span>
          </label>
          <input
            id="dream-title"
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="cartoon-form-input text-base"
            placeholder="Give this dream a memorable title…"
            required
          />
        </div>

        {/* Dream Body / Voice Panel */}
        <div>
          <label htmlFor="dream-body" className="block text-sm font-extrabold text-[#cfe3fc] mb-2">
            What happened in the dream? <span className="text-[#ffe082]">*</span>
          </label>

          {inputMode === "speak" ? (
            <div className="rounded-3xl border-2 border-[#081326] bg-[#0e2040] p-6 flex flex-col items-center gap-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
              <VoiceRecorderButton onTranscript={handleVoiceTranscript} />

              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#7ea4d4]">
                    Live Transcript (Editable)
                  </span>
                  <span className="text-[11px] font-bold text-[#64dfd0]">Voice detected</span>
                </div>
                <textarea
                  id="dream-body-voice"
                  value={form.body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  className="cartoon-form-input text-sm leading-relaxed"
                  rows={6}
                  placeholder="Your words will transcribe here as you speak…"
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          ) : (
            <textarea
              id="dream-body"
              value={form.body}
              onChange={(e) => handleBodyChange(e.target.value)}
              className="cartoon-form-input text-sm leading-relaxed"
              rows={8}
              placeholder="Describe your dream in as much detail as you recall: colors, people, feelings, floating moments…"
              style={{ resize: "vertical" }}
              required
            />
          )}
        </div>

        {/* Date + Dream Type Row */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dream-date" className="block text-sm font-extrabold text-[#cfe3fc] mb-2">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} className="text-[#64dfd0]" /> Dream Date
              </span>
            </label>
            <input
              id="dream-date"
              type="date"
              value={form.dream_date}
              onChange={(e) => update("dream_date", e.target.value)}
              className="cartoon-form-input text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="dream-type" className="block text-sm font-extrabold text-[#cfe3fc] mb-2">
              Dream Type
            </label>
            <select
              id="dream-type"
              value={form.dream_type}
              onChange={(e) => update("dream_type", e.target.value as DreamType)}
              className="cartoon-form-input text-sm cursor-pointer"
            >
              {DREAM_TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#0e2040] text-white">
                  {DREAM_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mood Picker */}
        <div>
          <label className="block text-sm font-extrabold text-[#cfe3fc] mb-2.5">
            How did the dream feel?
          </label>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((m) => {
              const cfg = MOOD_CONFIG[m];
              const Icon = cfg.icon;
              const active = form.mood === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => update("mood", m)}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] px-3.5 py-1.5 text-xs font-extrabold transition-transform ${
                    active
                      ? "scale-105 shadow-[0_3px_0_0_#081326] text-[#081326]"
                      : "bg-[#0e2040] text-[#cfe3fc] hover:scale-102"
                  }`}
                  style={{ backgroundColor: active ? cfg.bg : undefined }}
                >
                  <Icon size={13} strokeWidth={2.6} />
                  <span>{MOOD_LABELS[m]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sleep Quality */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-extrabold text-[#cfe3fc]">
              Sleep Quality (1 - 5)
            </label>
            <span className="text-xs font-extrabold text-[#ffe082]">
              {form.sleep_quality ? `${form.sleep_quality} / 5 Stars` : "Not rated"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((v) => {
              const activeVal = hoverRating ?? form.sleep_quality ?? 0;
              const isLit = activeVal >= v;
              return (
                <button
                  key={v}
                  type="button"
                  onMouseEnter={() => setHoverRating(v)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => update("sleep_quality", form.sleep_quality === v ? null : v)}
                  aria-label={`Rate sleep quality ${v} of 5`}
                  className="p-1 rounded-xl hover:scale-110 active:scale-95 transition-transform"
                >
                  <Star
                    size={28}
                    strokeWidth={2.4}
                    style={{
                      color: isLit ? "#ffe082" : "#244275",
                      fill: isLit ? "#ffe082" : "transparent",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Cartoon Checkbox Toggles: Lucid & Recurring */}
        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-3 rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-3 cursor-pointer hover:bg-[#12284e] transition-colors">
            <input
              type="checkbox"
              checked={form.is_lucid}
              onChange={(e) => update("is_lucid", e.target.checked)}
              className="h-5 w-5 rounded-lg border-2 border-[#081326] accent-[#ffe082] cursor-pointer"
            />
            <div>
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                <Sparkles size={13} className="text-[#ffe082]" /> Lucid Dream
              </span>
              <span className="block text-[11px] font-semibold text-[#8cb2e0]">
                I was aware I was dreaming
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-3 cursor-pointer hover:bg-[#12284e] transition-colors">
            <input
              type="checkbox"
              checked={form.is_recurring}
              onChange={(e) => update("is_recurring", e.target.checked)}
              className="h-5 w-5 rounded-lg border-2 border-[#081326] accent-[#64dfd0] cursor-pointer"
            />
            <div>
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                <Repeat size={13} className="text-[#64dfd0]" /> Recurring Dream
              </span>
              <span className="block text-[11px] font-semibold text-[#8cb2e0]">
                I&apos;ve experienced this before
              </span>
            </div>
          </label>
        </div>

        {/* Tags Section */}
        <div>
          <label htmlFor="tag-input" className="block text-sm font-extrabold text-[#cfe3fc] mb-2">
            Sticker Tags
          </label>

          {/* Active Tags */}
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#1c396e] pl-3 pr-1.5 py-1 text-xs font-extrabold text-[#cfe3fc] shadow-[0_2px_0_0_#081326]"
                >
                  <Hash size={11} strokeWidth={3} className="text-[#64dfd0]" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/15 text-[#ff859d]"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="cartoon-form-input h-12 text-sm"
                placeholder="Add tags like flying, water, maze (press Enter)"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                addTag(tagInput);
                setTagInput("");
              }}
              disabled={!tagInput.trim()}
              className="cartoon-form-btn-secondary shrink-0 h-12 px-4 rounded-2xl text-xs font-extrabold disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap active:translate-y-0.5"
            >
              <Plus size={16} strokeWidth={2.8} className="text-[#64dfd0]" />
              <span>Add</span>
            </button>
          </div>

          {/* Suggested Tags Cloud */}
          {suggestedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs font-bold text-[#8cb2e0]">Suggested:</span>
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full border-2 border-dashed border-[#5bb8ff]/60 bg-[#0e2040] px-3 py-1 text-xs font-bold text-[#5bb8ff] hover:bg-[#162e59]"
                >
                  <Plus size={11} strokeWidth={3} /> #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border-2 border-[#081326] bg-[#3a2340] px-4 py-3 text-sm font-bold text-[#ffd2db]"
          >
            <AlertTriangle size={17} className="shrink-0 text-[#ff859d]" strokeWidth={2.5} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center gap-3 pt-3 border-t-2 border-[#081326]/50">
          <button
            type="submit"
            disabled={saving}
            className="cartoon-form-btn-primary inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-extrabold disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving entry…
              </>
            ) : (
              <>
                <Save size={16} strokeWidth={2.6} />
                {mode === "edit" ? "Update Dream" : "Save to Storybook"}
              </>
            )}
          </button>

          <Link
            href="/journal"
            className="cartoon-form-btn-secondary px-5 py-3.5 rounded-2xl text-sm font-bold"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}