"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import { Exercise } from "../../src/types/workouts";
import { createExercise } from "../../src/api/workouts.api";

interface Props {
  exercises: Exercise[];
  exclude?: Set<number>;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  onCreated?: (exercise: Exercise) => void; // notify parent to refresh library
}

const MUSCLE_GROUPS = [
  "Chest", "Back", "Shoulders", "Biceps", "Triceps",
  "Legs", "Glutes", "Core", "Cardio", "Full Body", "Other",
];

export default function ExercisePicker({
  exercises,
  exclude = new Set(),
  onSelect,
  onClose,
  onCreated,
}: Props) {
  const { dark } = useTheme();
  const muted = dark ? "text-slate-400" : "text-slate-500";

  const [filter, setFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("");
  const [newEquipment, setNewEquipment] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const filtered = exercises.filter(
    (e) =>
      !exclude.has(e.id) &&
      (e.exercise_name.toLowerCase().includes(filter.toLowerCase()) ||
        e.muscle_group.toLowerCase().includes(filter.toLowerCase())),
  );

  const inputCls = `w-full px-3 py-1.5 rounded-lg border text-sm transition-colors ${
    dark
      ? "bg-slate-600 border-slate-500 text-white placeholder-slate-400"
      : "bg-white border-slate-300 text-[#1a1c1a] placeholder-slate-400"
  }`;

  async function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!newName.trim() || !newMuscle) return;
    setCreating(true);
    setCreateError("");
    try {
      const created = await createExercise({
        exercise_name: newName.trim(),
        muscle_group: newMuscle,
        equipment: newEquipment.trim() || undefined,
      });
      onCreated?.(created);
      onSelect(created);
    } catch {
      setCreateError("Failed to create exercise. Try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className={`rounded-xl border p-3 space-y-2 ${
        dark ? "bg-slate-700 border-slate-600" : "bg-white border-[#c2c8bf]"
      }`}
    >
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setNewName(e.target.value); // pre-fill create form with typed name
          }}
          placeholder="Search exercises…"
          className={inputCls}
        />
        <button onClick={onClose} className={`flex-shrink-0 ${muted}`}>
          <Icon name="close" className="text-base" />
        </button>
      </div>

      {/* Results */}
      {!showCreate && (
        <div className="max-h-52 overflow-y-auto space-y-0.5">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelect(e)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                dark
                  ? "hover:bg-slate-600 text-slate-200"
                  : "hover:bg-[#f4f4ef] text-slate-800"
              }`}
            >
              <span className="font-medium">{e.exercise_name}</span>
              <span className={`text-xs ${muted}`}>
                {e.muscle_group}
                {e.equipment ? ` · ${e.equipment}` : ""}
              </span>
            </button>
          ))}

          {/* Empty state with create prompt */}
          {filtered.length === 0 && (
            <p className={`text-xs text-center py-2 ${muted}`}>
              No exercises found
              {filter && ` for "${filter}"`}.
            </p>
          )}
        </div>
      )}

      {/* Toggle create form */}
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className={`flex items-center gap-1.5 w-full px-3 py-2 rounded-lg text-sm font-medium border-t transition-colors ${
            dark
              ? "border-slate-600 text-[#acd0ad] hover:text-[#acd0ad]"
              : "border-slate-100 text-[#37563b] hover:text-[#2f4e33]"
          }`}
        >
          <Icon name="add_circle" className="text-base" />
          Create new exercise{filter ? ` "${filter}"` : ""}
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className={`border-t pt-3 space-y-2 ${dark ? "border-slate-600" : "border-[#c2c8bf]"}`}
        >
          <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>
            New Exercise
          </p>

          <div className="flex flex-col gap-1">
            <label className={`text-xs ${muted}`}>Name *</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Bench Press"
              required
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={`text-xs ${muted}`}>Muscle Group *</label>
            <select
              value={newMuscle}
              onChange={(e) => setNewMuscle(e.target.value)}
              required
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">Select…</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={`text-xs ${muted}`}>Equipment</label>
            <input
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              placeholder="e.g. Barbell, Dumbbell, Cable…"
              className={inputCls}
            />
          </div>

          {createError && <p className="text-xs text-red-500">{createError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating || !newName.trim() || !newMuscle}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#37563b] hover:bg-[#2f4e33] text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <Icon name="add" className="text-base" />
              {creating ? "Creating…" : "Create & Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                dark
                  ? "bg-slate-600 hover:bg-[#f4f4ef]0 text-slate-300"
                  : "bg-[#eeeeea] hover:bg-[#e8e8e4] text-[#1a1c1a]"
              }`}
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
