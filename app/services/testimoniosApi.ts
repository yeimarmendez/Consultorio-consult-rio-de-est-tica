// app/services/testimoniosApi.ts
import type { Testimonio } from "../types/domain";
import { api } from "@/lib/api";


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** GET /testimonios — público, sin auth */
export async function getTestimoniosApi(): Promise<Testimonio[]> {
  const res = await fetch(`${API_BASE}/testimonios`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener testimonios");
  const data = await res.json();
  // normaliza campo BD: creado_en → creadoEn
  const lista = (data.testimonios ?? []) as Array<Record<string, unknown>>;
  return lista.map((t) => ({
    ...(t as unknown as Testimonio),
    creadoEn: (t.creadoEn ?? t.creado_en ?? "") as string,
  })) as Testimonio[];
}

/** POST /testimonios — admin, con Bearer token */
export async function createTestimonioApi(
  payload: Omit<Testimonio, "id" | "creadoEn">
): Promise<Testimonio> {
  const data = await api.post<{ ok: boolean; testimonio: Testimonio }>("/testimonios", payload);
  return data.testimonio;
}

/** PUT /testimonios/:id — admin, con Bearer token */
export async function updateTestimonioApi(
  id: number,
  payload: Partial<Omit<Testimonio, "id" | "creadoEn">>
): Promise<Testimonio> {
  const data = await api.put<{ ok: boolean; testimonio: Testimonio }>(`/testimonios/${id}`, payload);
  return data.testimonio;
}

/** DELETE /testimonios/:id — admin, con Bearer token */
export async function deleteTestimonioApi(id: number): Promise<void> {
  await api.delete(`/testimonios/${id}`);
}

export async function activarTestimonioApi(id: number): Promise<Testimonio> {
  return updateTestimonioApi(id, { activo: true });
}

export async function desactivarTestimonioApi(id: number): Promise<Testimonio> {
  return updateTestimonioApi(id, { activo: false });
}