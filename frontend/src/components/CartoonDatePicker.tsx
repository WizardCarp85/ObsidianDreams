"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";

interface CartoonDatePickerProps {
  id?: string;
  value: string; // "YYYY-MM-DD"
  onChange: (dateStr: string) => void;
  maxDate?: string; // "YYYY-MM-DD"
  className?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0);
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayString(): string {
  return toDateString(new Date());
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateString(d);
}

export function CartoonDatePicker({
  id = "dream-date",
  value,
  onChange,
  maxDate,
  className = "",
}: CartoonDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseLocalDate(value), [value]);

  // Current view month/year
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate);

  // Sync view month when value changes from outside
  useEffect(() => {
    setViewDate(selectedDate);
  }, [value, selectedDate]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const todayStr = useMemo(() => getTodayString(), []);
  const yesterdayStr = useMemo(() => getYesterdayString(), []);

  // Format label for display
  const displayLabel = useMemo(() => {
    if (!value) return "Select date";
    const d = selectedDate;
    const formatted = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (value === todayStr) {
      return `${formatted} · Today`;
    }
    if (value === yesterdayStr) {
      return `${formatted} · Last Night`;
    }
    return formatted;
  }, [value, selectedDate, todayStr, yesterdayStr]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i, 12, 0, 0);
      const str = toDateString(d);
      days.push({
        dateStr: str,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isSelected: str === value,
        isToday: str === todayStr,
        isDisabled: maxDate ? str > maxDate : false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i, 12, 0, 0);
      const str = toDateString(d);
      days.push({
        dateStr: str,
        dayNumber: i,
        isCurrentMonth: true,
        isSelected: str === value,
        isToday: str === todayStr,
        isDisabled: maxDate ? str > maxDate : false,
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i, 12, 0, 0);
      const str = toDateString(d);
      days.push({
        dateStr: str,
        dayNumber: i,
        isCurrentMonth: false,
        isSelected: str === value,
        isToday: str === todayStr,
        isDisabled: maxDate ? str > maxDate : false,
      });
    }

    return days;
  }, [viewDate, value, todayStr, maxDate]);

  const prevMonth = () => {
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1, 12, 0, 0)
    );
  };

  const nextMonth = () => {
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1, 12, 0, 0)
    );
  };

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      {/* Hidden input for form compatibility */}
      <input
        type="hidden"
        id={id}
        name="dream_date"
        value={value}
        readOnly
      />

      {/* Trigger Button Field */}
      <button
        type="button"
        id={`${id}-trigger`}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between h-12 px-3.5 rounded-2xl border-[2.5px] border-[#081326] bg-[#0f2040] text-left text-sm font-bold text-[#eef6ff] shadow-[0_3px_0_0_#081326] transition-colors hover:border-[#5bb8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon size={16} className="text-[#64dfd0] shrink-0" strokeWidth={2.6} />
          <span className="truncate">{displayLabel}</span>
        </span>

        <span className="flex h-7 px-2 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#1c396e] text-[11px] font-extrabold text-[#7ac8ff] shadow-[0_2px_0_0_#081326]">
          Change
        </span>
      </button>

      {/* Floating Cartoon Calendar Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Pick a dream date"
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[300px] sm:w-[320px] rounded-[24px] border-[2.5px] border-[#081326] bg-[#12244a] p-4 text-[#eef6ff] shadow-[0_10px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.16)]"
          style={{ animation: "popIn 0.16s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          {/* Quick Date Chips */}
          <div className="flex items-center gap-2 pb-3 mb-3 border-b-2 border-[#081326]/60">
            <button
              type="button"
              onClick={() => selectDate(yesterdayStr)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border-2 border-[#081326] text-xs font-extrabold transition-all active:translate-y-0.5 ${
                value === yesterdayStr
                  ? "bg-[#ffe082] text-[#081326] shadow-[0_2px_0_0_#081326]"
                  : "bg-[#0e1d3b] text-[#cfe3fc] hover:bg-[#1a3466]"
              }`}
            >
              <Moon size={12} strokeWidth={2.8} />
              Last Night
            </button>

            <button
              type="button"
              onClick={() => selectDate(todayStr)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border-2 border-[#081326] text-xs font-extrabold transition-all active:translate-y-0.5 ${
                value === todayStr
                  ? "bg-[#5bb8ff] text-[#081326] shadow-[0_2px_0_0_#081326]"
                  : "bg-[#0e1d3b] text-[#cfe3fc] hover:bg-[#1a3466]"
              }`}
            >
              <Sun size={12} strokeWidth={2.8} />
              Today
            </button>
          </div>

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#1a3769] text-white shadow-[0_2px_0_0_#081326] hover:bg-[#5bb8ff] hover:text-[#081326] active:translate-y-0.5 transition-colors"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>

            <div className="flex items-center gap-1.5 text-sm font-extrabold text-white">
              <Sparkles size={13} className="text-[#ffe082]" />
              <span>
                {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#1a3769] text-white shadow-[0_2px_0_0_#081326] hover:bg-[#5bb8ff] hover:text-[#081326] active:translate-y-0.5 transition-colors"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAY_NAMES.map((name) => (
              <span
                key={name}
                className="text-[11px] font-black tracking-wider text-[#7ea4d4]"
              >
                {name}
              </span>
            ))}
          </div>

          {/* Day Grid Cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(
              ({
                dateStr,
                dayNumber,
                isCurrentMonth,
                isSelected,
                isToday,
                isDisabled,
              }) => {
                let cellClass =
                  "relative flex h-8 w-full items-center justify-center rounded-xl text-xs font-extrabold transition-all ";

                if (isSelected) {
                  cellClass +=
                    "bg-[#5bb8ff] text-[#081326] border-2 border-[#081326] shadow-[0_2px_0_0_#081326] scale-105 z-10";
                } else if (isDisabled) {
                  cellClass += "opacity-25 cursor-not-allowed text-[#7899c2]";
                } else if (!isCurrentMonth) {
                  cellClass +=
                    "opacity-35 text-[#8fb2de] hover:bg-[#1a3769] hover:opacity-80";
                } else if (isToday) {
                  cellClass +=
                    "border-2 border-[#ffe082] text-[#ffe082] hover:bg-[#1a3769]";
                } else {
                  cellClass +=
                    "text-[#eef6ff] hover:bg-[#1f417d] hover:text-white";
                }

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => selectDate(dateStr)}
                    className={cellClass}
                  >
                    {dayNumber}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}
