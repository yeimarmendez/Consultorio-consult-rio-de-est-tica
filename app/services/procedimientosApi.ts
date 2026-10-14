// app/services/procedimientosApi.ts
import type { Procedimiento } from "../types/domain";
import { api } from "@/lib/api";


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** GET /procedimientos/:id — público, sin auth */
export async function getProcedimientoByIdApi(id: number): Promise<Procedimiento> {
  const res = await fetch(`${API_BASE}/procedimientos/${id}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "Procedimiento no encontrado");
  return data.data as Procedimiento;
}

/** GET /procedimientos — público, sin auth */
export async function getProcedimientosApi(): Promise<Procedimiento[]> {
  const res = await fetch(`${API_BASE}/procedimientos`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "Error al cargar procedimientos");
  return data.data as Procedimiento[];
}

/** POST /procedimientos — admin, con Bearer token */
export async function createProcedimientoApi(
  payload: Omit<Procedimiento, "id" | "galeria">
): Promise<Procedimiento> {
  const data = await api.post<{ ok: boolean; data: Procedimiento }>("/procedimientos", payload);
  return data.data;
}

/** PUT /procedimientos/:id — admin, con Bearer token */
export async function updateProcedimientoApi(
  id: number,
  payload: Partial<Omit<Procedimiento, "id">>
): Promise<Procedimiento> {
  const data = await api.put<{ ok: boolean; data: Procedimiento }>(`/procedimientos/${id}`, payload);
  return data.data;
}

/** DELETE /procedimientos/:id — admin, con Bearer token */
export async function deleteProcedimientoApi(id: number): Promise<void> {
  await api.delete(`/procedimientos/${id}`);
}