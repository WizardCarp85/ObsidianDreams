"use client";

import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";
import { DREAM_TYPE_LABELS, DREAM_TYPE_ICONS, MOOD_LABELS } from "@/lib/utils";
import type { Dream } from "@/types";
import {
  Star,
  Sparkles,
  Repeat,
  Moon,
  Mic,
  Hash,
  ChevronRight,
  Feather,
  Smile,
  CloudRain,
  Zap,
  Heart,
  type LucideIcon,
} from "lucide-react";

interface DreamCardProps {
  dream: Dream;
}

function getMoodSticker(mood: string): { icon: LucideIcon; bg: string } {
  const m = (mood || "").toLowerCase();
  if (m.includes("calm") || m.includes("peace") || m.includes("serene")) {
    return { icon: Feather, bg: "#64dfd0" };
  }
  if (m.includes("joy") || m.includes("happy") || m.includes("excit")) {
    return { icon: Smile, bg: "#ffe082" };
  }
  if (m.includes("sad") || m.includes("melanchol") || m.includes("grief")) {
    return { icon: CloudRain, bg: "#8ec5ff" };
  }
  if (m.includes("anx") || m.includes("fear") || m.includes("scary") || m.includes("night")) {
    return { icon: Zap, bg: "#ff9bb0" };
  }
  if (m.includes("love") || m.includes("warm")) {
    return { icon: Heart, bg: "#ffb3c6" };
  }
  return { icon: Sparkles, bg: "#94adff" };
}

export function DreamCard({ dream }: DreamCardProps) {
  const TypeIcon = DREAM_TYPE_ICONS[dream.dream_type];
  const { icon: MoodIcon, bg: moodBg } = getMoodSticker(dream.mood);
  const preview = dream.excerpt || dream.body || "";

  return (
    <Link
      href={`/journal/${dream.id}`}
      className="group relative flex flex-col gap-3 rounded-3xl bg-[#162e59] p-5 text-[#eef6ff] transition-all duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
      style={{
        border: "2.5px solid #081326",
        boxShadow: "0 5px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.12)",
        fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif",
      }}
    >
      {/* Top Row: Type Icon & Date Badge */}
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#5bb8ff] shadow-[0_2px_0_0_#081326] transition-transform group-hover:-rotate-6">
          {TypeIcon ? (
            <TypeIcon size={18} className="text-[#081326]" strokeWidth={2.5} />
          ) : (
            <Moon size={18} className="text-[#081326]" fill="#ffe082" strokeWidth={2.4} />
          )}
        </span>

        <span className="rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-[11px] font-extrabold text-[#9bc0ed]">
          {formatRelativeDate(dream.dream_date)}
        </span>
      </div>

      {/* Dream Title & Excerpt */}
      <div>
        <h3 className="line-clamp-1 text-base font-extrabold text-white">
          {dream.title || "Untitled Dream"}
        </h3>
        {preview && (
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-[#b8d2f4]">
            {preview}
          </p>
        )}
      </div>

      {/* Die-Cut Sticker Tags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#94adff] px-2.5 py-0.5 text-[11px] font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]">
          {TypeIcon && <TypeIcon size={11} strokeWidth={2.6} />}
          {DREAM_TYPE_LABELS[dream.dream_type]}
        </span>

        <span
          className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] px-2.5 py-0.5 text-[11px] font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]"
          style={{ backgroundColor: moodBg }}
        >
          <MoodIcon size={11} strokeWidth={2.6} />
          {MOOD_LABELS[dream.mood]}
        </span>

        {dream.is_lucid && (
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#ffe082] px-2.5 py-0.5 text-[11px] font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]">
            <Sparkles size={11} strokeWidth={2.6} /> Lucid
          </span>
        )}

        {dream.is_recurring && (
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#64dfd0] px-2.5 py-0.5 text-[11px] font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]">
            <Repeat size={11} strokeWidth={2.6} /> Recurring
          </span>
        )}

        {dream.input_method === "voice" && (
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#0e2040] px-2.5 py-0.5 text-[11px] font-extrabold text-[#7ac8ff]">
            <Mic size={11} strokeWidth={2.6} /> Voice
          </span>
        )}
      </div>

      {/* Footer: Tags & Sleep Rating */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-[#081326]/40">
        <div className="flex flex-wrap items-center gap-1">
          {dream.tags_detail?.slice(0, 2).map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-0.5 rounded-lg border-2 border-[#081326] bg-[#1c396e] px-2 py-0.5 text-[10px] font-bold text-[#cfe3fc]"
            >
              <Hash size={9} strokeWidth={3} className="text-[#64dfd0]" />
              {t.name}
            </span>
          ))}
          {dream.tags_detail?.length > 2 && (
            <span className="text-[10px] font-extrabold text-[#8cb2e0]">
              +{dream.tags_detail.length - 2}
            </span>
          )}
        </div>

        {dream.sleep_quality ? (
          <div className="flex items-center gap-1" title={`Sleep Quality: ${dream.sleep_quality}/5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={13}
                strokeWidth={2.2}
                style={{
                  color: i < (dream.sleep_quality ?? 0) ? "#ffe082" : "#244275",
                  fill: i < (dream.sleep_quality ?? 0) ? "#ffe082" : "transparent",
                }}
              />
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-[#6bc2ff] group-hover:translate-x-0.5 transition-transform">
            Read <ChevronRight size={13} strokeWidth={3} />
          </span>
        )}
      </div>
    </Link>
  );
}

export function DreamCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 rounded-3xl bg-[#152c57] p-5 animate-pulse"
      style={{
        border: "2.5px solid #081326",
        boxShadow: "0 5px 0 0 #081326",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-white/10" />
        <div className="h-5 w-24 rounded-full bg-white/10" />
      </div>
      <div className="h-5 w-3/4 rounded-lg bg-white/15" />
      <div className="h-3.5 w-full rounded bg-white/10" />
      <div className="flex gap-2 pt-2">
        <div className="h-5 w-20 rounded-full bg-white/10" />
        <div className="h-5 w-20 rounded-full bg-white/10" />
      </div>
    </div>
  );
}