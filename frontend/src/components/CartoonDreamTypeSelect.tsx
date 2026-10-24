"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Cloud,
  CloudLightning,
  Coffee,
  Layers,
  Repeat,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { DreamType } from "@/types";

interface DreamTypeOptionConfig {
  value: DreamType;
  label: string;
  desc: string;
  icon: LucideIcon;
  badgeBg: string;
  iconColor: string;
}

const DREAM_TYPE_OPTIONS: DreamTypeOptionConfig[] = [
  {
    value: "normal",
    label: "Normal Dream",
    desc: "Everyday narrative, thoughts & scenes",
    icon: Cloud,
    badgeBg: "#5bb8ff",
    iconColor: "#081326",
  },
  {
    value: "nightmare",
    label: "Nightmare",
    desc: "Intense, scary, or unsettling experience",
    icon: CloudLightning,
    badgeBg: "#ff859d",
    iconColor: "#081326",
  },
  {
    value: "fragmented",
    label: "Fragmented",
    desc: "Brief snippets, blurry impressions",
    icon: Layers,
    badgeBg: "#94adff",
    iconColor: "#081326",
  },
  {
    value: "nap",
    label: "Daytime Nap",
    desc: "Short drift during the day or evening",
    icon: Coffee,
    badgeBg: "#ffb3c6",
    iconColor: "#081326",
  },
];

interface CartoonDreamTypeSelectProps {
  id?: string;
  value: DreamType;
  onChange: (val: DreamType) => void;
  className?: string;
}

export function CartoonDreamTypeSelect({
  id = "dream-type",
  value,
  onChange,
  className = "",
}: CartoonDreamTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    DREAM_TYPE_OPTIONS.find((opt) => opt.value === value) ||
    DREAM_TYPE_OPTIONS[0];

  const CurrentIcon = currentOption.icon;

  // Handle outside click & Escape key
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

  const selectOption = (optValue: DreamType) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      {/* Hidden input for form sync */}
      <input
        type="hidden"
        id={id}
        name="dream_type"
        value={value}
        readOnly
      />

      {/* Trigger Button Field */}
      <button
        type="button"
        id={`${id}-trigger`}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between h-12 px-3 rounded-2xl border-[2.5px] border-[#081326] bg-[#0f2040] text-left text-sm font-bold text-[#eef6ff] shadow-[0_3px_0_0_#081326] transition-colors hover:border-[#5bb8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
      >
        <span className="flex items-center gap-2.5 truncate">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] shadow-[0_2px_0_0_#081326]"
            style={{ backgroundColor: currentOption.badgeBg }}
          >
            <CurrentIcon
              size={15}
              strokeWidth={2.8}
              style={{ color: currentOption.iconColor }}
            />
          </span>
          <span className="truncate font-extrabold text-white">
            {currentOption.label}
          </span>
        </span>

        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#1c396e] text-[#6bc2ff] shadow-[0_2px_0_0_#081326] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDown size={14} strokeWidth={3} />
        </span>
      </button>

      {/* Floating Cartoon Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select Dream Type"
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[280px] rounded-[24px] border-[2.5px] border-[#081326] bg-[#12244a] p-2 text-[#eef6ff] shadow-[0_10px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.14)] space-y-1.5"
          style={{ animation: "popIn 0.16s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          {DREAM_TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = opt.value === value;

            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(opt.value)}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-[#081326] bg-[#1a3769] shadow-[0_3px_0_0_#081326]"
                    : "border-transparent hover:border-[#081326]/60 hover:bg-[#162e59] hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] shadow-[0_2px_0_0_#081326]"
                    style={{ backgroundColor: opt.badgeBg }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={2.6}
                      style={{ color: opt.iconColor }}
                    />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-white leading-tight">
                      {opt.label}
                    </span>
                    <span className="block truncate text-[11px] font-semibold text-[#8cb2e0]">
                      {opt.desc}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#ffe082] text-[#081326] shadow-[0_2px_0_0_#081326] ml-2">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
