"use client";

import { useState } from "react";
import Icon from "../../src/components/icon";

interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

interface Props {
  medication?: Medication;
  onSuccess?: () => void;
}

export default function MedicationForm({ medication, onSuccess }: Props) {
  const [name, setName] = useState(medication?.name ?? "");
  const [dosage, setDosage] = useState(medication?.dosage ?? "");
  const [frequency, setFrequency] = useState(medication?.frequency ?? "");
  const [notes, setNotes] = useState(medication?.notes ?? "");
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(medication?.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const payload = {
      name,
      dosage,
      frequency,
      notes,
    };

    try {
      if (isEdit) {
        await fetch(`/api/medications/${medication!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/medications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
    >
      <h3 className="text-sm font-semibold">
        {isEdit ? "Update Medication" : "Add Medication"}
      </h3>

      {/* Medication Name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        />
      </div>

      {/* Dosage */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Dosage</label>
        <input
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="e.g. 200mg"
          className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        />
      </div>

      {/* Frequency */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Frequency</label>
        <input
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          placeholder="e.g. Twice daily"
          className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          rows={3}
        />
      </div>

      {/* Submit */}
      <button
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
      >
        <Icon name={isEdit ? "edit" : "add"} />
        {loading
          ? "Saving..."
          : isEdit
            ? "Update Medication"
            : "Add Medication"}
      </button>
    </form>
  );
}
