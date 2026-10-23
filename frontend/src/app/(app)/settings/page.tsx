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
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    setSaving(true);
    setSaved(false);
    try {
      await profileApi.update({ display_name: displayName, timezone, theme_preference: theme });
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
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await profileApi.delete();
      const supabase = getSupabaseClient();
      if (supabase) await supabase.auth.signOut();
      router.push("/");
    } catch {
      // show error
    }
  }

  function handleExportData() {
    const blob = new Blob([JSON.stringify({ profile, exportedAt: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "obsidiandreams-export.json";
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
          <label className="block text-sm mb-2" style={{ color: "#aeb8e0" }}>Display name</label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-glass"
            placeholder="Your name"
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
          "✓ Saved!"
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
              <p className="text-sm" style={{ color: "#f2a6c5" }}>Delete account</p>
              <p className="text-xs" style={{ color: "#7781ac" }}>
                {confirmDelete
                  ? "⚠️ Are you sure? This cannot be undone."
                  : "Permanently delete your account and all dream data"}
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="btn-danger text-sm py-2 px-4"
            >
              <Trash2 size={15} />
              {confirmDelete ? "Confirm" : "Delete"}
            </button>
          </div>
        </div>
      </SettingSection>
    </div>
  );
}
