
import { api } from "@/lib/api";

export type EstadoCita = "pendiente" | "confirmada" | "atendida" | "cancelada";

export interface Cita {
  id: number;
  userId: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  procedimiento: string;
  tipoCita: "valoracion" | "implementacion";
  nota: string | null;
  fecha: string;
  hora: string;
  metodoPago: "Consultorio" | "Online" | null;
  tipoPagoConsultorio: "Efectivo" | "Tarjeta" | null;
  tipoPagoOnline: "PayU" | "PSE" | null;
  pagado: boolean;
  monto: number | null;
  montoPagado: number | null;
  montoRestante: number | null;
  creadaPor: "usuario" | "doctora";
  fechaCreacion: string;
  estado: EstadoCita;
  qrCita: string | null;
  motivoCancelacion: string | null;
}

/** GET /citas?fecha=YYYY-MM-DD */
export async function getCitasByDayAPI(
  fecha: string,
  estado?: string
): Promise<Cita[]> {
  const data = await api.get<{ ok: boolean; citas: Cita[] }>(
    `/citas?fecha=${fecha}`
  );
  let citas = data.citas ?? [];
  if (estado && estado !== "todos") {
    citas = citas.filter((c) => c.estado === estado);
  }
  return citas;
}

/** GET /citas — todas */
export async function getCitasAPI(): Promise<Cita[]> {
  const data = await api.get<{ ok: boolean; citas: Cita[] }>("/citas");
  return data.citas ?? [];
}

export async function confirmarCitaAPI(id: number): Promise<void> {
  await api.put(`/citas/${id}`, { estado: "confirmada" });
}

export async function cancelarCitaAPI(id: number, motivo: string): Promise<void> {
  await api.put(`/citas/${id}`, {
    estado: "cancelada",
    motivo_cancelacion: motivo,
  });
}

export async function updateCitaAPI(
  id: number,
  updates: Partial<Cita>
): Promise<void> {
  await api.put(`/citas/${id}`, updates);
}

export function formatCurrency(value: number): string {
  return "$ " + value.toLocaleString("es-CO");
}

export function ordenarCitasPorHora(citas: Cita[], asc = true): Cita[] {
  return [...citas].sort((a, b) => {
    return asc ? parseHora(a.hora) - parseHora(b.hora) : parseHora(b.hora) - parseHora(a.hora);
  });
}

function parseHora(hora: string): number {
  if (!hora) return 0;
  const match12 = hora.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    if (match12[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (match12[3].toUpperCase() === "AM" && hour === 12) hour = 0;
    return hour * 60 + minutes;
  }
  const match24 = hora.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  return 0;
}