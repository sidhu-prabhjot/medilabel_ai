import api from "./axios";
import {
  ApiResponse,
  Exercise,
  Workout,
  WorkoutCreate,
  WorkoutExercise,
  WorkoutSet,
  SetCreate,
  WorkoutRoutine,
  RoutineExercise,
  RoutineSet,
  WorkoutPlan,
  PlanRoutineDay,
  PlanRestDay,
} from "../types/workouts";

// ── Exercises (global library) ─────────────────────────────────────────────────

export const getExercises = async (): Promise<Exercise[]> => {
  const res = await api.get<ApiResponse<Exercise[]>>("/api/exercises");
  return res.data.data;
};

export const createExercise = async (payload: {
  exercise_name: string;
  muscle_group: string;
  equipment?: string;
}): Promise<Exercise> => {
  const res = await api.post<ApiResponse<Exercise>>("/api/exercises", payload);
  return res.data.data;
};

// ── Workouts ───────────────────────────────────────────────────────────────────

export const getWorkouts = async (): Promise<Workout[]> => {
  const res = await api.get<ApiResponse<Workout[]>>("/api/workouts");
  return res.data.data;
};

export const createWorkout = async (payload: WorkoutCreate): Promise<Workout> => {
  const res = await api.post<ApiResponse<Workout>>("/api/workouts", payload);
  return res.data.data;
};

export const deleteWorkout = async (workoutId: number): Promise<void> => {
  await api.delete(`/api/workouts/${workoutId}`);
};

// ── Workout exercises ──────────────────────────────────────────────────────────

export const getWorkoutExercises = async (workoutId: number): Promise<WorkoutExercise[]> => {
  const res = await api.get<ApiResponse<WorkoutExercise[]>>(
    `/api/workouts/${workoutId}/exercises`,
  );
  return res.data.data;
};

export const addExerciseToWorkout = async (
  workoutId: number,
  exerciseId: number,
  orderIndex: number,
): Promise<WorkoutExercise> => {
  const res = await api.post<ApiResponse<WorkoutExercise>>(
    `/api/workouts/${workoutId}/exercises`,
    { exercise_id: exerciseId, order_index: orderIndex },
  );
  return res.data.data;
};

export const deleteWorkoutExercise = async (workoutExerciseId: number): Promise<void> => {
  await api.delete(`/api/workout-exercises/${workoutExerciseId}`);
};

// ── Sets ───────────────────────────────────────────────────────────────────────

export const getSets = async (workoutExerciseId: number): Promise<WorkoutSet[]> => {
  const res = await api.get<ApiResponse<WorkoutSet[]>>(
    `/api/workout-exercises/${workoutExerciseId}/sets`,
  );
  return res.data.data;
};

export const addSet = async (
  workoutExerciseId: number,
  payload: SetCreate,
): Promise<WorkoutSet> => {
  const res = await api.post<ApiResponse<WorkoutSet>>(
    `/api/workout-exercises/${workoutExerciseId}/sets`,
    payload,
  );
  return res.data.data;
};

export const deleteSet = async (setId: number): Promise<void> => {
  await api.delete(`/api/sets/${setId}`);
};

// ── Routines ───────────────────────────────────────────────────────────────────

export const getRoutines = async (): Promise<WorkoutRoutine[]> => {
  const res = await api.get<ApiResponse<WorkoutRoutine[]>>("/api/workout-routines");
  return res.data.data;
};

export const createRoutine = async (payload: {
  routine_name: string;
  description?: string;
}): Promise<WorkoutRoutine> => {
  const res = await api.post<ApiResponse<WorkoutRoutine>>("/api/workout-routines", payload);
  return res.data.data;
};

export const deleteRoutine = async (routineId: number): Promise<void> => {
  await api.delete(`/api/workout-routines/${routineId}`);
};

export const getRoutineExercises = async (routineId: number): Promise<RoutineExercise[]> => {
  const res = await api.get<ApiResponse<RoutineExercise[]>>(
    `/api/workout-routines/${routineId}/exercises`,
  );
  return res.data.data;
};

export const addExerciseToRoutine = async (
  routineId: number,
  exerciseId: number,
  orderIndex: number,
): Promise<RoutineExercise> => {
  const res = await api.post<ApiResponse<RoutineExercise>>(
    `/api/workout-routines/${routineId}/exercises`,
    { exercise_id: exerciseId, order_index: orderIndex },
  );
  return res.data.data;
};

export const deleteRoutineExercise = async (routineExerciseId: number): Promise<void> => {
  await api.delete(`/api/routine-exercises/${routineExerciseId}`);
};

export const getRoutineSets = async (routineExerciseId: number): Promise<RoutineSet[]> => {
  const res = await api.get<ApiResponse<RoutineSet[]>>(
    `/api/routine-exercises/${routineExerciseId}/sets`,
  );
  return res.data.data;
};

export const addRoutineSet = async (
  routineExerciseId: number,
  payload: {
    set_order: number;
    target_reps: number;
    target_weight?: number;
    target_rpe?: number;
    rest_seconds?: number;
  },
): Promise<RoutineSet> => {
  const res = await api.post<ApiResponse<RoutineSet>>(
    `/api/routine-exercises/${routineExerciseId}/sets`,
    payload,
  );
  return res.data.data;
};

export const deleteRoutineSet = async (setId: number): Promise<void> => {
  await api.delete(`/api/routine-sets/${setId}`);
};

// ── Plans ──────────────────────────────────────────────────────────────────────

export const getPlans = async (): Promise<WorkoutPlan[]> => {
  const res = await api.get<ApiResponse<WorkoutPlan[]>>("/api/workout-plans");
  return res.data.data;
};

export const createPlan = async (payload: {
  name: string;
  description?: string;
}): Promise<WorkoutPlan> => {
  const res = await api.post<ApiResponse<WorkoutPlan>>("/api/workout-plans", payload);
  return res.data.data;
};

export const deletePlan = async (planId: number): Promise<void> => {
  await api.delete(`/api/workout-plans/${planId}`);
};

export const activatePlan = async (planId: number): Promise<WorkoutPlan> => {
  const res = await api.patch<ApiResponse<WorkoutPlan>>(`/api/workout-plans/${planId}/activate`);
  return res.data.data;
};

export const getPlanDays = async (planId: number): Promise<PlanRoutineDay[]> => {
  const res = await api.get<ApiResponse<PlanRoutineDay[]>>(
    `/api/workout-plans/${planId}/days`,
  );
  return res.data.data;
};

export const addPlanDay = async (
  planId: number,
  payload: { routine_id: number; weekday: number; notes?: string },
): Promise<PlanRoutineDay> => {
  const res = await api.post<ApiResponse<PlanRoutineDay>>(
    `/api/workout-plans/${planId}/days`,
    payload,
  );
  return res.data.data;
};

export const deletePlanDay = async (
  planId: number,
  planDayId: number,
): Promise<void> => {
  await api.delete(`/api/workout-plans/${planId}/days/${planDayId}`);
};

// ── Rest days ──────────────────────────────────────────────────────────────────

export const getPlanRestDays = async (planId: number): Promise<PlanRestDay[]> => {
  const res = await api.get<ApiResponse<PlanRestDay[]>>(`/api/workout-plans/${planId}/rest-days`);
  return res.data.data;
};

export const addRestDay = async (planId: number, weekday: number): Promise<PlanRestDay> => {
  const res = await api.post<ApiResponse<PlanRestDay>>(`/api/workout-plans/${planId}/rest-days`, { weekday });
  return res.data.data;
};

export const deleteRestDay = async (planId: number, restDayId: number): Promise<void> => {
  await api.delete(`/api/workout-plans/${planId}/rest-days/${restDayId}`);
};
