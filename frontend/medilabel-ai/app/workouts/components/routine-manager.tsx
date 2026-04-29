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
  const [targetReps,   setTargetReps]   = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetRpe,    setTargetRpe]    = useState("");
  const [restSeconds,  setRestSeconds]  = useState("");
  const [loading,      setLoading]      = useState(false);

  const inputCls = `w-full px-2 py-1.5 rounded-lg border-none outline-none text-sm text-center focus:ring-2 transition-colors ${
    dark
      ? "bg-neutral-800 text-white placeholder-neutral-500 focus:ring-green-700"
      : "bg-[#F5F3EE] text-[#4F6F52] placeholder-[#A3B18A]/60 focus:ring-[#4F6F52]/20"
  }`;

  async function handleAdd() {
    if (!targetReps) return;
    setLoading(true);
    try {
      await addRoutineSet(routineExerciseId, {
        set_order:     nextOrder,
        target_reps:   parseInt(targetReps),
        target_weight: targetWeight ? parseFloat(targetWeight) : undefined,
        target_rpe:    targetRpe    ? parseFloat(targetRpe)    : undefined,
        rest_seconds:  restSeconds  ? parseInt(restSeconds)    : undefined,
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
      <input type="number" min={1}        value={targetReps}   onChange={(e) => setTargetReps(e.target.value)}   placeholder="Reps *" className={inputCls} />
      <input type="number" min={0} step="any" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="kg"     className={inputCls} />
      <input type="number" min={0} max={10} step="0.5" value={targetRpe} onChange={(e) => setTargetRpe(e.target.value)} placeholder="RPE"    className={inputCls} />
      <input type="number" min={0}        value={restSeconds}  onChange={(e) => setRestSeconds(e.target.value)}  placeholder="Rest s" className={inputCls} />
      <button
        onClick={handleAdd}
        disabled={loading || !targetReps}
        className={`flex justify-center items-center p-1.5 rounded-lg text-white disabled:opacity-50 transition-colors ${
          dark ? "bg-green-700 hover:bg-green-600" : "bg-[#4F6F52] hover:bg-[#3d5a3e]"
        }`}
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
  const heading = dark ? "text-white"        : "text-[#4F6F52]";
  const muted   = dark ? "text-neutral-400"  : "text-[#A3B18A]";

  const [expanded,       setExpanded]       = useState(false);
  const [routineExercises, setRoutineExercises] = useState<EnrichedRoutineExercise[]>([]);
  const [loadingDetail,  setLoadingDetail]  = useState(false);
  const [showExPicker,   setShowExPicker]   = useState(false);
  const [deletingId,     setDeletingId]     = useState<number | null>(null);

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  async function loadDetail() {
    if (expanded) { setExpanded(false); return; }
    setLoadingDetail(true);
    try {
      const res      = await getRoutineExercises(routine.id);
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
    const res      = await getRoutineExercises(routine.id);
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
      set_order:     nextOrder,
      target_reps:   s.target_reps,
      target_weight: s.target_weight ?? undefined,
      target_rpe:    s.target_rpe    ?? undefined,
      rest_seconds:  s.rest_seconds  ?? undefined,
    });
    await refreshExercises();
  }

  const alreadyAdded = new Set(routineExercises.map((e) => e.exercise.id));

  return (
    <div
      className={`rounded-3xl border overflow-hidden transition-all duration-200 shadow-[0_10px_40px_-10px_rgba(47,62,47,0.08)] ${
        expanded
          ? dark
            ? "border-green-800/40 border-2 bg-neutral-900"
            : "border-[#4F6F52]/20 border-2 bg-white shadow-md"
          : dark
            ? "border-neutral-800 bg-neutral-900"
            : "border-[#DAD7CD]/50 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={loadDetail}
            className={`flex items-center gap-2 transition-colors ${
              dark ? "text-green-400 hover:text-green-300" : "text-[#4F6F52] hover:text-[#3d5a3e]"
            }`}
          >
            <Icon
              name={loadingDetail ? "progress_activity" : expanded ? "expand_less" : "chevron_right"}
              className="text-base flex-shrink-0"
            />
          </button>
          <div className="min-w-0">
            <h3 className={`text-base font-bold truncate ${heading}`}>{routine.routine_name}</h3>
            {routine.description && (
              <p className={`text-xs mt-0.5 truncate ${muted}`}>{routine.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={async () => {
              let exToUse = routineExercises;
              if (!expanded || exToUse.length === 0) {
                setLoadingDetail(true);
                try {
                  const res = await getRoutineExercises(routine.id);
                  exToUse   = await Promise.all(
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              dark
                ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                : "bg-[#4F6F52]/10 text-[#4F6F52] hover:bg-[#4F6F52]/20"
            }`}
          >
            <Icon name="play_arrow" className="text-sm" />
            Start
          </button>
          <button
            onClick={onDeleted}
            title="Delete routine"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              dark
                ? "text-neutral-600 hover:text-red-400 hover:bg-red-500/10"
                : "text-[#DAD7CD] hover:text-red-500 hover:bg-red-50"
            }`}
          >
            <Icon name="delete" className="text-sm" />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className={`px-6 pb-6 pt-4 space-y-5 border-t ${
            dark
              ? "bg-neutral-950/60 border-neutral-800"
              : "bg-[#F5F3EE]/40 border-[#DAD7CD]/30"
          }`}
        >
          {routineExercises.length === 0 && (
            <p className={`text-sm ${muted}`}>No exercises yet — add one below.</p>
          )}

          {routineExercises.map((ee) => (
            <div key={ee.routineExercise.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className={`text-sm font-bold uppercase tracking-wider ${heading}`}>
                    {ee.exercise.exercise_name}
                  </span>
                  <span className={`ml-2 text-xs ${muted}`}>
                    {ee.exercise.muscle_group}
                    {ee.exercise.equipment ? ` · ${ee.exercise.equipment}` : ""}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteExercise(ee.routineExercise.id)}
                  disabled={deletingId === ee.routineExercise.id}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
                    dark
                      ? "text-neutral-600 hover:text-red-400 hover:bg-red-500/10"
                      : "text-[#DAD7CD] hover:text-red-500 hover:bg-red-50"
                  }`}
                >
                  <Icon name="remove_circle" className="text-sm" />
                </button>
              </div>

              {/* Target sets table */}
              {ee.sets.length > 0 && (
                <div
                  className={`mb-2 rounded-xl overflow-hidden border ${
                    dark ? "border-neutral-800" : "border-[#DAD7CD]/30"
                  }`}
                >
                  <div
                    className={`grid grid-cols-6 gap-2 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-center ${
                      dark
                        ? "bg-neutral-800 text-neutral-500"
                        : "bg-[#F5F3EE] text-[#A3B18A]"
                    }`}
                  >
                    <span>#</span><span>Reps</span><span>Weight</span><span>RPE</span><span>Rest</span><span />
                  </div>
                  {ee.sets
                    .sort((a: RoutineSet, b: RoutineSet) => a.set_order - b.set_order)
                    .map((s: RoutineSet, idx: number) => (
                      <div
                        key={s.id}
                        className={`grid grid-cols-6 gap-2 px-3 py-2 text-xs text-center items-center ${
                          idx % 2 === 0
                            ? dark ? "bg-neutral-900"      : "bg-white"
                            : dark ? "bg-neutral-800/40"   : "bg-[#F5F3EE]/50"
                        }`}
                      >
                        <span className={`font-bold ${dark ? "text-neutral-600" : "text-[#A3B18A]"}`}>{idx + 1}</span>
                        <span className={`font-bold tabular-nums ${heading}`}>{s.target_reps}</span>
                        <span className={`tabular-nums ${dark ? "text-neutral-400" : "text-[#A3B18A]"}`}>
                          {s.target_weight ? `${s.target_weight} kg` : "—"}
                        </span>
                        <span className={dark ? "text-neutral-400" : "text-[#A3B18A]"}>{s.target_rpe ?? "—"}</span>
                        <span className={dark ? "text-neutral-400" : "text-[#A3B18A]"}>
                          {s.rest_seconds ? `${s.rest_seconds}s` : "—"}
                        </span>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleDuplicateSet(s, ee.routineExercise.id, ee.sets.length)}
                            title="Duplicate set"
                            className={`transition-colors ${
                              dark
                                ? "text-neutral-700 hover:text-green-400"
                                : "text-[#DAD7CD] hover:text-[#4F6F52]"
                            }`}
                          >
                            <Icon name="content_copy" className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteSet(s.id)}
                            title="Delete set"
                            className={`transition-colors ${
                              dark
                                ? "text-neutral-700 hover:text-red-400"
                                : "text-[#DAD7CD] hover:text-red-500"
                            }`}
                          >
                            <Icon name="delete" className="text-sm" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

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
              className={`flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider transition-colors ${
                dark ? "text-green-400 hover:text-green-300" : "text-[#4F6F52] hover:text-[#3d5a3e]"
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

export default function RoutineManager({
  routines,
  exercises,
  onRefresh,
  onExerciseCreated,
  onStartWorkout,
}: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white"       : "text-[#4F6F52]";
  const muted   = dark ? "text-neutral-400" : "text-[#A3B18A]";

  const [showForm,     setShowForm]     = useState(false);
  const [routineName,  setRoutineName]  = useState("");
  const [routineDesc,  setRoutineDesc]  = useState("");
  const [creating,     setCreating]     = useState(false);
  const [deletingId,   setDeletingId]   = useState<number | null>(null);

  const inputCls = `w-full px-4 py-3.5 rounded-lg border-none outline-none text-sm focus:ring-2 transition-colors ${
    dark
      ? "bg-neutral-800 text-white placeholder-neutral-500 focus:ring-green-700"
      : "bg-[#F5F3EE] text-[#4F6F52] placeholder-[#A3B18A]/60 focus:ring-[#4F6F52]/20"
  }`;

  const labelCls = `text-[11px] font-bold tracking-widest uppercase px-1 ${muted}`;

  async function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!routineName.trim()) return;
    setCreating(true);
    try {
      await createRoutine({
        routine_name: routineName.trim(),
        description:  routineDesc.trim() || undefined,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-[11px] font-bold tracking-[0.2em] uppercase ${muted}`}>
          My Routines
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest transition-all duration-200 ${
            showForm
              ? dark
                ? "bg-neutral-800 text-neutral-300"
                : "bg-[#F5F3EE] text-[#4F6F52]"
              : dark
                ? "bg-green-700 hover:bg-green-600 text-white"
                : "bg-[#4F6F52] hover:bg-[#3d5a3e] text-white"
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
          className={`rounded-3xl border p-6 space-y-4 shadow-[0_10px_40px_-10px_rgba(47,62,47,0.08)] ${
            dark
              ? "bg-neutral-900 border-neutral-800"
              : "bg-white border-[#DAD7CD]/40"
          }`}
        >
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Routine Name *</label>
            <input
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g. Push A"
              required
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Description</label>
            <input
              value={routineDesc}
              onChange={(e) => setRoutineDesc(e.target.value)}
              placeholder="Optional description"
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={creating || !routineName.trim()}
            className={`flex items-center gap-1.5 px-6 py-3 rounded-full text-white text-sm font-bold uppercase tracking-widest disabled:opacity-50 transition-all hover:scale-[1.01] ${
              dark ? "bg-green-700 hover:bg-green-600" : "bg-[#4F6F52] hover:bg-[#3d5a3e]"
            }`}
          >
            <Icon name="add" className="text-base" />
            {creating ? "Creating…" : "Create Routine"}
          </button>
        </form>
      )}

      {/* Routine list */}
      {routines.length === 0 && !showForm ? (
        <div className={`flex flex-col items-center gap-3 py-16 ${muted}`}>
          <Icon name="checklist" className="text-5xl opacity-30" />
          <p className="text-sm font-medium">No routines yet. Create one to get started.</p>
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
