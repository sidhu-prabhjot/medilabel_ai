"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import { BodyMetric } from "../../src/types/body_metrics";
import { deleteBodyMetric } from "../../src/api/body_metrics.api";

interface Props {
  metrics: BodyMetric[];
  onRefresh: () => void;
}

export default function MetricHistory({ metrics, onRefresh }: Props) {
  const { dark } = useTheme();

  const muted = dark ? "text-slate-400" : "text-slate-500";
  const heading = dark ? "text-white" : "text-slate-900";
  const divider = dark ? "border-slate-700" : "border-slate-100";

  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteBodyMetric(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (metrics.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-2 py-8 ${muted}`}>
        <Icon name="monitor_weight" className="text-4xl opacity-40" />
        <p className="text-sm">No entries logged yet.</p>
      </div>
    );
  }

  // Most recent entries first
  const sorted = [...metrics].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
  );

  return (
    <div className="space-y-0">
      {sorted.map((m) => (
        <div
          key={m.id}
          className={`flex items-center gap-4 py-3 border-b ${divider}`}
        >
          {/* Date */}
          <div className="w-28 flex-shrink-0">
            <p className={`text-xs font-medium ${muted}`}>
              {new Date(m.recorded_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Metrics */}
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-semibold ${heading}`}>
              {m.weight_kg} kg
            </span>
            {m.body_fat_percent != null && (
              <span className={`ml-3 text-xs ${muted}`}>
                {m.body_fat_percent}% body fat
              </span>
            )}
            {m.notes && (
              <p className={`text-xs mt-0.5 truncate ${muted}`}>{m.notes}</p>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={() => handleDelete(m.id)}
            disabled={deletingId === m.id}
            title="Delete entry"
            className={`p-1.5 rounded-lg flex-shrink-0 transition-colors disabled:opacity-40 ${
              dark
                ? "hover:bg-red-500/15 text-slate-500 hover:text-red-400"
                : "hover:bg-red-50 text-slate-400 hover:text-red-500"
            }`}
          >
            <Icon name="delete" className="text-base" />
          </button>
        </div>
      ))}
    </div>
  );
}
