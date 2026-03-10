"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// ============================================================
// CUSTOMIZATION — edit this block to restyle / rebrand quickly
// ============================================================
const APP_NAME = "MediLabel AI";
const USER_NAME = "Dr. Sarah Chen";
const USER_EMAIL = "sarah.chen@hospital.org";
const USER_AVATAR = "SC";

// Nav items — add / remove / reorder freely
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "labels", label: "Labels", icon: "tag" },
  { id: "datasets", label: "Datasets", icon: "database" },
  { id: "models", label: "Models", icon: "cpu" },
  { id: "reports", label: "Reports", icon: "chart" },
  { id: "team", label: "Team", icon: "users" },
];

const NAV_BOTTOM = [{ id: "settings", label: "Settings", icon: "settings" }];
// ============================================================

// ---- Icons --------------------------------------------------
const icons: Record<string, (cls: string) => React.ReactElement> = {
  grid: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  tag: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  database: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  cpu: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </svg>
  ),
  chart: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
    </svg>
  ),
  users: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  settings: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  bell: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  menu: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
    </svg>
  ),
  x: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  ),
  logout: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  arrowUp: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
    >
      <path
        d="M5 10l7-7 7 7M12 3v18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  arrowDown: (c) => (
    <svg
      className={c}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
    >
      <path
        d="M19 14l-7 7-7-7M12 21V3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const Icon = ({
  name,
  className = "w-5 h-5",
}: {
  name: string;
  className?: string;
}) => icons[name]?.(className) ?? <span />;

// ---- Stat Card ----------------------------------------------
function StatCard({
  label,
  value,
  change,
  positive,
  barColor,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  barColor: string;
}) {
  return (
    <div className="rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            positive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
          }`}
        >
          <Icon name={positive ? "arrowUp" : "arrowDown"} className="w-3 h-3" />
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>
      <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-white/10">
        <div
          className={`h-1 rounded-full ${barColor}`}
          style={{ width: "65%" }}
        />
      </div>
    </div>
  );
}

// ---- Activity Row -------------------------------------------
type Status = "done" | "pending" | "running";

function ActivityRow({
  icon,
  label,
  sub,
  time,
  status,
}: {
  icon: string;
  label: string;
  sub: string;
  time: string;
  status: Status;
}) {
  const badge: Record<Status, string> = {
    done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    pending:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    running:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  };
  const label_: Record<Status, string> = {
    done: "Complete",
    pending: "Pending",
    running: "Running",
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="flex-shrink-0 w-9 h-9 rounded-md bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <Icon name={icon} className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {sub}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge[status]}`}
        >
          {label_[status]}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{time}</span>
      </div>
    </div>
  );
}

// ---- Nav Item -----------------------------------------------
function NavItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: { id: string; label: string; icon: string };
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-3 py-2 rounded-md text-sm font-medium transition-colors duration-100 group relative
        ${collapsed ? "justify-center px-2" : "px-3"}
        ${
          active
            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
        }
      `}
    >
      <Icon name={item.icon} className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
      )}
      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="absolute left-full ml-2 px-2 py-1 text-xs rounded-md bg-gray-900 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity shadow-lg">
          {item.label}
        </span>
      )}
    </button>
  );
}

// ---- Sidebar ------------------------------------------------
function Sidebar({
  active,
  setActive,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: {
  active: string;
  setActive: (id: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const router = useRouter();

  const content = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center gap-2.5 px-4 py-5 border-b border-gray-200 dark:border-white/10 ${!isMobile && collapsed ? "justify-center px-3" : ""}`}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center">
          <Icon name="tag" className="w-4 h-4 text-white" />
        </div>
        {(isMobile || !collapsed) && (
          <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white truncate">
            {APP_NAME}
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={active === item.id}
            collapsed={!isMobile && collapsed}
            onClick={() => {
              setActive(item.id);
              setMobileOpen(false);
            }}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-2 border-t border-gray-200 dark:border-white/10 space-y-0.5">
        {NAV_BOTTOM.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={active === item.id}
            collapsed={!isMobile && collapsed}
            onClick={() => {
              setActive(item.id);
              setMobileOpen(false);
            }}
          />
        ))}

        {/* User row */}
        <div
          className={`flex items-center gap-2.5 px-3 py-2 mt-1 ${!isMobile && collapsed ? "justify-center px-2" : ""}`}
        >
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            {USER_AVATAR}
          </div>
          {(isMobile || !collapsed) && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {USER_NAME}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {USER_EMAIL}
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  router.push("/");
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title="Log out"
              >
                <Icon name="logout" className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-full py-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border-t border-gray-200 dark:border-white/10 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              d="M15 18l-6-6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10 transition-all duration-200 overflow-hidden ${collapsed ? "w-16" : "w-56"}`}
      >
        {content(false)}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10 transform transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <Icon name="x" className="w-5 h-5" />
        </button>
        {content(true)}
      </aside>
    </>
  );
}

// ---- Dashboard Page -----------------------------------------
export default function Dashboard() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNav = [...NAV_ITEMS, ...NAV_BOTTOM];
  const pageTitle = allNav.find((n) => n.id === active)?.label ?? "Dashboard";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar
        active={active}
        setActive={setActive}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/10 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Icon name="menu" className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <Icon name="bell" className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {USER_AVATAR}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 space-y-6">
          {/* Dashboard */}
          {active === "dashboard" && (
            <>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Good morning,{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {USER_NAME.split(" ")[0]}
                  </span>{" "}
                  👋
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Here's what's happening today.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  label="Total Labels"
                  value="24,318"
                  change="12%"
                  positive={true}
                  barColor="bg-indigo-500"
                />
                <StatCard
                  label="Active Datasets"
                  value="142"
                  change="4%"
                  positive={true}
                  barColor="bg-sky-500"
                />
                <StatCard
                  label="Models Trained"
                  value="38"
                  change="8%"
                  positive={true}
                  barColor="bg-violet-500"
                />
                <StatCard
                  label="Error Rate"
                  value="0.43%"
                  change="0.1%"
                  positive={false}
                  barColor="bg-rose-500"
                />
              </div>

              {/* Two-col */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Activity */}
                <div className="lg:col-span-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Recent Activity
                    </h2>
                    <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                      View all
                    </button>
                  </div>
                  <ActivityRow
                    icon="tag"
                    label="Chest X-Ray Dataset v3"
                    sub="Label review completed"
                    time="2m ago"
                    status="done"
                  />
                  <ActivityRow
                    icon="cpu"
                    label="ResNet-50 Fine-tune"
                    sub="Training in progress — 67%"
                    time="14m ago"
                    status="running"
                  />
                  <ActivityRow
                    icon="database"
                    label="CT Scan Batch #41"
                    sub="Awaiting annotation"
                    time="1h ago"
                    status="pending"
                  />
                  <ActivityRow
                    icon="tag"
                    label="MRI Segmentation Labels"
                    sub="Export ready"
                    time="3h ago"
                    status="done"
                  />
                  <ActivityRow
                    icon="cpu"
                    label="EfficientNet-B4 Evaluation"
                    sub="Queued for validation"
                    time="5h ago"
                    status="pending"
                  />
                </div>

                {/* Progress */}
                <div className="rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Annotation Progress
                  </h2>
                  {[
                    { label: "X-Ray Labels", pct: 82, color: "bg-indigo-500" },
                    { label: "CT Scans", pct: 61, color: "bg-sky-500" },
                    { label: "MRI Segments", pct: 47, color: "bg-violet-500" },
                    {
                      label: "Pathology Slides",
                      pct: 29,
                      color: "bg-amber-500",
                    },
                  ].map((p) => (
                    <div key={p.label}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {p.label}
                        </span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {p.pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/10">
                        <div
                          className={`h-1.5 rounded-full ${p.color}`}
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/10">
                    <button className="w-full flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-sm font-semibold px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                      <Icon name="tag" className="w-4 h-4" />
                      Start Labeling
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Placeholder for other pages */}
          {active !== "dashboard" && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 rounded-lg border border-dashed border-gray-300 dark:border-white/10">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <Icon
                  name={allNav.find((n) => n.id === active)?.icon ?? "grid"}
                  className="w-5 h-5"
                />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {pageTitle} coming soon
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                This section is under construction.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
