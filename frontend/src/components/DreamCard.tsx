"use client";

import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";
import { DREAM_TYPE_LABELS, DREAM_TYPE_EMOJIS, MOOD_LABELS, MOOD_EMOJIS } from "@/lib/utils";
import type { Dream } from "@/types";
import { Star } from "lucide-react";

interface DreamCardProps {
  dream: Dream;
}

export function DreamCard({ dream }: DreamCardProps) {
  return (
    <Link href={`/journal/${dream.id}`} className="dream-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3
          className="font-semibold text-base leading-snug line-clamp-1"
          style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
        >
          {dream.title || "Untitled Dream"}
        </h3>
        <span className="text-xs flex-shrink-0" style={{ color: "#7781ac" }}>
          {formatRelativeDate(dream.dream_date)}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`badge badge-${dream.dream_type}`}>
          {DREAM_TYPE_EMOJIS[dream.dream_type]} {DREAM_TYPE_LABELS[dream.dream_type]}
        </span>
        <span className={`badge badge-${dream.mood}`}>
          {MOOD_EMOJIS[dream.mood]} {MOOD_LABELS[dream.mood]}
        </span>
        {dream.is_lucid && (
          <span className="badge badge-lucid">✨ Lucid</span>
        )}
        {dream.is_recurring && (
          <span className="badge badge-recurring">🔄 Recurring</span>
        )}
      </div>

      {dream.excerpt && (
        <p
          className="text-sm line-clamp-2 mb-3"
          style={{ color: "#7781ac", lineHeight: "1.6" }}
        >
          {dream.excerpt}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {dream.tags_detail.slice(0, 3).map((tag) => (
            <span key={tag.id} className="tag-chip">
              #{tag.name}
            </span>
          ))}
          {dream.tags_detail.length > 3 && (
            <span className="tag-chip">+{dream.tags_detail.length - 3}</span>
          )}
        </div>
        {dream.sleep_quality && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < dream.sleep_quality! ? "text-yellow-400 fill-yellow-400" : ""}
                style={{ color: i < dream.sleep_quality! ? "#f3d98b" : "#7781ac" }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function DreamCardSkeleton() {
  return (
    <div className="dream-card animate-pulse">
      <div className="h-4 bg-white/10 rounded mb-2 w-2/3" />
      <div className="flex gap-2 mb-3">
        <div className="h-5 bg-white/10 rounded-full w-20" />
        <div className="h-5 bg-white/10 rounded-full w-20" />
      </div>
      <div className="h-3 bg-white/10 rounded mb-2 w-full" />
      <div className="h-3 bg-white/10 rounded w-3/4" />
    </div>
  );
}
