"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../src/context/theme-context";
import { BodyMetric } from "../../src/types/body_metrics";
import Icon from "../../src/components/icon";

interface Props {
  metrics: BodyMetric[];
}

export default function MetricChart({ metrics }: Props) {
  const { dark } = useTheme();

  const muted = dark ? "text-slate-400" : "text-slate-500";

  // Need at least 2 points to draw a meaningful line
  if (metrics.length < 2) {
    return (
      <div className={`flex flex-col items-center gap-2 py-8 ${muted}`}>
        <Icon name="show_chart" className="text-4xl opacity-40" />
        <p className="text-sm">Log at least 2 entries to see your weight trend.</p>
      </div>
    );
  }

  // Sort oldest → newest so the line runs left to right
  const chartData = [...metrics]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((m) => ({
      date: new Date(m.recorded_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      weight: m.weight_kg,
    }));

  const tickColor = dark ? "#94a3b8" : "#64748b"; // slate-400 / slate-500
  const gridColor = dark ? "#334155" : "#e2e8f0"; // slate-700 / slate-200

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          domain={["auto", "auto"]}
          tickFormatter={(v) => `${v} kg`}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: dark ? "#1e293b" : "#ffffff",
            border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
            borderRadius: "8px",
            fontSize: "12px",
            color: dark ? "#f8fafc" : "#0f172a",
          }}
          formatter={(value: number) => [`${value} kg`, "Weight"]}
        />

        <Area
          type="monotone"
          dataKey="weight"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#weightGradient)"
          dot={{ fill: "#6366f1", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
