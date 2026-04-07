"use client";

import { useState } from "react";
import { useTheme } from "../../src/context/theme-context";
import Icon from "../../src/components/icon";
import ExercisePicker from "./exercise-picker";
import {
  WorkoutRoutine,
  Exercise,
  RoutineExercise,
  RoutineSet,
  EnrichedRoutineExercise,
} from "../../src/types/workouts";
import {
  createRoutine,
  deleteRoutine,
  getRoutineExercises,
  addExerciseToRoutine,
  deleteRoutineExercise,
  getRoutineSets,
  addRoutineSet,
  deleteRoutineSet,
} from "../../src/api/workouts.api";

interface Props {
  routines: WorkoutRoutine[];
  exercises: Exercise[];
  onRefresh: () => void;
  onExerciseCreated: (exercise: Exercise) => void;
  onStartWorkout: (routineId: number, routineName: string, exercises: EnrichedRoutineExercise[]) => void;
}

// ── Target set row form ────────────────────────────────────────────────────────

function AddSetForm({
  routineExerciseId,
  nextOrder,
  onSaved,
  dark,
}: {
  routineExerciseId: number;
  nextOrder: number;
  onSaved: () => void;
  dark: boolean;
}) {
  const [targetReps, setTargetReps] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetRpe, setTargetRpe] = useState("");
  const [restSeconds, setRestSeconds] = useState("");
  const [loading, setLoading] = useState(false);

  const inputCls = `w-full px-2 py-1 rounded-lg border text-sm text-center ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
  }`;

  async function handleAdd() {
    if (!targetReps) return;
    setLoading(true);
    try {
      await addRoutineSet(routineExerciseId, {
        set_order: nextOrder,
        target_reps: parseInt(targetReps),
        target_weight: targetWeight ? parseFloat(targetWeight) : undefined,
        target_rpe: targetRpe ? parseFloat(targetRpe) : undefined,
        rest_seconds: restSeconds ? parseInt(restSeconds) : undefined,
      });
      setTargetReps("");
      setTargetWeight("");
      setTargetRpe("");
      setRestSeconds("");
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-5 gap-2 items-center mt-1">
      <input type="number" min={1} value={targetReps} onChange={(e) => setTargetReps(e.target.value)} placeholder="Reps *" className={inputCls} />
      <input type="number" min={0} step="any" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="kg" className={inputCls} />
      <input type="number" min={0} max={10} step="0.5" value={targetRpe} onChange={(e) => setTargetRpe(e.target.value)} placeholder="RPE" className={inputCls} />
      <input type="number" min={0} value={restSeconds} onChange={(e) => setRestSeconds(e.target.value)} placeholder="Rest s" className={inputCls} />
      <button
        onClick={handleAdd}
        disabled={loading || !targetReps}
        className="flex justify-center items-center p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
      >
        <Icon name={loading ? "progress_activity" : "add"} className="text-base" />
      </button>
    </div>
  );
}

// ── Single routine card ────────────────────────────────────────────────────────

function RoutineCard({
  routine,
  exercises,
  onDeleted,
  onExerciseCreated,
  onStartWorkout,
  dark,
}: {
  routine: WorkoutRoutine;
  exercises: Exercise[];
  onDeleted: () => void;
  onExerciseCreated: (exercise: Exercise) => void;
  onStartWorkout: (routineId: number, routineName: string, exercises: EnrichedRoutineExercise[]) => void;
  dark: boolean;
}) {
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const divider = dark ? "border-slate-700" : "border-slate-100";

  const [expanded, setExpanded] = useState(false);
  const [routineExercises, setRoutineExercises] = useState<EnrichedRoutineExercise[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showExPicker, setShowExPicker] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  async function loadDetail() {
    if (expanded) { setExpanded(false); return; }
    setLoadingDetail(true);
    try {
      const res = await getRoutineExercises(routine.id);
      const enriched = await Promise.all(
        res.map(async (re: RoutineExercise) => {
          const sets = await getRoutineSets(re.id);
          return {
            routineExercise: re,
            exercise: exerciseMap.get(re.exercise_id) ?? {
              id: re.exercise_id,
              exercise_name: `Exercise #${re.exercise_id}`,
              muscle_group: "Unknown",
              equipment: null,
            },
            sets,
          };
        }),
      );
      setRoutineExercises(
        enriched.sort(
          (a, b) => a.routineExercise.order_index - b.routineExercise.order_index,
        ),
      );
      setExpanded(true);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function refreshExercises() {
    const res = await getRoutineExercises(routine.id);
    const enriched = await Promise.all(
      res.map(async (re: RoutineExercise) => {
        const sets = await getRoutineSets(re.id);
        return {
          routineExercise: re,
          exercise: exerciseMap.get(re.exercise_id) ?? {
            id: re.exercise_id,
            exercise_name: `Exercise #${re.exercise_id}`,
            muscle_group: "Unknown",
            equipment: null,
          },
          sets,
        };
      }),
    );
    setRoutineExercises(
      enriched.sort((a, b) => a.routineExercise.order_index - b.routineExercise.order_index),
    );
  }

  async function handleAddExercise(exercise: Exercise) {
    await addExerciseToRoutine(routine.id, exercise.id, routineExercises.length);
    setShowExPicker(false);
    await refreshExercises();
  }

  async function handleDeleteExercise(routineExerciseId: number) {
    setDeletingId(routineExerciseId);
    try {
      await deleteRoutineExercise(routineExerciseId);
      await refreshExercises();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteSet(setId: number) {
    await deleteRoutineSet(setId);
    await refreshExercises();
  }

  async function handleDuplicateSet(s: RoutineSet, routineExerciseId: number, nextOrder: number) {
    await addRoutineSet(routineExerciseId, {
      set_order: nextOrder,
      target_reps: s.target_reps,
      target_weight: s.target_weight ?? undefined,
      target_rpe: s.target_rpe ?? undefined,
      rest_seconds: s.rest_seconds ?? undefined,
    });
    await refreshExercises();
  }

  const alreadyAdded = new Set(routineExercises.map((e) => e.exercise.id));

  return (
    <div className={`rounded-xl border transition-colors ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={loadDetail}
            className={`flex items-center gap-2 font-semibold text-sm transition-colors ${
              dark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"
            }`}
          >
            <Icon
              name={loadingDetail ? "progress_activity" : expanded ? "expand_less" : "chevron_right"}
              className="text-base"
            />
            <span className={heading}>{routine.routine_name}</span>
          </button>
          {routine.description && (
            <span className={`text-xs ${muted}`}>{routine.description}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={async () => {
              let exToUse = routineExercises;
              if (!expanded || exToUse.length === 0) {
                setLoadingDetail(true);
                try {
                  const res = await getRoutineExercises(routine.id);
                  exToUse = await Promise.all(
                    res.map(async (re: RoutineExercise) => {
                      const sets = await getRoutineSets(re.id);
                      return {
                        routineExercise: re,
                        exercise: exerciseMap.get(re.exercise_id) ?? {
                          id: re.exercise_id,
                          exercise_name: `Exercise #${re.exercise_id}`,
                          muscle_group: "Unknown",
                          equipment: null,
                        },
                        sets,
                      };
                    }),
                  );
                } finally {
                  setLoadingDetail(false);
                }
              }
              onStartWorkout(routine.id, routine.routine_name, exToUse);
            }}
            title="Start workout from this routine"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dark
                ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Icon name="play_arrow" className="text-sm" />
            Start
          </button>
          <button
            onClick={onDeleted}
            title="Delete routine"
            className={`p-1.5 rounded-lg transition-colors ${
              dark ? "hover:bg-red-500/15 text-slate-500 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"
            }`}
          >
            <Icon name="delete" className="text-base" />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className={`border-t px-4 pb-4 pt-3 space-y-4 ${divider}`}>

          {routineExercises.length === 0 && (
            <p className={`text-sm ${muted}`}>No exercises yet — add one below.</p>
          )}

          {routineExercises.map((ee) => (
            <div key={ee.routineExercise.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className={`text-sm font-semibold ${heading}`}>{ee.exercise.exercise_name}</span>
                  <span className={`ml-2 text-xs ${muted}`}>
                    {ee.exercise.muscle_group}
                    {ee.exercise.equipment ? ` · ${ee.exercise.equipment}` : ""}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteExercise(ee.routineExercise.id)}
                  disabled={deletingId === ee.routineExercise.id}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                    dark ? "hover:bg-red-500/15 text-slate-500 hover:text-red-400" : "hover:bg-red-50 text-slate-400 hover:text-red-500"
                  }`}
                >
                  <Icon name="remove_circle" className="text-sm" />
                </button>
              </div>

              {/* Target sets */}
              {ee.sets.length > 0 && (
                <div className={`mb-2 rounded-lg overflow-hidden border ${dark ? "border-slate-700" : "border-slate-200"}`}>
                  <div className={`grid grid-cols-6 gap-2 px-3 py-1.5 text-xs font-semibold text-center ${dark ? "bg-slate-700/60 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                    <span>#</span><span>Reps</span><span>Weight</span><span>RPE</span><span>Rest</span><span />
                  </div>
                  {ee.sets
                    .sort((a: RoutineSet, b: RoutineSet) => a.set_order - b.set_order)
                    .map((s: RoutineSet, idx: number) => (
                      <div
                        key={s.id}
                        className={`grid grid-cols-6 gap-2 px-3 py-2 text-xs text-center items-center ${
                          idx % 2 === 0
                            ? dark ? "bg-slate-800" : "bg-white"
                            : dark ? "bg-slate-700/25" : "bg-slate-50"
                        }`}
                      >
                        <span className={`font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>{idx + 1}</span>
                        <span className={`font-medium ${heading}`}>{s.target_reps}</span>
                        <span className={muted}>{s.target_weight ? `${s.target_weight} kg` : "—"}</span>
                        <span className={muted}>{s.target_rpe ?? "—"}</span>
                        <span className={muted}>{s.rest_seconds ? `${s.rest_seconds}s` : "—"}</span>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleDuplicateSet(s, ee.routineExercise.id, ee.sets.length)}
                            title="Duplicate set"
                            className={`transition-colors ${dark ? "text-slate-600 hover:text-indigo-400" : "text-slate-300 hover:text-indigo-500"}`}
                          >
                            <Icon name="content_copy" className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteSet(s.id)}
                            title="Delete set"
                            className={`transition-colors ${dark ? "text-slate-600 hover:text-red-400" : "text-slate-300 hover:text-red-500"}`}
                          >
                            <Icon name="delete" className="text-sm" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Add target set */}
              <AddSetForm
                routineExerciseId={ee.routineExercise.id}
                nextOrder={ee.sets.length}
                onSaved={refreshExercises}
                dark={dark}
              />
            </div>
          ))}

          {/* Add exercise */}
          {showExPicker ? (
            <ExercisePicker
              exercises={exercises}
              exclude={alreadyAdded}
              onSelect={handleAddExercise}
              onClose={() => setShowExPicker(false)}
              onCreated={onExerciseCreated}
            />
          ) : (
            <button
              onClick={() => setShowExPicker(true)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                dark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"
              }`}
            >
              <Icon name="add_circle" className="text-base" />
              Add Exercise
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RoutineManager({ routines, exercises, onRefresh, onExerciseCreated, onStartWorkout }: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";

  const [showForm, setShowForm] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [routineDesc, setRoutineDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
    dark
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
  }`;

  async function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!routineName.trim()) return;
    setCreating(true);
    try {
      await createRoutine({
        routine_name: routineName.trim(),
        description: routineDesc.trim() || undefined,
      });
      setRoutineName("");
      setRoutineDesc("");
      setShowForm(false);
      onRefresh();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(routineId: number) {
    setDeletingId(routineId);
    try {
      await deleteRoutine(routineId);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold ${heading}`}>My Routines</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            showForm
              ? dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          <Icon name={showForm ? "expand_less" : "add"} className="text-sm" />
          {showForm ? "Close" : "New Routine"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className={`rounded-xl border p-4 space-y-3 ${
            dark ? "bg-slate-700/30 border-slate-700" : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${muted}`}>Routine Name *</label>
            <input value={routineName} onChange={(e) => setRoutineName(e.target.value)} placeholder="e.g. Push A" required className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${muted}`}>Description</label>
            <input value={routineDesc} onChange={(e) => setRoutineDesc(e.target.value)} placeholder="Optional description" className={inputCls} />
          </div>
          <button
            type="submit"
            disabled={creating || !routineName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Icon name="add" className="text-base" />
            {creating ? "Creating…" : "Create Routine"}
          </button>
        </form>
      )}

      {/* Routine list */}
      {routines.length === 0 && !showForm ? (
        <div className={`flex flex-col items-center gap-2 py-8 ${muted}`}>
          <Icon name="checklist" className="text-4xl opacity-40" />
          <p className="text-sm">No routines yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              exercises={exercises}
              dark={dark}
              onExerciseCreated={onExerciseCreated}
              onStartWorkout={onStartWorkout}
              onDeleted={() => {
                if (deletingId) return;
                handleDelete(r.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
