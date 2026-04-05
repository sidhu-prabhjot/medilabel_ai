import api from "./axios";
import {
  ApiResponse,
  BodyMetric,
  BodyMetricCreate,
  BodyMetricUpdate,
} from "../types/body_metrics";

// ── Fetch all entries for the current user ─────────────────────────────────────

export const getBodyMetrics = async (): Promise<BodyMetric[]> => {
  const response = await api.get<ApiResponse<BodyMetric[]>>("/api/body-metrics");
  return response.data.data;
};

// ── Fetch the most recent entry — returns null if none exist ───────────────────

export const getLatestBodyMetric = async (): Promise<BodyMetric | null> => {
  try {
    const response = await api.get<ApiResponse<BodyMetric>>("/api/body-metrics/latest");
    return response.data.data;
  } catch {
    // Backend returns 404 when the user has no entries yet
    return null;
  }
};

// ── Create a new entry ─────────────────────────────────────────────────────────

export const addBodyMetric = async (payload: BodyMetricCreate): Promise<BodyMetric> => {
  const response = await api.post<ApiResponse<BodyMetric>>("/api/body-metrics", payload);
  return response.data.data;
};

// ── Update an existing entry ───────────────────────────────────────────────────

export const updateBodyMetric = async (
  id: number,
  payload: BodyMetricUpdate,
): Promise<BodyMetric> => {
  const response = await api.put<ApiResponse<BodyMetric>>(`/api/body-metrics/${id}`, payload);
  return response.data.data;
};

// ── Delete an entry ────────────────────────────────────────────────────────────

export const deleteBodyMetric = async (id: number): Promise<void> => {
  await api.delete(`/api/body-metrics/${id}`);
};
