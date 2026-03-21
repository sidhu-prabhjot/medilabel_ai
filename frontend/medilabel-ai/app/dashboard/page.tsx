"use client";

import StatCard from "../src/components/stat-card";
import ActivityRow from "../src/components/activity-row";
import Card from "../src/components/card";
import AppLayout from "../src/components/layout/app-layout";
import { useTheme } from "../src/context/theme-context";

function StatusItem({ label, status }: { label: string; status: string }) {
  const { dark } = useTheme();
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${dark ? "text-slate-300" : "text-slate-700"}`}>
        {label}
      </span>
      <span
        className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
          dark
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    </div>
  );
}

function UptimeBar() {
  const { dark } = useTheme();
  return (
    <div
      className={`mt-5 pt-4 border-t ${dark ? "border-slate-700" : "border-slate-200"}`}
    >
      <p
        className={`text-xs font-medium mb-2 ${dark ? "text-slate-400" : "text-slate-500"}`}
      >
        Uptime — last 30 days
      </p>
      <div className="flex gap-0.5">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-6 rounded-sm ${i === 14 ? "bg-amber-400" : "bg-emerald-500"}`}
            title={i === 14 ? "1 incident" : "No incidents"}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        <span
          className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}
        >
          30d ago
        </span>
        <span
          className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}
        >
          Today
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-slate-900";

  const stats = [
    {
      label: "Total Labels Processed",
      value: "12,842",
      change: "+12%",
      positive: true,
      barColor: "bg-indigo-500",
    },
    {
      label: "Active Models",
      value: "4",
      change: "+1",
      positive: true,
      barColor: "bg-purple-500",
    },
    {
      label: "Avg Accuracy",
      value: "94.3%",
      change: "+0.6%",
      positive: true,
      barColor: "bg-emerald-500",
    },
    {
      label: "Errors",
      value: "23",
      change: "-5%",
      positive: true,
      barColor: "bg-amber-500",
    },
  ];

  const activity = [
    {
      icon: "label",
      label: "Label Parsed",
      sub: "Tylenol Extra Strength",
      time: "2 min ago",
      status: "done",
    },
    {
      icon: "graph_2",
      label: "Model Retraining",
      sub: "NER Pipeline",
      time: "15 min ago",
      status: "running",
    },
    {
      icon: "storage",
      label: "Data Sync",
      sub: "OpenFDA",
      time: "1 hr ago",
      status: "done",
    },
    {
      icon: "cloud",
      label: "Label Uploaded",
      sub: "Advil Cold & Sinus",
      time: "3 hr ago",
      status: "pending",
    },
  ] as const;

  return (
    <AppLayout title="Dashboard">
      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </section>

      {/* Activity + Status */}
      <section className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-semibold ${heading}`}>
              Recent Activity
            </h2>
            <button
              className={`text-xs font-medium ${
                dark
                  ? "text-indigo-400 hover:text-indigo-300"
                  : "text-indigo-600 hover:text-indigo-700"
              }`}
            >
              View all
            </button>
          </div>
          {activity.map((a, i) => (
            <ActivityRow key={i} {...a} />
          ))}
        </Card>

        <Card>
          <h2 className={`text-sm font-semibold mb-4 ${heading}`}>
            System Status
          </h2>
          <div className="space-y-3">
            <StatusItem label="OCR Service" status="Operational" />
            <StatusItem label="NER Pipeline" status="Operational" />
            <StatusItem label="Vector Search" status="Operational" />
            <StatusItem label="API Gateway" status="Operational" />
          </div>
          <UptimeBar />
        </Card>
      </section>
    </AppLayout>
  );
}
