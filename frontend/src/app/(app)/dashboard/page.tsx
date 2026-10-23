"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  BookOpen,
  TrendingUp,
  Star,
  Moon,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { dashboardApi } from "@/lib/api";
import type { DashboardSummary } from "@/types";
import {
  DREAM_TYPE_LABELS,
  DREAM_TYPE_EMOJIS,
  MOOD_EMOJIS,
  formatRelativeDate,
} from "@/lib/utils";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  gradient?: string;
}) {
  return (
    <div className="stat-card">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: gradient || `${accent}18`,
          border: `1px solid ${accent}30`,
        }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div
        className="text-3xl font-bold mb-1"
        style={{
          fontFamily: "Quicksand, sans-serif",
          color: gradient ? "transparent" : accent,
          backgroundImage: gradient,
          backgroundClip: gradient ? "text" : undefined,
          WebkitBackgroundClip: gradient ? "text" : undefined,
          WebkitTextFillColor: gradient ? "transparent" : undefined,
        }}
      >
        {value}
      </div>
      <div className="text-sm font-medium" style={{ color: "#aeb8e0" }}>
        {label}
      </div>
      {sub && <div className="text-xs mt-1" style={{ color: "#7781ac" }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const summary = await dashboardApi.summary();
      setData(summary);
    } catch (e) {
      setError("Could not connect to the backend. Make sure Django is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Compute sparkline data
  const sparklineData = (() => {
    if (!data?.mood_trend) return [];
    const map: Record<string, number> = {};
    for (const item of data.mood_trend) {
      map[item.dream_date] = (map[item.dream_date] || 0) + item.count;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({ date, count }));
  })();

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "Quicksand, sans-serif" }}>
            Good evening 🌙
          </h1>
          <p style={{ color: "#7781ac" }}>Loading your dream summary…</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="w-10 h-10 bg-white/10 rounded-xl mb-3" />
              <div className="h-8 bg-white/10 rounded mb-2 w-16" />
              <div className="h-3 bg-white/10 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "Quicksand, sans-serif" }}>
            Good evening 🌙
          </h1>
          <p style={{ color: "#7781ac" }}>Here&apos;s your dream snapshot</p>
        </div>
        <button onClick={load} className="btn-ghost py-2 px-3 text-sm" aria-label="Refresh dashboard">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            background: "rgba(243,217,139,0.08)",
            border: "1px solid rgba(243,217,139,0.2)",
            color: "#f3d98b",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Flame}
          label="Day streak"
          value={data?.streak ?? 0}
          sub="Keep it going!"
          accent="#f3d98b"
          gradient="linear-gradient(135deg, #f3d98b 0%, #f2a6c5 100%)"
        />
        <StatCard
          icon={BookOpen}
          label="Total dreams"
          value={data?.total_dreams ?? 0}
          sub={`${data?.this_month_count ?? 0} this month`}
          accent="#6c8eff"
        />
        <StatCard
          icon={Moon}
          label="Most common"
          value={data?.most_common_type
            ? `${DREAM_TYPE_EMOJIS[data.most_common_type]} ${DREAM_TYPE_LABELS[data.most_common_type]}`
            : "—"}
          sub="This month"
          accent="#b9a6f5"
        />
        <StatCard
          icon={TrendingUp}
          label="Mood trend"
          value={sparklineData.length > 0 ? "Active" : "No data"}
          sub="Last 14 days"
          accent="#6fe3d9"
        />
      </div>

      {/* Sparkline */}
      {sparklineData.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="font-semibold"
              style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
            >
              14-day activity
            </h2>
            <span className="text-xs" style={{ color: "#7781ac" }}>
              dreams / day
            </span>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6fe3d9"
                strokeWidth={2}
                dot={false}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(18,26,58,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.75rem",
                  color: "#eaf0ff",
                  fontSize: "12px",
                }}
                labelFormatter={(l) => l}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Last dream */}
        {data?.last_dream && (
          <div className="glass-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2
                className="font-semibold"
                style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
              >
                Last night&apos;s dream
              </h2>
              <span className="text-xs" style={{ color: "#7781ac" }}>
                {formatRelativeDate(data.last_dream.dream_date)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge badge-${data.last_dream.dream_type}`}>
                {DREAM_TYPE_EMOJIS[data.last_dream.dream_type]}{" "}
                {DREAM_TYPE_LABELS[data.last_dream.dream_type]}
              </span>
              <span className="text-sm" style={{ color: "#7781ac" }}>
                {MOOD_EMOJIS[data.last_dream.mood]}
              </span>
            </div>
            <p
              className="text-sm line-clamp-2"
              style={{ color: "#aeb8e0", lineHeight: 1.6 }}
            >
              {data.last_dream.title}
            </p>
            {data.last_dream.excerpt && (
              <p className="text-xs line-clamp-2" style={{ color: "#7781ac" }}>
                {data.last_dream.excerpt}
              </p>
            )}
            <Link
              href={`/journal/${data.last_dream.id}`}
              className="btn-ghost text-sm py-2 mt-auto self-start"
            >
              View full dream <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* AI Insight */}
        <div className="insight-banner flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "#b9a6f5" }} />
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "Quicksand, sans-serif", color: "#b9a6f5" }}
            >
              AI Insight
            </span>
          </div>
          <p className="text-sm" style={{ color: "#aeb8e0", lineHeight: 1.7 }}>
            {data?.ai_snippet ||
              "Log more dreams to get personalized AI insights about your dream patterns and themes."}
          </p>
          <Link
            href="/patterns"
            className="text-sm font-medium flex items-center gap-1 mt-auto"
            style={{ color: "#6fe3d9" }}
          >
            See full patterns <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/journal/new" className="btn-primary text-sm">
          + Log tonight&apos;s dream
        </Link>
        <Link href="/journal" className="btn-secondary text-sm">
          Browse journal
        </Link>
        <Link href="/patterns" className="btn-ghost text-sm">
          <Star size={14} /> View patterns
        </Link>
      </div>
    </div>
  );
}
