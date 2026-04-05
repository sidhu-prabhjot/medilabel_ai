"use client";

import { useCallback, useEffect, useState } from "react";
import AppLayout from "../src/components/layout/app-layout";
import Card from "../src/components/card";
import StatCard from "../src/components/stat-card";
import Icon from "../src/components/icon";
import { useTheme } from "../src/context/theme-context";

import MetricLogForm from "./components/metric-log-form";
import MetricHistory from "./components/metric-history";
import MetricChart from "./components/metric-chart";

import { getBodyMetrics } from "../src/api/body_metrics.api";
import { BodyMetric } from "../src/types/body_metrics";

export default function BodyMetricsPage() {
  const { dark } = useTheme();

  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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

  // Sort newest first for easy access to latest and previous entries
  const byDate = [...metrics].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
  );

  const latest = byDate[0] ?? null;
  const previous = byDate[1] ?? null;

  const rawChange =
    latest && previous ? latest.weight_kg - previous.weight_kg : null;
  const weightChange = rawChange !== null ? rawChange.toFixed(1) : null;
  // For weight: losing weight (negative change) is positive from a health perspective —
  // adjust the sign display based on your use case. Here we treat any change as neutral.
  const changeIsNeutral = true;

  const stats = [
    {
      label: "Latest Weight",
      value: latest ? `${latest.weight_kg} kg` : "—",
      change: "most recent",
      positive: true,
      barColor: "bg-indigo-500",
    },
    {
      label: "Body Fat",
      value:
        latest?.body_fat_percent != null ? `${latest.body_fat_percent}%` : "—",
      change: "most recent",
      positive: true,
      barColor: "bg-purple-500",
    },
    {
      label: "Weight Change",
      value:
        weightChange !== null
          ? `${parseFloat(weightChange) > 0 ? "+" : ""}${weightChange} kg`
          : "—",
      change: "vs previous entry",
      positive: changeIsNeutral,
      barColor: "bg-slate-500",
    },
    {
      label: "Total Entries",
      value: String(metrics.length),
      change: "logged",
      positive: true,
      barColor: "bg-emerald-500",
    },
  ];

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Body Metrics">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-xl border p-5 h-28 animate-pulse ${
                  dark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              />
            ))}
          </div>
          <div
            className={`rounded-xl border p-5 h-48 animate-pulse ${
              dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Body Metrics">
      <div className="space-y-6">

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </section>

        {/* Log new entry */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}
            >
              Log Entry
            </h2>
            <button
              onClick={() => setShowForm((v) => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                showForm
                  ? dark
                    ? "bg-slate-700 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              <Icon name={showForm ? "expand_less" : "add"} className="text-sm" />
              {showForm ? "Close" : "New Entry"}
            </button>
          </div>

          {showForm ? (
            <div
              className={`p-4 rounded-xl border ${
                dark
                  ? "bg-slate-700/30 border-slate-700"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <MetricLogForm
                onSaved={() => {
                  setShowForm(false);
                  loadMetrics();
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          ) : (
            <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Track your weight and body composition over time.
            </p>
          )}
        </Card>

        {/* Weight trend chart */}
        <Card>
          <h2
            className={`text-sm font-semibold mb-4 ${dark ? "text-white" : "text-slate-900"}`}
          >
            Weight Trend
          </h2>
          <MetricChart metrics={metrics} />
        </Card>

        {/* Entry history */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}
            >
              History
            </h2>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                dark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"
              }`}
            >
              {metrics.length}
            </span>
          </div>
          <MetricHistory metrics={metrics} onRefresh={loadMetrics} />
        </Card>

      </div>
    </AppLayout>
  );
}
