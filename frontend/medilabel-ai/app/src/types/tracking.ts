// ── Supplements ───────────────────────────────────────────────────────────────

export interface Supplement {
  supplement_id: number;
  user_id: string;
  name: string;
  brand: string | null;
  form: string | null;
  dosage_amount: number | null;
  dosage_unit: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

// Sent to POST /api/supplements
export interface SupplementCreate {
  name: string;
  brand?: string;
  form?: string;
  dosage_amount?: number;
  dosage_unit?: string;
  notes?: string;
}

// Sent to PUT /api/supplements/:id — all fields optional (partial update)
export interface SupplementUpdate {
  name?: string;
  brand?: string;
  form?: string;
  dosage_amount?: number;
  dosage_unit?: string;
  notes?: string;
}

// One item in the daily supplement checklist
export interface SupplementTodayItem {
  supplement_id: number;
  name: string;
  brand: string | null;
  form: string | null;
  dosage_amount: number | null;
  dosage_unit: string | null;
  log_date: string;
  status: "taken" | "pending" | "skipped";
  taken_at: string | null;
  log_id: number | null;
}

// ── Medication schedules ───────────────────────────────────────────────────────

export interface Schedule {
  schedule_id: number;
  user_id: string;
  medication_id: number;
  stock_id: number | null;
  frequency: string;
  interval_hours: number | null;
  doses_per_day: number | null;
  start_date: string;
  end_date: string | null;
  doses_remaining: number | null;
  next_dose_at: string | null;
  created_at: string;
  updated_at: string | null;
  medication_name: string | null;
  stock_unit: string | null;
}

// Sent to POST /api/schedules
export interface ScheduleCreate {
  medication_id: number;
  stock_id?: number;
  frequency: string;
  interval_hours?: number;
  doses_per_day?: number;
  start_date: string;
  end_date?: string;
  doses_remaining?: number;
  next_dose_at?: string;
}

// One item in the daily medication dose list
export interface TodayDoseItem {
  schedule_id: number;
  medication_id: number;
  medication_name: string;
  frequency: string;
  doses_per_day: number | null;
  next_dose_at: string | null;
  doses_remaining: number | null;
  stock_unit: string | null;
  log_id: number | null;
  status: "taken" | "missed" | "pending";
  taken_at: string | null;
  is_overdue: boolean;
}

// Sent to POST /api/schedules/:id/log
export interface IntakeLogCreate {
  schedule_id: number;
  status: "taken" | "missed";
  taken_at?: string;
  notes?: string;
}
