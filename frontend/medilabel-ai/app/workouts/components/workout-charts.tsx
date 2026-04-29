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

function computePRs(enrichedWorkouts: EnrichedWorkout[]): PersonalRecord[] {
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
          date: ew.workout.workout_date.slice(5),
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
  const heading = dark ? "text-white" : "text-[#4F6F52]";
  const muted   = dark ? "text-neutral-400" : "text-[#A3B18A]";

  const tickColor  = dark ? "#737373" : "#A3B18A";
  const gridColor  = dark ? "#262626" : "#DAD7CD";

  const tooltipStyle = {
    backgroundColor: dark ? "#171717" : "#fff",
    border: `1px solid ${dark ? "#262626" : "#DAD7CD"}`,
    borderRadius: 8,
    color: dark ? "#f5f5f5" : "#4F6F52",
    fontSize: 12,
  };

  const [selectedExerciseId, setSelectedExerciseId] = useState<number | "">("");

  const { weeklyFreq, weeklyVolume, prs, progressData } = useMemo(() => {
    const freqMap = new Map<string, number>();
    const volMap  = new Map<string, number>();

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

    const weeklyFreq   = allWeeks.map((w) => ({ week: w, count: freqMap.get(w) ?? 0 }));
    const weeklyVolume = allWeeks.map((w) => ({
      week: w,
      volume: Math.round(volMap.get(w) ?? 0),
    }));

    const prs          = computePRs(enrichedWorkouts);
    const progressData =
      selectedExerciseId !== ""
        ? progressForExercise(enrichedWorkouts, selectedExerciseId as number)
        : [];

    return { weeklyFreq, weeklyVolume, prs, progressData };
  }, [enrichedWorkouts, selectedExerciseId]);

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
          <h3 className={`text-[11px] font-bold tracking-[0.2em] uppercase mb-5 ${muted}`}>
            Workouts per Week
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyFreq} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Workouts"]} />
              <Bar dataKey="count" fill="#4F6F52" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className={`text-[11px] font-bold tracking-[0.2em] uppercase mb-5 ${muted}`}>
            Weekly Volume (kg)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyVolume} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, "Volume"]} />
              <Bar dataKey="volume" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Exercise progress */}
      <Card>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className={`text-[11px] font-bold tracking-[0.2em] uppercase ${muted}`}>
            Exercise Progress
          </h3>
          <select
            value={selectedExerciseId}
            onChange={(e) =>
              setSelectedExerciseId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className={`text-sm px-3 py-2 rounded-lg border-none outline-none focus:ring-2 transition-colors ${
              dark
                ? "bg-neutral-800 text-white focus:ring-green-700"
                : "bg-[#F5F3EE] text-[#4F6F52] focus:ring-[#4F6F52]/20"
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
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
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
                stroke="#4F6F52"
                strokeWidth={2}
                dot={{ fill: "#4F6F52", r: 4 }}
                activeDot={{ r: 6 }}
                name="maxWeightKg"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Personal records */}
      <Card>
        <h3 className={`text-[11px] font-bold tracking-[0.2em] uppercase mb-5 ${muted}`}>
          Personal Records
        </h3>
        {prs.length === 0 ? (
          <p className={`text-sm ${muted}`}>No weight data recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`border-b text-left ${
                  dark ? "border-neutral-800" : "border-[#DAD7CD]/40"
                }`}
              >
                <th className={`py-2 font-bold text-[10px] uppercase tracking-[0.2em] ${muted}`}>Exercise</th>
                <th className={`font-bold text-[10px] uppercase tracking-[0.2em] ${muted}`}>Muscle</th>
                <th className={`font-bold text-[10px] uppercase tracking-[0.2em] text-right ${muted}`}>Best Weight</th>
                <th className={`font-bold text-[10px] uppercase tracking-[0.2em] text-right ${muted}`}>Reps</th>
                <th className={`font-bold text-[10px] uppercase tracking-[0.2em] text-right ${muted}`}>Achieved</th>
              </tr>
            </thead>
            <tbody>
              {prs.map((pr) => (
                <tr
                  key={pr.exercise.id}
                  className={`border-b transition-colors ${
                    dark ? "border-neutral-800" : "border-[#DAD7CD]/20"
                  }`}
                >
                  <td className={`py-3 font-semibold ${heading}`}>{pr.exercise.exercise_name}</td>
                  <td className={`text-xs ${muted}`}>{pr.exercise.muscle_group}</td>
                  <td className="text-right tabular-nums">
                    <span
                      className={`text-sm font-bold ${
                        dark ? "text-green-400" : "text-[#4F6F52]"
                      }`}
                    >
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
