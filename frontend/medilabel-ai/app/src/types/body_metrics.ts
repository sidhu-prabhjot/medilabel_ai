// ── Body metric record ─────────────────────────────────────────────────────────
// Mirrors backend BodyMetricResponse schema (api/schemas/body_metric_record.py)

export interface BodyMetric {
  id: number;
  user_id: string;
  weight_kg: number;
  body_fat_percent: number | null;
  recorded_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null; // not present in DB schema — will be null
}

export interface BodyMetricCreate {
  weight_kg: number;
  body_fat_percent?: number;
  recorded_at?: string; // ISO string; defaults to now() on the backend
  notes?: string;
}

export interface BodyMetricUpdate {
  weight_kg?: number;
  body_fat_percent?: number;
  recorded_at?: string;
  notes?: string;
}

// ── Generic API wrapper ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}
