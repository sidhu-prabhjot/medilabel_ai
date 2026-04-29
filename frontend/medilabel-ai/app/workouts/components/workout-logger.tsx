"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import {
  Exercise,
  EnrichedWorkout,
  EnrichedRoutineExercise,
  PersonalRecord,
} from "../../src/types/workouts";
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
  // Date string of the session whose values were pre-filled, if any
  prefilledFrom: string | null;
}

interface Props {
  exercises: Exercise[];
  previousWorkouts: EnrichedWorkout[];
  initialPreset: { routineId: number; name: string; exercises: EnrichedRoutineExercise[] } | null;
  onSaved: (newPRs: PersonalRecord[]) => void;
  onCancel: () => void;
  onExerciseCreated: (exercise: Exercise) => void;
}

function newSet(): LoggedSet {
  return {
    tempId: crypto.randomUUID(),
    reps: "",
    weight_kg: "",
    rpe: "",
    rest_seconds: "",
  };
}


function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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
      className={`w-full px-2 py-1.5 rounded-lg text-sm text-center transition-colors border-none outline-none focus:ring-2 ${
        dark
          ? "bg-neutral-800 text-white placeholder-neutral-600 focus:ring-green-600"
          : "bg-[#F5F3EE] text-[#4F6F52] placeholder-[#A3B18A]/60 focus:ring-[#4F6F52]"
      }`}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function WorkoutLogger({
  exercises,
  previousWorkouts,
  initialPreset,
  onSaved,
  onCancel,
  onExerciseCreated,
}: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-[#4F6F52]";
  const muted = dark ? "text-neutral-400" : "text-[#A3B18A]";
  const divider = dark ? "border-neutral-800" : "border-[#DAD7CD]/40";

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

  function resetForm() {
    setWorkoutName("");
    setWorkoutDate(today);
    setDuration("");
    setNotes("");
    setLoggedExercises([]);
    setShowPicker(false);
    setError("");
    setNewPRs([]);
  }

  // When a routine preset arrives, pre-fill the form with its name and exercises.
  // Each routine set's targets become editable starting values so the user only
  // needs to adjust actuals rather than type everything from scratch.
  useEffect(() => {
    if (!initialPreset) return;

    setWorkoutName(initialPreset.name);
    setWorkoutDate(today);
    setDuration("");
    setNotes("");
    setShowPicker(false);
    setError("");
    setNewPRs([]);

    setLoggedExercises(
      initialPreset.exercises.map((re) => ({
        tempId: crypto.randomUUID(),
        exercise: re.exercise,
        prefilledFrom: null, // routine targets take priority over last-session prefill
        sets: re.sets.length > 0
          ? re.sets.map((s) => ({
              tempId: crypto.randomUUID(),
              reps: s.target_reps?.toString() ?? "",
              weight_kg: s.target_weight?.toString() ?? "",
              rpe: s.target_rpe?.toString() ?? "",
              rest_seconds: s.rest_seconds?.toString() ?? "",
            }))
          : [newSet()],
      })),
    );
  }, [initialPreset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build a map of exerciseId → last session once per change to previousWorkouts,
  // instead of scanning the full array inside the render loop for each exercise.
  const lastSessionMap = useMemo(() => {
    const map = new Map<number, { date: string; sets: { reps: number | null; weight_kg: number | null }[] }>();
    for (const ew of previousWorkouts) {
      for (const ee of ew.exercises) {
        const existing = map.get(ee.exercise.id);
        if (!existing || ew.workout.workout_date > existing.date) {
          map.set(ee.exercise.id, {
            date: ew.workout.workout_date,
            sets: ee.sets.map((s) => ({ reps: s.reps, weight_kg: s.weight_kg })),
          });
        }
      }
    }
    return map;
  }, [previousWorkouts]);

  const inputCls = `w-full px-4 py-3.5 rounded-lg text-sm transition-colors border-none outline-none focus:ring-2 ${
    dark
      ? "bg-neutral-800 text-white placeholder-neutral-500 focus:ring-green-600"
      : "bg-[#F5F3EE] text-[#4F6F52] placeholder-[#A3B18A]/60 focus:ring-[#4F6F52]"
  }`;
  const labelCls = `text-[11px] font-bold tracking-widest uppercase px-1 ${
    dark ? "text-neutral-500" : "text-[#A3B18A]"
  }`;

  // ── Set mutations ─────────────────────────────────────────────────────────────

  function addSetToExercise(exTempId: string) {
    setLoggedExercises((prev) =>
      prev.map((e) =>
        e.tempId === exTempId ? { ...e, sets: [...e.sets, newSet()] } : e,
      ),
    );
  }

  function duplicateSet(exTempId: string, setTempId: string) {
    setLoggedExercises((prev) =>
      prev.map((e) => {
        if (e.tempId !== exTempId) return e;
        const source = e.sets.find((s) => s.tempId === setTempId);
        if (!source) return e;
        const copy: LoggedSet = { ...source, tempId: crypto.randomUUID() };
        const idx = e.sets.findIndex((s) => s.tempId === setTempId);
        const next = [...e.sets];
        next.splice(idx + 1, 0, copy);
        return { ...e, sets: next };
      }),
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

  function updateSet(
    exTempId: string,
    setTempId: string,
    field: keyof LoggedSet,
    value: string,
  ) {
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

  function moveExercise(exTempId: string, direction: "up" | "down") {
    setLoggedExercises((prev) => {
      const idx = prev.findIndex((e) => e.tempId === exTempId);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  // When adding an exercise manually, pre-fill sets with the most recent session
  // values so the user can adjust rather than start from scratch.
  function handlePickExercise(exercise: Exercise) {
    const last = lastSessionMap.get(exercise.id) ?? null;
    const sets: LoggedSet[] =
      last && last.sets.length > 0
        ? last.sets.map((s) => ({
            tempId: crypto.randomUUID(),
            reps: s.reps?.toString() ?? "",
            weight_kg: s.weight_kg?.toString() ?? "",
            rpe: "",
            rest_seconds: "",
          }))
        : [newSet()];

    setLoggedExercises((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        exercise,
        sets,
        prefilledFrom: last?.date ?? null,
      },
    ]);
    setShowPicker(false);
  }

  // ── PR detection ──────────────────────────────────────────────────────────────

  function detectPRs(
    savedSets: { exercise: Exercise; sets: LoggedSet[] }[],
  ): PersonalRecord[] {
    const prs: PersonalRecord[] = [];

    for (const { exercise, sets } of savedSets) {
      const maxNewWeight = Math.max(
        ...sets.filter((s) => s.weight_kg).map((s) => parseFloat(s.weight_kg)),
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
          .filter(
            (s) => s.weight_kg && parseFloat(s.weight_kg) === maxNewWeight,
          )
          .sort(
            (a, b) => parseFloat(b.reps || "0") - parseFloat(a.reps || "0"),
          )[0];
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
        routine_id: initialPreset?.routineId,
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
      resetForm();
      setNewPRs(detectedPRs);
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
      {/* Active routine banner */}
      {initialPreset && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm ${
          dark ? "bg-green-900/20 text-green-400" : "bg-[#4F6F52]/8 text-[#4F6F52]"
        }`}>
          <span>Routine: <span className="font-bold">{initialPreset.name}</span></span>
          <button
            type="button"
            onClick={() => { resetForm(); onCancel(); }}
            className={`text-xs font-semibold underline ${dark ? "text-neutral-400 hover:text-white" : "text-[#A3B18A] hover:text-[#4F6F52]"}`}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Workout details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 flex flex-col gap-2">
          <label className={labelCls}>Workout Name *</label>
          <input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g. Upper Body Power"
            required
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelCls}>Date</label>
          <input
            type="date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelCls}>Duration (min)</label>
          <input
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="45"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelCls}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Any specific wins today?"
          rows={3}
          className={inputCls}
        />
      </div>

      {/* Exercise list */}
      {loggedExercises.length > 0 && (
        <div className="space-y-4">
          {loggedExercises.map((le, exIdx) => {
            const lastSession = lastSessionMap.get(le.exercise.id) ?? null;
            return (
              <div
                key={le.tempId}
                className={`rounded-xl border p-4 space-y-3 ${
                  dark
                    ? "bg-neutral-800/40 border-neutral-700"
                    : "bg-[#F5F3EE]/50 border-[#DAD7CD]"
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
                  <div className="flex items-center gap-1">
                    {/* Reorder buttons */}
                    <button
                      type="button"
                      onClick={() => moveExercise(le.tempId, "up")}
                      disabled={exIdx === 0}
                      className={`p-1 rounded transition-colors disabled:opacity-20 ${
                        dark ? "text-neutral-500 hover:text-neutral-300" : "text-[#A3B18A] hover:text-[#4F6F52]"
                      }`}
                    >
                      <Icon name="keyboard_arrow_up" className="text-base" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveExercise(le.tempId, "down")}
                      disabled={exIdx === loggedExercises.length - 1}
                      className={`p-1 rounded transition-colors disabled:opacity-20 ${
                        dark ? "text-neutral-500 hover:text-neutral-300" : "text-[#A3B18A] hover:text-[#4F6F52]"
                      }`}
                    >
                      <Icon name="keyboard_arrow_down" className="text-base" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExercise(le.tempId)}
                      className={`p-1 rounded-lg transition-colors ${
                        dark
                          ? "hover:bg-red-500/15 text-neutral-500 hover:text-red-400"
                          : "hover:bg-red-50 text-[#A3B18A] hover:text-red-500"
                      }`}
                    >
                      <Icon name="delete" className="text-base" />
                    </button>
                  </div>
                </div>

                {/* Pre-filled notice */}
                {le.prefilledFrom && (
                  <p className={`text-xs ${muted}`}>
                    Pre-filled from {formatShortDate(le.prefilledFrom)} — adjust as needed.
                  </p>
                )}

                {/* Last session hint (always shown when history exists) */}
                {lastSession && (
                  <div className={`flex items-center gap-1.5 flex-wrap text-xs ${muted}`}>
                    <Icon name="history" className="text-xs opacity-60 flex-shrink-0" />
                    <span className="opacity-70">{formatShortDate(lastSession.date)}:</span>
                    {lastSession.sets.slice(0, 3).map((s, i) => (
                      <span key={i} className="tabular-nums">
                        {s.weight_kg ?? "—"} kg × {s.reps ?? "—"}
                        {i < Math.min(lastSession.sets.length, 3) - 1 ? " ·" : ""}
                      </span>
                    ))}
                    {lastSession.sets.length > 3 && (
                      <span className="opacity-50">+{lastSession.sets.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Set rows */}
                <div className="space-y-2">
                  <div
                    className={`grid grid-cols-6 gap-2 text-xs font-medium text-center ${muted}`}
                  >
                    <span>Reps</span>
                    <span>Weight (kg)</span>
                    <span>RPE</span>
                    <span>Rest (s)</span>
                    <span />
                    <span />
                  </div>

                  {le.sets.map((s, si) => (
                    <div
                      key={s.tempId}
                      className="grid grid-cols-6 gap-2 items-center"
                    >
                      <SetInput
                        value={s.reps}
                        onChange={(v) => updateSet(le.tempId, s.tempId, "reps", v)}
                        placeholder={String(si + 1)}
                        dark={dark}
                      />
                      <SetInput
                        value={s.weight_kg}
                        onChange={(v) => updateSet(le.tempId, s.tempId, "weight_kg", v)}
                        placeholder="0"
                        dark={dark}
                      />
                      <SetInput
                        value={s.rpe}
                        onChange={(v) => updateSet(le.tempId, s.tempId, "rpe", v)}
                        placeholder="—"
                        dark={dark}
                      />
                      <SetInput
                        value={s.rest_seconds}
                        onChange={(v) => updateSet(le.tempId, s.tempId, "rest_seconds", v)}
                        placeholder="60"
                        dark={dark}
                      />
                      <button
                        type="button"
                        onClick={() => duplicateSet(le.tempId, s.tempId)}
                        title="Duplicate set"
                        className={`flex justify-center p-1 rounded transition-colors ${
                          dark
                            ? "text-neutral-500 hover:text-green-400"
                            : "text-[#A3B18A] hover:text-[#4F6F52]"
                        }`}
                      >
                        <Icon name="content_copy" className="text-base" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSet(le.tempId, s.tempId)}
                        className={`flex justify-center p-1 rounded transition-colors ${
                          dark
                            ? "text-neutral-500 hover:text-red-400"
                            : "text-[#A3B18A] hover:text-red-500"
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
                  className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                    dark
                      ? "text-green-400 hover:text-green-300"
                      : "text-[#4F6F52] hover:text-[#4F6F52]/70"
                  }`}
                >
                  <Icon name="add" className="text-sm" />
                  Add Set
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Exercises section header + picker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold uppercase tracking-widest ${dark ? "text-neutral-500" : "text-[#4F6F52]/50"}`}>
            Exercises
          </h4>
          {!showPicker && (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-colors ${
                dark
                  ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                  : "bg-[#A3B18A]/20 text-[#4F6F52] hover:bg-[#A3B18A]/30"
              }`}
            >
              <Icon name="add" className="text-sm" />
              Add Exercise
            </button>
          )}
        </div>

        {showPicker ? (
          <ExercisePicker
            exercises={exercises}
            exclude={alreadyAdded}
            onSelect={handlePickExercise}
            onClose={() => setShowPicker(false)}
            onCreated={onExerciseCreated}
          />
        ) : loggedExercises.length === 0 ? (
          <div
            className={`p-14 border-2 border-dashed rounded-xl flex flex-col items-center text-center ${
              dark ? "border-neutral-700" : "border-[#DAD7CD]"
            }`}
          >
            <Icon
              name="fitness_center"
              className={`text-5xl mb-3 ${dark ? "text-neutral-600" : "text-[#A3B18A]"}`}
            />
            <p className={`text-sm font-medium ${dark ? "text-neutral-500" : "text-[#A3B18A]"}`}>
              No exercises added yet.<br />
              Start by clicking the &ldquo;Add Exercise&rdquo; button to begin building your session.
            </p>
          </div>
        ) : null}
      </div>

      <div className={`border-t pt-6 ${divider} flex flex-col sm:flex-row gap-3`}>
        <button
          type="submit"
          disabled={saving || !workoutName.trim()}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#4F6F52]/20 hover:scale-[1.01] ${
            dark
              ? "bg-green-700 hover:bg-green-600 text-white"
              : "bg-[#4F6F52] hover:bg-[#4F6F52]/90 text-white"
          }`}
        >
          {saving ? "Saving…" : "Save Workout"}
        </button>
        <button
          type="button"
          onClick={() => { resetForm(); onCancel(); }}
          className={`px-10 py-4 rounded-full text-sm font-bold transition-colors border ${
            dark
              ? "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
              : "border-[#DAD7CD] text-[#A3B18A] hover:bg-[#F5F3EE]"
          }`}
        >
          Discard
        </button>
        {error && <p className="text-sm text-red-500 self-center">{error}</p>}
      </div>

      {/* New PR celebration */}
      {newPRs.length > 0 && (
        <div
          className={`rounded-xl border p-4 ${dark ? "bg-green-900/20 border-green-800/40" : "bg-[#4F6F52]/5 border-[#DAD7CD]"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon
              name="emoji_events"
              className={`text-base ${dark ? "text-green-400" : "text-[#4F6F52]"}`}
            />
            <span
              className={`text-sm font-bold ${dark ? "text-green-300" : "text-[#4F6F52]"}`}
            >
              New Personal Record{newPRs.length > 1 ? "s" : ""}!
            </span>
          </div>
          {newPRs.map((pr) => (
            <p
              key={pr.exercise.id}
              className={`text-sm ${dark ? "text-green-200" : "text-[#4F6F52]"}`}
            >
              {pr.exercise.exercise_name} — {pr.maxWeightKg} kg
              {pr.repsAtMax > 0 ? ` × ${pr.repsAtMax} reps` : ""}
            </p>
          ))}
        </div>
      )}
    </form>
  );
}
