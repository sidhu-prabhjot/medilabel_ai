// ── Exercise library (global, shared) ─────────────────────────────────────────

export interface Exercise {
  id: number;
  exercise_name: string;
  muscle_group: string;
  equipment: string | null;
}

// ── Workout (logged session) ───────────────────────────────────────────────────

export interface Workout {
  id: number;
  user_id: string;
  workout_name: string;
  workout_date: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutCreate {
  workout_name: string;
  workout_date: string;
  duration_minutes?: number;
  notes?: string;
  routine_id?: number;
}

// ── Workout exercise (exercise entry within a logged workout) ──────────────────

export interface WorkoutExercise {
  id: number;
  workout_id: number;
  exercise_id: number;
  order_index: number | null;
}

// ── Set (actual logged set within a workout exercise) ─────────────────────────

export interface WorkoutSet {
  id: number;
  workout_exercise_id: number;
  reps: number | null;
  weight_kg: number | null;
  rest_seconds: number | null;
  rpe: number | null;
}

export interface SetCreate {
  reps?: number;
  weight_kg?: number;
  rest_seconds?: number;
  rpe?: number;
}

// ── Enriched types (joined client-side) ───────────────────────────────────────

export interface EnrichedWorkoutExercise {
  workoutExercise: WorkoutExercise;
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface EnrichedWorkout {
  workout: Workout;
  exercises: EnrichedWorkoutExercise[];
}

// ── Workout routines (templates) ──────────────────────────────────────────────

export interface WorkoutRoutine {
  id: number;
  user_id: string;
  routine_name: string;
  description: string | null;
  created_at: string;
}

export interface RoutineExercise {
  id: number;
  routine_id: number;
  exercise_id: number;
  order_index: number;
  notes: string | null;
}

export interface RoutineSet {
  id: number;
  routine_exercise_id: number;
  set_order: number;
  target_reps: number;
  target_weight: number | null;
  target_rpe: number | null;
  rest_seconds: number | null;
  notes: string | null;
}

export interface EnrichedRoutineExercise {
  routineExercise: RoutineExercise;
  exercise: Exercise;
  sets: RoutineSet[];
}

export interface EnrichedRoutine {
  routine: WorkoutRoutine;
  exercises: EnrichedRoutineExercise[];
}

// ── Weekly plans ───────────────────────────────────────────────────────────────

export interface WorkoutPlan {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PlanRoutineDay {
  id: number;
  plan_id: number;
  routine_id: number;
  weekday: number; // 0 = Monday … 6 = Sunday
  notes: string | null;
}

export interface PlanRestDay {
  id: number;
  plan_id: number;
  weekday: number; // 0 = Monday … 6 = Sunday
}

// ── Progress & PRs (derived client-side) ─────────────────────────────────────

export interface PersonalRecord {
  exercise: Exercise;
  maxWeightKg: number;
  repsAtMax: number;
  achievedAt: string; // workout_date
}

export interface ProgressPoint {
  date: string;
  maxWeightKg: number;
  totalVolume: number; // sum of reps × weight_kg for that session
}

// ── Generic API wrapper ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}
