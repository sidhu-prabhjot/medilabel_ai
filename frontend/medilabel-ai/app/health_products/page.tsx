"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "../src/components/layout/app-layout";
import Card from "../src/components/card";
import Icon from "../src/components/icon";
import { useTheme } from "../src/context/theme-context";

import MedicationSearch from "./components/medication-search";
import MedicationTable from "./components/medication-table";
import MedicationCharts from "./components/medication-charts";
import SymptomTracker from "./components/symptom-tracker";
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

// ── Types ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "today",     label: "Today" },
  { id: "stock",     label: "My Stock" },
  { id: "schedules", label: "Schedules" },
  { id: "charts",    label: "Charts" },
  { id: "symptoms",  label: "Symptoms" },
] as const;

type TabId = (typeof TABS)[number]["id"];
type TimeOfDay = "morning" | "afternoon" | "evening";

// ── Helpers ────────────────────────────────────────────────────────────────────

function doseHour(item: TodayDoseItem): number {
  if (!item.next_dose_at) return 8;
  return new Date(item.next_dose_at).getHours();
}

function doseTimeLabel(item: TodayDoseItem): string {
  if (!item.next_dose_at) return "—";
  const d = new Date(item.next_dose_at);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function filterByTime(items: TodayDoseItem[], tod: TimeOfDay): TodayDoseItem[] {
  return items.filter((item) => {
    const h = doseHour(item);
    if (tod === "morning") return h < 12;
    if (tod === "afternoon") return h >= 12 && h < 17;
    return h >= 17;
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
          dark ? "text-emerald-600" : "text-[#A3B18A]"
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

function DoseCard({
  item,
  onLog,
  dark,
}: {
  item: TodayDoseItem;
  onLog: (scheduleId: number, wasMissed: boolean, doseAmount: number) => void;
  dark: boolean;
}) {
  const taken = item.status === "taken";

  return (
    <div className="relative pl-16">
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-4 flex items-center justify-center z-10 shadow-sm ${
          dark ? "bg-slate-800 border-slate-900" : "bg-white border-[#faf9f5]"
        }`}
      >
        <span className={`text-[10px] font-bold ${dark ? "text-slate-400" : "text-[#A3B18A]"}`}>
          {doseTimeLabel(item)}
        </span>
      </div>

      <div
        className={`p-6 rounded-[2rem] border flex items-center justify-between transition-shadow ${
          taken
            ? dark
              ? "bg-slate-700/40 border-slate-700 opacity-60"
              : "bg-white/50 border-[#DAD7CD]/30 opacity-60"
            : dark
              ? "bg-slate-800 border-slate-700 hover:shadow-md"
              : "bg-white border-[#DAD7CD]/50 shadow-sm hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              dark ? "bg-emerald-900/30" : "bg-[#4F6F52]/5"
            }`}
          >
            <Icon
              name="pill"
              className={`text-3xl ${dark ? "text-emerald-400" : "text-[#4F6F52]"}`}
            />
          </div>
          <div>
            <h4 className={`text-lg font-bold ${dark ? "text-white" : "text-[#37563b]"}`}>
              {item.medication_name}
            </h4>
            <p className={`text-sm font-medium ${dark ? "text-slate-400" : "text-[#A3B18A]"}`}>
              {item.dose_amount} {item.dose_unit ?? "dose"}
              {item.is_overdue && !taken && (
                <span className="ml-2 text-xs font-bold text-red-500 uppercase tracking-wider">
                  Overdue
                </span>
              )}
            </p>
          </div>
        </div>

        {taken ? (
          <span
            className={`text-xs font-bold uppercase tracking-widest italic ${
              dark ? "text-slate-500" : "text-[#A3B18A]"
            }`}
          >
            Taken
          </span>
        ) : (
          <button
            onClick={() => onLog(item.schedule_id, false, item.dose_amount)}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
              dark
                ? "border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                : "border-[#4F6F52] text-[#4F6F52] hover:bg-[#4F6F52] hover:text-white"
            }`}
          >
            <Icon name="check" className="text-xl" />
          </button>
        )}
      </div>
    </div>
  );
}

function SupplementRow({
  item,
  onToggle,
  dark,
}: {
  item: SupplementTodayItem;
  onToggle: (id: number) => void;
  dark: boolean;
}) {
  const taken = item.status === "taken";
  const dosage = [
    item.dosage_amount != null ? `${item.dosage_amount}${item.dosage_unit ?? ""}` : null,
    item.form,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div
      className={`p-6 rounded-[2rem] border flex items-center justify-between transition-shadow ${
        taken
          ? dark
            ? "bg-slate-700/40 border-slate-700 opacity-60"
            : "bg-white/50 border-[#DAD7CD]/30 opacity-60"
          : dark
            ? "bg-slate-800 border-slate-700 hover:shadow-md"
            : "bg-white border-[#DAD7CD]/50 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-6">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            dark ? "bg-emerald-900/20" : "bg-[#A3B18A]/10"
          }`}
        >
          <Icon
            name="nutrition"
            className={`text-3xl ${dark ? "text-emerald-500" : "text-[#A3B18A]"}`}
          />
        </div>
        <div>
          <h4 className={`text-lg font-bold ${dark ? "text-white" : "text-[#37563b]"}`}>
            {item.name}
            {item.brand && (
              <span
                className={`ml-2 text-xs font-normal ${dark ? "text-slate-400" : "text-[#A3B18A]"}`}
              >
                {item.brand}
              </span>
            )}
          </h4>
          {dosage && (
            <p className={`text-sm font-medium ${dark ? "text-slate-400" : "text-[#A3B18A]"}`}>
              {dosage}
            </p>
          )}
        </div>
      </div>

      {taken ? (
        <span
          className={`text-xs font-bold uppercase tracking-widest italic ${
            dark ? "text-slate-500" : "text-[#A3B18A]"
          }`}
        >
          Taken
        </span>
      ) : (
        <button
          onClick={() => onToggle(item.supplement_id)}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
            dark
              ? "border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white"
              : "border-[#4F6F52] text-[#4F6F52] hover:bg-[#4F6F52] hover:text-white"
          }`}
        >
          <Icon name="check" className="text-xl" />
        </button>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MedicationPage() {
  const { dark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [loading, setLoading] = useState(true);

  const [userMedications, setUserMedications] = useState<UserMedication[]>([]);
  const [supplementsToday, setSupplementsToday] = useState<SupplementTodayItem[]>([]);
  const [schedulesToday, setSchedulesToday] = useState<TodayDoseItem[]>([]);
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
          // skip medications that fail individual fetch
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

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function handleToggleSupplement(supplementId: number) {
    await toggleSupplementLog(supplementId);
    await loadTodayChecklists();
  }

  async function handleLogDose(scheduleId: number, wasMissed: boolean, doseAmount: number) {
    await logDose(scheduleId, { schedule_id: scheduleId, dose_amount: doseAmount, was_missed: wasMissed });
    await loadTodayChecklists();
  }

  // ── Derived stats ─────────────────────────────────────────────────────────────

  const expiringSoon = useMemo(
    () =>
      userMedications.filter((m) => {
        if (!m.stock.expiration_date) return false;
        const days = Math.ceil(
          (new Date(m.stock.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        return days <= 30;
      }),
    [userMedications],
  );

  const nextDose = useMemo(() => {
    const pending = schedulesToday
      .filter((s) => s.status !== "taken" && s.next_dose_at)
      .map((s) => new Date(s.next_dose_at!))
      .sort((a, b) => a.getTime() - b.getTime());
    return pending[0] ?? null;
  }, [schedulesToday]);

  const takenToday = schedulesToday.filter((s) => s.status === "taken").length;
  const remainingToday =
    schedulesToday.filter((s) => s.status !== "taken").length +
    supplementsToday.filter((s) => s.status !== "taken").length;

  const dosesForTime = filterByTime(schedulesToday, timeOfDay);

  // ── Style shorthands ──────────────────────────────────────────────────────────

  const textPrimary = dark ? "text-emerald-400" : "text-[#37563b]";
  const textMuted = dark ? "text-slate-400" : "text-[#A3B18A]";
  const borderColor = dark ? "border-slate-700" : "border-[#DAD7CD]/50";
  const surface = dark ? "bg-slate-800 border-slate-700" : "bg-white border-[#DAD7CD]/50";

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Medication">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
    <AppLayout title="Medication">
      <div className="space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            dark={dark}
            label="Taken Today"
            value={String(takenToday)}
            unit={`of ${schedulesToday.length} doses`}
            valueClass={dark ? "text-emerald-400" : "text-[#4F6F52]"}
          />
          <StatCard
            dark={dark}
            label="Remaining"
            value={String(remainingToday)}
            unit="to take"
            valueClass={dark ? "text-emerald-400" : "text-[#4F6F52]"}
          />
          <StatCard
            dark={dark}
            label="Stock Alerts"
            value={String(expiringSoon.length)}
            unit="expiring soon"
            valueClass={expiringSoon.length > 0 ? "text-red-500" : dark ? "text-emerald-400" : "text-[#4F6F52]"}
          />
          <StatCard
            dark={dark}
            label="Next Dose"
            value={
              nextDose
                ? nextDose.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "—"
            }
            unit={nextDose ? (nextDose.getHours() < 12 ? "AM" : "PM") : "none scheduled"}
            valueClass={dark ? "text-emerald-400" : "text-[#566342]"}
          />
        </div>

        {/* Tab nav */}
        <nav className={`flex flex-wrap gap-8 border-b pb-2 ${borderColor}`}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-2 font-semibold transition-colors text-sm ${
                activeTab === tab.id
                  ? dark
                    ? "text-emerald-400 after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[3px] after:bg-emerald-400 after:rounded-full"
                    : "text-orange-500 after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[3px] after:bg-orange-500 after:rounded-full"
                  : dark
                    ? "text-slate-500 hover:text-slate-300"
                    : "text-[#A3B18A] hover:text-[#4F6F52]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Today ──────────────────────────────────────────────────────────── */}
        {activeTab === "today" && (
          <div className="flex flex-col md:flex-row gap-10">
            {/* Main timeline */}
            <div className="flex-grow space-y-8">

              {/* Expiry alert */}
              {expiringSoon.length > 0 && (
                <div
                  className={`p-5 rounded-2xl border flex items-center justify-between ${
                    dark
                      ? "bg-amber-900/20 border-amber-700/40"
                      : "bg-[#4F6F52]/5 border-[#DAD7CD]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon
                      name="warning"
                      className={dark ? "text-amber-400" : "text-[#566342]"}
                    />
                    <p className={`text-sm font-medium ${dark ? "text-amber-300" : "text-[#4F6F52]"}`}>
                      {expiringSoon.length} medication{expiringSoon.length !== 1 ? "s" : ""} expiring soon:{" "}
                      <span className="font-bold">
                        {expiringSoon.map((m) => m.medication.name).join(", ")}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Time-of-day selector + header */}
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${textPrimary}`}>Today's Schedule</h3>
                <div
                  className={`flex gap-1 p-1.5 rounded-full border ${
                    dark ? "bg-slate-800 border-slate-700" : "bg-white border-[#DAD7CD]/30 shadow-sm"
                  }`}
                >
                  {(["morning", "afternoon", "evening"] as TimeOfDay[]).map((tod) => (
                    <button
                      key={tod}
                      onClick={() => setTimeOfDay(tod)}
                      className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                        timeOfDay === tod
                          ? dark
                            ? "bg-emerald-600 text-white"
                            : "bg-orange-500 text-white"
                          : dark
                            ? "text-slate-400 hover:bg-slate-700"
                            : "text-[#A3B18A] hover:bg-[#4F6F52]/5"
                      }`}
                    >
                      {tod.charAt(0).toUpperCase() + tod.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dose timeline */}
              <div
                className={`space-y-6 relative ${
                  dosesForTime.length > 0
                    ? "before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-[#DAD7CD]/50"
                    : ""
                }`}
              >
                {dosesForTime.length === 0 ? (
                  <p className={`text-sm ${textMuted}`}>
                    No doses scheduled for the {timeOfDay}.
                  </p>
                ) : (
                  dosesForTime.map((item) => (
                    <DoseCard key={item.schedule_id} item={item} onLog={handleLogDose} dark={dark} />
                  ))
                )}
              </div>

              {/* Supplements */}
              {supplementsToday.length > 0 && (
                <div className="space-y-4">
                  <h3 className={`text-xl font-bold ${textPrimary}`}>Supplements</h3>
                  <div className="space-y-4">
                    {supplementsToday.map((item) => (
                      <SupplementRow
                        key={item.supplement_id}
                        item={item}
                        onToggle={handleToggleSupplement}
                        dark={dark}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar panel */}
            <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-6">
              {expiringSoon.length > 0 && (
                <div
                  className={`p-8 rounded-[2rem] relative overflow-hidden ${
                    dark
                      ? "bg-emerald-900 text-white shadow-xl shadow-emerald-900/20"
                      : "bg-[#4F6F52] text-white shadow-xl shadow-[#4F6F52]/10"
                  }`}
                >
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-2">Refill Needed</h4>
                    <ul className="text-sm text-white/80 leading-relaxed list-disc list-inside mt-2 space-y-1">
                      {expiringSoon.map((m) => (
                        <li key={m.stock.stock_id}>{m.medication.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                </div>
              )}

              {/* Daily progress */}
              <div className={`p-6 rounded-[2rem] border ${surface}`}>
                <h4 className={`text-sm font-bold mb-4 ${textPrimary}`}>Daily Progress</h4>
                <div className="space-y-4">
                  {schedulesToday.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span className={textMuted}>Medications</span>
                        <span className={textPrimary}>
                          {takenToday}/{schedulesToday.length}
                        </span>
                      </div>
                      <div className={`h-2 rounded-full ${dark ? "bg-slate-700" : "bg-[#DAD7CD]/50"}`}>
                        <div
                          className="h-2 rounded-full bg-[#4F6F52] transition-all"
                          style={{
                            width: `${(takenToday / schedulesToday.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {supplementsToday.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span className={textMuted}>Supplements</span>
                        <span className={textPrimary}>
                          {supplementsToday.filter((s) => s.status === "taken").length}/
                          {supplementsToday.length}
                        </span>
                      </div>
                      <div className={`h-2 rounded-full ${dark ? "bg-slate-700" : "bg-[#DAD7CD]/50"}`}>
                        <div
                          className="h-2 rounded-full bg-[#A3B18A] transition-all"
                          style={{
                            width: `${
                              (supplementsToday.filter((s) => s.status === "taken").length /
                                supplementsToday.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {schedulesToday.length === 0 && supplementsToday.length === 0 && (
                    <p className={`text-xs ${textMuted}`}>No items tracked today.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── My Stock ──────────────────────────────────────────────────────── */}
        {activeTab === "stock" && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
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
                <h2 className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                  My Medications
                </h2>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    dark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {userMedications.length}
                </span>
              </div>
              <MedicationTable userMedications={userMedications} onRefresh={loadMedications} />
            </Card>

            <Card>
              <SupplementManager
                supplements={supplements}
                onRefresh={() => {
                  getSupplements().then(setSupplements);
                  loadTodayChecklists();
                }}
              />
            </Card>
          </div>
        )}

        {/* ── Schedules ─────────────────────────────────────────────────────── */}
        {activeTab === "schedules" && (
          <Card>
            <ScheduleManager
              schedules={schedules}
              userMedications={userMedications}
              onRefresh={() => {
                getSchedules().then(setSchedules);
                loadTodayChecklists();
              }}
            />
          </Card>
        )}

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        {activeTab === "charts" && (
          <MedicationCharts userMedications={userMedications} />
        )}

        {/* ── Symptoms ─────────────────────────────────────────────────────── */}
        {activeTab === "symptoms" && (
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
