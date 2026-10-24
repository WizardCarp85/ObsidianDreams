"use client";

import { useEffect, useState } from "react";
import { patternsApi } from "@/lib/api";
import type { PatternsOverview } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  Sparkles,
  RefreshCw,
  Moon,
  TrendingUp,
  Tag,
  Activity,
  BookOpen,
  Star,
  Repeat,
} from "lucide-react";
import { DREAM_TYPE_LABELS, MOOD_LABELS, MOOD_EMOJIS } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  lucid: "#b9a6f5",
  nightmare: "#f2a6c5",
  recurring: "#f3d98b",
  normal: "#6c8eff",
  fragmented: "#6fe3d9",
  nap: "#aeb8e0",
};

const MOOD_COLORS: Record<string, string> = {
  peaceful: "#6fe3d9",
  anxious: "#f3d98b",
  joyful: "#8fa8ff",
  confusing: "#b9a6f5",
  scary: "#f2a6c5",
  neutral: "#aeb8e0",
};

const TOOLTIP_STYLE = {
  background: "rgba(18,26,58,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.75rem",
  color: "#eaf0ff",
  fontSize: "12px",
};

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon size={18} style={{ color: "#6c8eff" }} />
        <h2
          className="font-semibold text-lg"
          style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export default function PatternsPage() {
  const [data, setData] = useState<PatternsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [days, setDays] = useState(90);

  async function loadData(d = days) {
    setLoading(true);
    try {
      const res = await patternsApi.overview(d);
      setData(res);
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  }

  async function generateInsight() {
    setInsightLoading(true);
    try {
      const insight = await patternsApi.generateInsight();
      setInsightText(insight.summary_text);
    } catch {
      setInsightText("Could not generate insight. Make sure the backend is running and your OpenAI key is configured.");
    } finally {
      setInsightLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // Process mood over time into time-series for line chart
  const moodTimeline = (() => {
    if (!data?.mood_over_time) return [];
    const byDate: Record<string, Record<string, number>> = {};
    for (const item of data.mood_over_time) {
      if (!byDate[item.dream_date]) byDate[item.dream_date] = {};
      byDate[item.dream_date][item.mood] = (byDate[item.dream_date][item.mood] || 0) + item.count;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, moods]) => ({ date, ...moods }));
  })();

  const DOMINANT_MOODS = [...new Set(data?.mood_over_time?.map((m) => m.mood) ?? [])].slice(0, 4);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Quicksand, sans-serif" }}>
          Patterns & Insights
        </h1>
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  const noData = !data || data.all_time_stats.total === 0;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Quicksand, sans-serif" }}>
            Patterns & Insights
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7781ac" }}>
            Full analytical view of your dream life
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {(
            [
              { label: "30d", value: 30 },
              { label: "90d", value: 90 },
              { label: "1y", value: 365 },
            ] as const
          ).map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setDays(value); loadData(value); }}
              className="btn-ghost text-xs py-1 px-3"
              style={days === value ? { color: "#6c8eff", borderColor: "#6c8eff" } : {}}
            >
              {label}
            </button>
          ))}
          <button onClick={() => loadData()} className="btn-ghost py-2 px-3" aria-label="Refresh">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {noData ? (
        <div className="empty-state glass-card py-20">
          <div className="empty-state-icon">
            <BookOpen size={36} />
          </div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "Quicksand, sans-serif" }}>
            No dream data yet
          </h2>
          <p style={{ color: "#7781ac" }}>
            Start logging dreams to unlock pattern analysis and AI insights.
          </p>
        </div>
      ) : (
        <>
          {/* All-time stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total dreams", value: data!.all_time_stats.total, icon: BookOpen },
              { label: "Lucid dreams", value: data!.all_time_stats.lucid, icon: Moon },
              { label: "Recurring", value: data!.all_time_stats.recurring, icon: Repeat },
              {
                label: "Avg sleep quality",
                value: data!.all_time_stats.avg_sleep_quality
                  ? `${data!.all_time_stats.avg_sleep_quality.toFixed(1)} / 5`
                  : "—",
                icon: Star,
              },
            ].map(({ label, value, icon: StatIcon }) => (
              <div key={label} className="glass-card p-4 text-center">
                <div className="flex justify-center mb-1">
                  <StatIcon size={22} className="text-[#6c8eff]" />
                </div>
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "Quicksand, sans-serif", color: "#6c8eff" }}
                >
                  {value}
                </div>
                <div className="text-xs" style={{ color: "#7781ac" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* AI Narrative */}
          <div className="insight-banner">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "#b9a6f5" }} />
                <span
                  className="font-semibold"
                  style={{ fontFamily: "Quicksand, sans-serif", color: "#b9a6f5" }}
                >
                  AI Narrative Insight
                </span>
              </div>
              <button
                onClick={generateInsight}
                disabled={insightLoading}
                className="btn-ghost text-xs py-1 px-3"
              >
                {insightLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="spinner" style={{ width: 12, height: 12 }} /> Generating…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <RefreshCw size={13} /> Regenerate
                  </span>
                )}
              </button>
            </div>
            <p className="text-sm" style={{ color: "#aeb8e0", lineHeight: 1.8 }}>
              {insightText ||
                "Click Regenerate to get a personalized AI-powered narrative summary of your recent dream patterns."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Dream type distribution */}
            <SectionCard title="Dream type breakdown" icon={Moon}>
              {data!.type_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data!.type_distribution.map((d) => ({
                        name: DREAM_TYPE_LABELS[d.dream_type] || d.dream_type,
                        value: d.count,
                        type: d.dream_type,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                    >
                      {data!.type_distribution.map((d) => (
                        <Cell key={d.dream_type} fill={TYPE_COLORS[d.dream_type] || "#6c8eff"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: "#aeb8e0", fontSize: 12 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center py-8 text-sm" style={{ color: "#7781ac" }}>
                  No data for selected period
                </p>
              )}
            </SectionCard>

            {/* Sleep quality vs mood */}
            <SectionCard title="Sleep quality vs. mood" icon={TrendingUp}>
              {data!.sleep_mood_correlation.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data!.sleep_mood_correlation.map((d) => ({
                      mood: `${MOOD_EMOJIS[d.mood] || ""} ${MOOD_LABELS[d.mood] || d.mood}`.trim(),
                      avg_sleep: d.avg_sleep ? parseFloat(d.avg_sleep.toFixed(1)) : 0,
                      label: MOOD_LABELS[d.mood] || d.mood,
                    }))}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis dataKey="mood" tick={{ fill: "#7781ac", fontSize: 11 }} />
                    <YAxis domain={[0, 5]} tick={{ fill: "#7781ac", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v, _, { payload }) => [
                        `${v} / 5`,
                        `Avg sleep (${payload?.label || ""})`,
                      ]}
                    />
                    <Bar dataKey="avg_sleep" radius={[6, 6, 0, 0]}>
                      {data!.sleep_mood_correlation.map((d) => (
                        <Cell key={d.mood} fill={MOOD_COLORS[d.mood] || "#6c8eff"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center py-8 text-sm" style={{ color: "#7781ac" }}>
                  No data for selected period
                </p>
              )}
            </SectionCard>
          </div>

          {/* Mood over time */}
          {moodTimeline.length > 0 && (
            <SectionCard title="Mood over time" icon={Activity}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={moodTimeline} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#7781ac", fontSize: 11 }}
                    tickFormatter={(d) => d.slice(5)} // MM-DD
                  />
                  <YAxis tick={{ fill: "#7781ac", fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  {DOMINANT_MOODS.map((mood) => (
                    <Line
                      key={mood}
                      type="monotone"
                      dataKey={mood}
                      stroke={MOOD_COLORS[mood] || "#6c8eff"}
                      strokeWidth={2}
                      dot={false}
                      name={`${MOOD_EMOJIS[mood] || ""} ${MOOD_LABELS[mood] || mood}`.trim()}
                    />
                  ))}
                  <Legend
                    formatter={(v) => (
                      <span style={{ color: "#aeb8e0", fontSize: 12 }}>{v}</span>
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          {/* Top tags */}
          {data!.top_tags.length > 0 && (
            <SectionCard title="Most frequent tags" icon={Tag}>
              <div className="flex flex-wrap gap-2">
                {data!.top_tags.map(({ tag, count }) => (
                  <span
                    key={tag}
                    className="tag-chip"
                    style={{
                      fontSize: `${Math.min(0.85 + count * 0.03, 1.1)}rem`,
                      opacity: 0.6 + Math.min(count * 0.04, 0.4),
                    }}
                  >
                    #{tag}
                    <span
                      className="ml-1"
                      style={{ color: "#b9a6f5", fontWeight: 700, fontSize: "0.7rem" }}
                    >
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Lucidity rate */}
          <SectionCard title="Lucidity overview" icon={Moon}>
            <div className="flex items-center gap-6">
              <div>
                <div
                  className="text-5xl font-bold mb-1"
                  style={{
                    fontFamily: "Quicksand, sans-serif",
                    background: "linear-gradient(90deg, #6c8eff, #b9a6f5)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {data!.lucidity_rate}%
                </div>
                <div className="text-sm" style={{ color: "#7781ac" }}>
                  of dreams in this period were lucid
                </div>
              </div>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${data!.lucidity_rate}%`,
                    background: "linear-gradient(90deg, #6c8eff, #b9a6f5)",
                    transition: "width 1s ease",
                  }}
                />
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
