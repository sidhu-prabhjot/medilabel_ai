"use client";

import { useEffect, useState } from "react";
import AppLayout from "../src/components/layout/app-layout";
import Icon from "../src/components/icon";
import { useTheme } from "../src/context/theme-context";

// ─── Circular progress ring ───────────────────────────────────────────────────
function CircleProgress({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          strokeWidth={5} stroke="rgba(255,255,255,0.35)" fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          strokeWidth={5} stroke="white" fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
        {pct}%
      </span>
    </div>
  );
}

// ─── Scan card ────────────────────────────────────────────────────────────────
function ScanCard({
  name, count, pct, gradient, iconName,
}: {
  name: string; count: string; pct: number; gradient: string; iconName: string;
}) {
  return (
    <div
      className={`relative rounded-2xl p-4 ${gradient} text-white overflow-hidden flex flex-col justify-between`}
      style={{ minHeight: "148px" }}
    >
      <div>
        <h3 className="font-bold text-base leading-tight">{name}</h3>
        <p className="text-xs opacity-75 mt-1">{count}</p>
      </div>
      <div className="flex items-end justify-between mt-3">
        <CircleProgress pct={pct} />
        <Icon name={iconName} className="text-6xl opacity-60 -mb-1" />
      </div>
    </div>
  );
}

// ─── Schedule item ────────────────────────────────────────────────────────────
function ScheduleItem({
  iconBg, iconName, title, time,
}: {
  iconBg: string; iconName: string; title: string; time: string;
}) {
  const { dark } = useTheme();
  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-3 ${
        dark ? "bg-slate-800" : "bg-white"
      } shadow-sm`}
    >
      <div
        className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon name={iconName} className="text-[18px] text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            dark ? "text-white" : "text-gray-700"
          }`}
        >
          {title}
        </p>
        <p className={`text-xs ${dark ? "text-slate-400" : "text-gray-400"}`}>
          {time}
        </p>
      </div>
      <button
        className={`flex-shrink-0 ${dark ? "text-slate-600" : "text-gray-300"}`}
      >
        <Icon name="more_vert" className="text-[18px]" />
      </button>
    </div>
  );
}

// ─── Statistics card ──────────────────────────────────────────────────────────
function StatsCard({ label, value }: { label: string; value: string }) {
  const { dark } = useTheme();
  return (
    <div
      className={`rounded-2xl p-4 ${dark ? "bg-slate-800" : "bg-blue-50"}`}
    >
      <p
        className={`text-xs leading-tight mb-3 ${
          dark ? "text-slate-400" : "text-gray-400"
        }`}
      >
        {label}
      </p>
      <div className="flex items-center gap-2">
        <div
          className={`w-0.5 h-8 rounded-full ${
            dark ? "bg-blue-400" : "bg-blue-400"
          }`}
        />
        <span
          className={`text-2xl font-bold tabular-nums ${
            dark ? "text-blue-400" : "text-blue-600"
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Activity bar chart ───────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ACTIVITY_VALUES = [45, 62, 55, 90, 70, 42, 30];

function ActivityChart() {
  const { dark } = useTheme();
  const max = Math.max(...ACTIVITY_VALUES);
  return (
    <div>
      <div className="flex items-end gap-1.5 h-28">
        {ACTIVITY_VALUES.map((v, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end h-full"
          >
            <div
              className={`w-full rounded-full transition-all ${
                i === 3
                  ? "bg-blue-500"
                  : dark
                  ? "bg-slate-700"
                  : "bg-blue-100"
              }`}
              style={{
                height: `${(v / max) * 100}%`,
                minHeight: "12px",
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-2">
        {DAYS.map((d, i) => (
          <div
            key={i}
            className={`flex-1 text-center text-xs ${
              dark ? "text-slate-500" : "text-gray-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { dark } = useTheme();
  const [username, setUsername] = useState("User");

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const raw: string = payload.sub || payload.email || "";
        const name = raw.includes("@") ? raw.split("@")[0] : raw;
        if (name) setUsername(name.charAt(0).toUpperCase() + name.slice(1));
      }
    } catch {
      // keep default
    }
  }, []);

  const heading = dark ? "text-white" : "text-gray-800";
  const muted = dark ? "text-slate-400" : "text-gray-400";

  const scans = [
    {
      name: "Pain Relief",
      count: "3 recent scans",
      pct: 94,
      gradient: "bg-gradient-to-br from-blue-400 to-blue-600",
      iconName: "medication",
    },
    {
      name: "Supplements",
      count: "7 recent scans",
      pct: 87,
      gradient: "bg-gradient-to-br from-orange-400 to-orange-500",
      iconName: "nutrition",
    },
    {
      name: "Antibiotics",
      count: "2 recent scans",
      pct: 91,
      gradient: "bg-gradient-to-br from-green-400 to-green-600",
      iconName: "vaccines",
    },
    {
      name: "Cold & Flu",
      count: "5 recent scans",
      pct: 78,
      gradient: "bg-gradient-to-br from-amber-400 to-amber-500",
      iconName: "masks",
    },
  ];

  const schedule = [
    {
      iconBg: "bg-blue-400",
      iconName: "light_mode",
      title: "Vitamin D – Morning",
      time: "8:00 AM – 9:00 AM",
    },
    {
      iconBg: "bg-orange-400",
      iconName: "medication",
      title: "Ibuprofen – Midday",
      time: "12:00 PM – 1:00 PM",
    },
    {
      iconBg: "bg-green-400",
      iconName: "vaccines",
      title: "Amoxicillin – Evening",
      time: "6:00 PM – 7:00 PM",
    },
    {
      iconBg: "bg-purple-400",
      iconName: "local_pharmacy",
      title: "Omega-3 – Afternoon",
      time: "3:00 PM – 4:00 PM",
    },
    {
      iconBg: "bg-amber-400",
      iconName: "nutrition",
      title: "Vitamin C – Morning",
      time: "8:00 AM – 12:00 PM",
    },
    {
      iconBg: "bg-teal-400",
      iconName: "bedtime",
      title: "Melatonin – Night",
      time: "10:00 PM – 11:00 PM",
    },
  ];

  const stats = [
    { label: "Labels Processed", value: "842" },
    { label: "Active Medications", value: "04" },
    { label: "Avg Accuracy", value: "94%" },
    { label: "Tasks Finished", value: "12" },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="flex gap-6">
        {/* ── Center content ── */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Greeting */}
          <h1 className={`text-2xl font-semibold ${heading}`}>
            Hello{" "}
            <span className={dark ? "text-blue-400" : "text-blue-600"}>
              {username}
            </span>
            , welcome back!
          </h1>

          {/* Recent Scans */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className={`text-base font-semibold ${heading}`}>
                  Recent Scans
                </h2>
                <button
                  className={`text-xs font-medium ${
                    dark ? "text-blue-400" : "text-blue-500"
                  }`}
                >
                  View All
                </button>
              </div>
              <button className={`${muted}`}>
                <Icon name="search" className="text-[20px]" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {scans.map((s, i) => (
                <ScanCard key={i} {...s} />
              ))}
            </div>
          </section>

          {/* Medication Schedule */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className={`text-base font-semibold ${heading}`}>
                  Medication Schedule
                </h2>
                <button
                  className={`text-xs font-medium ${
                    dark ? "text-blue-400" : "text-blue-500"
                  }`}
                >
                  View All
                </button>
              </div>
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  dark ? "text-blue-400" : "text-blue-500"
                }`}
              >
                <Icon name="calendar_month" className="text-[16px]" />
                <span>Today</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {schedule.map((item, i) => (
                <ScheduleItem key={i} {...item} />
              ))}
            </div>
          </section>
        </div>

        {/* ── Right panel ── */}
        <div className="w-60 flex-shrink-0 space-y-6">
          {/* Statistics */}
          <section>
            <h2 className={`text-base font-semibold mb-4 ${heading}`}>
              Statistics
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <StatsCard key={i} {...s} />
              ))}
            </div>
          </section>

          {/* Activity */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base font-semibold ${heading}`}>Activity</h2>
              <div className="flex gap-0.5 text-xs">
                {["Day", "Week", "Month"].map((t, i) => (
                  <button
                    key={t}
                    className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                      i === 1
                        ? "bg-blue-500 text-white"
                        : `${muted} hover:text-blue-500`
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <ActivityChart />
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
