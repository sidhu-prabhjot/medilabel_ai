"use client";

import { useCallback, useEffect, useState } from "react";
import AppLayout from "../src/components/layout/app-layout";
import Card from "../src/components/card";
import StatCard from "../src/components/stat-card";
import Icon from "../src/components/icon";
import { useTheme } from "../src/context/theme-context";

import WorkoutLogger from "./components/workout-logger";
import WorkoutHistory from "./components/workout-history";
import WorkoutCharts from "./components/workout-charts";
import RoutineManager from "./components/routine-manager";
import WeeklyPlan from "./components/weekly-plan";

import {
  getWorkouts,
  getExercises,
  getRoutines,
  getPlans,
  getWorkoutExercises,
  getSets,
} from "../src/api/workouts.api";
import {
  Workout,
  Exercise,
  WorkoutRoutine,
  WorkoutPlan,
  EnrichedWorkout,
  PersonalRecord,
} from "../src/types/workouts";

// ── Section tab nav ────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "log", label: "Log Workout", icon: "add_circle" },
  { id: "history", label: "History", icon: "history" },
  { id: "progress", label: "Progress", icon: "trending_up" },
  { id: "routines", label: "Routines", icon: "checklist" },
  { id: "plan", label: "Weekly Plan", icon: "calendar_month" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// ── Helpers ────────────────────────────────────────────────────────────────────

function thisWeekWorkouts(workouts: Workout[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  startOfWeek.setHours(0, 0, 0, 0);
  return workouts.filter((w) => new Date(w.workout_date) >= startOfWeek).length;
}

function weeklyVolumeKg(enrichedWorkouts: EnrichedWorkout[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);

  let total = 0;
  for (const ew of enrichedWorkouts) {
    if (new Date(ew.workout.workout_date) < startOfWeek) continue;
    for (const ee of ew.exercises) {
      for (const s of ee.sets) {
        if (s.reps && s.weight_kg) total += s.reps * s.weight_kg;
      }
    }
  }
  return Math.round(total);
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const { dark } = useTheme();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);

  // Enriched workouts loaded progressively in background for charts/PRs
  const [enrichedWorkouts, setEnrichedWorkouts] = useState<EnrichedWorkout[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("log");

  // Track PRs announced in the current session to show a banner
  const [sessionPRs, setSessionPRs] = useState<PersonalRecord[]>([]);

  // ── Loaders ──────────────────────────────────────────────────────────────────

  const loadBase = useCallback(async () => {
    const [w, e, r, p] = await Promise.all([
      getWorkouts(),
      getExercises(),
      getRoutines(),
      getPlans(),
    ]);
    setWorkouts(w);
    setExercises(e);
    setRoutines(r);
    setPlans(p);
    return w;
  }, []);

  // Load full exercise+set detail for all workouts (background enrichment)
  const enrichAll = useCallback(async (workoutList: Workout[]) => {
    setLoadingProgress(true);
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

    const results = await Promise.allSettled(
      workoutList.map(async (w) => {
        const wes = await getWorkoutExercises(w.id);
        const enrichedExercises = await Promise.all(
          wes.map(async (we) => {
            const sets = await getSets(we.id);
            return {
              workoutExercise: we,
              exercise: exerciseMap.get(we.exercise_id) ?? {
                id: we.exercise_id,
                exercise_name: `Exercise #${we.exercise_id}`,
                muscle_group: "Unknown",
                equipment: null,
              },
              sets,
            };
          }),
        );
        return {
          workout: w,
          exercises: enrichedExercises.sort(
            (a, b) => (a.workoutExercise.order_index ?? 0) - (b.workoutExercise.order_index ?? 0),
          ),
        } as EnrichedWorkout;
      }),
    );

    const fulfilled = results
      .filter((r): r is PromiseFulfilledResult<EnrichedWorkout> => r.status === "fulfilled")
      .map((r) => r.value);

    setEnrichedWorkouts(fulfilled);
    setLoadingProgress(false);
  }, [exercises]);

  const refreshWorkouts = useCallback(async () => {
    const w = await getWorkouts();
    setWorkouts(w);
    await enrichAll(w);
  }, [enrichAll]);

  const refreshRoutines = useCallback(async () => {
    setRoutines(await getRoutines());
  }, []);

  const refreshPlans = useCallback(async () => {
    setPlans(await getPlans());
  }, []);

  useEffect(() => {
    loadBase()
      .then((w) => enrichAll(w))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived stats ─────────────────────────────────────────────────────────────

  const thisWeek = thisWeekWorkouts(workouts);
  const volume = weeklyVolumeKg(enrichedWorkouts);

  const stats = [
    {
      label: "Total Workouts",
      value: String(workouts.length),
      change: "logged",
      positive: true,
      barColor: "bg-indigo-500",
    },
    {
      label: "This Week",
      value: String(thisWeek),
      change: thisWeek > 0 ? "sessions" : "none yet",
      positive: thisWeek > 0,
      barColor: thisWeek > 0 ? "bg-emerald-500" : "bg-slate-400",
    },
    {
      label: "Weekly Volume",
      value: volume > 0 ? `${volume.toLocaleString()} kg` : "—",
      change: "this week",
      positive: volume > 0,
      barColor: "bg-purple-500",
    },
    {
      label: "Routines",
      value: String(routines.length),
      change: "templates",
      positive: true,
      barColor: "bg-amber-500",
    },
  ];

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Workouts">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-xl border p-5 h-28 animate-pulse ${
                  dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                }`}
              />
            ))}
          </div>
          <div className={`rounded-xl border p-5 h-64 animate-pulse ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`} />
        </div>
      </AppLayout>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Workouts">
      <div className="space-y-6">
        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </section>

        {/* Session PR banner */}
        {sessionPRs.length > 0 && (
          <div className={`rounded-xl border p-4 flex items-start gap-3 ${dark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"}`}>
            <Icon name="emoji_events" className={`text-xl flex-shrink-0 mt-0.5 ${dark ? "text-emerald-400" : "text-emerald-600"}`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold mb-1 ${dark ? "text-emerald-300" : "text-emerald-800"}`}>
                New Personal Record{sessionPRs.length > 1 ? "s" : ""} this session!
              </p>
              {sessionPRs.map((pr) => (
                <p key={pr.exercise.id} className={`text-sm ${dark ? "text-emerald-200" : "text-emerald-900"}`}>
                  {pr.exercise.exercise_name} — {pr.maxWeightKg} kg
                  {pr.repsAtMax > 0 ? ` × ${pr.repsAtMax}` : ""}
                </p>
              ))}
            </div>
            <button
              onClick={() => setSessionPRs([])}
              className={`p-1 rounded ${dark ? "text-emerald-500 hover:text-emerald-300" : "text-emerald-500 hover:text-emerald-700"}`}
            >
              <Icon name="close" className="text-base" />
            </button>
          </div>
        )}

        {/* Section nav */}
        <div className={`flex gap-1 p-1 rounded-xl ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? dark
                    ? "bg-slate-700 text-white shadow-sm"
                    : "bg-white text-slate-900 shadow-sm"
                  : dark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon name={s.icon} className="text-base hidden sm:block" />
              <span className="hidden sm:block">{s.label}</span>
              <span className="sm:hidden">{s.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Section content */}
        {activeSection === "log" && (
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                Log a Workout
              </h2>
              {exercises.length === 0 && (
                <span className={`text-xs ${dark ? "text-amber-400" : "text-amber-600"}`}>
                  Add exercises to the library first
                </span>
              )}
            </div>
            <WorkoutLogger
              exercises={exercises}
              previousWorkouts={enrichedWorkouts}
              onSaved={(prs) => {
                if (prs.length > 0) setSessionPRs(prs);
                refreshWorkouts();
              }}
              onExerciseCreated={(e) => setExercises((prev) => [...prev, e])}
            />
          </Card>
        )}

        {activeSection === "history" && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                Workout History
              </h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                {workouts.length}
              </span>
            </div>
            <WorkoutHistory
              workouts={workouts}
              exercises={exercises}
              onRefresh={refreshWorkouts}
            />
          </Card>
        )}

        {activeSection === "progress" && (
          <WorkoutCharts
            enrichedWorkouts={enrichedWorkouts}
            exercises={exercises}
            loading={loadingProgress}
          />
        )}

        {activeSection === "routines" && (
          <Card>
            <RoutineManager
              routines={routines}
              exercises={exercises}
              onRefresh={refreshRoutines}
              onExerciseCreated={(e) => setExercises((prev) => [...prev, e])}
            />
          </Card>
        )}

        {activeSection === "plan" && (
          <Card>
            <WeeklyPlan
              plans={plans}
              routines={routines}
              onRefresh={refreshPlans}
            />
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
