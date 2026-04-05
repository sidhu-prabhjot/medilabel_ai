"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import { BodyMetricCreate } from "../../src/types/body_metrics";
import { addBodyMetric } from "../../src/api/body_metrics.api";

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

export default function MetricLogForm({ onSaved, onCancel }: Props) {
  const { dark } = useTheme();

  const [weightKg, setWeightKg] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  // Default to right now, formatted for <input type="datetime-local">
  const [recordedAt, setRecordedAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputCls = `w-full px-3 py-1.5 rounded-lg border text-sm transition-colors ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
  }`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weightKg) return;

    setLoading(true);
    setError("");

    const payload: BodyMetricCreate = {
      weight_kg: parseFloat(weightKg),
      body_fat_percent: bodyFatPercent ? parseFloat(bodyFatPercent) : undefined,
      recorded_at: new Date(recordedAt).toISOString(),
      notes: notes.trim() || undefined,
    };

    try {
      await addBodyMetric(payload);
      onSaved();
    } catch {
      setError("Failed to save entry. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <div className="flex flex-col gap-1">
          <label
            className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            Weight (kg) *
          </label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="500"
            required
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g. 75.5"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            Body Fat %
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={bodyFatPercent}
            onChange={(e) => setBodyFatPercent(e.target.value)}
            placeholder="e.g. 18.5"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}
          >
            Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes…"
            className={inputCls}
          />
        </div>

      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !weightKg}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Icon name="add" className="text-base" />
          {loading ? "Saving…" : "Save Entry"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            dark
              ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
