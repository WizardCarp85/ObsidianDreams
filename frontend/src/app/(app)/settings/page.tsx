"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Download,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Globe,
  Hash,
  Info,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mic,
  Moon,
  PenTool,
  RotateCcw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { dreamsApi, profileApi } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase";
import type { Dream, DreamType } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */

type LogMode = "text" | "voice";
type DateFormat = "locale" | "mdy" | "dmy" | "iso";
type TimeFormat = "12h" | "24h";
type WeekStart = "monday" | "sunday";
type AiStyle = "symbolic" | "psychological" | "concise";
type PermissionState = NotificationPermission | "unsupported";
type Feedback = { type: "success" | "error" | "info"; message: string };

interface SettingsState {
  // 1. Journaling & Capture
  defaultLogMode: LogMode;
  defaultDreamType: DreamType;
  defaultSleepQuality: number; // 0 = ask every time
  voiceLanguage: string;
  autoSaveDrafts: boolean;
  autoSuggestTags: boolean;
  // 2. Morning Recall & Lucid Reminders
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: string[];
  lucidCheckEnabled: boolean;
  lucidCheckInterval: string;
  // 3. AI & Pattern Analysis
  aiInsightsEnabled: boolean;
  aiStyle: AiStyle;
  defaultPatternDays: number;
  includeNightmaresInAi: boolean;
  // 4. Timezone & Calendar
  timezone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  weekStart: WeekStart;
  // 5. Privacy & Security
  blurPreviews: boolean;
  pinLockEnabled: boolean;
  pinCode: string;
  autoLockMinutes: number;
}

const DEFAULT_SETTINGS: SettingsState = {
  defaultLogMode: "text",
  defaultDreamType: "normal",
  defaultSleepQuality: 0,
  voiceLanguage: "en-US",
  autoSaveDrafts: true,
  autoSuggestTags: true,
  reminderEnabled: false,
  reminderTime: "07:30",
  reminderDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  lucidCheckEnabled: false,
  lucidCheckInterval: "3h",
  aiInsightsEnabled: true,
  aiStyle: "symbolic",
  defaultPatternDays: 90,
  includeNightmaresInAi: true,
  timezone: "UTC",
  dateFormat: "locale",
  timeFormat: "12h",
  weekStart: "monday",
  blurPreviews: false,
  pinLockEnabled: false,
  pinCode: "",
  autoLockMinutes: 15,
};

const STORAGE_KEY = "stardrift_app_settings_v2";
const FONT = "'Quicksand', ui-rounded, 'Nunito', sans-serif";

const DAYS = [
  { id: "mon", label: "Mon", full: "Monday" },
  { id: "tue", label: "Tue", full: "Tuesday" },
  { id: "wed", label: "Wed", full: "Wednesday" },
  { id: "thu", label: "Thu", full: "Thursday" },
  { id: "fri", label: "Fri", full: "Friday" },
  { id: "sat", label: "Sat", full: "Saturday" },
  { id: "sun", label: "Sun", full: "Sunday" },
] as const;

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const NAV_SECTIONS: {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: string;
}[] = [
  { id: "journal", label: "Journal & Capture", icon: BookOpen, accent: "#5bb8ff" },
  { id: "reminders", label: "Recall & Reminders", icon: Bell, accent: "#ffe082" },
  { id: "ai", label: "AI & Patterns", icon: Sparkles, accent: "#94adff" },
  { id: "regional", label: "Date & Timezone", icon: Globe, accent: "#64dfd0" },
  { id: "privacy", label: "Privacy & Vault", icon: ShieldCheck, accent: "#5bb8ff" },
  { id: "data", label: "Backup & Export", icon: Download, accent: "#ffe082" },
  { id: "account", label: "Account & Session", icon: LogOut, accent: "#64dfd0" },
  { id: "danger", label: "Danger Zone", icon: Trash2, accent: "#ff859d" },
];

/* ------------------------------------------------------------------ */
/*  Cartoon Theme & SVG Illustrations                                  */
/* ------------------------------------------------------------------ */

function SettingsStyles() {
  return (
    <style>{`
      .st-card {
        border: 2.5px solid #081326;
        box-shadow:
          0 5px 0 0 #081326,
          inset 0 2px 0 0 rgba(255,255,255,0.12);
      }

      .st-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: .5rem;
        border: 2.5px solid #081326;
        border-radius: 1rem;
        font-weight: 800;
        cursor: pointer;
        transition:
          transform .15s ease,
          box-shadow .15s ease,
          background-color .15s ease;
      }

      .st-button:active:not(:disabled) {
        transform: translateY(2px);
        box-shadow: 0 1px 0 0 #081326;
      }

      .st-button:disabled {
        cursor: not-allowed;
        opacity: .6;
      }

      .st-button-sky {
        background: #5bb8ff;
        color: #081326;
        box-shadow:
          0 4px 0 0 #081326,
          inset 0 2px 0 0 rgba(255,255,255,.45);
      }
      .st-button-sky:hover:not(:disabled) {
        background: #77c6ff;
        transform: translateY(-2px);
        box-shadow:
          0 6px 0 0 #081326,
          inset 0 2px 0 0 rgba(255,255,255,.55);
      }

      .st-button-gold {
        background: #ffe082;
        color: #081326;
        box-shadow:
          0 4px 0 0 #081326,
          inset 0 2px 0 0 rgba(255,255,255,.45);
      }
      .st-button-gold:hover:not(:disabled) {
        background: #ffea9f;
        transform: translateY(-2px);
        box-shadow:
          0 6px 0 0 #081326,
          inset 0 2px 0 0 rgba(255,255,255,.55);
      }

      .st-button-navy {
        background: #1c396e;
        color: #eef6ff;
        box-shadow:
          0 4px 0 0 #081326,
          inset 0 2px 0 0 rgba(255,255,255,.13);
      }
      .st-button-navy:hover:not(:disabled) {
        background: #254887;
        transform: translateY(-2px);
        box-shadow:
          0 6px 0 0 #081326,
          inset 0 2px 0 0 rgba(255,255,255,.2);
      }

      .st-button-coral {
        background: #ff859d;
        color: #081326;
        box-shadow:
          0 4px 0 0 #081326,
          inset 0 2px 0 0 rgba(255,255,255,.4);
      }
      .st-button-coral:hover:not(:disabled) {
        background: #ff9cb3;
        transform: translateY(-2px);
        box-shadow:
          0 6px 0 0 #081326,
          inset 0 2px 0 0 rgba(255,255,255,.5);
      }

      .st-button:focus-visible,
      .st-nav-link:focus-visible,
      .st-field:focus-visible,
      .st-choice:focus-visible {
        outline: 3px solid #ffe082;
        outline-offset: 3px;
      }

      .st-field {
        width: 100%;
        min-height: 46px;
        border: 2.5px solid #081326;
        border-radius: .9rem;
        background: #0e2040;
        padding: .65rem .9rem;
        color: #eef6ff;
        font-size: .875rem;
        font-weight: 700;
        outline: none;
        transition: border-color .15s ease, box-shadow .15s ease;
      }

      .st-field:focus {
        border-color: #5bb8ff;
        box-shadow: 0 0 0 3px rgba(91,184,255,.22);
      }

      .st-field::placeholder {
        color: #6d8eb8;
      }

      .st-choice {
        cursor: pointer;
        transition:
          transform .15s ease,
          border-color .15s ease,
          background-color .15s ease,
          box-shadow .15s ease;
      }

      .st-choice:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      .st-nav-link {
        transition:
          transform .15s ease,
          background-color .15s ease,
          color .15s ease;
      }

      .st-nav-link:hover {
        background: #1c396e;
        color: #ffffff;
        transform: translateX(2px);
      }

      @keyframes settingsTwinkle {
        0%, 100% { opacity: .4; transform: scale(.88); }
        50% { opacity: 1; transform: scale(1.14); }
      }

      .settings-twinkle {
        animation: settingsTwinkle 3s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .st-button,
        .st-choice,
        .st-nav-link,
        .settings-twinkle {
          animation: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}

function CartoonCloud({
  className = "",
  fill = "#214685",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 220 90" fill="none" className={className} aria-hidden="true">
      <path
        d="M28 82H190C203.255 82 214 71.2548 214 58C214 45.792 204.88 35.7145 193.079 34.2016C189.261 18.0273 174.725 6 157.4 6C143.829 6 131.954 13.386 125.605 24.3374C119.994 19.7544 112.833 17 105 17C88.2355 17 74.4776 29.6691 72.6977 45.9597C68.8312 43.4557 64.2227 42 59.2727 42C45.315 42 34 53.315 34 67.2727C34 68.1986 34.0497 69.1128 34.1466 70.0131C23.5499 70.7222 15 74.5 15 78.5C15 80.9853 20.8203 82 28 82Z"
        fill={fill}
        stroke="#081326"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M135 22C141 14 149 11 158 11C170 11 181 18 186 29"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartoonStar({
  size = 14,
  color = "#ffe082",
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2C12.7 7.6 16.4 11.3 22 12C16.4 12.7 12.7 16.4 12 22C11.3 16.4 7.6 12.7 2 12C7.6 11.3 11.3 7.6 12 2Z"
        fill={color}
        stroke="#081326"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable UI Primitives                                             */
/* ------------------------------------------------------------------ */

function SettingSection({
  id,
  title,
  description,
  icon: Icon,
  accent,
  badge,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="st-card scroll-mt-24 rounded-3xl bg-[#152d58] p-5 sm:p-6"
    >
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#081326]/50 pb-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#081326] shadow-[0_2px_0_0_#081326]"
            style={{ backgroundColor: accent }}
          >
            <Icon size={20} className="text-[#081326]" strokeWidth={2.5} />
          </span>

          <div>
            <h2 className="text-base font-extrabold text-white sm:text-lg">
              {title}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-[#91b0d8]">
              {description}
            </p>
          </div>
        </div>

        {badge}
      </header>

      {children}
    </section>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  accent = "#64dfd0",
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  accent?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-white">{title}</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-[#91b0d8]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-[#081326] transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
        style={{ backgroundColor: checked ? accent : "#263a5b" }}
      >
        <span
          className="absolute left-[3px] top-[3px] h-[17px] w-[17px] rounded-full border-2 border-[#081326] bg-white shadow-sm transition-transform"
          style={{ transform: checked ? "translateX(19px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}

function StatusBanner({
  feedback,
  onDismiss,
}: {
  feedback: Feedback | null;
  onDismiss: () => void;
}) {
  if (!feedback) return null;

  const isError = feedback.type === "error";
  const isSuccess = feedback.type === "success";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`st-card flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${
        isError
          ? "bg-[#3a2340] text-[#ffd2db]"
          : isSuccess
            ? "bg-[#103a3c] text-[#a8f5e8]"
            : "bg-[#17345f] text-[#cfe3fc]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] text-[#081326] ${
            isError
              ? "bg-[#ff859d]"
              : isSuccess
                ? "bg-[#64dfd0]"
                : "bg-[#5bb8ff]"
          }`}
        >
          {isError ? (
            <AlertTriangle size={16} strokeWidth={2.6} />
          ) : isSuccess ? (
            <Check size={16} strokeWidth={3} />
          ) : (
            <Info size={16} strokeWidth={2.6} />
          )}
        </span>
        <span>{feedback.message}</span>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Export Helpers                                                     */
/* ------------------------------------------------------------------ */

async function fetchAllDreams(): Promise<Dream[]> {
  const allDreams: Dream[] = [];
  let page = 1;

  while (page <= 500) {
    const result = await dreamsApi.list({ page });
    const results = result.results || [];
    allDreams.push(...results);

    if (!result.next || results.length === 0) {
      return allDreams;
    }
    page += 1;
  }

  return allDreams;
}

function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadFile(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/*  Main Settings Page                                                 */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(
    JSON.stringify(DEFAULT_SETTINGS)
  );
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [notifPermission, setNotifPermission] =
    useState<PermissionState>("default");
  const [exporting, setExporting] = useState<"json" | "csv" | "md" | null>(
    null
  );
  const [signingOut, setSigningOut] = useState(false);

  // Danger Zone Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function updateSetting<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  /* 1. Hydrate local settings + backend timezone */
  useEffect(() => {
    let initial = { ...DEFAULT_SETTINGS };

    try {
      const browserTz =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      initial.timezone = browserTz;

      // Support legacy keys if present
      const legacyMode = window.localStorage.getItem(
        "stardrift_default_log_mode"
      );
      if (legacyMode === "text" || legacyMode === "voice") {
        initial.defaultLogMode = legacyMode;
      }

      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        initial = { ...initial, ...parsed };
      }
    } catch {
      // Ignore storage errors
    }

    setSettings(initial);
    setSavedSnapshot(JSON.stringify(initial));
    setLoaded(true);

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(window.Notification.permission);
    } else {
      setNotifPermission("unsupported");
    }

    profileApi
      .get()
      .then((p) => {
        if (p?.timezone) {
          setSettings((prev) => {
            const next = { ...prev, timezone: p.timezone };
            setSavedSnapshot(JSON.stringify(next));
            return next;
          });
        }
      })
      .catch(() => {});
  }, []);

  /* Escape key & scroll lock for Delete Account modal */
  useEffect(() => {
    if (!showDeleteModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !deleting) {
        setShowDeleteModal(false);
        setDeletePhrase("");
        setDeleteError(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showDeleteModal, deleting]);

  const isDirty = useMemo(
    () => loaded && JSON.stringify(settings) !== savedSnapshot,
    [loaded, settings, savedSnapshot]
  );

  /* Save all settings */
  async function handleSavePreferences() {
    setSaving(true);
    setFeedback(null);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      // Keep legacy keys in sync for other components
      window.localStorage.setItem(
        "stardrift_default_log_mode",
        settings.defaultLogMode
      );
      window.localStorage.setItem(
        "stardrift_autosave_drafts",
        String(settings.autoSaveDrafts)
      );
      window.localStorage.setItem(
        "stardrift_reminder_enabled",
        String(settings.reminderEnabled)
      );
      window.localStorage.setItem(
        "stardrift_reminder_time",
        settings.reminderTime
      );

      await profileApi.update({ timezone: settings.timezone }).catch(() => null);

      setSavedSnapshot(JSON.stringify(settings));
      setFeedback({
        type: "success",
        message: "All preferences and settings have been saved!",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Could not save your preferences. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    const browserTz =
      (typeof window !== "undefined" &&
        Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "UTC";
    const resetState = { ...DEFAULT_SETTINGS, timezone: browserTz };
    setSettings(resetState);
    setFeedback({
      type: "info",
      message: "Defaults restored. Click Save Settings to apply.",
    });
  }

  function toggleReminderDay(dayId: string) {
    setSettings((prev) => {
      const exists = prev.reminderDays.includes(dayId);
      const nextDays = exists
        ? prev.reminderDays.filter((d) => d !== dayId)
        : [...prev.reminderDays, dayId];
      return { ...prev, reminderDays: nextDays };
    });
  }

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifPermission("unsupported");
      return;
    }
    try {
      const perm = await window.Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        updateSetting("reminderEnabled", true);
        setFeedback({
          type: "success",
          message: "Browser notifications enabled! Save settings to keep your schedule.",
        });
      } else {
        setFeedback({
          type: "info",
          message: "Notification permission was not granted by your browser.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to request notification permission.",
      });
    }
  }

  function sendTestNotification() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (window.Notification.permission !== "granted") {
      void requestNotificationPermission();
      return;
    }
    try {
      new window.Notification("Morning Dream Recall", {
        body: `Good morning! Take 60 seconds to capture your dream before it fades (${settings.reminderTime}).`,
      });
      setFeedback({
        type: "success",
        message: "Sent a test notification to your browser!",
      });
    } catch {
      setFeedback({
        type: "info",
        message: "Notification permission is active on this device.",
      });
    }
  }

  async function handleExport(format: "json" | "csv" | "md") {
    setExporting(format);
    setFeedback(null);

    try {
      const dreams = await fetchAllDreams();
      const dateStr = new Date().toISOString().split("T")[0];

      if (format === "json") {
        const payload = {
          app: "ObsidianDreams / Stardrift",
          exportedAt: new Date().toISOString(),
          timezone: settings.timezone,
          totalDreamsCount: dreams.length,
          dreams,
        };
        downloadFile(
          JSON.stringify(payload, null, 2),
          `dreams-backup-${dateStr}.json`,
          "application/json;charset=utf-8"
        );
      } else if (format === "csv") {
        const headers = [
          "ID",
          "Date",
          "Title",
          "Type",
          "Mood",
          "Lucid",
          "Recurring",
          "Sleep Quality",
          "Input Method",
          "Tags",
          "Dream Text",
        ];
        const rows = dreams.map((d) => [
          d.id,
          d.dream_date,
          d.title || "",
          d.dream_type,
          d.mood,
          d.is_lucid ? "Yes" : "No",
          d.is_recurring ? "Yes" : "No",
          d.sleep_quality ? `${d.sleep_quality}/5` : "",
          d.input_method || "text",
          (d.tags_detail || []).map((t) => t.name).join(", "),
          d.body || "",
        ]);
        const csv = [
          headers.map(csvCell).join(","),
          ...rows.map((r) => r.map(csvCell).join(",")),
        ].join("\r\n");

        downloadFile(
          `\uFEFF${csv}`,
          `dreams-journal-${dateStr}.csv`,
          "text/csv;charset=utf-8"
        );
      } else {
        const mdLines = [
          `# Personal Dream Storybook`,
          `Exported on ${dateStr} · Total entries: ${dreams.length}`,
          ``,
          ...dreams.flatMap((d) => [
            `---`,
            `## ${d.title || "Untitled Dream"} (${d.dream_date})`,
            `- **Type:** ${d.dream_type} | **Mood:** ${d.mood} | **Lucid:** ${
              d.is_lucid ? "Yes" : "No"
            } | **Sleep:** ${d.sleep_quality ? `${d.sleep_quality}/5` : "N/A"}`,
            d.tags_detail?.length
              ? `- **Tags:** ${d.tags_detail.map((t) => `#${t.name}`).join(" ")}`
              : ``,
            ``,
            d.body || "_No description recorded._",
            ``,
          ]),
        ];
        downloadFile(
          mdLines.join("\n"),
          `dreams-storybook-${dateStr}.md`,
          "text/markdown;charset=utf-8"
        );
      }

      setFeedback({
        type: "success",
        message: `Exported ${dreams.length} ${
          dreams.length === 1 ? "dream" : "dreams"
        } as ${format.toUpperCase()}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Export failed. Try again.",
      });
    } finally {
      setExporting(null);
    }
  }

  function handleClearLocalDrafts() {
    try {
      window.localStorage.removeItem("stardrift_dream_draft");
      setFeedback({
        type: "success",
        message: "Cleared cached local dream drafts.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Could not clear local cache.",
      });
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = getSupabaseClient();
      if (supabase) await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } catch {
      setSigningOut(false);
      setFeedback({
        type: "error",
        message: "Could not sign out. Please try again.",
      });
    }
  }

  async function handleDeleteAccount() {
    if (deletePhrase !== "DELETE") return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await profileApi.delete();
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut().catch(() => undefined);
      }
      try {
        window.localStorage.clear();
      } catch {
        // Ignore storage errors
      }
      window.location.href = "/";
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to delete account. Please try again."
      );
      setDeleting(false);
    }
  }

  const timezoneList = useMemo(
    () => Array.from(new Set([settings.timezone, ...TIMEZONES])),
    [settings.timezone]
  );

  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-28 text-[#eef6ff] md:pb-12"
      style={{ fontFamily: FONT }}
    >
      <SettingsStyles />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ILLUSTRATED STORYBOOK HERO                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <header className="st-card relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1b3a70] via-[#152d59] to-[#0e2040] p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#5bb8ff]/15 blur-[75px]"
          aria-hidden="true"
        />

        <CartoonCloud
          fill="#214685"
          className="pointer-events-none absolute -bottom-7 -right-8 hidden w-56 opacity-80 sm:block"
        />
        <CartoonStar
          size={16}
          color="#ffe082"
          className="settings-twinkle pointer-events-none absolute right-10 top-8"
        />
        <CartoonStar
          size={11}
          color="#64dfd0"
          className="settings-twinkle pointer-events-none absolute right-28 top-16 hidden sm:block"
        />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-xs font-extrabold text-[#7ac8ff] shadow-[0_2px_0_0_#081326]">
              <Settings2 size={13} className="text-[#ffe082]" />
              Control Center
            </span>

            <h1 className="text-3xl font-extrabold tracking-tight text-white [text-shadow:0_3px_0_#081326] sm:text-4xl">
              App Settings
            </h1>

            <p className="mt-2 max-w-lg text-sm font-semibold leading-relaxed text-[#bad4f7]">
              Configure your dream capture defaults, morning recall alarms, AI
              pattern analysis, privacy locks, and archive backups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={saving || !loaded}
              className="st-button st-button-navy px-4 py-3 text-xs"
            >
              <RotateCcw size={14} />
              Reset defaults
            </button>

            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={saving || !loaded}
              className="st-button st-button-sky px-5 py-3 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Settings
                  {isDirty && (
                    <span className="ml-1 h-2.5 w-2.5 rounded-full border border-[#081326] bg-[#ffe082]" />
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <StatusBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TWO-COLUMN LAYOUT: STICKY NAV RAIL + SETTINGS STACK            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        {/* Left Sticky Section Rail */}
        <nav
          aria-label="Settings sections"
          className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-6 lg:flex-col lg:overflow-visible"
        >
          {NAV_SECTIONS.map(({ id, label, icon: Icon, accent }) => (
            <a
              key={id}
              href={`#${id}`}
              className="st-nav-link flex shrink-0 items-center gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#12264a] px-3 py-2.5 text-xs font-extrabold text-[#bed6f5] shadow-[0_3px_0_0_#081326] lg:w-full"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-[#081326]"
                style={{ backgroundColor: accent }}
              >
                <Icon size={14} className="text-[#081326]" strokeWidth={2.5} />
              </span>
              <span className="truncate">{label}</span>
            </a>
          ))}
        </nav>

        {/* Right Content Column */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* 1. JOURNALING & CAPTURE */}
          <SettingSection
            id="journal"
            title="Journaling & Capture"
            description="Customize your morning editor, voice transcription, and smart taggers."
            icon={BookOpen}
            accent="#5bb8ff"
          >
            <div className="space-y-5">
              {/* Default Recording Mode */}
              <div>
                <label className="mb-2.5 block text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]">
                  Default Recording Mode
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: "text",
                        title: "Classic Text Editor",
                        description:
                          "Opens directly to the title and story editor.",
                        icon: PenTool,
                        color: "#5bb8ff",
                      },
                      {
                        value: "voice",
                        title: "Voice Note Prompt",
                        description:
                          "Prioritizes hands-free microphone capture in bed.",
                        icon: Mic,
                        color: "#ffe082",
                      },
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const selected = settings.defaultLogMode === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateSetting("defaultLogMode", option.value)
                        }
                        className={`st-choice flex items-start gap-3 rounded-2xl border-2 p-4 text-left ${
                          selected
                            ? "border-[#5bb8ff] bg-[#193765] shadow-[0_3px_0_0_#081326]"
                            : "border-[#081326] bg-[#0e2040]"
                        }`}
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] shadow-[0_2px_0_0_#081326]"
                          style={{ backgroundColor: option.color }}
                        >
                          <Icon
                            size={18}
                            className="text-[#081326]"
                            strokeWidth={2.6}
                          />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-white">
                            {option.title}
                          </span>
                          <span className="mt-1 block text-xs font-medium leading-relaxed text-[#9bc0ed]">
                            {option.description}
                          </span>
                        </span>

                        {selected && (
                          <Check
                            size={17}
                            className="shrink-0 text-[#64dfd0]"
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Dream Type, Sleep Rating & Voice Language */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <label
                    htmlFor="default-dream-type"
                    className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]"
                  >
                    <Moon size={13} className="text-[#94adff]" />
                    Default Dream Type
                  </label>
                  <select
                    id="default-dream-type"
                    value={settings.defaultDreamType}
                    onChange={(e) =>
                      updateSetting(
                        "defaultDreamType",
                        e.target.value as DreamType
                      )
                    }
                    className="st-field"
                  >
                    <option value="normal">Normal Dream</option>
                    <option value="lucid">Lucid Dream</option>
                    <option value="recurring">Recurring Dream</option>
                    <option value="fragmented">Fragmented</option>
                    <option value="nightmare">Nightmare</option>
                    <option value="nap">Daytime Nap</option>
                  </select>
                </div>

                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <label
                    htmlFor="default-sleep-quality"
                    className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]"
                  >
                    <Star size={13} className="text-[#ffe082]" />
                    Default Sleep Rating
                  </label>
                  <select
                    id="default-sleep-quality"
                    value={settings.defaultSleepQuality}
                    onChange={(e) =>
                      updateSetting(
                        "defaultSleepQuality",
                        Number(e.target.value)
                      )
                    }
                    className="st-field"
                  >
                    <option value={0}>Ask every time</option>
                    <option value={5}>5 / 5 Stars</option>
                    <option value={4}>4 / 5 Stars</option>
                    <option value={3}>3 / 5 Stars</option>
                    <option value={2}>2 / 5 Stars</option>
                    <option value={1}>1 / 5 Stars</option>
                  </select>
                </div>

                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <label
                    htmlFor="voice-lang"
                    className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]"
                  >
                    <Mic size={13} className="text-[#64dfd0]" />
                    Voice Dictation Language
                  </label>
                  <select
                    id="voice-lang"
                    value={settings.voiceLanguage}
                    onChange={(e) =>
                      updateSetting("voiceLanguage", e.target.value)
                    }
                    className="st-field"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="en-AU">English (AU)</option>
                    <option value="es-ES">Español</option>
                    <option value="fr-FR">Français</option>
                    <option value="de-DE">Deutsch</option>
                    <option value="hi-IN">हिन्दी (Hindi)</option>
                    <option value="ja-JP">日本語 (Japanese)</option>
                  </select>
                </div>
              </div>

              {/* Toggles: Auto-save & Smart Tagging */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <ToggleRow
                    title="Auto-save in-progress dreams"
                    description="Preserve unfinished drafts locally if your browser closes."
                    checked={settings.autoSaveDrafts}
                    onChange={(val) => updateSetting("autoSaveDrafts", val)}
                    accent="#64dfd0"
                  />
                </div>

                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <ToggleRow
                    title="Smart keyword tag suggestions"
                    description="Automatically suggest #tags like water, flying, or maze as you type."
                    checked={settings.autoSuggestTags}
                    onChange={(val) => updateSetting("autoSuggestTags", val)}
                    accent="#5bb8ff"
                  />
                </div>
              </div>
            </div>
          </SettingSection>

          {/* 2. MORNING RECALL & LUCID REMINDERS */}
          <SettingSection
            id="reminders"
            title="Morning Recall & Reminders"
            description="Gentle nudges right as you wake up so fleeting dreams don't slip away."
            icon={Bell}
            accent="#ffe082"
          >
            <div className="space-y-5">
              <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                <ToggleRow
                  title="Daily wake-up recall reminder"
                  description="Send a morning notification to record your dream."
                  checked={settings.reminderEnabled}
                  onChange={(val) => updateSetting("reminderEnabled", val)}
                  accent="#ffe082"
                />
              </div>

              <div
                className={`grid gap-4 sm:grid-cols-2 ${
                  settings.reminderEnabled ? "" : "opacity-50"
                }`}
              >
                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <label
                    htmlFor="reminder-time"
                    className="mb-2 flex items-center gap-2 text-sm font-extrabold text-white"
                  >
                    <Clock3 size={15} className="text-[#ffe082]" />
                    Preferred Reminder Time
                  </label>
                  <input
                    id="reminder-time"
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) =>
                      updateSetting("reminderTime", e.target.value)
                    }
                    disabled={!settings.reminderEnabled}
                    className="st-field"
                  />
                </div>

                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-extrabold text-white">
                      Active Days
                    </p>
                    <button
                      type="button"
                      disabled={!settings.reminderEnabled}
                      onClick={() =>
                        updateSetting(
                          "reminderDays",
                          DAYS.map((d) => d.id)
                        )
                      }
                      className="text-[11px] font-extrabold text-[#7ac8ff] hover:text-white disabled:opacity-50"
                    >
                      Every day
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((day) => {
                      const selected = settings.reminderDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          disabled={!settings.reminderEnabled}
                          aria-pressed={selected}
                          onClick={() => toggleReminderDay(day.id)}
                          className={`st-choice h-9 min-w-10 rounded-xl border-2 px-2 text-[11px] font-extrabold ${
                            selected
                              ? "border-[#081326] bg-[#64dfd0] text-[#081326] shadow-[0_2px_0_0_#081326]"
                              : "border-[#081326] bg-[#172f59] text-[#9bc0ed]"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Daytime Reality Check Nudge */}
              <div className="grid gap-4 sm:grid-cols-[1fr_200px] items-center rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                <ToggleRow
                  title="Daytime Lucid Reality-Check Nudges"
                  description="Periodic daytime reminders to ask 'Am I dreaming?' and build lucid habits."
                  checked={settings.lucidCheckEnabled}
                  onChange={(val) => updateSetting("lucidCheckEnabled", val)}
                  accent="#94adff"
                />

                <select
                  aria-label="Reality check frequency"
                  value={settings.lucidCheckInterval}
                  disabled={!settings.lucidCheckEnabled}
                  onChange={(e) =>
                    updateSetting("lucidCheckInterval", e.target.value)
                  }
                  className="st-field disabled:opacity-50"
                >
                  <option value="2h">Every 2 hours</option>
                  <option value="3h">Every 3 hours</option>
                  <option value="4h">Every 4 hours</option>
                  <option value="daily">Once at midday</option>
                </select>
              </div>

              {/* Browser Notification Permission Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#081326] bg-[#102448] p-4">
                <div>
                  <p className="text-xs font-extrabold text-white">
                    Browser Notification Permission
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#9bc0ed]">
                    {notifPermission === "granted"
                      ? "✓ Allowed by your browser"
                      : notifPermission === "denied"
                        ? "✕ Blocked in browser settings"
                        : notifPermission === "unsupported"
                          ? "Not supported in this browser"
                          : "Prompt permission to receive wake-up alerts"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {notifPermission !== "granted" &&
                    notifPermission !== "unsupported" && (
                      <button
                        type="button"
                        onClick={requestNotificationPermission}
                        className="st-button st-button-gold px-3.5 py-2 text-xs"
                      >
                        <Bell size={14} />
                        Enable Notifications
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={sendTestNotification}
                    className="st-button st-button-navy px-3.5 py-2 text-xs"
                  >
                    <Send size={13} />
                    Test Alert
                  </button>
                </div>
              </div>
            </div>
          </SettingSection>

          {/* 3. AI & PATTERN ANALYSIS */}
          <SettingSection
            id="ai"
            title="AI & Pattern Analysis"
            description="Control how your subconscious patterns and recurring themes are interpreted."
            icon={Sparkles}
            accent="#94adff"
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <ToggleRow
                    title="Enable AI Narrative Insights"
                    description="Allow AI to generate pattern summaries on your Dashboard and Patterns hub."
                    checked={settings.aiInsightsEnabled}
                    onChange={(val) => updateSetting("aiInsightsEnabled", val)}
                    accent="#94adff"
                  />
                </div>

                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <ToggleRow
                    title="Include Nightmares in AI Summaries"
                    description="Analyze scary or anxious entries when computing recurring themes."
                    checked={settings.includeNightmaresInAi}
                    onChange={(val) =>
                      updateSetting("includeNightmaresInAi", val)
                    }
                    disabled={!settings.aiInsightsEnabled}
                    accent="#64dfd0"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <label
                    htmlFor="ai-style"
                    className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]"
                  >
                    <Brain size={14} className="text-[#94adff]" />
                    Interpretation Style
                  </label>
                  <select
                    id="ai-style"
                    value={settings.aiStyle}
                    disabled={!settings.aiInsightsEnabled}
                    onChange={(e) =>
                      updateSetting("aiStyle", e.target.value as AiStyle)
                    }
                    className="st-field disabled:opacity-50"
                  >
                    <option value="symbolic">Symbolic &amp; Archetypal</option>
                    <option value="psychological">
                      Emotional &amp; Reflective
                    </option>
                    <option value="concise">Concise &amp; Grounded</option>
                  </select>
                </div>

                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <label
                    htmlFor="default-pattern-days"
                    className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]"
                  >
                    <Compass size={14} className="text-[#64dfd0]" />
                    Default Pattern Window
                  </label>
                  <select
                    id="default-pattern-days"
                    value={settings.defaultPatternDays}
                    onChange={(e) =>
                      updateSetting(
                        "defaultPatternDays",
                        Number(e.target.value)
                      )
                    }
                    className="st-field"
                  >
                    <option value={30}>Last 30 Nights</option>
                    <option value={90}>Last 90 Nights</option>
                    <option value={365}>Last 1 Year</option>
                  </select>
                </div>
              </div>
            </div>
          </SettingSection>

          {/* 4. TIMEZONE & CALENDAR */}
          <SettingSection
            id="regional"
            title="Timezone & Calendar"
            description="Ensures dream dates and morning recall streaks align with your local sunrise."
            icon={Globe}
            accent="#64dfd0"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4 sm:col-span-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="timezone-select"
                    className="flex items-center gap-2 text-sm font-extrabold text-white"
                  >
                    <Globe size={15} className="text-[#64dfd0]" />
                    Your Local Timezone
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const detected =
                        Intl.DateTimeFormat().resolvedOptions().timeZone ||
                        "UTC";
                      updateSetting("timezone", detected);
                    }}
                    className="text-xs font-extrabold text-[#7ac8ff] hover:text-white"
                  >
                    Detect current timezone
                  </button>
                </div>

                <select
                  id="timezone-select"
                  value={settings.timezone}
                  onChange={(e) => updateSetting("timezone", e.target.value)}
                  className="st-field"
                >
                  {timezoneList.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                <label
                  htmlFor="date-format"
                  className="mb-2 flex items-center gap-2 text-sm font-extrabold text-white"
                >
                  <CalendarDays size={15} className="text-[#ffe082]" />
                  Date Format
                </label>
                <select
                  id="date-format"
                  value={settings.dateFormat}
                  onChange={(e) =>
                    updateSetting("dateFormat", e.target.value as DateFormat)
                  }
                  className="st-field"
                >
                  <option value="locale">Device Default</option>
                  <option value="mdy">MM / DD / YYYY</option>
                  <option value="dmy">DD / MM / YYYY</option>
                  <option value="iso">YYYY-MM-DD (ISO)</option>
                </select>
              </div>

              <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                <label
                  htmlFor="week-start"
                  className="mb-2 flex items-center gap-2 text-sm font-extrabold text-white"
                >
                  <Clock3 size={15} className="text-[#5bb8ff]" />
                  Week Starts On
                </label>
                <select
                  id="week-start"
                  value={settings.weekStart}
                  onChange={(e) =>
                    updateSetting("weekStart", e.target.value as WeekStart)
                  }
                  className="st-field"
                >
                  <option value="monday">Monday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
            </div>
          </SettingSection>

          {/* 5. PRIVACY & VAULT SECURITY */}
          <SettingSection
            id="privacy"
            title="Privacy & Vault Security"
            description="How your private subconscious entries are protected on this device and in the cloud."
            icon={ShieldCheck}
            accent="#5bb8ff"
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <ToggleRow
                    title="Privacy Blur in Journal List"
                    description="Blur dream excerpts until you hover or tap on a card."
                    checked={settings.blurPreviews}
                    onChange={(val) => updateSetting("blurPreviews", val)}
                    accent="#5bb8ff"
                  />
                </div>

                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <ToggleRow
                    title="Passcode Lock on Launch"
                    description="Require a 4-digit PIN when reopening your journal on this device."
                    checked={settings.pinLockEnabled}
                    onChange={(val) => updateSetting("pinLockEnabled", val)}
                    accent="#ffe082"
                  />
                </div>
              </div>

              {settings.pinLockEnabled && (
                <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border-2 border-[#081326] bg-[#102448] p-4">
                  <div>
                    <label
                      htmlFor="vault-pin"
                      className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#ffe082]"
                    >
                      <KeyRound size={14} />
                      4-Digit Vault PIN
                    </label>
                    <input
                      id="vault-pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={settings.pinCode}
                      onChange={(e) =>
                        updateSetting(
                          "pinCode",
                          e.target.value.replace(/\D/g, "").slice(0, 4)
                        )
                      }
                      placeholder="••••"
                      className="st-field tracking-[0.4em]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="auto-lock-mins"
                      className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]"
                    >
                      <Lock size={14} />
                      Auto-Lock Idle Timer
                    </label>
                    <select
                      id="auto-lock-mins"
                      value={settings.autoLockMinutes}
                      onChange={(e) =>
                        updateSetting("autoLockMinutes", Number(e.target.value))
                      }
                      className="st-field"
                    >
                      <option value={5}>After 5 minutes</option>
                      <option value={15}>After 15 minutes</option>
                      <option value={30}>After 30 minutes</option>
                      <option value={60}>After 1 hour</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Vault Security Guarantees */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border-2 border-[#081326] bg-[#102448] p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] text-[#081326]">
                    <Check size={15} strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-white">
                      Isolated User Vault
                    </p>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#91b0d8]">
                      Your dreams are protected with strict Row-Level Security so
                      no other user can query or view them.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border-2 border-[#081326] bg-[#102448] p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#5bb8ff] text-[#081326]">
                    <EyeOff size={15} strokeWidth={2.6} />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-white">
                      Zero Public Feeds
                    </p>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#91b0d8]">
                      Secured via authenticated sessions. You retain full
                      ownership and export rights at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SettingSection>

          {/* 6. DATA BACKUP & EXPORT */}
          <SettingSection
            id="data"
            title="Data Backup & Export"
            description="Download your complete dream archive in open, portable formats anytime."
            icon={Download}
            accent="#ffe082"
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#5bb8ff] text-[#081326] shadow-[0_2px_0_0_#081326]">
                    <FileText size={18} />
                  </span>
                  <h3 className="text-sm font-extrabold text-white">
                    Full Archive (JSON)
                  </h3>
                  <p className="mt-1 flex-1 text-xs font-medium leading-relaxed text-[#91b0d8]">
                    Complete backup with dream transcripts, tags, moods, and
                    timestamps.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExport("json")}
                    disabled={exporting !== null}
                    className="st-button st-button-navy mt-4 w-full px-3 py-2.5 text-xs"
                  >
                    {exporting === "json" ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Exporting…
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Export JSON
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] text-[#081326] shadow-[0_2px_0_0_#081326]">
                    <FileSpreadsheet size={18} />
                  </span>
                  <h3 className="text-sm font-extrabold text-white">
                    Spreadsheet (CSV)
                  </h3>
                  <p className="mt-1 flex-1 text-xs font-medium leading-relaxed text-[#91b0d8]">
                    Tabular format ready for Excel, Numbers, or Google Sheets.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExport("csv")}
                    disabled={exporting !== null}
                    className="st-button st-button-navy mt-4 w-full px-3 py-2.5 text-xs"
                  >
                    {exporting === "csv" ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Exporting…
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet size={14} />
                        Export CSV
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#ffe082] text-[#081326] shadow-[0_2px_0_0_#081326]">
                    <Hash size={18} />
                  </span>
                  <h3 className="text-sm font-extrabold text-white">
                    Storybook (Markdown)
                  </h3>
                  <p className="mt-1 flex-1 text-xs font-medium leading-relaxed text-[#91b0d8]">
                    Clean, human-readable chapters for Obsidian, Notion, or
                    printing.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExport("md")}
                    disabled={exporting !== null}
                    className="st-button st-button-navy mt-4 w-full px-3 py-2.5 text-xs"
                  >
                    {exporting === "md" ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Exporting…
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Export .MD
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#081326] bg-[#102448] p-4">
                <div>
                  <p className="text-xs font-extrabold text-white">
                    Local Drafts &amp; Browser Cache
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-[#91b0d8]">
                    Clear unsaved local dream drafts stored in this browser
                    without affecting your saved entries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearLocalDrafts}
                  className="st-button st-button-navy px-3.5 py-2 text-xs"
                >
                  Clear local drafts
                </button>
              </div>
            </div>
          </SettingSection>

          {/* 7. ACCOUNT SESSION */}
          <SettingSection
            id="account"
            title="Account Session"
            description="Manage your active login session on this device."
            icon={LogOut}
            accent="#64dfd0"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
              <div>
                <p className="text-sm font-extrabold text-white">Sign Out</p>
                <p className="mt-1 text-xs font-medium text-[#91b0d8]">
                  End your current session on this device. You can sign back in
                  anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="st-button st-button-navy px-4 py-2.5 text-xs"
              >
                {signingOut ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Signing out…
                  </>
                ) : (
                  <>
                    <LogOut size={14} />
                    Sign out
                  </>
                )}
              </button>
            </div>
          </SettingSection>

          {/* 8. DANGER ZONE */}
          <section
            id="danger"
            className="st-card scroll-mt-24 rounded-3xl bg-[#241b35] p-5 sm:p-6"
          >
            <header className="mb-5 flex items-center gap-3 border-b-2 border-[#081326]/50 pb-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#ff859d] shadow-[0_2px_0_0_#081326]">
                <AlertTriangle
                  size={20}
                  className="text-[#081326]"
                  strokeWidth={2.5}
                />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-white sm:text-lg">
                  Danger Zone
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-[#d6a9b8]">
                  Irreversible account and archive actions.
                </p>
              </div>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[#081326] bg-[#1a1529] p-4">
              <div className="max-w-md">
                <p className="text-sm font-extrabold text-[#ffb1c1]">
                  Delete Account Permanently
                </p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-[#c59aaa]">
                  Permanently purge your account, dream entries, pattern
                  history, and saved preferences.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeletePhrase("");
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                className="st-button st-button-coral px-4 py-2.5 text-xs"
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          </section>

          {/* Bottom Save Bar */}
          <div className="st-card flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#102448] p-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-3 w-3 rounded-full border-2 border-[#081326] ${
                  isDirty ? "bg-[#ffe082] animate-pulse" : "bg-[#64dfd0]"
                }`}
              />
              <p className="text-xs font-bold text-[#cfe3fc]">
                {isDirty
                  ? "You have unsaved preference changes."
                  : "All settings are up to date."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={saving || !loaded}
              className="st-button st-button-sky px-6 py-3 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DELETE ACCOUNT CONFIRMATION MODAL                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b18]/80 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setShowDeleteModal(false);
              setDeletePhrase("");
              setDeleteError(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="st-card w-full max-w-md rounded-[26px] bg-[#182a4b] p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#ff859d] text-[#081326] shadow-[0_3px_0_0_#081326]">
                <AlertTriangle size={23} strokeWidth={2.5} />
              </span>

              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setShowDeleteModal(false);
                    setDeletePhrase("");
                    setDeleteError(null);
                  }
                }}
                disabled={deleting}
                className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#102244] text-[#cfe3fc] hover:bg-[#1c396e]"
                aria-label="Close modal"
              >
                <X size={17} />
              </button>
            </div>

            <h2
              id="delete-account-title"
              className="text-xl font-extrabold text-white"
            >
              Delete your account?
            </h2>

            <p className="mt-2 text-sm font-medium leading-relaxed text-[#b6cce9]">
              This permanently removes your account, dream logs, and AI pattern
              insights. To confirm, type{" "}
              <strong className="text-[#ffb1c1]">DELETE</strong> below.
            </p>

            <label
              htmlFor="delete-confirmation"
              className="mb-2 mt-5 block text-xs font-extrabold text-[#d8e9ff]"
            >
              Type DELETE to confirm
            </label>

            <input
              id="delete-confirmation"
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              className="st-field"
              placeholder="DELETE"
              autoComplete="off"
              disabled={deleting}
            />

            {deleteError && (
              <p
                role="alert"
                className="mt-3 rounded-xl border-2 border-[#ff859d]/40 bg-[#ff859d]/10 px-3 py-2.5 text-xs font-bold text-[#ffd2db]"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePhrase("");
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="st-button st-button-navy px-4 py-3 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deletePhrase !== "DELETE"}
                className="st-button st-button-coral px-5 py-3 text-sm"
              >
                {deleting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}