"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import { Exercise, EnrichedWorkout, EnrichedRoutineExercise, PersonalRecord } from "../../src/types/workouts";
import {
  createWorkout,
  addExerciseToWorkout,
  addSet,
} from "../../src/api/workouts.api";
import ExercisePicker from "./exercise-picker";

interface LoggedSet {
  tempId: string;
  reps: string;
  weight_kg: string;
  rpe: string;
  rest_seconds: string;
}

interface LoggedExercise {
  tempId: string;
  exercise: Exercise;
  sets: LoggedSet[];
}

interface Props {
  exercises: Exercise[];
  previousWorkouts: EnrichedWorkout[];
  initialPreset: { name: string; exercises: EnrichedRoutineExercise[] } | null;
  onSaved: (newPRs: PersonalRecord[]) => void;
  onExerciseCreated: (exercise: Exercise) => void;
}

function newSet(): LoggedSet {
  return { tempId: crypto.randomUUID(), reps: "", weight_kg: "", rpe: "", rest_seconds: "" };
}

// ── Input cell used in set rows ────────────────────────────────────────────────

function SetInput({
  value,
  onChange,
  placeholder,
  dark,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  dark: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      step="any"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-2 py-1 rounded-lg border text-sm text-center transition-colors ${
        dark
          ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500"
          : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
      }`}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function WorkoutLogger({ exercises, previousWorkouts, onSaved, onExerciseCreated }: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const divider = dark ? "border-slate-700" : "border-slate-200";

  const today = new Date().toISOString().slice(0, 10);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(today);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newPRs, setNewPRs] = useState<PersonalRecord[]>([]);

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
  }`;

  // ── Set mutations ─────────────────────────────────────────────────────────────

  function addSetToExercise(exTempId: string) {
    setLoggedExercises((prev) =>
      prev.map((e) =>
        e.tempId === exTempId ? { ...e, sets: [...e.sets, newSet()] } : e,
      ),
    );
  }

  function removeSet(exTempId: string, setTempId: string) {
    setLoggedExercises((prev) =>
      prev.map((e) =>
        e.tempId === exTempId
          ? { ...e, sets: e.sets.filter((s) => s.tempId !== setTempId) }
          : e,
      ),
    );
  }

  function updateSet(exTempId: string, setTempId: string, field: keyof LoggedSet, value: string) {
    setLoggedExercises((prev) =>
      prev.map((e) =>
        e.tempId === exTempId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.tempId === setTempId ? { ...s, [field]: value } : s,
              ),
            }
          : e,
      ),
    );
  }

  function removeExercise(exTempId: string) {
    setLoggedExercises((prev) => prev.filter((e) => e.tempId !== exTempId));
  }

  function handlePickExercise(exercise: Exercise) {
    setLoggedExercises((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), exercise, sets: [newSet()] },
    ]);
    setShowPicker(false);
  }

  // ── PR detection ──────────────────────────────────────────────────────────────

  function detectPRs(savedSets: { exercise: Exercise; sets: LoggedSet[] }[]): PersonalRecord[] {
    const prs: PersonalRecord[] = [];

    for (const { exercise, sets } of savedSets) {
      const maxNewWeight = Math.max(
        ...sets
          .filter((s) => s.weight_kg)
          .map((s) => parseFloat(s.weight_kg)),
        0,
      );
      if (maxNewWeight === 0) continue;

      // Find previous best for this exercise across all previous workouts
      let prevBest = 0;
      for (const ew of previousWorkouts) {
        for (const ee of ew.exercises) {
          if (ee.exercise.id !== exercise.id) continue;
          for (const s of ee.sets) {
            if (s.weight_kg && s.weight_kg > prevBest) prevBest = s.weight_kg;
          }
        }
      }

      if (maxNewWeight > prevBest) {
        const bestSet = sets
          .filter((s) => s.weight_kg && parseFloat(s.weight_kg) === maxNewWeight)
          .sort((a, b) => parseFloat(b.reps || "0") - parseFloat(a.reps || "0"))[0];
        prs.push({
          exercise,
          maxWeightKg: maxNewWeight,
          repsAtMax: bestSet?.reps ? parseInt(bestSet.reps) : 0,
          achievedAt: workoutDate,
        });
      }
    }
    return prs;
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!workoutName.trim()) return;

    setSaving(true);
    setError("");
    setNewPRs([]);

    try {
      const workout = await createWorkout({
        workout_name: workoutName.trim(),
        workout_date: workoutDate,
        duration_minutes: duration ? parseInt(duration) : undefined,
        notes: notes.trim() || undefined,
      });

      for (let i = 0; i < loggedExercises.length; i++) {
        const le = loggedExercises[i];
        const we = await addExerciseToWorkout(workout.id, le.exercise.id, i);

        for (const s of le.sets) {
          if (!s.reps && !s.weight_kg) continue; // skip empty rows
          await addSet(we.id, {
            reps: s.reps ? parseInt(s.reps) : undefined,
            weight_kg: s.weight_kg ? parseFloat(s.weight_kg) : undefined,
            rpe: s.rpe ? parseFloat(s.rpe) : undefined,
            rest_seconds: s.rest_seconds ? parseInt(s.rest_seconds) : undefined,
          });
        }
      }

      const detectedPRs = detectPRs(loggedExercises);
      setNewPRs(detectedPRs);

      // Reset form
      setWorkoutName("");
      setWorkoutDate(today);
      setDuration("");
      setNotes("");
      setLoggedExercises([]);

      onSaved(detectedPRs);
    } catch {
      setError("Failed to save workout. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const alreadyAdded = new Set(loggedExercises.map((e) => e.exercise.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Workout details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className={`text-xs font-medium ${muted}`}>Workout Name *</label>
          <input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g. Push Day A"
            required
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${muted}`}>Date</label>
          <input
            type="date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${muted}`}>Duration (min)</label>
          <input
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="60"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={`text-xs font-medium ${muted}`}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes…"
          rows={2}
          className={inputCls}
        />
      </div>

      {/* Exercise list */}
      {loggedExercises.length > 0 && (
        <div className="space-y-4">
          {loggedExercises.map((le) => (
            <div
              key={le.tempId}
              className={`rounded-xl border p-4 space-y-3 ${
                dark ? "bg-slate-700/30 border-slate-700" : "bg-slate-50 border-slate-200"
              }`}
            >
              {/* Exercise header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className={`font-semibold text-sm ${heading}`}>
                    {le.exercise.exercise_name}
                  </span>
                  <span className={`ml-2 text-xs ${muted}`}>
                    {le.exercise.muscle_group}
                    {le.exercise.equipment ? ` · ${le.exercise.equipment}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeExercise(le.tempId)}
                  className={`p-1 rounded-lg transition-colors ${
                    dark ? "hover:bg-red-500/15 text-slate-500 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"
                  }`}
                >
                  <Icon name="delete" className="text-base" />
                </button>
              </div>

              {/* Set rows */}
              <div className="space-y-2">
                <div className={`grid grid-cols-5 gap-2 text-xs font-medium text-center ${muted}`}>
                  <span>Reps</span>
                  <span>Weight (kg)</span>
                  <span>RPE</span>
                  <span>Rest (s)</span>
                  <span />
                </div>

                {le.sets.map((s, si) => (
                  <div key={s.tempId} className="grid grid-cols-5 gap-2 items-center">
                    <SetInput value={s.reps} onChange={(v) => updateSet(le.tempId, s.tempId, "reps", v)} placeholder={String(si + 1)} dark={dark} />
                    <SetInput value={s.weight_kg} onChange={(v) => updateSet(le.tempId, s.tempId, "weight_kg", v)} placeholder="0" dark={dark} />
                    <SetInput value={s.rpe} onChange={(v) => updateSet(le.tempId, s.tempId, "rpe", v)} placeholder="—" dark={dark} />
                    <SetInput value={s.rest_seconds} onChange={(v) => updateSet(le.tempId, s.tempId, "rest_seconds", v)} placeholder="60" dark={dark} />
                    <button
                      type="button"
                      onClick={() => removeSet(le.tempId, s.tempId)}
                      className={`flex justify-center p-1 rounded transition-colors ${
                        dark ? "text-slate-500 hover:text-red-400" : "text-slate-300 hover:text-red-500"
                      }`}
                    >
                      <Icon name="remove" className="text-base" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addSetToExercise(le.tempId)}
                className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                  dark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"
                }`}
              >
                <Icon name="add" className="text-sm" />
                Add Set
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Exercise picker */}
      {showPicker ? (
        <ExercisePicker
          exercises={exercises}
          exclude={alreadyAdded}
          onSelect={handlePickExercise}
          onClose={() => setShowPicker(false)}
          onCreated={onExerciseCreated}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            dark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"
          }`}
        >
          <Icon name="add_circle" className="text-base" />
          Add Exercise
        </button>
      )}

      <div className={`border-t pt-4 ${divider} flex items-center gap-3 flex-wrap`}>
        <button
          type="submit"
          disabled={saving || !workoutName.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Icon name="save" className="text-base" />
          {saving ? "Saving…" : "Save Workout"}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* New PR celebration */}
      {newPRs.length > 0 && (
        <div className={`rounded-xl border p-4 ${dark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="emoji_events" className={`text-base ${dark ? "text-emerald-400" : "text-emerald-600"}`} />
            <span className={`text-sm font-semibold ${dark ? "text-emerald-300" : "text-emerald-800"}`}>
              New Personal Record{newPRs.length > 1 ? "s" : ""}!
            </span>
          </div>
          {newPRs.map((pr) => (
            <p key={pr.exercise.id} className={`text-sm ${dark ? "text-emerald-200" : "text-emerald-900"}`}>
              {pr.exercise.exercise_name} — {pr.maxWeightKg} kg
              {pr.repsAtMax > 0 ? ` × ${pr.repsAtMax} reps` : ""}
            </p>
          ))}
        </div>
      )}
    </form>
  );
}
