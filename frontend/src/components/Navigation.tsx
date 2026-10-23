"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Plus,
  Sparkles,
  Settings,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/patterns", label: "Patterns", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 p-5 pb-3 transition-opacity hover:opacity-90 cursor-pointer"
        title="Stardrift Home"
      >
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6c8eff, #6bc2ff)" }}
        >
          <Moon size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span
            className="text-lg font-bold"
            style={{ fontFamily: "Quicksand, sans-serif", color: "#eaf0ff" }}
          >
            Star<span style={{ color: "#6bc2ff" }}>drift</span>
          </span>
        )}
      </Link>

      {/* New Dream button */}
      <div className="px-3 py-3">
        <Link
          href="/journal/new"
          className={`btn-primary w-full justify-center ${collapsed ? "px-0 py-3" : ""}`}
          style={{ borderRadius: "0.875rem" }}
        >
          <Plus size={18} />
          {!collapsed && <span>New Dream</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-item ${active ? "active" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-nav-item w-full justify-center"
          style={{ background: "none", border: "none", cursor: "pointer" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/journal", label: "Journal", icon: BookOpen },
    null, // center new button
    { href: "/patterns", label: "Patterns", icon: Sparkles },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="mobile-tab-bar md:hidden">
      {tabs.map((tab, i) => {
        if (!tab) {
          return (
            <Link key="new" href="/journal/new" className="tab-item-new" aria-label="New Dream">
              <Plus size={24} className="text-white" />
            </Link>
          );
        }
        const Icon = tab.icon;
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link key={tab.href} href={tab.href} className={`tab-item ${active ? "active" : ""}`}>
            <Icon size={22} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
