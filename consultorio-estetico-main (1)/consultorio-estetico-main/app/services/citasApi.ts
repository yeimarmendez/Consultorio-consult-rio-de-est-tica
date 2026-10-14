// app/services/citasApi.ts
// Usa `api` (Bearer token automático) para rutas protegidas,
// y fetch público solo para bloqueos (ruta pública).

import type { Cita, BloqueoHora } from "../types/domain";
import { api } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ============================
//  C I T A S
// ============================

/** GET /citas?fecha=YYYY-MM-DD */
export async function getCitasByDayApi(fechaISO: string): Promise<Cita[]> {
  const data = await api.get<{ ok: boolean; citas: Cita[] }>(
    `/citas?fecha=${fechaISO}`
  );
  return data.citas ?? [];
}

/** GET /citas — todas las del usuario autenticado (o todas si es admin) */
export async function getCitasApi(): Promise<Cita[]> {
  const data = await api.get<{ ok: boolean; citas: Cita[] }>("/citas");
  return data.citas ?? [];
}

/** POST /citas */
export async function createCitaApi(
  payload: Omit<Cita, "id" | "fechaCreacion">
): Promise<Cita> {
  const data = await api.post<{ ok: boolean; cita: Cita }>("/citas", payload);
  if (!data.cita) throw new Error("Respuesta inválida al crear cita");
  return data.cita;
}

/** PUT /citas/:id */
export async function updateCitaApi(
  id: number,
  payload: Partial<Omit<Cita, "id" | "fechaCreacion">>
): Promise<void> {
  await api.put(`/citas/${id}`, payload);
}

/** DELETE /citas/:id — solo admin */
export async function deleteCitaApi(id: number): Promise<void> {
  await api.delete(`/citas/${id}`);
}

// ============================
//  B L O Q U E O S   D E   H O R A
// ============================

/** GET /bloqueos-horas?fechaISO=YYYY-MM-DD — público, sin auth */
export async function getBloqueosPorFechaApi(
  fechaISO: string
): Promise<BloqueoHora[]> {
  const res = await fetch(`${API_BASE}/bloqueos-horas?fechaISO=${fechaISO}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al obtener bloqueos de hora");
  const data = await res.json();
  return (data.bloqueos ?? []) as BloqueoHora[];
}

/** POST /bloqueos-horas — admin */
export async function createBloqueoHoraApi(
  payload: Omit<BloqueoHora, "id">
): Promise<BloqueoHora> {
  const data = await api.post<{ ok: boolean; bloqueo: BloqueoHora }>(
    "/bloqueos-horas",
    payload
  );
  if (!data.bloqueo) throw new Error("Respuesta inválida al crear bloqueo");
  return data.bloqueo;
}

/** DELETE /bloqueos-horas/:id — por ID */
export async function deleteBloqueoHoraApi(id: number): Promise<void> {
  await api.delete(`/bloqueos-horas/${id}`);
}

/** DELETE /bloqueos-horas/:fechaISO/:hora — por fecha+hora (panel horarios) */
export async function deleteBloqueoHoraByFechaApi(
  fechaISO: string,
  hora: string
): Promise<void> {
  await api.delete(`/bloqueos-horas/${fechaISO}/${encodeURIComponent(hora)}`);
}