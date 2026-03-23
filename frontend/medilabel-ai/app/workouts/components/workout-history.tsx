"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import {
  Workout,
  EnrichedWorkout,
  Exercise,
} from "../../src/types/workouts";
import {
  getWorkoutExercises,
  getSets,
  deleteWorkout,
} from "../../src/api/workouts.api";

interface Props {
  workouts: Workout[];
  exercises: Exercise[];
  onRefresh: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function volumeLabel(ew: EnrichedWorkout): string {
  let total = 0;
  for (const ee of ew.exercises) {
    for (const s of ee.sets) {
      if (s.reps && s.weight_kg) total += s.reps * s.weight_kg;
    }
  }
  return total > 0 ? `${total.toLocaleString()} kg` : "—";
}

export default function WorkoutHistory({ workouts, exercises, onRefresh }: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const divider = dark ? "border-slate-700" : "border-slate-100";

  // Map of workout id → enriched detail (loaded on expand)
  const [detailMap, setDetailMap] = useState<Map<number, EnrichedWorkout>>(new Map());
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  async function loadDetail(workout: Workout) {
    if (detailMap.has(workout.id)) {
      setExpandedId((prev) => (prev === workout.id ? null : workout.id));
      return;
    }

    setLoadingId(workout.id);
    try {
      const workoutExercises = await getWorkoutExercises(workout.id);

      const enrichedExercises = await Promise.all(
        workoutExercises.map(async (we) => {
          const sets = await getSets(we.id);
          const exercise = exerciseMap.get(we.exercise_id) ?? {
            id: we.exercise_id,
            exercise_name: `Exercise #${we.exercise_id}`,
            muscle_group: "Unknown",
            equipment: null,
          };
          return { workoutExercise: we, exercise, sets };
        }),
      );

      const enriched: EnrichedWorkout = {
        workout,
        exercises: enrichedExercises.sort(
          (a, b) => (a.workoutExercise.order_index ?? 0) - (b.workoutExercise.order_index ?? 0),
        ),
      };

      setDetailMap((prev) => new Map(prev).set(workout.id, enriched));
      setExpandedId(workout.id);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(workoutId: number) {
    setDeletingId(workoutId);
    try {
      await deleteWorkout(workoutId);
      setDetailMap((prev) => {
        const next = new Map(prev);
        next.delete(workoutId);
        return next;
      });
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (workouts.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
        <Icon name="fitness_center" className="text-4xl opacity-40" />
        <p className="text-sm">No workouts logged yet. Use the logger above to add your first one.</p>
      </div>
    );
  }

  const sorted = [...workouts].sort(
    (a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime(),
  );

  return (
    <div>
      {/* Table header */}
      <div className={`hidden md:grid grid-cols-12 gap-2 pb-2 border-b text-xs font-medium uppercase tracking-wide ${muted} ${divider}`}>
        <span className="col-span-4">Workout</span>
        <span className="col-span-3">Date</span>
        <span className="col-span-2 text-right">Duration</span>
        <span className="col-span-2 text-right">Volume</span>
        <span className="col-span-1" />
      </div>

      <div className="divide-y" style={{ borderColor: dark ? "#334155" : "#f1f5f9" }}>
        {sorted.map((w) => {
          const detail = detailMap.get(w.id);
          const isExpanded = expandedId === w.id;
          const isLoading = loadingId === w.id;

          return (
            <div key={w.id}>
              {/* Row */}
              <div className="grid grid-cols-12 gap-2 items-center py-3">
                {/* Name */}
                <div className="col-span-4 flex items-center gap-2">
                  <button
                    onClick={() => loadDetail(w)}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                      dark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"
                    }`}
                  >
                    <Icon
                      name={isLoading ? "progress_activity" : isExpanded ? "expand_less" : "chevron_right"}
                      className="text-base"
                    />
                    <span className={heading}>{w.workout_name}</span>
                  </button>
                </div>

                {/* Date */}
                <span className={`col-span-3 text-sm ${muted}`}>{formatDate(w.workout_date)}</span>

                {/* Duration */}
                <span className={`col-span-2 text-sm text-right tabular-nums ${muted}`}>
                  {w.duration_minutes ? `${w.duration_minutes} min` : "—"}
                </span>

                {/* Volume */}
                <span className={`col-span-2 text-sm text-right tabular-nums ${muted}`}>
                  {detail ? volumeLabel(detail) : "—"}
                </span>

                {/* Delete */}
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => handleDelete(w.id)}
                    disabled={deletingId === w.id}
                    title="Delete workout"
                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                      dark
                        ? "hover:bg-red-500/15 text-slate-500 hover:text-red-400"
                        : "hover:bg-red-50 text-slate-400 hover:text-red-500"
                    }`}
                  >
                    <Icon name="delete" className="text-base" />
                  </button>
                </div>
              </div>

              {/* Expanded exercise detail */}
              {isExpanded && detail && (
                <div
                  className={`mb-3 mx-0 rounded-xl p-4 space-y-4 ${
                    dark ? "bg-slate-700/30 border border-slate-700" : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  {w.notes && (
                    <p className={`text-xs italic ${muted}`}>{w.notes}</p>
                  )}

                  {detail.exercises.length === 0 ? (
                    <p className={`text-sm ${muted}`}>No exercises recorded.</p>
                  ) : (
                    detail.exercises.map((ee) => (
                      <div key={ee.workoutExercise.id}>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className={`text-sm font-semibold ${heading}`}>
                            {ee.exercise.exercise_name}
                          </span>
                          <span className={`text-xs ${muted}`}>
                            {ee.exercise.muscle_group}
                            {ee.exercise.equipment ? ` · ${ee.exercise.equipment}` : ""}
                          </span>
                        </div>

                        {ee.sets.length === 0 ? (
                          <p className={`text-xs ${muted}`}>No sets recorded.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className={`text-left border-b ${divider}`}>
                                <th className={`pb-1 font-medium ${muted}`}>Set</th>
                                <th className={`pb-1 font-medium ${muted}`}>Reps</th>
                                <th className={`pb-1 font-medium ${muted}`}>Weight</th>
                                <th className={`pb-1 font-medium ${muted}`}>RPE</th>
                                <th className={`pb-1 font-medium ${muted}`}>Rest</th>
                                <th className={`pb-1 font-medium text-right ${muted}`}>Volume</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ee.sets.map((s, i) => (
                                <tr key={s.id} className={`border-b ${divider}`}>
                                  <td className={`py-1.5 tabular-nums ${muted}`}>{i + 1}</td>
                                  <td className={`py-1.5 tabular-nums ${heading}`}>{s.reps ?? "—"}</td>
                                  <td className={`py-1.5 tabular-nums ${heading}`}>
                                    {s.weight_kg ? `${s.weight_kg} kg` : "—"}
                                  </td>
                                  <td className={`py-1.5 tabular-nums ${muted}`}>{s.rpe ?? "—"}</td>
                                  <td className={`py-1.5 tabular-nums ${muted}`}>
                                    {s.rest_seconds ? `${s.rest_seconds}s` : "—"}
                                  </td>
                                  <td className={`py-1.5 tabular-nums text-right ${muted}`}>
                                    {s.reps && s.weight_kg
                                      ? `${(s.reps * s.weight_kg).toLocaleString()} kg`
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
