"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import { BodyMetric, BodyMetricUpdate } from "../../src/types/body_metrics";
import { deleteBodyMetric, updateBodyMetric } from "../../src/api/body_metrics.api";

interface Props {
  metrics: BodyMetric[];
  onRefresh: () => void;
}

export default function MetricHistory({ metrics, onRefresh }: Props) {
  const { dark } = useTheme();

  const textMuted = dark ? "text-slate-400" : "text-[#A3B18A]";
  const divider   = dark ? "border-slate-700" : "border-[#DAD7CD]/60";

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500 outline-none"
      : "bg-white border-[#DAD7CD] text-slate-900 placeholder-[#A3B18A] focus:border-[#4F6F52] outline-none"
  }`;

  const [deletingId, setDeletingId]         = useState<number | null>(null);
  const [editingId, setEditingId]           = useState<number | null>(null);
  const [editWeight, setEditWeight]         = useState("");
  const [editBodyFat, setEditBodyFat]       = useState("");
  const [editRecordedAt, setEditRecordedAt] = useState("");
  const [editNotes, setEditNotes]           = useState("");
  const [saving, setSaving]                 = useState(false);
  const [saveError, setSaveError]           = useState("");

  function openEdit(m: BodyMetric) {
    setEditingId(m.id);
    setEditWeight(String(m.weight_kg));
    setEditBodyFat(m.body_fat_percent != null ? String(m.body_fat_percent) : "");
    setEditRecordedAt(new Date(m.recorded_at).toISOString().slice(0, 16));
    setEditNotes(m.notes ?? "");
    setSaveError("");
  }

  function closeEdit() {
    setEditingId(null);
    setSaveError("");
  }

  async function handleSave(id: number) {
    if (!editWeight) return;
    setSaving(true);
    setSaveError("");

    const payload: BodyMetricUpdate = {
      weight_kg: parseFloat(editWeight),
      body_fat_percent: editBodyFat ? parseFloat(editBodyFat) : undefined,
      recorded_at: new Date(editRecordedAt).toISOString(),
      notes: editNotes.trim() || undefined,
    };

    try {
      await updateBodyMetric(id, payload);
      closeEdit();
      onRefresh();
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

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
      <div className={`flex flex-col items-center gap-3 py-12 ${textMuted}`}>
        <Icon name="monitor_weight" className="text-5xl opacity-30" />
        <p className="text-sm font-medium">No entries logged yet.</p>
      </div>
    );
  }

  const sorted = [...metrics].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
  );

  return (
    <div className="space-y-0">
      {sorted.map((m) => (
        <div key={m.id} className={`border-b last:border-b-0 ${divider}`}>
          {editingId === m.id ? (
            <div
              className={`my-3 p-5 rounded-2xl border space-y-4 ${
                dark
                  ? "bg-slate-700/40 border-slate-700"
                  : "bg-[#4F6F52]/5 border-[#DAD7CD]"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
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
                    value={editBodyFat}
                    onChange={(e) => setEditBodyFat(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={`text-[11px] font-bold uppercase tracking-[0.12em] ${textMuted}`}>
                    Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editRecordedAt}
                    onChange={(e) => setEditRecordedAt(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={`text-[11px] font-bold uppercase tracking-[0.12em] ${textMuted}`}>
                    Notes
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Optional notes…"
                    className={inputCls}
                  />
                </div>
              </div>

              {saveError && <p className="text-xs text-red-500">{saveError}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(m.id)}
                  disabled={saving || !editWeight}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-white text-sm font-bold disabled:opacity-50 transition-all active:scale-95 ${
                    dark
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-[#4F6F52] hover:bg-[#37563b]"
                  }`}
                >
                  <Icon name="check" className="text-base" />
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
                    dark
                      ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      : "bg-[#DAD7CD]/50 hover:bg-[#DAD7CD] text-[#4F6F52]"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 py-4">
              {/* Icon badge */}
              <div
                className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${
                  dark ? "bg-emerald-900/30" : "bg-[#4F6F52]/5"
                }`}
              >
                <Icon
                  name="monitor_weight"
                  className={`text-xl ${dark ? "text-emerald-400" : "text-[#4F6F52]"}`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className={`text-lg font-extrabold ${dark ? "text-white" : "text-[#37563b]"}`}>
                    {m.weight_kg} kg
                  </span>
                  {m.body_fat_percent != null && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        dark ? "bg-emerald-900/40 text-emerald-400" : "bg-[#4F6F52]/10 text-[#4F6F52]"
                      }`}
                    >
                      {m.body_fat_percent}% fat
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <p className={`text-xs font-medium ${textMuted}`}>
                    {new Date(m.recorded_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" · "}
                    {new Date(m.recorded_at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {m.notes && (
                    <p className={`text-xs truncate ${textMuted}`}>{m.notes}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(m)}
                  title="Edit entry"
                  className={`p-2 rounded-xl transition-colors ${
                    dark
                      ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300"
                      : "hover:bg-[#4F6F52]/10 text-[#A3B18A] hover:text-[#4F6F52]"
                  }`}
                >
                  <Icon name="edit" className="text-base" />
                </button>

                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  title="Delete entry"
                  className={`p-2 rounded-xl transition-colors disabled:opacity-40 ${
                    dark
                      ? "hover:bg-red-500/15 text-slate-500 hover:text-red-400"
                      : "hover:bg-red-50 text-[#A3B18A] hover:text-red-500"
                  }`}
                >
                  <Icon name="delete" className="text-base" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
