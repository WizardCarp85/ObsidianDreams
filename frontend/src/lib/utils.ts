import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DREAM_TYPE_LABELS: Record<string, string> = {
  lucid: "Lucid",
  nightmare: "Nightmare",
  recurring: "Recurring",
  normal: "Normal",
  fragmented: "Fragmented",
  nap: "Nap",
};

export const DREAM_TYPE_EMOJIS: Record<string, string> = {
  lucid: "🌙",
  nightmare: "😰",
  recurring: "🔄",
  normal: "💭",
  fragmented: "🌫️",
  nap: "😴",
};

export const MOOD_LABELS: Record<string, string> = {
  peaceful: "Peaceful",
  anxious: "Anxious",
  joyful: "Joyful",
  confusing: "Confusing",
  scary: "Scary",
  neutral: "Neutral",
};

export const MOOD_EMOJIS: Record<string, string> = {
  peaceful: "😌",
  anxious: "😰",
  joyful: "😄",
  confusing: "😵",
  scary: "😨",
  neutral: "😶",
};

export const DREAM_TYPES = Object.keys(DREAM_TYPE_LABELS);
export const MOOD_TYPES = Object.keys(MOOD_LABELS);

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return formatDate(dateStr);
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}
