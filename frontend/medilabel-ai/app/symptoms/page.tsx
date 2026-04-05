"use client";

import { useCallback, useEffect, useState } from "react";
import AppLayout from "../src/components/layout/app-layout";
import Card from "../src/components/card";
import StatCard from "../src/components/stat-card";
import { useTheme } from "../src/context/theme-context";
import { getSymptoms } from "../src/api/health_product.api";
import { SymptomLog } from "../src/types/health_products";
import SymptomTracker from "../health_products/components/symptom-tracker";

export default function SymptomsPage() {
  const { dark } = useTheme();

  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSymptoms = useCallback(async () => {
    try {
      const data = await getSymptoms();
      setSymptoms(data);
    } catch {
      // Silently fail — tracker will show empty state
    }
  }, []);

  useEffect(() => {
    loadSymptoms().finally(() => setLoading(false));
  }, [loadSymptoms]);

  // ── Derived stats ─────────────────────────────────────────────────────────────

  const total = symptoms.length;
  const active = symptoms.filter((s) => !s.is_resolved).length;
  const resolved = symptoms.filter((s) => s.is_resolved).length;
  const avgSeverity =
    total > 0
      ? (symptoms.reduce((sum, s) => sum + s.severity, 0) / total).toFixed(1)
      : "—";

  const stats = [
    {
      label: "Total Logged",
      value: String(total),
      change: "all time",
      positive: true,
      barColor: "bg-indigo-500",
    },
    {
      label: "Active",
      value: String(active),
      change: "unresolved",
      positive: active === 0,
      barColor: active > 0 ? "bg-amber-500" : "bg-emerald-500",
    },
    {
      label: "Resolved",
      value: String(resolved),
      change: `${total > 0 ? Math.round((resolved / total) * 100) : 0}% of total`,
      positive: true,
      barColor: "bg-emerald-500",
    },
    {
      label: "Avg Severity",
      value: String(avgSeverity),
      change: "out of 5",
      positive: avgSeverity === "—" || parseFloat(String(avgSeverity)) <= 3,
      barColor: "bg-purple-500",
    },
  ];

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Symptoms">
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
            className={`rounded-xl border p-5 h-64 animate-pulse ${
              dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Symptoms">
      <div className="space-y-6">
        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </section>

        {/* Symptom log */}
        <Card>
          <SymptomTracker symptoms={symptoms} onRefresh={loadSymptoms} />
        </Card>
      </div>
    </AppLayout>
  );
}
