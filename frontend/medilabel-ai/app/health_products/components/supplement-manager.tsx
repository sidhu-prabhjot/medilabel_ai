"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import { Supplement, SupplementCreate } from "../../src/types/tracking";
import { createSupplement, deleteSupplement } from "../../src/api/tracking.api";
import Icon from "../../src/components/icon";

interface Props {
  supplements: Supplement[];
  onRefresh: () => void;
}

const EMPTY_FORM: SupplementCreate = {
  name: "",
  brand: "",
  form: "",
  dosage_amount: undefined,
  dosage_unit: "",
  notes: "",
};

export default function SupplementManager({ supplements, onRefresh }: Props) {
  const { dark } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SupplementCreate>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createSupplement(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteSupplement(id);
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
          My Supplements
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
          {showForm ? "Cancel" : "Add supplement"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`rounded-xl border p-4 space-y-3 ${dark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>Name *</label>
              <input
                required
                className={inputClass}
                placeholder="e.g. Vitamin D"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>Brand</label>
              <input
                className={inputClass}
                placeholder="e.g. NOW Foods"
                value={form.brand ?? ""}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>Amount</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                placeholder="e.g. 1000"
                value={form.dosage_amount ?? ""}
                onChange={(e) => setForm({ ...form, dosage_amount: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>Unit</label>
              <input
                className={inputClass}
                placeholder="e.g. mg"
                value={form.dosage_unit ?? ""}
                onChange={(e) => setForm({ ...form, dosage_unit: e.target.value })}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>Form</label>
              <input
                className={inputClass}
                placeholder="e.g. capsule, powder"
                value={form.form ?? ""}
                onChange={(e) => setForm({ ...form, form: e.target.value })}
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
            {saving ? "Saving..." : "Save supplement"}
          </button>
        </form>
      )}

      {supplements.length === 0 && !showForm && (
        <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
          No supplements added yet.
        </p>
      )}

      <ul className="space-y-2">
        {supplements.map((s) => (
          <li
            key={s.supplement_id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                {s.name}
              </p>
              <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {[s.brand, s.dosage_amount ? `${s.dosage_amount}${s.dosage_unit ?? ""}` : null, s.form]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <button
              onClick={() => handleDelete(s.supplement_id)}
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
