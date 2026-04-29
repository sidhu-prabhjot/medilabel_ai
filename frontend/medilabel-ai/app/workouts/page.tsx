"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  getPlanDays,
  getPlanRestDays,
  getRoutineExercises,
  getRoutineSets,
  getWorkoutExercises,
  getSets,
} from "../src/api/workouts.api";
import {
  Workout,
  Exercise,
  WorkoutRoutine,
  WorkoutPlan,
  EnrichedWorkout,
  EnrichedRoutineExercise,
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

// ISO week key (YYYY-Www) — identifies which week a date falls in.
function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + 4 - day);
  const year = thursday.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((thursday.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// Counts consecutive weeks (ending with the current week) that contain at least one workout.
function computeStreak(workouts: Workout[]): number {
  const weekKeys = new Set(workouts.map((w) => isoWeekKey(w.workout_date)));
  let streak = 0;
  const now = new Date();
  while (true) {
    const key = isoWeekKey(
      new Date(now.getTime() - streak * 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    );
    if (!weekKeys.has(key)) break;
    streak++;
  }
  return streak;
}

// Returns the count of exercises for which the user has a recorded best weight.
function computePRCount(enrichedWorkouts: EnrichedWorkout[]): number {
  const exercisesWithWeight = new Set<number>();
  for (const ew of enrichedWorkouts) {
    for (const ee of ew.exercises) {
      if (ee.sets.some((s) => s.weight_kg)) exercisesWithWeight.add(ee.exercise.id);
    }
  }
  return exercisesWithWeight.size;
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
  const [enrichedWorkouts, setEnrichedWorkouts] = useState<EnrichedWorkout[]>(
    [],
  );
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("log");

  // Track PRs announced in the current session to show a banner
  const [sessionPRs, setSessionPRs] = useState<PersonalRecord[]>([]);

  // Routines scheduled for today from the active weekly plan
  const [todayRoutines, setTodayRoutines] = useState<WorkoutRoutine[]>([]);

  // Preset exercises when starting a workout from a routine
  const [routinePreset, setRoutinePreset] = useState<{
    routineId: number;
    name: string;
    exercises: EnrichedRoutineExercise[];
  } | null>(null);

  function handleStartFromRoutine(
    routineId: number,
    routineName: string,
    exercises: EnrichedRoutineExercise[],
  ) {
    setRoutinePreset({ routineId, name: routineName, exercises });
    setActiveSection("log");
  }

  // Fetches a routine's exercises+sets then launches the logger preset.
  async function startRoutine(routine: WorkoutRoutine) {
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
    const res = await getRoutineExercises(routine.id);
    const enriched = await Promise.all(
      res.map(async (re) => {
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
    handleStartFromRoutine(routine.id, routine.routine_name, enriched);
  }

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

    // Derive today's routines from the active plan.
    // JS getDay(): 0=Sun..6=Sat → convert to Mon=0..Sun=6 to match the app's weekday convention.
    const activePlan = p.find((plan) => plan.is_active);
    if (activePlan) {
      const todayWeekday = (new Date().getDay() + 6) % 7;
      const [days, restDays] = await Promise.all([
        getPlanDays(activePlan.id),
        getPlanRestDays(activePlan.id),
      ]);
      const isRestDay = restDays.some((rd) => rd.weekday === todayWeekday);
      if (isRestDay) {
        setTodayRoutines([]);
      } else {
        const routineMap = new Map(r.map((rt) => [rt.id, rt]));
        const scheduled = days
          .filter((d) => d.weekday === todayWeekday)
          .map((d) => routineMap.get(d.routine_id))
          .filter((rt): rt is WorkoutRoutine => rt !== undefined);
        setTodayRoutines(scheduled);
      }
    } else {
      setTodayRoutines([]);
    }

    return w;
  }, []);

  // Load full exercise+set detail for all workouts (background enrichment)
  const enrichAll = useCallback(
    async (workoutList: Workout[]) => {
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
              (a, b) =>
                (a.workoutExercise.order_index ?? 0) -
                (b.workoutExercise.order_index ?? 0),
            ),
          } as EnrichedWorkout;
        }),
      );

      const fulfilled = results
        .filter(
          (r): r is PromiseFulfilledResult<EnrichedWorkout> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);

      setEnrichedWorkouts(fulfilled);
      setLoadingProgress(false);
    },
    [exercises],
  );

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

  const thisWeek = useMemo(() => thisWeekWorkouts(workouts), [workouts]);
  const volume = useMemo(() => weeklyVolumeKg(enrichedWorkouts), [enrichedWorkouts]);
  const streak = useMemo(() => computeStreak(workouts), [workouts]);
  const prCount = useMemo(() => computePRCount(enrichedWorkouts), [enrichedWorkouts]);

  const stats = [
    {
      label: "Current Streak",
      value: streak > 0 ? String(streak) : "—",
      unit: "Weeks",
      barColor: "bg-green-700",
    },
    {
      label: "This Week",
      value: String(thisWeek),
      unit: "Sessions",
      barColor: thisWeek > 0 ? "bg-green-600" : "bg-stone-400",
    },
    {
      label: "Weekly Volume",
      value: volume > 0 ? volume.toLocaleString() : "—",
      unit: "KG",
      barColor: "bg-amber-600",
    },
    {
      label: "Personal Records",
      value: String(prCount),
      unit: "Count",
      barColor: "bg-green-800",
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
                  dark
                    ? "bg-neutral-900 border-neutral-800"
                    : "bg-white border-[#DAD7CD]/30"
                }`}
              />
            ))}
          </div>
          <div
            className={`rounded-xl border p-5 h-64 animate-pulse ${dark ? "bg-neutral-900 border-neutral-800" : "bg-white border-[#DAD7CD]/30"}`}
          />
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
            <StatCard key={i} label={s.label} value={s.value} unit={s.unit} barColor={s.barColor} />
          ))}
        </section>

        {/* Session PR banner */}
        {sessionPRs.length > 0 && (
          <div
            className={`rounded-xl border p-4 flex items-start gap-3 ${dark ? "bg-green-900/20 border-green-800/40" : "bg-[#4F6F52]/5 border-[#DAD7CD]"}`}
          >
            <Icon
              name="emoji_events"
              className={`text-xl flex-shrink-0 mt-0.5 ${dark ? "text-green-400" : "text-green-700"}`}
            />
            <div className="flex-1">
              <p
                className={`text-sm font-semibold mb-1 ${dark ? "text-green-300" : "text-green-800"}`}
              >
                New Personal Record{sessionPRs.length > 1 ? "s" : ""} this session!
              </p>
              {sessionPRs.map((pr) => (
                <p
                  key={pr.exercise.id}
                  className={`text-sm ${dark ? "text-green-200" : "text-green-900"}`}
                >
                  {pr.exercise.exercise_name} — {pr.maxWeightKg} kg
                  {pr.repsAtMax > 0 ? ` × ${pr.repsAtMax}` : ""}
                </p>
              ))}
            </div>
            <button
              onClick={() => setSessionPRs([])}
              className={`p-1 rounded ${dark ? "text-green-500 hover:text-green-300" : "text-green-600 hover:text-green-800"}`}
            >
              <Icon name="close" className="text-base" />
            </button>
          </div>
        )}

        {/* Section nav — underline tabs */}
        <div className={`flex border-b ${dark ? "border-neutral-800" : "border-[#DAD7CD]/40"}`}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeSection === s.id
                  ? dark
                    ? "border-green-500 text-green-400"
                    : "border-[#E27D60] text-[#E27D60]"
                  : dark
                    ? "border-transparent text-neutral-500 hover:text-neutral-300"
                    : "border-transparent text-[#A3B18A] hover:text-[#4F6F52]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Section content */}
        {activeSection === "log" && (
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2
                className={`text-xl font-bold tracking-tight ${dark ? "text-white" : "text-[#4F6F52]"}`}
              >
                Log a Workout
              </h2>
              {exercises.length === 0 && (
                <span
                  className={`text-xs font-medium ${dark ? "text-amber-400" : "text-[#A3B18A]"}`}
                >
                  Add exercises to the library first
                </span>
              )}
            </div>

            {/* Today's scheduled routines from the active plan */}
            {todayRoutines.length > 0 && !routinePreset && (
              <div className="mb-5 space-y-3">
                {todayRoutines.map((r) => (
                  <div
                    key={r.id}
                    className={`relative overflow-hidden rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between shadow-[0_10px_40px_-10px_rgba(47,62,47,0.08)] ${
                      dark ? "bg-green-900/40" : "bg-[#4F6F52]"
                    }`}
                  >
                    {/* Decorative circle */}
                    <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full -mr-24 -mt-24 pointer-events-none" />

                    <div className="relative z-10">
                      <span
                        className={`inline-block text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4 ${
                          dark ? "bg-green-800/60 text-green-300" : "bg-white/20 text-white"
                        }`}
                      >
                        Today's Plan
                      </span>
                      <h3 className="text-white text-2xl font-bold tracking-tight mb-1">
                        {r.routine_name}
                      </h3>
                      <p className="text-white/70 text-sm">
                        Start your scheduled session for today.
                      </p>
                    </div>

                    <button
                      onClick={() => startRoutine(r)}
                      className={`relative z-10 mt-6 md:mt-0 flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-transform hover:scale-105 ${
                        dark
                          ? "bg-neutral-900 text-white"
                          : "bg-white text-[#4F6F52]"
                      }`}
                    >
                      <Icon name="play_arrow" className="text-base" />
                      Start Routine
                    </button>
                  </div>
                ))}
              </div>
            )}
            <WorkoutLogger
              exercises={exercises}
              previousWorkouts={enrichedWorkouts}
              initialPreset={routinePreset}
              onCancel={() => setRoutinePreset(null)}
              onSaved={(prs) => {
                setRoutinePreset(null);
                if (prs.length > 0) setSessionPRs(prs);
                refreshWorkouts();
              }}
              onExerciseCreated={(e) => setExercises((prev) => [...prev, e])}
            />
          </Card>
        )}

        {activeSection === "history" && (
          <WorkoutHistory
            workouts={workouts}
            exercises={exercises}
            onRefresh={refreshWorkouts}
          />
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
              onStartWorkout={handleStartFromRoutine}
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
