import api from "./axios";
import { ApiResponse } from "../types/health_products";
import {
  Supplement,
  SupplementCreate,
  SupplementUpdate,
  SupplementTodayItem,
  Schedule,
  ScheduleCreate,
  TodayDoseItem,
  IntakeLogCreate,
} from "../types/tracking";

// ── Supplements ───────────────────────────────────────────────────────────────

export const getSupplements = async (): Promise<Supplement[]> => {
  const response = await api.get<ApiResponse<Supplement[]>>("/api/supplements");
  return response.data.data;
};

export const getSupplementsToday = async (): Promise<SupplementTodayItem[]> => {
  const response = await api.get<ApiResponse<SupplementTodayItem[]>>("/api/supplements/today");
  return response.data.data;
};

export const createSupplement = async (payload: SupplementCreate): Promise<Supplement> => {
  const response = await api.post<ApiResponse<Supplement>>("/api/supplements", payload);
  return response.data.data;
};

export const updateSupplement = async (
  supplementId: number,
  payload: SupplementUpdate,
): Promise<Supplement> => {
  const response = await api.put<ApiResponse<Supplement>>(
    `/api/supplements/${supplementId}`,
    payload,
  );
  return response.data.data;
};

export const deleteSupplement = async (supplementId: number): Promise<void> => {
  await api.delete(`/api/supplements/${supplementId}`);
};

// Toggles today's log: pending → taken, taken → pending
export const toggleSupplementLog = async (
  supplementId: number,
): Promise<SupplementTodayItem> => {
  const response = await api.post<ApiResponse<SupplementTodayItem>>(
    `/api/supplements/${supplementId}/log`,
  );
  return response.data.data;
};

// ── Medication schedules ───────────────────────────────────────────────────────

export const getSchedules = async (): Promise<Schedule[]> => {
  const response = await api.get<ApiResponse<Schedule[]>>("/api/schedules");
  return response.data.data;
};

export const getSchedulesToday = async (): Promise<TodayDoseItem[]> => {
  const response = await api.get<ApiResponse<TodayDoseItem[]>>("/api/schedules/today");
  return response.data.data;
};

export const createSchedule = async (payload: ScheduleCreate): Promise<Schedule> => {
  const response = await api.post<ApiResponse<Schedule>>("/api/schedules", payload);
  return response.data.data;
};

export const deleteSchedule = async (scheduleId: number): Promise<void> => {
  await api.delete(`/api/schedules/${scheduleId}`);
};

export const logDose = async (
  scheduleId: number,
  payload: IntakeLogCreate,
): Promise<void> => {
  await api.post(`/api/schedules/${scheduleId}/log`, payload);
};
