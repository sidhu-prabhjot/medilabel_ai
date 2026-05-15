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
  stock_id: number;
  dose_amount: number;
  dose_unit: string | null;
  frequency_per_day: number;
  interval_hours: number | null;
  start_date: string;
  end_date: string | null;
  next_dose_at: string | null;
  created_at: string;
  medication_name: string | null;
  stock_unit: string | null;
}

// Sent to POST /api/schedules
export interface ScheduleCreate {
  medication_id: number;
  stock_id: number;
  dose_amount: number;
  dose_unit?: string;
  frequency_per_day: number;
  interval_hours?: number;
  start_date: string;
  end_date?: string;
  next_dose_at?: string;
}

// One item in the daily medication dose list
export interface TodayDoseItem {
  schedule_id: number;
  medication_id: number;
  medication_name: string;
  frequency_per_day: number;
  dose_amount: number;
  dose_unit: string | null;
  next_dose_at: string | null;
  stock_unit: string | null;
  intake_id: number | null;
  status: "taken" | "missed" | "pending";
  taken_at: string | null;
  is_overdue: boolean;
}

// Sent to POST /api/schedules/:id/log
export interface IntakeLogCreate {
  schedule_id: number;
  dose_amount: number;
  was_missed: boolean;
  taken_at?: string;
  notes?: string;
}
