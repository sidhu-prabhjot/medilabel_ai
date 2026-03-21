"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import { SymptomLog, SymptomLogCreate } from "../../src/types/health_products";
import { addSymptom, deleteSymptom } from "../../src/api/health_product.api";

interface Props {
  symptoms: SymptomLog[];
  onRefresh: () => void;
}

// ── Severity badge ─────────────────────────────────────────────────────────────

function SeverityBadge({ level, dark }: { level: number; dark: boolean }) {
  const configs = [
    { label: "Mild", color: dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-700" },
    { label: "Mild", color: dark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-700" },
    { label: "Moderate", color: dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-700" },
    { label: "Moderate", color: dark ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-700" },
    { label: "Severe", color: dark ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-700" },
  ];
  const { label, color } = configs[Math.min(level - 1, 4)];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label} ({level}/5)
    </span>
  );
}

// ── Log form ───────────────────────────────────────────────────────────────────

function SymptomForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { dark } = useTheme();
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputCls = `w-full px-3 py-1.5 rounded-lg border text-sm transition-colors ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
  }`;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!symptom.trim()) return;
    setLoading(true);
    setError("");

    const payload: SymptomLogCreate = {
      symptom: symptom.trim(),
      severity,
      notes: notes.trim() || undefined,
      is_resolved: false,
    };

    try {
      await addSymptom(payload);
      onSaved();
    } catch {
      setError("Failed to log symptom. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Symptom *
        </label>
        <input
          value={symptom}
          onChange={(e) => setSymptom((e.target as HTMLInputElement).value)}
          placeholder="e.g. Headache, nausea…"
          required
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Severity: {severity}/5
        </label>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Mild</span>
          <input
            type="range"
            min={1}
            max={5}
            value={severity}
            onChange={(e) => setSeverity(Number((e.target as HTMLInputElement).value))}
            className="flex-1 accent-indigo-500"
          />
          <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Severe</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={`text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
          placeholder="Optional details…"
          rows={2}
          className={inputCls}
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !symptom.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Icon name="add" className="text-base" />
          {loading ? "Logging…" : "Log Symptom"}
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

// ── Main component ─────────────────────────────────────────────────────────────

export default function SymptomTracker({ symptoms, onRefresh }: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const divider = dark ? "border-slate-700" : "border-slate-100";

  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(symptomId: string) {
    setDeletingId(symptomId);
    try {
      await deleteSymptom(symptomId);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-sm font-semibold ${heading}`}>Symptom Log</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            showForm
              ? dark
                ? "bg-slate-700 text-slate-300"
                : "bg-slate-100 text-slate-600"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          <Icon name={showForm ? "expand_less" : "add"} className="text-sm" />
          {showForm ? "Close" : "Log Symptom"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div
          className={`mb-5 p-4 rounded-xl border ${
            dark ? "bg-slate-700/30 border-slate-700" : "bg-slate-50 border-slate-200"
          }`}
        >
          <SymptomForm
            onSaved={() => {
              setShowForm(false);
              onRefresh();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Symptom list */}
      {symptoms.length === 0 ? (
        <div className={`flex flex-col items-center gap-2 py-8 ${muted}`}>
          <Icon name="health_and_safety" className="text-4xl opacity-40" />
          <p className="text-sm">No symptoms logged yet.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {symptoms.map((s) => (
            <div
              key={s.symptom_id}
              className={`flex items-start gap-3 py-3 border-b ${divider}`}
            >
              {/* Resolved indicator */}
              <div
                className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  s.is_resolved ? "bg-emerald-500" : "bg-amber-400"
                }`}
                title={s.is_resolved ? "Resolved" : "Active"}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium text-sm ${heading}`}>{s.symptom}</span>
                  <SeverityBadge level={s.severity} dark={dark} />
                  {s.is_resolved && (
                    <span className={`text-xs ${dark ? "text-emerald-400" : "text-emerald-600"}`}>
                      Resolved
                    </span>
                  )}
                </div>
                {s.notes && (
                  <p className={`text-xs mt-0.5 truncate ${muted}`}>{s.notes}</p>
                )}
                <p className={`text-xs mt-0.5 ${muted}`}>
                  {new Date(s.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <button
                onClick={() => handleDelete(s.symptom_id)}
                disabled={deletingId === s.symptom_id}
                title="Delete symptom"
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
      )}
    </div>
  );
}
