"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import Card from "../../src/components/card";
import { useTheme } from "../../src/context/theme-context";
import { UserMedication } from "../../src/types/health_products";

interface Props {
  userMedications: UserMedication[];
}

const BRAND_COLOR = "#a78bfa";   // purple-400
const GENERIC_COLOR = "#6366f1"; // indigo-500
const BAR_COLOR = "#6366f1";
const BAR_LOW_COLOR = "#f59e0b"; // amber-400  — stock ≤ 5

const PIE_COLORS = [BRAND_COLOR, GENERIC_COLOR];

export default function MedicationCharts({ userMedications }: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const tooltipStyle = {
    backgroundColor: dark ? "#1e293b" : "#fff",
    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
    borderRadius: 8,
    color: dark ? "#f1f5f9" : "#0f172a",
    fontSize: 12,
  };

  // ── Bar chart: stock quantity per medication ─────────────────────────────────
  const stockData = userMedications
    .filter((m) => m.stock.quantity != null)
    .map((m) => ({
      name: m.medication.name.split(" ").slice(0, 2).join(" "), // truncate long names
      stock: m.stock.quantity as number,
      unit: m.stock.unit ?? "",
    }));

  // ── Pie chart: brand vs generic ──────────────────────────────────────────────
  const brandCount = userMedications.filter((m) => m.medication.is_brand).length;
  const genericCount = userMedications.length - brandCount;
  const pieData = [
    { name: "Brand", value: brandCount },
    { name: "Generic", value: genericCount },
  ].filter((d) => d.value > 0);

  const isEmpty = userMedications.length === 0;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Stock levels */}
      <Card>
        <h3 className={`text-sm font-semibold mb-4 ${heading}`}>Stock Levels</h3>
        {isEmpty || stockData.length === 0 ? (
          <div className={`flex items-center justify-center h-[200px] text-sm ${muted}`}>
            No stock data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stockData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, _, entry) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const unit = (entry as any)?.payload?.unit ?? "";
                  return [`${value ?? 0}${unit ? ` ${unit}` : ""}`, "Stock"];
                }}
              />
              <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                {stockData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.stock <= 5 ? BAR_LOW_COLOR : BAR_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {!isEmpty && stockData.length > 0 && (
          <p className={`mt-2 text-xs ${muted}`}>
            <span className="inline-block w-2 h-2 rounded-sm bg-amber-400 mr-1" />
            Amber bars indicate low stock (≤ 5 units)
          </p>
        )}
      </Card>

      {/* Brand vs Generic */}
      <Card>
        <h3 className={`text-sm font-semibold mb-4 ${heading}`}>Brand vs Generic</h3>
        {isEmpty ? (
          <div className={`flex items-center justify-center h-[200px] text-sm ${muted}`}>
            No medications yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 12, color: dark ? "#94a3b8" : "#64748b" }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
