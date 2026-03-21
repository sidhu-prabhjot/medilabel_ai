// ── Medication (global medications table) ─────────────────────────────────────

export interface Medication {
  medication_id: number;
  rxcui: string;
  name: string;
  generic_rxcui: string | null;
  is_brand: boolean;
  created_at: string;
  updated_at: string;
}

// Raw shape returned by RxNav when a medication is not yet in the DB
export interface RxNavProperties {
  rxcui: string;
  name: string;
  tty: string;
  language: string;
  suppress: string;
  umlscui: string;
}

export interface RxNavResult {
  properties: RxNavProperties;
}

// A single item from GET /api/medications/search — either a DB record or raw RxNav
export type SearchResult = Medication | RxNavResult;

export function isDbMedication(r: SearchResult): r is Medication {
  return "medication_id" in r;
}

export function isRxNavResult(r: SearchResult): r is RxNavResult {
  return "properties" in r;
}

// ── Stock record (user_medication_stock table) ─────────────────────────────────

export interface StockRecord {
  stock_id: number;
  user_id: string;
  medication_id: number;
  quantity: number | null;
  unit: string | null;
  expiration_date: string | null;
  opened_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface StockFormValues {
  quantity?: number;
  unit?: string;
  expiration_date?: string;
  opened_at?: string;
  notes?: string;
}

// Stock record enriched with medication details
export interface UserMedication {
  stock: StockRecord;
  medication: Medication;
}

// ── Symptom log ────────────────────────────────────────────────────────────────

export interface SymptomLog {
  symptom_id: string;
  user_id: string;
  symptom: string;
  severity: number;
  notes: string | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface SymptomLogCreate {
  symptom: string;
  severity: number;
  notes?: string;
  is_resolved?: boolean;
}

// ── Generic API wrapper ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}
