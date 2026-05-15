"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import { Schedule, ScheduleCreate } from "../../src/types/tracking";
import { UserMedication } from "../../src/types/health_products";
import { createSchedule, deleteSchedule } from "../../src/api/tracking.api";
import Icon from "../../src/components/icon";

interface Props {
  schedules: Schedule[];
  userMedications: UserMedication[];
  onRefresh: () => void;
}

export default function ScheduleManager({ schedules, userMedications, onRefresh }: Props) {
  const { dark } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stockId, setStockId] = useState<number | "">("");
  const [doseAmount, setDoseAmount] = useState("");
  const [doseUnit, setDoseUnit] = useState("tablet");
  const [frequencyPerDay, setFrequencyPerDay] = useState("1");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [firstDoseTime, setFirstDoseTime] = useState("08:00");

  function resetForm() {
    setStockId("");
    setDoseAmount("");
    setDoseUnit("tablet");
    setFrequencyPerDay("1");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setFirstDoseTime("08:00");
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!stockId || !doseAmount) return;

    const selected = userMedications.find((m) => m.stock.stock_id === Number(stockId));
    if (!selected) return;

    const payload: ScheduleCreate = {
      medication_id: selected.medication.medication_id,
      stock_id: Number(stockId),
      dose_amount: Number(doseAmount),
      dose_unit: doseUnit || "tablet",
      frequency_per_day: Number(frequencyPerDay),
      start_date: startDate,
      end_date: endDate || undefined,
      next_dose_at: `${startDate}T${firstDoseTime}:00`,
    };

    setSaving(true);
    try {
      await createSchedule(payload);
      resetForm();
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
      : "bg-white border-[#c2c8bf] text-[#1a1c1a] placeholder:text-slate-400"
  }`;

  function frequencyLabel(n: number) {
    if (n === 1) return "Once daily";
    if (n === 2) return "Twice daily";
    if (n === 3) return "Three times daily";
    return `${n}× daily`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${dark ? "text-white" : "text-[#1a1c1a]"}`}>
          Medication Schedules
        </h3>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            dark
              ? "bg-[#37563b]/15 text-[#acd0ad] hover:bg-[#37563b]/25"
              : "bg-[#c8ecc8] text-[#2f4e33] hover:bg-[#c8ecc8]"
          }`}
        >
          <Icon name={showForm ? "close" : "add"} className="text-base" />
          {showForm ? "Cancel" : "Add schedule"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className={`rounded-xl border p-4 space-y-3 ${dark ? "bg-slate-800 border-slate-700" : "bg-[#f4f4ef] border-[#c2c8bf]"}`}
        >
          {userMedications.length === 0 ? (
            <p className={`text-sm ${dark ? "text-amber-400" : "text-amber-600"}`}>
              Add a medication in My Stock first before scheduling it.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-[#424841]"}`}>
                    Medication *
                  </label>
                  <select
                    required
                    className={inputClass}
                    value={stockId}
                    onChange={(e) => setStockId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Select medication</option>
                    {userMedications.map((m) => (
                      <option key={m.stock.stock_id} value={m.stock.stock_id}>
                        {m.medication.name}
                        {m.stock.unit ? ` (${m.stock.unit})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-[#424841]"}`}>
                    Frequency *
                  </label>
                  <select
                    required
                    className={inputClass}
                    value={frequencyPerDay}
                    onChange={(e) => setFrequencyPerDay(e.target.value)}
                  >
                    <option value="1">Once daily</option>
                    <option value="2">Twice daily</option>
                    <option value="3">Three times daily</option>
                    <option value="4">Four times daily</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-[#424841]"}`}>
                    Dose amount *
                  </label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step={0.1}
                    className={inputClass}
                    placeholder="e.g. 1"
                    value={doseAmount}
                    onChange={(e) => setDoseAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-[#424841]"}`}>
                    Dose unit
                  </label>
                  <input
                    className={inputClass}
                    placeholder="tablet"
                    value={doseUnit}
                    onChange={(e) => setDoseUnit(e.target.value)}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-[#424841]"}`}>
                    Start date *
                  </label>
                  <input
                    type="date"
                    required
                    className={inputClass}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-[#424841]"}`}>
                    First dose time *
                  </label>
                  <input
                    type="time"
                    required
                    className={inputClass}
                    value={firstDoseTime}
                    onChange={(e) => setFirstDoseTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-[#424841]"}`}>
                    End date
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#37563b] text-white hover:bg-[#2f4e33] disabled:opacity-50 transition-colors"
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
              dark ? "bg-slate-800 border-slate-700" : "bg-white border-[#c2c8bf]"
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${dark ? "text-white" : "text-[#1a1c1a]"}`}>
                {s.medication_name ?? `Medication #${s.medication_id}`}
              </p>
              <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {frequencyLabel(s.frequency_per_day)}
                {` · ${s.dose_amount} ${s.dose_unit ?? "tablet"}`}
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
