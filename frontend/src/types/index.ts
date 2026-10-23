// TypeScript types matching the Django models

export interface UserProfile {
  id: string;
  supabase_id: string;
  email: string;
  display_name: string;
  timezone: string;
  theme_preference: "dark" | "light";
  created_at: string;
}

export type DreamType = "lucid" | "nightmare" | "recurring" | "normal" | "fragmented" | "nap";
export type Mood = "peaceful" | "anxious" | "joyful" | "confusing" | "scary" | "neutral";
export type InputMethod = "text" | "voice";

export interface Tag {
  id: number;
  name: string;
}

export interface Dream {
  id: string;
  title: string;
  body: string;
  dream_date: string; // YYYY-MM-DD
  dream_type: DreamType;
  mood: Mood;
  sleep_quality: number | null; // 1-5
  is_lucid: boolean;
  is_recurring: boolean;
  input_method: InputMethod;
  tags_detail: Tag[];
  excerpt: string;
  created_at: string;
  updated_at: string;
}

export interface DreamFormData {
  title: string;
  body: string;
  dream_date: string;
  dream_type: DreamType;
  mood: Mood;
  sleep_quality: number | null;
  is_lucid: boolean;
  is_recurring: boolean;
  input_method: InputMethod;
  tags: string[];
}

export interface Insight {
  id: string;
  period_start: string;
  period_end: string;
  summary_text: string;
  stats_json: Record<string, unknown>;
  generated_at: string;
}

export interface DashboardSummary {
  streak: number;
  total_dreams: number;
  this_month_count: number;
  type_breakdown: Record<string, number>;
  most_common_type: DreamType | null;
  mood_trend: Array<{ dream_date: string; mood: string; count: number }>;
  last_dream: Dream | null;
  ai_snippet: string | null;
}

export interface PatternsOverview {
  type_distribution: Array<{ dream_type: string; count: number }>;
  mood_over_time: Array<{ dream_date: string; mood: string; count: number }>;
  lucidity_rate: number;
  sleep_mood_correlation: Array<{ mood: string; avg_sleep: number | null; count: number }>;
  top_tags: Array<{ tag: string; count: number }>;
  all_time_stats: {
    total: number;
    lucid: number;
    recurring: number;
    avg_sleep_quality: number | null;
  };
  period_days: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
