"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { profileApi, dreamsApi } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { UserProfile, Dream } from "@/types";
import {
  User,
  Globe,
  Bell,
  Download,
  Trash2,
  LogOut,
  Save,
  AlertTriangle,
  X,
  Check,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  Mic,
  PenTool,
  Clock,
  Sparkles,
} from "lucide-react";

function SettingSection({
  title,
  icon: Icon,
  description,
  children,
}: {
  title: string;
  icon: React.ElementType;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#162e59] shadow-[0_2px_0_0_#081326]">
            <Icon size={16} style={{ color: "#6c8eff" }} />
          </div>
          <div>
            <h2
              className="font-bold text-base text-white"
              style={{ fontFamily: "Quicksand, sans-serif" }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-xs font-semibold text-[#7781ac]">{description}</p>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState("UTC");

  // App & Logging Preferences (local preferences)
  const [defaultLogMode, setDefaultLogMode] = useState<"text" | "voice">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("stardrift_default_log_mode") as "text" | "voice") || "text";
    }
    return "text";
  });

  const [autoSaveDrafts, setAutoSaveDrafts] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const val = localStorage.getItem("stardrift_autosave_drafts");
      return val === null ? true : val === "true";
    }
    return true;
  });

  // Morning Reminder Preferences
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("stardrift_reminder_enabled") === "true";
    }
    return false;
  });

  const [reminderTime, setReminderTime] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("stardrift_reminder_time") || "07:30";
    }
    return "07:30";
  });

  const [notifPermission, setNotifPermission] = useState<string>("default");

  // Account Danger Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Data Exporting Status
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  useEffect(() => {
    profileApi.get()
      .then((p) => {
        setProfile(p);
        setTimezone(p.timezone || "UTC");
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  async function handleSavePreferences() {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await profileApi.update({
        timezone,
      });
      setProfile(updated);

      if (typeof window !== "undefined") {
        localStorage.setItem("stardrift_default_log_mode", defaultLogMode);
        localStorage.setItem("stardrift_autosave_drafts", String(autoSaveDrafts));
        localStorage.setItem("stardrift_reminder_enabled", String(reminderEnabled));
        localStorage.setItem("stardrift_reminder_time", reminderTime);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // show error
    } finally {
      setSaving(false);
    }
  }

  async function requestNotificationPermission() {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === "granted") {
          setReminderEnabled(true);
          localStorage.setItem("stardrift_reminder_enabled", "true");
        }
      } catch (e) {
        console.error("Failed to request notification permission:", e);
      }
    }
  }

  async function handleExportJson() {
    setExportingJson(true);
    try {
      let dreams: Dream[] = [];
      try {
        const res = await dreamsApi.list();
        dreams = res.results || [];
      } catch (e) {
        console.warn("Could not fetch dreams for export:", e);
      }

      const exportData = {
        app: "Stardrift",
        exportedAt: new Date().toISOString(),
        profile,
        totalDreamsCount: dreams.length,
        dreams,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stardrift-dreams-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingJson(false);
    }
  }

  async function handleExportCsv() {
    setExportingCsv(true);
    try {
      let dreams: Dream[] = [];
      try {
        const res = await dreamsApi.list();
        dreams = res.results || [];
      } catch (e) {
        console.warn("Could not fetch dreams for CSV export:", e);
      }

      const headers = ["ID", "Date", "Title", "Type", "Mood", "Lucid", "Recurring", "Sleep Quality", "Tags"];
      const rows = dreams.map((d) => [
        `"${d.id}"`,
        `"${d.dream_date}"`,
        `"${(d.title || "").replace(/"/g, '""')}"`,
        `"${d.dream_type}"`,
        `"${d.mood}"`,
        d.is_lucid ? "Yes" : "No",
        d.is_recurring ? "Yes" : "No",
        d.sleep_quality ? `${d.sleep_quality}/5` : "N/A",
        `"${(d.tags_detail || []).map((t) => t.name).join(", ")}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stardrift-journal-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingCsv(false);
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await profileApi.delete();
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      try {
        localStorage.clear();
      } catch {}
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to delete account:", err);
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account. Please try again.");
      setDeleting(false);
    }
  }

  const TIMEZONES = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Toronto", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
    "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney",
  ];

  return (
    <div
      className="flex flex-col gap-6 max-w-3xl pb-16"
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white" style={{ fontFamily: "Quicksand, sans-serif" }}>
          Settings
        </h1>
        <p className="text-sm font-semibold mt-1" style={{ color: "#7781ac" }}>
          Configure application preferences, morning reminders, privacy, and data exports.
        </p>
      </div>

      {/* 1. SEPARATE PROFILE BANNER */}
      <div
        className="rounded-2xl border-2 border-[#081326] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_3px_0_0_#081326]"
        style={{
          background: "linear-gradient(135deg, #102142, #183366)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] text-[#081326] font-black text-base shadow-[0_2px_0_0_#081326]">
            <User size={20} strokeWidth={2.6} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">Looking for your Profile?</h3>
              <span className="rounded-md border border-[#ffe082]/40 bg-[#ffe082]/10 px-1.5 py-0.5 text-[10px] font-black text-[#ffe082]">
                New Hub
              </span>
            </div>
            <p className="text-xs font-semibold text-[#8cb2e0] mt-0.5">
              Customize your Dreamer name, view recall streaks, badges, and journal intentions.
            </p>
          </div>
        </div>

        <Link
          href="/profile"
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl border-2 border-[#081326] bg-[#ffe082] px-4 py-2 text-xs font-black text-[#081326] shadow-[0_2.5px_0_0_#081326] hover:brightness-105 active:translate-y-0.5 transition-all"
        >
          Open Profile
          <ChevronRight size={14} strokeWidth={2.8} />
        </Link>
      </div>

      {/* 2. LOGGING & JOURNAL PREFERENCES */}
      <SettingSection
        title="Journaling & Logging"
        icon={PenTool}
        description="Choose your preferred workflow when recording morning dreams"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#8cb2e0] mb-2">
              Default Recording Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDefaultLogMode("text")}
                className={`rounded-2xl border-2 p-3.5 text-left flex items-start gap-3 transition-all ${
                  defaultLogMode === "text"
                    ? "border-[#5bb8ff] bg-[#162e59] shadow-[0_3px_0_0_#081326]"
                    : "border-[#081326] bg-[#0c182e] opacity-75 hover:opacity-100 shadow-[0_2px_0_0_#081326]"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#5bb8ff] text-[#081326]">
                  <PenTool size={15} strokeWidth={2.6} />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Classic Text Editor</p>
                  <p className="text-[11px] font-semibold text-[#8cb2e0] mt-0.5">
                    Opens directly to title & markdown story input.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDefaultLogMode("voice")}
                className={`rounded-2xl border-2 p-3.5 text-left flex items-start gap-3 transition-all ${
                  defaultLogMode === "voice"
                    ? "border-[#ffe082] bg-[#162e59] shadow-[0_3px_0_0_#081326]"
                    : "border-[#081326] bg-[#0c182e] opacity-75 hover:opacity-100 shadow-[0_2px_0_0_#081326]"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#ffe082] text-[#081326]">
                  <Mic size={15} strokeWidth={2.6} />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Voice Note Prompt</p>
                  <p className="text-[11px] font-semibold text-[#8cb2e0] mt-0.5">
                    Prioritizes microphone voice capture right in bed.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p className="text-sm font-bold text-white">Auto-save in-progress dreams</p>
              <p className="text-xs font-semibold text-[#7781ac] mt-0.5">
                Preserve draft entries locally if your browser accidentally closes
              </p>
            </div>
            <label className="toggle-switch cursor-pointer">
              <input
                type="checkbox"
                checked={autoSaveDrafts}
                onChange={(e) => setAutoSaveDrafts(e.target.checked)}
              />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </label>
          </div>
        </div>
      </SettingSection>

      {/* 3. TIMEZONE */}
      <SettingSection
        title="Timezone & Calendar"
        icon={Globe}
        description="Ensures dream dates and morning recall streaks align with your local sunrise"
      >
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-[#8cb2e0] mb-2">
            Your Local Timezone
          </label>
          <div className="relative max-w-sm">
            <select
              id="timezone-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="input-glass w-full text-xs font-bold"
              style={{
                backgroundColor: "#0c182e",
                border: "2px solid #081326",
                borderRadius: "0.875rem",
                color: "#eaf0ff",
                boxShadow: "0 2px 0 0 #081326",
              }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz} style={{ backgroundColor: "#0c182e", color: "#eaf0ff" }}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SettingSection>

      {/* 4. MORNING RECALL REMINDERS */}
      <SettingSection
        title="Morning Recall Reminders"
        icon={Bell}
        description="A gentle nudge right as you wake up so dreams don't slip away"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Daily wake-up reminder</p>
              <p className="text-xs font-semibold text-[#7781ac] mt-0.5">
                Send a morning reminder notification to record your dream
              </p>
            </div>
            <label className="toggle-switch cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
              />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </label>
          </div>

          {reminderEnabled && (
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#5bb8ff]/20 bg-[#102242]"
            >
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#ffe082]" />
                <span className="text-xs font-black text-white">Preferred Reminder Time</span>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="rounded-lg border-2 border-[#081326] bg-[#0c182e] px-2.5 py-1 text-xs font-bold text-white shadow-[0_2px_0_0_#081326]"
              />
            </div>
          )}

          {/* Browser Notification Permission Status */}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p className="text-xs font-bold text-[#8cb2e0]">Browser Notification Status</p>
              <p className="text-[11px] font-semibold text-[#7781ac]">
                {notifPermission === "granted"
                  ? "✓ Allowed by your browser"
                  : notifPermission === "denied"
                  ? "✕ Blocked in browser settings"
                  : "Prompt permission to send alerts"}
              </p>
            </div>
            {notifPermission !== "granted" && (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                Enable Notifications
              </button>
            )}
          </div>
        </div>
      </SettingSection>

      {/* Save Button */}
      <button
        id="save-settings-btn"
        onClick={handleSavePreferences}
        className="btn-primary w-fit self-start cursor-pointer"
        disabled={saving}
      >
        {saving ? (
          <span className="flex items-center gap-2"><span className="spinner" /> Saving preferences…</span>
        ) : saved ? (
          <span className="flex items-center gap-1.5"><Check size={16} strokeWidth={3} /> Preferences Saved!</span>
        ) : (
          <span className="flex items-center gap-2"><Save size={16} strokeWidth={2.4} /> Save Preferences</span>
        )}
      </button>

      {/* 5. PRIVACY & SECURITY GUARANTEE */}
      <SettingSection
        title="Privacy & Security"
        icon={ShieldCheck}
        description="How Stardrift safeguards your private subconscious logs"
      >
        <div className="flex flex-col gap-2.5 text-xs font-semibold text-[#8cb2e0]">
          <div className="flex items-center gap-2 text-white font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-[#081326] bg-[#64dfd0] text-[#081326]">
              <Check size={13} strokeWidth={3} />
            </span>
            Isolated User Vault
          </div>
          <p className="pl-7 text-[11px] text-[#7781ac]">
            Your dreams are stored with strict Row-Level Security. No other dreamer can ever query or view your dreams.
          </p>
          <div className="flex items-center gap-2 text-white font-bold pt-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-[#081326] bg-[#5bb8ff] text-[#081326]">
              <Check size={13} strokeWidth={3} />
            </span>
            Authenticated Sessions
          </div>
          <p className="pl-7 text-[11px] text-[#7781ac]">
            Secured via Supabase authentication tokens. You retain full ownership and export rights of your data.
          </p>
        </div>
      </SettingSection>

      {/* 6. DATA BACKUP & EXPORT */}
      <SettingSection
        title="Data Backup & Export"
        icon={Download}
        description="Download your dream archive in open, portable formats anytime"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <div>
              <p className="text-sm font-bold text-white">Export Full Dream Archive (JSON)</p>
              <p className="text-xs font-semibold text-[#7781ac]">
                Complete export including dream transcripts, AI insights, tags, and timestamps.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              disabled={exportingJson}
              className="btn-ghost text-xs py-2 px-4 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Download size={14} />
              {exportingJson ? "Exporting…" : "Export JSON"}
            </button>
          </div>

          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p className="text-sm font-bold text-white">Export Dream Spreadsheet (CSV)</p>
              <p className="text-xs font-semibold text-[#7781ac]">
                Tabular format ready for Excel, Apple Numbers, or Google Sheets.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="btn-ghost text-xs py-2 px-4 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              {exportingCsv ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>
      </SettingSection>

      {/* 7. ACCOUNT SESSION & DANGER ZONE */}
      <SettingSection
        title="Account & Danger Zone"
        icon={Trash2}
        description="Manage your active login session or permanently delete your account"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-white">Sign Out</p>
              <p className="text-xs font-semibold text-[#7781ac]">End current session on this device</p>
            </div>
            <button onClick={handleSignOut} className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer">
              <LogOut size={14} /> Sign out
            </button>
          </div>

          <div
            className="flex items-center justify-between py-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p className="text-sm font-black text-[#ff859d]">Delete Account Permanently</p>
              <p className="text-xs font-semibold text-[#7781ac]">
                Irreversibly delete your account, dream records, patterns, and files
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowDeleteModal(true); setDeleteError(null); }}
              className="btn-danger text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={14} /> Delete Account
            </button>
          </div>
        </div>
      </SettingSection>

      {/* Delete Account Modal Popup */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(7, 11, 25, 0.78)", backdropFilter: "blur(8px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setShowDeleteModal(false);
              setDeleteError(null);
            }
          }}
        >
          <div
            className="glass-card max-w-md w-full p-6 relative flex flex-col gap-5 fade-up"
            style={{
              background: "linear-gradient(145deg, #162444, #101c38)",
              border: "2.5px solid #081326",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(242, 166, 197, 0.15)",
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                if (!deleting) {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#7781ac] hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
              disabled={deleting}
            >
              <X size={18} />
            </button>

            {/* Header Icon + Title */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-[#081326] bg-[#ff859d]/15 shadow-[0_2px_0_0_#081326]"
              >
                <AlertTriangle size={24} className="text-[#ff859d]" />
              </div>
              <div>
                <h3
                  className="text-lg font-black text-white"
                  style={{ fontFamily: "Quicksand, sans-serif" }}
                >
                  Delete Account
                </h3>
                <p className="text-xs font-bold text-[#7781ac]">
                  This action is permanent and cannot be undone
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <p className="text-xs font-semibold leading-relaxed text-[#aeb8e0]">
              Are you sure you want to permanently delete your account? All your recorded dream logs, journal entries, AI pattern insights, and profile data will be permanently purged.
            </p>

            {deleteError && (
              <div
                className="rounded-xl p-3 text-xs font-bold border border-[#ff859d]/40 bg-[#ff859d]/10 text-[#ff859d]"
              >
                {deleteError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="btn-ghost text-xs py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="btn-danger text-xs py-2 px-5 inline-flex items-center gap-2 cursor-pointer font-black"
              >
                {deleting ? (
                  <>
                    <span className="spinner" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
