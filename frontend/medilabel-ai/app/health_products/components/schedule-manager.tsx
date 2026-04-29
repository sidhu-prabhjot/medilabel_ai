"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import { Schedule, ScheduleCreate } from "../../src/types/tracking";
import { Medication } from "../../src/types/health_products";
import { createSchedule, deleteSchedule } from "../../src/api/tracking.api";
import Icon from "../../src/components/icon";

interface Props {
  schedules: Schedule[];
  medications: Medication[];
  onRefresh: () => void;
}

export default function ScheduleManager({ schedules, medications, onRefresh }: Props) {
  const { dark } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ScheduleCreate>>({
    start_date: new Date().toISOString().slice(0, 10),
    frequency: "daily",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.medication_id || !form.frequency || !form.start_date) return;

    setSaving(true);
    try {
      await createSchedule(form as ScheduleCreate);
      setForm({ start_date: new Date().toISOString().slice(0, 10), frequency: "daily" });
      setShowForm(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteSchedule(id);
    onRefresh();
  }

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
  }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
          Medication Schedules
        </h3>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            dark
              ? "bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25"
              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          }`}
        >
          <Icon name={showForm ? "close" : "add"} className="text-base" />
          {showForm ? "Cancel" : "Add schedule"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`rounded-xl border p-4 space-y-3 ${dark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
          {medications.length === 0 ? (
            <p className={`text-sm ${dark ? "text-amber-400" : "text-amber-600"}`}>
              Add a medication in Health Products first before scheduling it.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>Medication *</label>
                  <select
                    required
                    className={inputClass}
                    value={form.medication_id ?? ""}
                    onChange={(e) => setForm({ ...form, medication_id: Number(e.target.value) })}
                  >
                    <option value="">Select medication</option>
                    {medications.map((m) => (
                      <option key={m.medication_id} value={m.medication_id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>Frequency *</label>
                  <select
                    required
                    className={inputClass}
                    value={form.frequency ?? "daily"}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="twice_daily">Twice daily</option>
                    <option value="three_times_daily">Three times daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="as_needed">As needed</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>Start date *</label>
                  <input
                    type="date"
                    required
                    className={inputClass}
                    value={form.start_date ?? ""}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>End date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.end_date ?? ""}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>Doses remaining</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    placeholder="e.g. 30"
                    value={form.doses_remaining ?? ""}
                    onChange={(e) => setForm({ ...form, doses_remaining: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dark
                    ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                }`}
              >
                {saving ? "Saving..." : "Save schedule"}
              </button>
            </>
          )}
        </form>
      )}

      {schedules.length === 0 && !showForm && (
        <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
          No schedules set up yet.
        </p>
      )}

      <ul className="space-y-2">
        {schedules.map((s) => (
          <li
            key={s.schedule_id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                {s.medication_name ?? `Medication #${s.medication_id}`}
              </p>
              <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {s.frequency}
                {s.doses_remaining != null && ` · ${s.doses_remaining} ${s.stock_unit ?? "doses"} left`}
                {s.end_date && ` · Until ${s.end_date}`}
              </p>
            </div>
            <button
              onClick={() => handleDelete(s.schedule_id)}
              className={`p-1.5 rounded-lg transition-colors ${
                dark ? "text-slate-500 hover:text-red-400" : "text-slate-400 hover:text-red-500"
              }`}
            >
              <Icon name="delete" className="text-base" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
