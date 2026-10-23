"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, Plus, X, BookOpen } from "lucide-react";
import { dreamsApi } from "@/lib/api";
import type { Dream } from "@/types";
import { DreamCard, DreamCardSkeleton } from "@/components/DreamCard";
import { DREAM_TYPES, MOOD_TYPES, DREAM_TYPE_LABELS, MOOD_LABELS } from "@/lib/utils";

export default function JournalPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const res = await dreamsApi.list({
          q: debouncedQ || undefined,
          type: typeFilter || undefined,
          mood: moodFilter || undefined,
          page: p,
        });
        if (p === 1) {
          setDreams(res.results);
        } else {
          setDreams((prev) => [...prev, ...res.results]);
        }
        setTotal(res.count);
        setHasNext(!!res.next);
        setPage(p);
      } catch {
        // show empty state
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, typeFilter, moodFilter]
  );

  useEffect(() => { load(1); }, [load]);

  const clearFilters = () => {
    setQ("");
    setTypeFilter("");
    setMoodFilter("");
  };

  const hasFilters = !!(q || typeFilter || moodFilter);

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Quicksand, sans-serif" }}>
            Dream Journal
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7781ac" }}>
            {total > 0 ? `${total} dream${total !== 1 ? "s" : ""} logged` : "Start recording your dreams"}
          </p>
        </div>
        <Link href="/journal/new" className="btn-primary text-sm">
          <Plus size={16} /> New Dream
        </Link>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#7781ac" }}
          />
          <input
            id="journal-search"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dreams…"
            className="input-glass pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost text-sm ${showFilters ? "border-primary-500" : ""}`}
          style={showFilters ? { borderColor: "#6c8eff", color: "#6c8eff" } : {}}
        >
          <Filter size={15} /> Filters
          {hasFilters && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "#b9a6f5" }}
            />
          )}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost text-sm" aria-label="Clear filters">
            <X size={15} /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div
          className="glass-card p-4 flex gap-4 flex-wrap"
          style={{ borderRadius: "1rem" }}
        >
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs" style={{ color: "#7781ac" }}>Dream type</label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-glass py-2 text-sm"
              style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
            >
              <option value="">All types</option>
              {DREAM_TYPES.map((t) => (
                <option key={t} value={t}>{DREAM_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs" style={{ color: "#7781ac" }}>Mood</label>
            <select
              id="filter-mood"
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
              className="input-glass py-2 text-sm"
              style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
            >
              <option value="">All moods</option>
              {MOOD_TYPES.map((m) => (
                <option key={m} value={m}>{MOOD_LABELS[m]}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Dream grid */}
      {loading && dreams.length === 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <DreamCardSkeleton key={i} />)}
        </div>
      ) : dreams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={36} />
          </div>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "Quicksand, sans-serif" }}
          >
            {hasFilters ? "No dreams match your filters" : "Your journal is waiting"}
          </h2>
          <p style={{ color: "#7781ac", maxWidth: "320px" }}>
            {hasFilters
              ? "Try adjusting or clearing your filters."
              : "No dreams yet — your journal is waiting for tonight's story."}
          </p>
          {!hasFilters && (
            <Link href="/journal/new" className="btn-primary mt-2">
              Log your first dream
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {dreams.map((d) => <DreamCard key={d.id} dream={d} />)}
          </div>
          {hasNext && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => load(page + 1)}
                className="btn-secondary text-sm"
                disabled={loading}
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
