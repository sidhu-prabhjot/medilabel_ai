"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import Card from "../../src/components/card";
import Icon from "../../src/components/icon";
import { useTheme } from "../../src/context/theme-context";
import { EnrichedWorkout, Exercise, PersonalRecord } from "../../src/types/workouts";

interface Props {
  enrichedWorkouts: EnrichedWorkout[];
  exercises: Exercise[];
  loading: boolean;
}

// ── ISO week key helper (YYYY-Www) ─────────────────────────────────────────────

function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + 4 - day);
  const year = thursday.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((thursday.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
  return `W${String(week).padStart(2, "0")}`;
}

// ── PR computation ─────────────────────────────────────────────────────────────

function computePRs(enrichedWorkouts: EnrichedWorkout[]): PersonalRecord[] {
  // exerciseId → { maxWeightKg, repsAtMax, achievedAt }
  const best = new Map<
    number,
    { exercise: Exercise; maxWeightKg: number; repsAtMax: number; achievedAt: string }
  >();

  const sorted = [...enrichedWorkouts].sort(
    (a, b) =>
      new Date(a.workout.workout_date).getTime() -
      new Date(b.workout.workout_date).getTime(),
  );

  for (const ew of sorted) {
    for (const ee of ew.exercises) {
      for (const s of ee.sets) {
        if (!s.weight_kg) continue;
        const prev = best.get(ee.exercise.id);
        if (!prev || s.weight_kg > prev.maxWeightKg) {
          best.set(ee.exercise.id, {
            exercise: ee.exercise,
            maxWeightKg: s.weight_kg,
            repsAtMax: s.reps ?? 0,
            achievedAt: ew.workout.workout_date,
          });
        }
      }
    }
  }

  return Array.from(best.values()).sort((a, b) =>
    a.exercise.exercise_name.localeCompare(b.exercise.exercise_name),
  );
}

// ── Progress data per exercise ─────────────────────────────────────────────────

function progressForExercise(
  enrichedWorkouts: EnrichedWorkout[],
  exerciseId: number,
) {
  const points: { date: string; maxWeightKg: number; totalVolume: number }[] = [];

  const sorted = [...enrichedWorkouts].sort(
    (a, b) =>
      new Date(a.workout.workout_date).getTime() -
      new Date(b.workout.workout_date).getTime(),
  );

  for (const ew of sorted) {
    for (const ee of ew.exercises) {
      if (ee.exercise.id !== exerciseId) continue;
      let max = 0;
      let vol = 0;
      for (const s of ee.sets) {
        if (s.weight_kg && s.weight_kg > max) max = s.weight_kg;
        if (s.reps && s.weight_kg) vol += s.reps * s.weight_kg;
      }
      if (max > 0 || vol > 0) {
        points.push({
          date: ew.workout.workout_date.slice(5), // MM-DD
          maxWeightKg: max,
          totalVolume: vol,
        });
      }
    }
  }

  return points;
}

export default function WorkoutCharts({ enrichedWorkouts, exercises, loading }: Props) {
  const { dark } = useTheme();
  const heading = dark ? "text-white" : "text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const tooltipStyle = {
    backgroundColor: dark ? "#1e293b" : "#fff",
    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
    borderRadius: 8,
    color: dark ? "#f1f5f9" : "#0f172a",
    fontSize: 12,
  };

  const [selectedExerciseId, setSelectedExerciseId] = useState<number | "">("");

  // ── Derived chart data ─────────────────────────────────────────────────────────

  const { weeklyFreq, weeklyVolume, prs, progressData } = useMemo(() => {
    const freqMap = new Map<string, number>();
    const volMap = new Map<string, number>();

    for (const ew of enrichedWorkouts) {
      const key = isoWeekKey(ew.workout.workout_date);
      freqMap.set(key, (freqMap.get(key) ?? 0) + 1);
      let vol = 0;
      for (const ee of ew.exercises) {
        for (const s of ee.sets) {
          if (s.reps && s.weight_kg) vol += s.reps * s.weight_kg;
        }
      }
      volMap.set(key, (volMap.get(key) ?? 0) + vol);
    }

    const allWeeks = [...new Set([...freqMap.keys(), ...volMap.keys()])].sort().slice(-8);

    const weeklyFreq = allWeeks.map((w) => ({ week: w, count: freqMap.get(w) ?? 0 }));
    const weeklyVolume = allWeeks.map((w) => ({
      week: w,
      volume: Math.round(volMap.get(w) ?? 0),
    }));

    const prs = computePRs(enrichedWorkouts);
    const progressData =
      selectedExerciseId !== ""
        ? progressForExercise(enrichedWorkouts, selectedExerciseId as number)
        : [];

    return { weeklyFreq, weeklyVolume, prs, progressData };
  }, [enrichedWorkouts, selectedExerciseId]);

  // Exercises that have at least one set with weight data (for the picker)
  const trackedExercises = useMemo(() => {
    const ids = new Set<number>();
    for (const ew of enrichedWorkouts) {
      for (const ee of ew.exercises) {
        if (ee.sets.some((s) => s.weight_kg)) ids.add(ee.exercise.id);
      }
    }
    return exercises.filter((e) => ids.has(e.id));
  }, [enrichedWorkouts, exercises]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center gap-2 py-10 text-sm ${muted}`}>
        <Icon name="progress_activity" className="text-base animate-spin" />
        Loading progress data…
      </div>
    );
  }

  if (enrichedWorkouts.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
        <Icon name="bar_chart" className="text-4xl opacity-40" />
        <p className="text-sm">Log workouts to see charts and progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly frequency + volume */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className={`text-sm font-semibold mb-4 ${heading}`}>Workouts per Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyFreq} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Workouts"]} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className={`text-sm font-semibold mb-4 ${heading}`}>Weekly Volume (kg)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyVolume} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, "Volume"]} />
              <Bar dataKey="volume" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Exercise progress */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className={`text-sm font-semibold ${heading}`}>Exercise Progress</h3>
          <select
            value={selectedExerciseId}
            onChange={(e) =>
              setSelectedExerciseId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              dark
                ? "bg-slate-700 border-slate-600 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
          >
            <option value="">Select exercise…</option>
            {trackedExercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.exercise_name}
              </option>
            ))}
          </select>
        </div>

        {selectedExerciseId === "" ? (
          <p className={`text-sm text-center py-6 ${muted}`}>
            Select an exercise to view your progress over time.
          </p>
        ) : progressData.length < 2 ? (
          <p className={`text-sm text-center py-6 ${muted}`}>
            Not enough data yet — log this exercise in at least 2 sessions.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={progressData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#f1f5f9"} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => [
                  `${v} kg`,
                  name === "maxWeightKg" ? "Max Weight" : "Volume",
                ]}
              />
              <Line
                type="monotone"
                dataKey="maxWeightKg"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 4 }}
                activeDot={{ r: 6 }}
                name="maxWeightKg"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Personal records */}
      <Card>
        <h3 className={`text-sm font-semibold mb-4 ${heading}`}>Personal Records</h3>
        {prs.length === 0 ? (
          <p className={`text-sm ${muted}`}>No weight data recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b text-left ${dark ? "border-slate-700" : "border-slate-200"}`}>
                <th className={`py-2 font-medium text-xs uppercase tracking-wide ${muted}`}>Exercise</th>
                <th className={`font-medium text-xs uppercase tracking-wide ${muted}`}>Muscle</th>
                <th className={`font-medium text-xs uppercase tracking-wide text-right ${muted}`}>Best Weight</th>
                <th className={`font-medium text-xs uppercase tracking-wide text-right ${muted}`}>Reps</th>
                <th className={`font-medium text-xs uppercase tracking-wide text-right ${muted}`}>Achieved</th>
              </tr>
            </thead>
            <tbody>
              {prs.map((pr) => (
                <tr
                  key={pr.exercise.id}
                  className={`border-b transition-colors ${dark ? "border-slate-700" : "border-slate-100"}`}
                >
                  <td className={`py-2.5 font-medium ${heading}`}>{pr.exercise.exercise_name}</td>
                  <td className={`text-xs ${muted}`}>{pr.exercise.muscle_group}</td>
                  <td className="text-right tabular-nums">
                    <span className={`text-sm font-semibold ${dark ? "text-indigo-300" : "text-indigo-600"}`}>
                      {pr.maxWeightKg} kg
                    </span>
                  </td>
                  <td className={`text-right tabular-nums text-sm ${muted}`}>
                    {pr.repsAtMax > 0 ? `× ${pr.repsAtMax}` : "—"}
                  </td>
                  <td className={`text-right text-xs ${muted}`}>
                    {new Date(pr.achievedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
