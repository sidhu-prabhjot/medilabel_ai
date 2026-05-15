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

  const [weightKg, setWeightKg]             = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [recordedAt, setRecordedAt]         = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");

  const textMuted = dark ? "text-slate-400" : "text-[#A3B18A]";

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500 outline-none"
      : "bg-white border-[#DAD7CD] text-slate-900 placeholder-[#A3B18A] focus:border-[#4F6F52] outline-none"
  }`;

  async function handleSubmit(e: { preventDefault: () => void }) {
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="flex flex-col gap-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-[0.12em] ${textMuted}`}>
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

        <div className="flex flex-col gap-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-[0.12em] ${textMuted}`}>
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

        <div className="flex flex-col gap-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-[0.12em] ${textMuted}`}>
            Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-[0.12em] ${textMuted}`}>
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

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || !weightKg}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-bold disabled:opacity-50 transition-all active:scale-95 ${
            dark
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-[#4F6F52] hover:bg-[#37563b]"
          }`}
        >
          <Icon name="add" className="text-base" />
          {loading ? "Saving…" : "Save Entry"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 ${
            dark
              ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
              : "bg-[#DAD7CD]/50 hover:bg-[#DAD7CD] text-[#4F6F52]"
          }`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
