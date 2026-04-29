"use client";

import { useState, useMemo } from "react";
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function durationLabel(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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

const RANGE_LABELS: { value: "all" | "month" | "week"; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "month", label: "30 Days" },
  { value: "week", label: "This Week" },
];

const PAGE_SIZE = 10;

export default function WorkoutHistory({ workouts, exercises, onRefresh }: Props) {
  const { dark } = useTheme();

  const heading = dark ? "text-white" : "text-[#4F6F52]";
  const muted   = dark ? "text-neutral-400" : "text-[#A3B18A]";

  const [detailMap, setDetailMap] = useState<Map<number, EnrichedWorkout>>(new Map());
  const [loadingId, setLoadingId]   = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch]         = useState("");
  const [range, setRange]           = useState<"all" | "month" | "week">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
      setDetailMap((prev) => { const next = new Map(prev); next.delete(workoutId); return next; });
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  const sorted = useMemo(() => {
    const now = new Date();
    const cutoffs: Record<"all" | "month" | "week", Date | null> = {
      all: null,
      month: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    };
    const cutoff = cutoffs[range];
    const q = search.toLowerCase();
    return [...workouts]
      .sort((a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime())
      .filter((w) => {
        if (cutoff && new Date(w.workout_date) < cutoff) return false;
        if (q && !w.workout_name.toLowerCase().includes(q)) return false;
        return true;
      });
  }, [workouts, search, range]);

  if (workouts.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-3 py-16 ${muted}`}>
        <Icon name="fitness_center" className="text-5xl opacity-30" />
        <p className="text-sm font-medium">No workouts logged yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search + filter */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <Icon
            name="search"
            className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${muted}`}
          />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            placeholder="Search workouts…"
            className={`w-full border-none rounded-xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 shadow-[0_10px_40px_-10px_rgba(47,62,47,0.08)] transition-shadow ${
              dark
                ? "bg-neutral-900 text-white placeholder-neutral-500 focus:ring-green-700"
                : "bg-white text-[#4F6F52] placeholder-[#A3B18A] focus:ring-[#4F6F52]/20"
            }`}
          />
        </div>

        <div
          className={`flex items-center p-1.5 rounded-full shadow-[0_10px_40px_-10px_rgba(47,62,47,0.08)] border ${
            dark ? "bg-neutral-900 border-neutral-800" : "bg-white border-[#DAD7CD]/30"
          }`}
        >
          {RANGE_LABELS.map((r) => (
            <button
              key={r.value}
              onClick={() => { setRange(r.value); setVisibleCount(PAGE_SIZE); }}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                range === r.value
                  ? dark
                    ? "bg-green-700 text-white"
                    : "bg-[#4F6F52] text-[#F5F3EE]"
                  : dark
                    ? "text-neutral-400 hover:text-neutral-200"
                    : "text-[#A3B18A] hover:bg-[#4F6F52]/5"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {/* Table column header (desktop) */}
      <div className={`hidden md:grid grid-cols-12 px-8 py-2 text-[11px] font-bold uppercase tracking-[0.2em] ${muted}`}>
        <div className="col-span-5">Workout Name</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-2 text-center">Duration</div>
        <div className="col-span-2 text-center">Volume</div>
        <div className="col-span-1" />
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div className={`flex flex-col items-center gap-3 py-16 ${muted}`}>
          <Icon name="search_off" className="text-5xl opacity-30" />
          <p className="text-sm font-medium">No workouts match your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.slice(0, visibleCount).map((w) => {
            const detail    = detailMap.get(w.id);
            const isExpanded = expandedId === w.id;
            const isLoading  = loadingId === w.id;

            return (
              <div
                key={w.id}
                className={`rounded-3xl border overflow-hidden transition-all duration-200 shadow-[0_10px_40px_-10px_rgba(47,62,47,0.08)] ${
                  isExpanded
                    ? dark
                      ? "border-green-800/40 border-2 bg-neutral-900"
                      : "border-[#4F6F52]/20 border-2 bg-white shadow-md"
                    : dark
                      ? "border-neutral-800 bg-neutral-900"
                      : "border-[#DAD7CD]/50 bg-white"
                }`}
              >
                {/* Row header */}
                <div className="grid grid-cols-4 md:grid-cols-12 items-center px-6 md:px-8 py-5 gap-4">
                  {/* Name */}
                  <div className="col-span-3 md:col-span-5">
                    <h3 className={`text-base font-bold ${heading}`}>{w.workout_name}</h3>
                    <p className={`text-xs font-medium md:hidden uppercase tracking-wider mt-0.5 ${muted}`}>
                      {formatDate(w.workout_date)}{w.duration_minutes ? ` • ${durationLabel(w.duration_minutes)}` : ""}
                    </p>
                  </div>

                  {/* Date */}
                  <div className={`hidden md:block col-span-2 text-sm font-medium ${dark ? "text-white/70" : "text-[#4F6F52]/80"}`}>
                    {formatDate(w.workout_date)}
                  </div>

                  {/* Duration */}
                  <div className={`hidden md:block col-span-2 text-center text-sm font-medium tabular-nums ${dark ? "text-white/70" : "text-[#4F6F52]/80"}`}>
                    {durationLabel(w.duration_minutes)}
                  </div>

                  {/* Volume */}
                  <div className={`hidden md:block col-span-2 text-center text-sm font-medium font-mono tabular-nums ${dark ? "text-white/70" : "text-[#4F6F52]/80"}`}>
                    {detail ? volumeLabel(detail) : "—"}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end items-center gap-1">
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={deletingId === w.id}
                      title="Delete workout"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 ${
                        dark
                          ? "text-neutral-600 hover:text-red-400 hover:bg-red-500/10"
                          : "text-[#DAD7CD] hover:text-red-500 hover:bg-red-50"
                      }`}
                    >
                      <Icon name="delete" className="text-sm" />
                    </button>
                    <button
                      onClick={() => loadDetail(w)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isExpanded
                          ? dark
                            ? "bg-green-900/40 text-green-400"
                            : "bg-[#4F6F52]/10 text-[#4F6F52]"
                          : dark
                            ? "text-neutral-400 hover:bg-neutral-800"
                            : "text-[#4F6F52] hover:bg-[#4F6F52]/5"
                      }`}
                    >
                      <Icon
                        name={isLoading ? "progress_activity" : isExpanded ? "expand_less" : "expand_more"}
                        className="text-base"
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded exercise details */}
                {isExpanded && detail && (
                  <div
                    className={`px-8 py-6 space-y-6 border-t ${
                      dark
                        ? "bg-neutral-950/60 border-neutral-800"
                        : "bg-[#F5F3EE]/40 border-[#DAD7CD]/30"
                    }`}
                  >
                    {w.notes && (
                      <p className={`text-sm italic ${muted}`}>{w.notes}</p>
                    )}

                    {detail.exercises.length === 0 ? (
                      <p className={`text-sm ${muted}`}>No exercises recorded.</p>
                    ) : (
                      detail.exercises.map((ee) => (
                        <div key={ee.workoutExercise.id}>
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-bold uppercase tracking-wider ${heading}`}>
                              {ee.exercise.exercise_name}
                            </span>
                            <span className={`text-xs font-bold ${muted}`}>
                              {ee.sets.length} Set{ee.sets.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {ee.sets.length === 0 ? (
                            <p className={`text-xs ${muted}`}>No sets recorded.</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {ee.sets.map((s, i) => (
                                <div
                                  key={s.id}
                                  className={`p-3 rounded-xl border text-center ${
                                    dark
                                      ? "bg-neutral-900 border-neutral-800"
                                      : "bg-white border-[#DAD7CD]/30"
                                  }`}
                                >
                                  <p className={`text-[10px] uppercase tracking-tighter mb-1 ${muted}`}>
                                    Set {i + 1}
                                  </p>
                                  <p className={`font-bold text-sm ${heading}`}>
                                    {s.weight_kg != null ? `${s.weight_kg}` : "—"}
                                    {" × "}
                                    {s.reps ?? "—"}
                                  </p>
                                  {(s.rpe || s.rest_seconds) && (
                                    <p className={`text-[10px] mt-0.5 ${muted}`}>
                                      {s.rpe ? `RPE ${s.rpe}` : ""}
                                      {s.rpe && s.rest_seconds ? " · " : ""}
                                      {s.rest_seconds ? `${s.rest_seconds}s` : ""}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
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
      )}

      {/* Load more */}
      {sorted.length > visibleCount && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className={`px-8 py-3 rounded-full border font-bold text-sm uppercase tracking-widest transition-all duration-300 ${
              dark
                ? "border-green-700 text-green-400 hover:bg-green-700 hover:text-white"
                : "border-[#4F6F52] text-[#4F6F52] hover:bg-[#4F6F52] hover:text-white"
            }`}
          >
            Load Older History
          </button>
        </div>
      )}
    </div>
  );
}
