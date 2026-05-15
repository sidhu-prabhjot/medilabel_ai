"use client";

import { useEffect, useState } from "react";
import AppLayout from "../src/components/layout/app-layout";
import Icon from "../src/components/icon";
import { useTheme } from "../src/context/theme-context";
import { getMe } from "../src/api/auth.api";
import { getSchedulesToday } from "../src/api/tracking.api";
import { getBodyMetrics, getLatestBodyMetric } from "../src/api/body_metrics.api";
import { getUserMedications } from "../src/api/health_product.api";
import { getWorkouts } from "../src/api/workouts.api";
import type { TodayDoseItem } from "../src/types/tracking";
import type { BodyMetric } from "../src/types/body_metrics";
import type { StockRecord } from "../src/types/health_products";
import type { Workout } from "../src/types/workouts";

// ─── Adherence Ring ───────────────────────────────────────────────────────────
function AdherenceRing({ taken, total }: { taken: number; total: number }) {
  const { dark } = useTheme();
  const pct = total === 0 ? 0 : Math.round((taken / total) * 100);
  const r = 76;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const size = 192;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            strokeWidth={14}
            stroke={dark ? "#1e293b" : "#c8ecc8"}
            fill="none"
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            strokeWidth={14}
            stroke="#37563b"
            fill="none"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-black tabular-nums ${dark ? "text-white" : "text-gray-800"}`}>
            {total === 0 ? "—" : `${pct}%`}
          </span>
          <span className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${dark ? "text-slate-400" : "text-gray-400"}`}>
            Taken Today
          </span>
        </div>
      </div>
      <p className={`text-sm font-medium ${dark ? "text-slate-300" : "text-gray-600"}`}>
        {total === 0 ? "No doses scheduled" : `${taken} of ${total} doses taken`}
      </p>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 80;
  const H = 36;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-9 flex-shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, overdue }: { status: string; overdue: boolean }) {
  if (overdue && status !== "taken") {
    return (
      <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
        Overdue
      </span>
    );
  }
  if (status === "taken") {
    return (
      <span className="text-[10px] font-bold bg-[#c8ecc8] text-[#2f4e33] px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
        Taken
      </span>
    );
  }
  if (status === "missed") {
    return (
      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
        Missed
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold bg-[#eeeeea] text-[#424841] px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
      Pending
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent: string;
}) {
  const { dark } = useTheme();
  return (
    <div className={`rounded-2xl p-5 flex items-center gap-4 shadow-sm ${dark ? "bg-slate-800" : "bg-white"}`}>
      <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center flex-shrink-0`}>
        <Icon name={icon} className="text-[20px] text-white" />
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-medium mb-0.5 ${dark ? "text-slate-400" : "text-[#424841]"}`}>{label}</p>
        <p className={`text-xl font-bold tabular-nums truncate ${dark ? "text-white" : "text-[#1a1c1a]"}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function startOfCurrentWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { dark } = useTheme();
  const [username, setUsername] = useState("User");
  const [doses, setDoses] = useState<TodayDoseItem[]>([]);
  const [latestMetric, setLatestMetric] = useState<BodyMetric | null>(null);
  const [metricHistory, setMetricHistory] = useState<BodyMetric[]>([]);
  const [userMeds, setUserMeds] = useState<StockRecord[]>([]);
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    getMe()
      .then(({ email }) => {
        const name = email.split("@")[0];
        setUsername(name.charAt(0).toUpperCase() + name.slice(1));
      })
      .catch(() => {});

    getSchedulesToday().then(setDoses).catch(() => {});

    getLatestBodyMetric().then(setLatestMetric).catch(() => {});

    getBodyMetrics()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
        );
        setMetricHistory(sorted.slice(-7));
      })
      .catch(() => {});

    getUserMedications().then(setUserMeds).catch(() => {});

    getWorkouts()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime(),
        );
        setAllWorkouts(sorted);
      })
      .catch(() => {});
  }, []);

  // ── Derived values ───────────────────────────────────────────────────────────
  const takenCount = doses.filter((d) => d.status === "taken").length;
  const lowStock = userMeds.filter((m) => m.quantity !== null && (m.quantity as number) < 10);
  const sparklineWeights = metricHistory.map((m) => m.weight_kg);
  const weightDelta =
    metricHistory.length >= 2
      ? metricHistory[metricHistory.length - 1].weight_kg -
        metricHistory[metricHistory.length - 2].weight_kg
      : null;
  const recentWorkout = allWorkouts[0] ?? null;
  const weekStart = startOfCurrentWeek();
  const workoutsThisWeek = allWorkouts.filter(
    (w) => new Date(w.workout_date) >= weekStart,
  ).length;

  const card = dark ? "bg-slate-800" : "bg-white";
  const heading = dark ? "text-white" : "text-[#1a1c1a]";
  const muted = dark ? "text-slate-400" : "text-[#424841]";
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-5">

        {/* ── Greeting ── */}
        <div>
          <h1 className={`text-2xl font-semibold ${heading}`}>
            {getGreeting()},{" "}
            <span className={dark ? "text-[#acd0ad]" : "text-[#37563b]"}>{username}</span>
          </h1>
          <p className={`text-sm mt-0.5 ${muted}`}>{todayLabel}</p>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Scheduled Today"
            value={doses.length}
            icon="calendar_today"
            accent="bg-[#37563b]"
          />
          <StatCard
            label="Doses Taken"
            value={`${takenCount} / ${doses.length}`}
            icon="check_circle"
            accent="bg-[#4f6f52]"
          />
          <StatCard
            label="Active Meds"
            value={userMeds.length}
            icon="medication"
            accent="bg-[#566342]"
          />
          <StatCard
            label="Workouts This Week"
            value={workoutsThisWeek}
            icon="fitness_center"
            accent="bg-[#515048]"
          />
        </div>

        {/* ── Main row: adherence + schedule ── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Adherence Ring */}
          <div className={`rounded-2xl p-6 shadow-sm flex flex-col ${card}`}>
            <h2 className={`text-sm font-semibold mb-5 ${heading}`}>Daily Adherence</h2>
            <div className="flex-1 flex items-center justify-center">
              <AdherenceRing taken={takenCount} total={doses.length} />
            </div>
          </div>

          {/* Today's Schedule */}
          <div className={`rounded-2xl p-6 shadow-sm col-span-2 ${card}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-semibold ${heading}`}>Today&rsquo;s Schedule</h2>
              <span className={`text-xs ${muted}`}>{todayLabel}</span>
            </div>

            {doses.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-44 gap-2 ${muted}`}>
                <Icon name="event_available" className="text-4xl opacity-30" />
                <p className="text-sm">No doses scheduled today</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {doses.map((dose) => (
                  <div
                    key={dose.schedule_id}
                    className={`flex items-center gap-3 rounded-xl p-3 ${
                      dark ? "bg-slate-700/50" : "bg-[#f4f4ef]"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        dose.status === "taken"
                          ? "bg-[#37563b]"
                          : dose.is_overdue
                          ? "bg-orange-500"
                          : dose.status === "missed"
                          ? "bg-red-500"
                          : "bg-[#acd0ad]"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${heading}`}>
                        {dose.medication_name}
                      </p>
                      <p className={`text-xs ${muted}`}>
                        {dose.dose_amount}{" "}
                        {dose.dose_unit ?? dose.stock_unit ?? "dose"}
                        {formatTime(dose.next_dose_at) && (
                          <> &middot; {formatTime(dose.next_dose_at)}</>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={dose.status} overdue={dose.is_overdue} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom row: weight · stock · workout ── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Current Weight */}
          <div className={`rounded-2xl p-6 shadow-sm ${card}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-1.5 rounded-lg ${dark ? "bg-[#2f4e33]/30" : "bg-[#c8ecc8]"}`}>
                <Icon name="scale" className={`text-[18px] ${dark ? "text-[#acd0ad]" : "text-[#37563b]"}`} />
              </div>
              <h2 className={`text-sm font-semibold ${heading}`}>Current Weight</h2>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div>
                <p className={`text-3xl font-black tabular-nums ${heading}`}>
                  {latestMetric ? latestMetric.weight_kg : "—"}
                  {latestMetric && (
                    <span className={`text-base font-normal ml-1 ${muted}`}>kg</span>
                  )}
                </p>
                {latestMetric?.body_fat_percent != null && (
                  <p className={`text-xs mt-1 ${muted}`}>
                    {latestMetric.body_fat_percent}% body fat
                  </p>
                )}
                {weightDelta !== null && (
                  <p className={`text-xs mt-1 font-medium ${weightDelta <= 0 ? "text-green-500" : "text-red-500"}`}>
                    {weightDelta > 0 ? "+" : ""}
                    {weightDelta.toFixed(1)} kg from last entry
                  </p>
                )}
                {!latestMetric && (
                  <p className={`text-xs mt-1 ${muted}`}>No entries yet</p>
                )}
              </div>
              {sparklineWeights.length >= 2 && (
                <Sparkline
                  data={sparklineWeights}
                  color={weightDelta !== null && weightDelta <= 0 ? "#22c55e" : "#ef4444"}
                />
              )}
            </div>
          </div>

          {/* Stock Alert */}
          <div
            className={`rounded-2xl p-6 shadow-sm ${card} ${
              lowStock.length > 0
                ? `border-2 ${dark ? "border-red-800" : "border-red-200"}`
                : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-1.5 rounded-lg ${
                  lowStock.length > 0
                    ? dark ? "bg-red-900/30" : "bg-red-100"
                    : dark ? "bg-green-900/30" : "bg-green-100"
                }`}
              >
                <Icon
                  name="inventory_2"
                  className={`text-[18px] ${lowStock.length > 0 ? "text-red-500" : "text-green-500"}`}
                />
              </div>
              {lowStock.length > 0 && (
                <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Action Required
                </span>
              )}
            </div>

            {lowStock.length > 0 ? (
              <>
                <p className={`text-2xl font-black ${heading}`}>{lowStock.length}</p>
                <p className={`text-sm mt-1 ${muted}`}>
                  {lowStock.length === 1 ? "prescription" : "prescriptions"} running
                  low — order refills soon.
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-green-500">
                  {userMeds.length > 0 ? "All Good" : "—"}
                </p>
                <p className={`text-sm mt-1 ${muted}`}>
                  {userMeds.length > 0
                    ? "All stock levels are sufficient."
                    : "No medications tracked yet."}
                </p>
              </>
            )}
          </div>

          {/* Recent Workout */}
          <div className={`rounded-2xl p-6 shadow-sm ${card}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-1.5 rounded-lg ${dark ? "bg-[#2f4e33]/30" : "bg-[#dae8be]"}`}>
                <Icon name="fitness_center" className={`text-[18px] ${dark ? "text-[#acd0ad]" : "text-[#566342]"}`} />
              </div>
              <h2 className={`text-sm font-semibold ${heading}`}>Recent Workout</h2>
            </div>

            {recentWorkout ? (
              <>
                <p className={`text-lg font-bold truncate ${heading}`}>
                  {recentWorkout.workout_name}
                </p>
                <p className={`text-xs mt-1 ${muted}`}>
                  {new Date(recentWorkout.workout_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className={`text-xs mt-3 font-medium ${dark ? "text-[#acd0ad]" : "text-[#37563b]"}`}>
                  {workoutsThisWeek} workout{workoutsThisWeek !== 1 ? "s" : ""} this week
                </p>
              </>
            ) : (
              <div className={`flex flex-col items-center justify-center h-16 gap-1 ${muted}`}>
                <p className="text-sm">No workouts logged yet</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
