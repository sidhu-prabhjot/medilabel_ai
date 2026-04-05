import api from "./axios";
import {
  ApiResponse,
  Medication,
  SearchResult,
  StockFormValues,
  StockRecord,
  SymptomLog,
  SymptomLogCreate,
} from "../types/health_products";

// ── Medication search ──────────────────────────────────────────────────────────

export const searchMedications = async (
  medicationTerm: string,
): Promise<SearchResult[]> => {
  const response = await api.get<ApiResponse<SearchResult[]>>(
    "/api/medications/search",
    { params: { medication_term: medicationTerm } },
  );
  return response.data.data;
};

// ── Medication CRUD ────────────────────────────────────────────────────────────

export const addMedication = async (payload: {
  rxcui: string;
  name: string;
  tty: string;
}): Promise<Medication> => {
  const response = await api.post<ApiResponse<Medication[]>>("/api/medications", payload);
  return response.data.data[0];
};

export const getMedication = async (medicationId: number): Promise<Medication> => {
  const response = await api.get<ApiResponse<Medication>>(
    `/api/medications/${medicationId}`,
  );
  return response.data.data;
};

export const deleteMedication = async (medicationId: number): Promise<void> => {
  await api.delete(`/api/medications/${medicationId}`);
};

// ── Stock ──────────────────────────────────────────────────────────────────────

export const addStock = async (
  medicationId: number,
  stock: StockFormValues,
): Promise<StockRecord> => {
  const response = await api.post<ApiResponse<StockRecord[]>>(
    `/api/medications/${medicationId}/stock`,
    stock,
  );
  return response.data.data[0];
};

export const getUserMedications = async (): Promise<StockRecord[]> => {
  const response = await api.get<ApiResponse<StockRecord[]>>("/api/user/medications");
  return response.data.data;
};

// ── Symptoms ───────────────────────────────────────────────────────────────────

export const getSymptoms = async (): Promise<SymptomLog[]> => {
  const response = await api.get<ApiResponse<SymptomLog[]>>("/api/symptoms");
  return response.data.data;
};

export const addSymptom = async (payload: SymptomLogCreate): Promise<SymptomLog> => {
  const response = await api.post<ApiResponse<SymptomLog[]>>("/api/symptoms", payload);
  return response.data.data[0];
};

export const deleteSymptom = async (symptomId: string): Promise<void> => {
  await api.delete(`/api/symptoms/${symptomId}`);
};

// Mark a symptom as resolved via PUT /api/symptoms/{id}
export const resolveSymptom = async (symptomId: string): Promise<SymptomLog> => {
  const response = await api.put<ApiResponse<SymptomLog>>(`/api/symptoms/${symptomId}`, {
    is_resolved: true,
  });
  return response.data.data;
};
