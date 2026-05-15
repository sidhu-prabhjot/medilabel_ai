"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "../src/components/layout/app-layout";
import Icon from "../src/components/icon";
import { useTheme } from "../src/context/theme-context";

import MetricLogForm from "./components/metric-log-form";
import MetricHistory from "./components/metric-history";
import MetricChart from "./components/metric-chart";

import { getBodyMetrics } from "../src/api/body_metrics.api";
import { BodyMetric } from "../src/types/body_metrics";

// ── Tab nav ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "log",      label: "Log Entry" },
  { id: "history",  label: "History" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Inline stat card ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  valueClass,
  dark,
}: {
  label: string;
  value: string;
  unit: string;
  valueClass: string;
  dark: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-[2rem] border flex flex-col gap-1 transition-colors ${
        dark ? "bg-slate-800 border-slate-700" : "bg-white border-[#DAD7CD] shadow-sm"
      }`}
    >
      <span
        className={`text-[11px] font-bold uppercase tracking-[0.15em] ${
          dark ? "text-emerald-400" : "text-[#A3B18A]"
        }`}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-extrabold ${valueClass}`}>{value}</span>
        <span className={`text-sm font-medium ${dark ? "text-slate-400" : "text-[#4F6F52]/60"}`}>
          {unit}
        </span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BodyMetricsPage() {
  const { dark } = useTheme();

  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const loadMetrics = useCallback(async () => {
    try {
      const data = await getBodyMetrics();
      setMetrics(data);
    } catch {
      // Silently fail — child components will show empty states
    }
  }, []);

  useEffect(() => {
    loadMetrics().finally(() => setLoading(false));
  }, [loadMetrics]);

  // ── Derived stats ─────────────────────────────────────────────────────────────

  const byDate = useMemo(
    () =>
      [...metrics].sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
      ),
    [metrics],
  );

  const latest   = byDate[0] ?? null;
  const previous = byDate[1] ?? null;

  const rawChange =
    latest && previous ? latest.weight_kg - previous.weight_kg : null;
  const weightChange = rawChange !== null ? rawChange.toFixed(1) : null;

  // ── Style shorthands ──────────────────────────────────────────────────────────

  const textPrimary = dark ? "text-emerald-400" : "text-[#37563b]";
  const textMuted   = dark ? "text-slate-400"   : "text-[#A3B18A]";
  const surface     = dark ? "bg-slate-800 border-slate-700" : "bg-white border-[#DAD7CD]";

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Body Metrics">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-[2rem] border p-6 h-28 animate-pulse ${
                  dark ? "bg-slate-800 border-slate-700" : "bg-white border-[#DAD7CD]"
                }`}
              />
            ))}
          </div>
          <div
            className={`rounded-[2rem] border p-8 h-64 animate-pulse ${
              dark ? "bg-slate-800 border-slate-700" : "bg-white border-[#DAD7CD]"
            }`}
          />
        </div>
      </AppLayout>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Body Metrics">
      <div className="space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            dark={dark}
            label="Latest Weight"
            value={latest ? `${latest.weight_kg}` : "—"}
            unit={latest ? "kg" : ""}
            valueClass={dark ? "text-emerald-400" : "text-[#4F6F52]"}
          />
          <StatCard
            dark={dark}
            label="Body Fat"
            value={latest?.body_fat_percent != null ? `${latest.body_fat_percent}` : "—"}
            unit={latest?.body_fat_percent != null ? "%" : ""}
            valueClass={dark ? "text-emerald-400" : "text-[#4F6F52]"}
          />
          <StatCard
            dark={dark}
            label="Weight Change"
            value={
              weightChange !== null
                ? `${parseFloat(weightChange) > 0 ? "+" : ""}${weightChange}`
                : "—"
            }
            unit={weightChange !== null ? "kg vs prev" : ""}
            valueClass={
              weightChange !== null && parseFloat(weightChange) > 0
                ? "text-red-500"
                : weightChange !== null && parseFloat(weightChange) < 0
                  ? "text-emerald-500"
                  : dark
                    ? "text-emerald-400"
                    : "text-[#4F6F52]"
            }
          />
          <StatCard
            dark={dark}
            label="Total Entries"
            value={String(metrics.length)}
            unit="logged"
            valueClass={dark ? "text-emerald-400" : "text-[#4F6F52]"}
          />
        </div>

        {/* Tab nav */}
        <nav className={`flex border-b ${dark ? "border-slate-800" : "border-[#DAD7CD]/40"}`}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? dark
                    ? "border-emerald-400 text-emerald-400"
                    : "border-[#E27D60] text-[#E27D60]"
                  : dark
                    ? "border-transparent text-slate-500 hover:text-slate-300"
                    : "border-transparent text-[#A3B18A] hover:text-[#4F6F52]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className={`p-8 rounded-[2rem] border ${surface}`}>
              <h3 className={`text-xl font-bold mb-6 ${textPrimary}`}>Weight Trend</h3>
              <MetricChart metrics={metrics} />
            </div>

            {metrics.length === 0 && (
              <div className={`p-10 rounded-[2rem] border flex flex-col items-center gap-3 ${surface}`}>
                <Icon
                  name="monitor_weight"
                  className={`text-5xl opacity-30 ${textMuted}`}
                />
                <p className={`text-sm font-medium ${textMuted}`}>
                  No entries yet. Go to{" "}
                  <button
                    onClick={() => setActiveTab("log")}
                    className={`underline underline-offset-2 ${dark ? "text-emerald-400" : "text-[#4F6F52]"}`}
                  >
                    Log Entry
                  </button>{" "}
                  to get started.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Log Entry ────────────────────────────────────────────────────── */}
        {activeTab === "log" && (
          <div className={`p-8 rounded-[2rem] border ${surface}`}>
            <h3 className={`text-xl font-bold mb-6 ${textPrimary}`}>Log New Entry</h3>
            <MetricLogForm
              onSaved={() => {
                loadMetrics();
                setActiveTab("history");
              }}
              onCancel={() => setActiveTab("overview")}
            />
          </div>
        )}

        {/* ── History ──────────────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className={`p-8 rounded-[2rem] border ${surface}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${textPrimary}`}>Entry History</h3>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  dark
                    ? "bg-slate-700 text-slate-400"
                    : "bg-[#4F6F52]/10 text-[#A3B18A]"
                }`}
              >
                {metrics.length} {metrics.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <MetricHistory metrics={metrics} onRefresh={loadMetrics} />
          </div>
        )}

      </div>
    </AppLayout>
  );
}
