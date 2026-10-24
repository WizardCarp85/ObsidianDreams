"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { dreamsApi } from "@/lib/api";
import type { Dream } from "@/types";
import { DreamForm } from "@/components/DreamForm";
import {
  Trash2,
  ArrowLeft,
  Star,
  Sparkles,
  Repeat,
  Mic,
} from "lucide-react";
import Link from "next/link";
import {
  DREAM_TYPE_LABELS,
  DREAM_TYPE_ICONS,
  MOOD_EMOJIS,
  MOOD_LABELS,
  formatDate,
} from "@/lib/utils";

export default function DreamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dreamsApi.get(id).then(setDream).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this dream? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await dreamsApi.delete(id);
      router.push("/journal");
    } catch {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl animate-pulse flex flex-col gap-6">
        <div className="h-8 bg-white/10 rounded w-2/3" />
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-40 bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (!dream) {
    return (
      <div className="empty-state">
        <h2 className="text-xl font-semibold" style={{ fontFamily: "Quicksand, sans-serif" }}>
          Dream not found
        </h2>
        <Link href="/journal" className="btn-primary mt-2">
          Back to journal
        </Link>
      </div>
    );
  }

  if (editMode) {
    return (
      <DreamForm
        mode="edit"
        dreamId={id}
        initialData={{
          title: dream.title,
          body: dream.body,
          dream_date: dream.dream_date,
          dream_type: dream.dream_type,
          mood: dream.mood,
          sleep_quality: dream.sleep_quality,
          is_lucid: dream.is_lucid,
          is_recurring: dream.is_recurring,
          input_method: dream.input_method,
          tags: dream.tags_detail.map((t) => t.name),
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href="/journal" className="btn-ghost py-2 px-3" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setEditMode(true)} className="btn-ghost text-sm">
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger text-sm"
          >
            <Trash2 size={15} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {/* Dream header */}
      <div>
        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "Quicksand, sans-serif" }}
        >
          {dream.title || "Untitled Dream"}
        </h1>
        <div className="flex items-center gap-3 flex-wrap text-sm" style={{ color: "#7781ac" }}>
          <span>{formatDate(dream.dream_date)}</span>
          <span>·</span>
          {(() => {
            const TypeIcon = DREAM_TYPE_ICONS[dream.dream_type];
            return (
              <span className={`badge badge-${dream.dream_type} inline-flex items-center gap-1`}>
                {TypeIcon && <TypeIcon size={13} />}
                <span>{DREAM_TYPE_LABELS[dream.dream_type]}</span>
              </span>
            );
          })()}
          <span className={`badge badge-${dream.mood} inline-flex items-center gap-1`}>
            <span>{MOOD_EMOJIS[dream.mood]}</span>
            <span>{MOOD_LABELS[dream.mood]}</span>
          </span>
          {dream.is_lucid && (
            <span className="badge badge-lucid inline-flex items-center gap-1">
              <Sparkles size={13} />
              <span>Lucid</span>
            </span>
          )}
          {dream.is_recurring && (
            <span className="badge badge-recurring inline-flex items-center gap-1">
              <Repeat size={13} />
              <span>Recurring</span>
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        className="glass-card p-6"
        style={{ lineHeight: 1.8, color: "#aeb8e0", whiteSpace: "pre-wrap" }}
      >
        {dream.body || (
          <span style={{ color: "#7781ac", fontStyle: "italic" }}>
            No description recorded.
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-6">
        {dream.sleep_quality && (
          <div>
            <p className="text-xs mb-1" style={{ color: "#7781ac" }}>Sleep quality</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  style={{
                    color: i < dream.sleep_quality! ? "#f3d98b" : "#7781ac",
                    fill: i < dream.sleep_quality! ? "#f3d98b" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {dream.input_method === "voice" && (
          <div>
            <p className="text-xs mb-1" style={{ color: "#7781ac" }}>Logged via</p>
            <span className="badge badge-normal inline-flex items-center gap-1">
              <Mic size={13} />
              <span>Voice</span>
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {dream.tags_detail.length > 0 && (
        <div>
          <p className="text-xs mb-2" style={{ color: "#7781ac" }}>Tags</p>
          <div className="flex flex-wrap gap-2">
            {dream.tags_detail.map((tag) => (
              <span key={tag.id} className="tag-chip">#{tag.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
