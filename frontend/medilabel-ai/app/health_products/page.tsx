"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "../src/components/layout/app-layout";
import Card from "../src/components/card";
import StatCard from "../src/components/stat-card";
import Icon from "../src/components/icon";
import { useTheme } from "../src/context/theme-context";

import MedicationSearch from "./components/medication-search";
import MedicationTable from "./components/medication-table";
import MedicationCharts from "./components/medication-charts";
import SymptomTracker from "./components/symptom-tracker";
import SupplementChecklist from "./components/supplement-checklist";
import MedicationChecklist from "./components/medication-checklist";
import SupplementManager from "./components/supplement-manager";
import ScheduleManager from "./components/schedule-manager";

import { getUserMedications, getMedication, getSymptoms } from "../src/api/health_product.api";
import {
  getSupplements,
  getSupplementsToday,
  getSchedules,
  getSchedulesToday,
  toggleSupplementLog,
  logDose,
} from "../src/api/tracking.api";
import { StockRecord, Medication, UserMedication, SymptomLog } from "../src/types/health_products";
import { Supplement, SupplementTodayItem, Schedule, TodayDoseItem } from "../src/types/tracking";

// ── Section tab nav ────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "today",       label: "Today",          icon: "today" },
  { id: "medications", label: "My Medications",  icon: "medication" },
  { id: "supplements", label: "Supplements",     icon: "nutrition" },
  { id: "schedules",   label: "Schedules",       icon: "event_repeat" },
  { id: "charts",      label: "Charts",          icon: "bar_chart" },
  { id: "symptoms",    label: "Symptoms",        icon: "health_and_safety" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// ── Expiration alert banner ────────────────────────────────────────────────────

function ExpirationAlerts({ userMedications }: { userMedications: UserMedication[] }) {
  const { dark } = useTheme();

  const today = new Date();
  const alerts = userMedications
    .filter((m) => m.stock.expiration_date != null)
    .map((m) => {
      const expiry = new Date(m.stock.expiration_date!);
      const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...m, daysUntil };
    })
    .filter((m) => m.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (alerts.length === 0) return null;

  return (
    <div
      className={`rounded-xl border p-4 ${
        dark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon
          name="warning"
          className={`text-base ${dark ? "text-amber-400" : "text-amber-600"}`}
        />
        <span className={`text-sm font-semibold ${dark ? "text-amber-300" : "text-amber-800"}`}>
          {alerts.length} medication{alerts.length !== 1 ? "s" : ""} expiring soon
        </span>
      </div>

      <div className="space-y-1.5">
        {alerts.map(({ medication, stock, daysUntil }) => (
          <div key={stock.stock_id} className="flex items-center justify-between text-sm">
            <span className={dark ? "text-amber-200" : "text-amber-900"}>{medication.name}</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                daysUntil < 0
                  ? dark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700"
                  : dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"
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

export default function HealthProductsPage() {
  const { dark } = useTheme();

  const [activeSection, setActiveSection] = useState<SectionId>("today");
  const [loading, setLoading] = useState(true);

  // Medication library
  const [userMedications, setUserMedications] = useState<UserMedication[]>([]);

  // Daily tracking
  const [supplementsToday, setSupplementsToday] = useState<SupplementTodayItem[]>([]);
  const [schedulesToday, setSchedulesToday] = useState<TodayDoseItem[]>([]);

  // Management catalogs
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);

  // ── Loaders ──────────────────────────────────────────────────────────────────

  const loadMedications = useCallback(async () => {
    const stockRecords: StockRecord[] = await getUserMedications();
    const uniqueIds = [...new Set(stockRecords.map((s) => s.medication_id))];

    const medMap = new Map<number, Medication>();
    await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const med = await getMedication(id);
          medMap.set(id, med);
        } catch {
          // Skip medications that can't be fetched individually
        }
      }),
    );

    setUserMedications(
      stockRecords
        .filter((s) => medMap.has(s.medication_id))
        .map((s) => ({ stock: s, medication: medMap.get(s.medication_id)! })),
    );
  }, []);

  const loadTodayChecklists = useCallback(async () => {
    const [suppsToday, schedsToday] = await Promise.all([
      getSupplementsToday(),
      getSchedulesToday(),
    ]);
    setSupplementsToday(suppsToday);
    setSchedulesToday(schedsToday);
  }, []);

  useEffect(() => {
    Promise.all([
      loadMedications(),
      loadTodayChecklists(),
      getSupplements().then(setSupplements),
      getSchedules().then(setSchedules),
      getSymptoms().then(setSymptoms),
    ]).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Action handlers ───────────────────────────────────────────────────────────

  async function handleToggleSupplement(supplementId: number) {
    await toggleSupplementLog(supplementId);
    await loadTodayChecklists();
  }

  async function handleLogDose(scheduleId: number, status: "taken" | "missed") {
    await logDose(scheduleId, { schedule_id: scheduleId, status });
    await loadTodayChecklists();
  }

  // ── Derived stats ─────────────────────────────────────────────────────────────

  const totalMedications = userMedications.length;

  const expiringSoon = useMemo(
    () =>
      userMedications.filter((m) => {
        if (!m.stock.expiration_date) return false;
        const days = Math.ceil(
          (new Date(m.stock.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        return days <= 30;
      }).length,
    [userMedications],
  );

  const totalUnits = useMemo(
    () => userMedications.reduce((sum, m) => sum + (m.stock.quantity ?? 0), 0),
    [userMedications],
  );

  const brandCount = useMemo(
    () => userMedications.filter((m) => m.medication.is_brand).length,
    [userMedications],
  );

  const stats = [
    {
      label: "Total Medications",
      value: String(totalMedications),
      unit: "tracked",
      barColor: "bg-indigo-500",
    },
    {
      label: "Expiring Soon",
      value: String(expiringSoon),
      unit: "within 30 days",
      barColor: expiringSoon > 0 ? "bg-amber-500" : "bg-emerald-500",
    },
    {
      label: "Total Units",
      value: String(totalUnits),
      unit: "in stock",
      barColor: "bg-purple-500",
    },
    {
      label: "Brand Name",
      value: String(brandCount),
      unit: `${totalMedications > 0 ? Math.round((brandCount / totalMedications) * 100) : 0}% of total`,
      barColor: "bg-violet-500",
    },
  ];

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Health Products">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-xl border p-5 h-28 animate-pulse ${
                  dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
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

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Health Products">
      <div className="space-y-6">
        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} unit={s.unit} barColor={s.barColor} />
          ))}
        </section>

        {/* Expiry alert — shown on all tabs so it's never hidden */}
        <ExpirationAlerts userMedications={userMedications} />

        {/* Section nav — underline tabs */}
        <div className={`flex border-b ${dark ? "border-slate-700" : "border-slate-200"}`}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeSection === s.id
                  ? dark
                    ? "border-indigo-400 text-indigo-400"
                    : "border-indigo-600 text-indigo-600"
                  : dark
                    ? "border-transparent text-slate-500 hover:text-slate-300"
                    : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Today — daily supplement + medication dose checklists */}
        {activeSection === "today" && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Icon
                  name="nutrition"
                  className={`text-lg ${dark ? "text-indigo-400" : "text-indigo-600"}`}
                />
                <h2 className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                  Supplements
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    dark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {supplementsToday.filter((s) => s.status === "taken").length} /{" "}
                  {supplementsToday.length} taken
                </span>
              </div>
              <SupplementChecklist items={supplementsToday} onToggle={handleToggleSupplement} />
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Icon
                  name="medication"
                  className={`text-lg ${dark ? "text-rose-400" : "text-rose-600"}`}
                />
                <h2 className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                  Medications
                </h2>
                {schedulesToday.some((s) => s.is_overdue && s.status !== "taken") && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      dark
                        ? "bg-red-500/20 text-red-400"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    Overdue
                  </span>
                )}
              </div>
              <MedicationChecklist items={schedulesToday} onLog={handleLogDose} />
            </Card>
          </div>
        )}

        {/* My Medications — library search + stock table */}
        {activeSection === "medications" && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2
                  className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}
                >
                  Search Medications
                </h2>
                <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
                  Powered by NIH RxNorm
                </span>
              </div>
              <MedicationSearch onStockAdded={loadMedications} />
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2
                  className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}
                >
                  My Medications
                </h2>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    dark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {totalMedications}
                </span>
              </div>
              <MedicationTable userMedications={userMedications} onRefresh={loadMedications} />
            </Card>
          </div>
        )}

        {/* Supplements — catalog CRUD */}
        {activeSection === "supplements" && (
          <Card>
            <SupplementManager
              supplements={supplements}
              onRefresh={() => {
                getSupplements().then(setSupplements);
                loadTodayChecklists();
              }}
            />
          </Card>
        )}

        {/* Schedules — medication schedule CRUD */}
        {activeSection === "schedules" && (
          <Card>
            <ScheduleManager
              schedules={schedules}
              medications={userMedications.map((m) => m.medication)}
              onRefresh={() => {
                getSchedules().then(setSchedules);
                loadTodayChecklists();
              }}
            />
          </Card>
        )}

        {/* Charts — stock levels + brand vs generic */}
        {activeSection === "charts" && (
          <MedicationCharts userMedications={userMedications} />
        )}

        {/* Symptoms — symptom log */}
        {activeSection === "symptoms" && (
          <Card>
            <SymptomTracker
              symptoms={symptoms}
              onRefresh={() => getSymptoms().then(setSymptoms)}
            />
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
