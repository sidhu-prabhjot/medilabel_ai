"use client";

import { useCallback, useEffect, useState } from "react";
import AppLayout from "../src/components/layout/app-layout";
import Card from "../src/components/card";
import StatCard from "../src/components/stat-card";
import Icon from "../src/components/icon";
import { useTheme } from "../src/context/theme-context";

import MedicationSearch from "./components/medication-search";
import MedicationTable from "./components/medication-table";
import MedicationCharts from "./components/medication-charts";
import SymptomTracker from "./components/symptom-tracker";

import {
  getUserMedications,
  getMedication,
  getSymptoms,
} from "../src/api/health_product.api";
import { StockRecord, Medication, UserMedication, SymptomLog } from "../src/types/health_products";

// ── Expiration alert banner ────────────────────────────────────────────────────

function ExpirationAlerts({
  userMedications,
}: {
  userMedications: UserMedication[];
}) {
  const { dark } = useTheme();

  const today = new Date();
  const alerts = userMedications
    .filter((m) => m.stock.expiration_date != null)
    .map((m) => {
      const expiry = new Date(m.stock.expiration_date!);
      const daysUntil = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { ...m, daysUntil };
    })
    .filter((m) => m.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (alerts.length === 0) return null;

  return (
    <div
      className={`rounded-xl border p-4 ${
        dark
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon
          name="warning"
          className={`text-base ${dark ? "text-amber-400" : "text-amber-600"}`}
        />
        <span
          className={`text-sm font-semibold ${dark ? "text-amber-300" : "text-amber-800"}`}
        >
          {alerts.length} medication{alerts.length !== 1 ? "s" : ""} expiring soon
        </span>
      </div>

      <div className="space-y-1.5">
        {alerts.map(({ medication, stock, daysUntil }) => (
          <div
            key={stock.stock_id}
            className="flex items-center justify-between text-sm"
          >
            <span className={dark ? "text-amber-200" : "text-amber-900"}>
              {medication.name}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                daysUntil < 0
                  ? dark
                    ? "bg-red-500/20 text-red-400"
                    : "bg-red-100 text-red-700"
                  : dark
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {daysUntil < 0 ? "Expired" : `${daysUntil}d left`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HealthProducts() {
  const { dark } = useTheme();

  const [userMedications, setUserMedications] = useState<UserMedication[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stock records then enrich each with medication details
  const loadMedications = useCallback(async () => {
    try {
      const stockRecords: StockRecord[] = await getUserMedications();

      // Deduplicate medication IDs to avoid redundant fetches
      const uniqueIds = [...new Set(stockRecords.map((s) => s.medication_id))];
      const medMap = new Map<number, Medication>();

      await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const med = await getMedication(id);
            medMap.set(id, med);
          } catch {
            // Skip medications that can't be fetched
          }
        }),
      );

      const enriched: UserMedication[] = stockRecords
        .filter((s) => medMap.has(s.medication_id))
        .map((s) => ({ stock: s, medication: medMap.get(s.medication_id)! }));

      setUserMedications(enriched);
    } catch {
      // Silently fail — table will show empty state
    }
  }, []);

  const loadSymptoms = useCallback(async () => {
    try {
      const data = await getSymptoms();
      setSymptoms(data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    Promise.all([loadMedications(), loadSymptoms()]).finally(() =>
      setLoading(false),
    );
  }, [loadMedications, loadSymptoms]);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const totalMedications = userMedications.length;

  const expiringSoon = userMedications.filter((m) => {
    if (!m.stock.expiration_date) return false;
    const days = Math.ceil(
      (new Date(m.stock.expiration_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );
    return days <= 30;
  }).length;

  const totalUnits = userMedications.reduce(
    (sum, m) => sum + (m.stock.quantity ?? 0),
    0,
  );

  const brandCount = userMedications.filter((m) => m.medication.is_brand).length;

  const stats = [
    {
      label: "Total Medications",
      value: String(totalMedications),
      change: "tracked",
      positive: true,
      barColor: "bg-indigo-500",
    },
    {
      label: "Expiring Soon",
      value: String(expiringSoon),
      change: "within 30 days",
      positive: expiringSoon === 0,
      barColor: expiringSoon > 0 ? "bg-amber-500" : "bg-emerald-500",
    },
    {
      label: "Total Units",
      value: String(totalUnits),
      change: "in stock",
      positive: true,
      barColor: "bg-purple-500",
    },
    {
      label: "Brand Name",
      value: String(brandCount),
      change: `${totalMedications > 0 ? Math.round((brandCount / totalMedications) * 100) : 0}% of total`,
      positive: true,
      barColor: "bg-violet-500",
    },
  ];

  // ── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Health Products">
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

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Health Products">
      <div className="space-y-6">
        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </section>

        {/* Expiration alerts */}
        <ExpirationAlerts userMedications={userMedications} />

        {/* Search */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}
            >
              Search Medications
            </h2>
            <span
              className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}
            >
              Powered by NIH RxNorm
            </span>
          </div>
          <MedicationSearch onStockAdded={loadMedications} />
        </Card>

        {/* My Medications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}
            >
              My Medications
            </h2>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                dark
                  ? "bg-slate-700 text-slate-400"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {totalMedications}
            </span>
          </div>
          <MedicationTable
            userMedications={userMedications}
            onRefresh={loadMedications}
          />
        </Card>

        {/* Charts */}
        <MedicationCharts userMedications={userMedications} />

        {/* Symptom Tracker */}
        <Card>
          <SymptomTracker symptoms={symptoms} onRefresh={loadSymptoms} />
        </Card>
      </div>
    </AppLayout>
  );
}
