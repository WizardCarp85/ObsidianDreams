"use client";

import { useEffect, useState } from "react";
import { profileApi } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types";
import {
  User,
  Globe,
  Palette,
  Bell,
  Download,
  Trash2,
  Moon,
  Sun,
  LogOut,
  Save,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";

function SettingSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Icon size={18} style={{ color: "#6c8eff" }} />
        <h2
          className="font-semibold"
          style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
        >
          {title}
        </h2>
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
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    profileApi.get()
      .then((p) => {
        setProfile(p);
        setDisplayName(p.display_name || "");
        setTimezone(p.timezone || "UTC");
        setTheme(p.theme_preference || "dark");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const trimmed = displayName.trim();
    if (!trimmed) {
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const updated = await profileApi.update({
        display_name: trimmed,
        timezone,
        theme_preference: theme,
      });
      setProfile(updated);
      setDisplayName(updated.display_name);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("profile-updated", { detail: { display_name: updated.display_name } })
        );
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // show error
    } finally {
      setSaving(false);
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

  function handleExportData() {
    const blob = new Blob([JSON.stringify({ profile, exportedAt: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stardrift-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const TIMEZONES = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Toronto", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
    "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney",
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Quicksand, sans-serif" }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "#7781ac" }}>
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile */}
      <SettingSection title="Profile" icon={User}>
        <div>
          <label className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>
            Display name <span className="text-[#ffe082]" title="Required">*</span>
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-glass"
            placeholder="Your name"
            required
            minLength={2}
          />
        </div>
        {profile && (
          <div>
            <label className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>Email</label>
            <input
              type="email"
              value={profile.email}
              readOnly
              className="input-glass"
              style={{ opacity: 0.6, cursor: "not-allowed" }}
            />
            <p className="text-xs mt-1" style={{ color: "#7781ac" }}>
              Email is managed by Supabase Auth
            </p>
          </div>
        )}
      </SettingSection>

      {/* Timezone */}
      <SettingSection title="Timezone" icon={Globe}>
        <div>
          <label className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>Your timezone</label>
          <select
            id="timezone-select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="input-glass"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </SettingSection>

      {/* Theme */}
      <SettingSection title="Appearance" icon={Palette}>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
              theme === "dark" ? "border-2" : "border"
            }`}
            style={{
              background: theme === "dark" ? "rgba(108,142,255,0.1)" : "rgba(255,255,255,0.04)",
              borderColor: theme === "dark" ? "#6c8eff" : "rgba(255,255,255,0.1)",
            }}
          >
            <Moon size={22} style={{ color: theme === "dark" ? "#6c8eff" : "#7781ac" }} />
            <span
              className="text-sm font-medium"
              style={{ color: theme === "dark" ? "#6c8eff" : "#7781ac", fontFamily: "Quicksand, sans-serif" }}
            >
              Night (dark)
            </span>
          </button>
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
              theme === "light" ? "border-2" : "border"
            }`}
            style={{
              background: theme === "light" ? "rgba(108,142,255,0.1)" : "rgba(255,255,255,0.04)",
              borderColor: theme === "light" ? "#6c8eff" : "rgba(255,255,255,0.1)",
            }}
          >
            <Sun size={22} style={{ color: theme === "light" ? "#6c8eff" : "#7781ac" }} />
            <span
              className="text-sm font-medium"
              style={{ color: theme === "light" ? "#6c8eff" : "#7781ac", fontFamily: "Quicksand, sans-serif" }}
            >
              Dawn (light)
            </span>
          </button>
        </div>
      </SettingSection>

      {/* Reminders (stub) */}
      <SettingSection title="Reminders" icon={Bell}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: "#aeb8e0" }}>Daily dream reminder</p>
            <p className="text-xs mt-1" style={{ color: "#7781ac" }}>
              Reminder notifications (coming in Part 2)
            </p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" disabled />
            <span className="toggle-track" style={{ opacity: 0.4 }} />
            <span className="toggle-thumb" />
          </label>
        </div>
      </SettingSection>

      {/* Save button */}
      <button
        id="save-settings-btn"
        onClick={handleSave}
        className="btn-primary w-fit"
        disabled={saving}
      >
        {saving ? (
          <span className="flex items-center gap-2"><span className="spinner" /> Saving…</span>
        ) : saved ? (
          <span className="flex items-center gap-1.5"><Check size={16} /> Saved!</span>
        ) : (
          <span className="flex items-center gap-2"><Save size={16} /> Save preferences</span>
        )}
      </button>

      {/* Data & Account */}
      <SettingSection title="Data & Account" icon={Download}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm" style={{ color: "#aeb8e0" }}>Export data</p>
              <p className="text-xs" style={{ color: "#7781ac" }}>Download your profile data as JSON</p>
            </div>
            <button onClick={handleExportData} className="btn-ghost text-sm py-2 px-4">
              <Download size={15} /> Export
            </button>
          </div>
          <div
            className="flex items-center justify-between py-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p className="text-sm" style={{ color: "#aeb8e0" }}>Sign out</p>
              <p className="text-xs" style={{ color: "#7781ac" }}>Sign out of your account</p>
            </div>
            <button onClick={handleSignOut} className="btn-ghost text-sm py-2 px-4">
              <LogOut size={15} /> Sign out
            </button>
          </div>
          <div
            className="flex items-center justify-between py-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f2a6c5" }}>Delete account</p>
              <p className="text-xs" style={{ color: "#7781ac" }}>
                Permanently delete your account, dream records, and patterns
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowDeleteModal(true); setDeleteError(null); }}
              className="btn-danger text-sm py-2 px-4"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>
      </SettingSection>

      {/* Delete Account Modal Popup */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(7, 11, 25, 0.75)", backdropFilter: "blur(8px)" }}
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
              background: "linear-gradient(145deg, rgba(22, 28, 54, 0.95), rgba(16, 20, 42, 0.98))",
              border: "1px solid rgba(242, 166, 197, 0.3)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(242, 166, 197, 0.15)",
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
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: "#7781ac" }}
              aria-label="Close modal"
              disabled={deleting}
            >
              <X size={18} />
            </button>

            {/* Header Icon + Title */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(242, 166, 197, 0.12)",
                  border: "1px solid rgba(242, 166, 197, 0.3)",
                }}
              >
                <AlertTriangle size={24} style={{ color: "#f2a6c5" }} />
              </div>
              <div>
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: "Quicksand, sans-serif", color: "#ffffff" }}
                >
                  Delete Account
                </h3>
                <p className="text-xs" style={{ color: "#7781ac" }}>
                  This action is permanent and cannot be undone
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <p className="text-sm leading-relaxed" style={{ color: "#aeb8e0" }}>
              Are you sure you want to permanently delete your account? All your dream logs, interpretations, patterns, and profile settings will be erased immediately.
            </p>

            {deleteError && (
              <div
                className="rounded-xl p-3 text-xs"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                }}
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
                className="btn-ghost text-sm py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="btn-danger text-sm py-2 px-5 inline-flex items-center gap-2 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <span className="spinner" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Yes, delete permanently
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
