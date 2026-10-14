"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

const HORAS_BASE = [
  "08:00 AM","08:30 AM","09:00 AM","09:30 AM",
  "10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","01:00 PM","01:30 PM",
  "02:00 PM","02:30 PM","03:00 PM","03:30 PM",
  "04:00 PM","04:30 PM","05:00 PM","05:30 PM","06:00 PM",
];

interface Bloqueo { id?: number; fechaISO: string; hora: string; motivo: string; }

export default function HorariosHabilitados() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [citasOcupadas, setCitasOcupadas] = useState<Set<string>>(new Set());
  const [loadingDia, setLoadingDia] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [motivoNuevo, setMotivoNuevo] = useState("Bloqueo manual");

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2500);
  };

  /* ── Cargar bloqueos y citas del día seleccionado ─────────────────────── */
  const cargarDia = async (fechaISO: string) => {
    setLoadingDia(true);
    try {
      const [bloqRes, citasRes] = await Promise.all([
        api.get<{ ok: boolean; bloqueos: Bloqueo[] }>(`/bloqueos-horas?fechaISO=${fechaISO}`),
        api.get<{ ok: boolean; citas: { hora: string; estado: string; nombres: string; procedimiento: string }[] }>(`/citas?fecha=${fechaISO}`),
      ]);
      if (bloqRes.ok) setBloqueos(bloqRes.bloqueos);
      if (citasRes.ok) {
        const ocupadas = new Set(
          citasRes.citas.filter((c) => c.estado !== "cancelada").map((c) => c.hora)
        );
        setCitasOcupadas(ocupadas);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingDia(false); }
  };

  const seleccionarDia = (iso: string) => {
    setSelectedDate(iso); cargarDia(iso);
  };

  /* ── Bloquear hora ───────────────────────────────────────────────────── */
  const handleBloquear = async (hora: string) => {
    if (!selectedDate) return;
    try {
      await api.post("/bloqueos-horas", { fechaISO: selectedDate, hora, motivo: motivoNuevo });
      showToast(`Hora ${hora} bloqueada`);
      cargarDia(selectedDate);
    } catch (e: any) { showToast("Error: " + e.message); }
  };

  /* ── Desbloquear hora ────────────────────────────────────────────────── */
  const handleDesbloquear = async (hora: string) => {
    if (!selectedDate) return;
    try {
      await api.delete(`/bloqueos-horas/${selectedDate}/${encodeURIComponent(hora)}`);
      showToast(`Hora ${hora} desbloqueada`);
      cargarDia(selectedDate);
    } catch (e: any) { showToast("Error: " + e.message); }
  };

  const esBloqueada = (hora: string) => bloqueos.some((b) => b.hora === hora);
  const esCita = (hora: string) => citasOcupadas.has(hora);

  // Generar días del mes
  const primerDia = new Date(anio, mes, 1).getDay() || 7;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasCal: (number | null)[] = [];
  for (let i = 1; i < primerDia; i++) diasCal.push(null);
  for (let d = 1; d <= diasEnMes; d++) diasCal.push(d);

  const nombresMes = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  return (
    <div>
      <h2 className="fw-bold mb-4" style={{ color: "#4E3B2B" }}>Gestión de Horarios</h2>

      {/* Toast */}
      {toast && (
        <div className="alert rounded-3 py-2 px-4 mb-3 text-center fw-semibold" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "1px solid #D4C4B0" }}>
          {toast}
        </div>
      )}

      <div className="row g-4">
        {/* CALENDARIO */}
        <div className="col-md-5">
          <div className="rounded-4 p-4 shadow-sm" style={{ backgroundColor: "#FFFDF9", border: "1px solid #E9DED2" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <button onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); }} className="btn btn-sm rounded-circle" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B" }}>‹</button>
              <h5 className="fw-semibold m-0" style={{ color: "#4E3B2B" }}>{nombresMes[mes]} {anio}</h5>
              <button onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a + 1); } else setMes(m => m + 1); }} className="btn btn-sm rounded-circle" style={{ backgroundColor: "#E9DED2", color: "#4E3B2B" }}>›</button>
            </div>

            <div className="d-grid mb-2" style={{ gridTemplateColumns: "repeat(7,1fr)", textAlign: "center" }}>
              {["L","M","X","J","V","S","D"].map((d) => (
                <div key={d} style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8B7060" }}>{d}</div>
              ))}
            </div>

            <div className="d-grid" style={{ gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
              {diasCal.map((dia, i) => {
                if (!dia) return <div key={`e-${i}`} />;
                const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                const isSelected = iso === selectedDate;
                return (
                  <motion.button key={dia} whileHover={{ scale: 1.1 }} onClick={() => seleccionarDia(iso)}
                    style={{
                      width: 34, height: 34, borderRadius: "50%", border: "none", margin: "0 auto",
                      backgroundColor: isSelected ? "#8B6A4B" : "#F5EEE6",
                      color: isSelected ? "#fff" : "#4E3B2B",
                      fontWeight: isSelected ? 700 : 400, fontSize: "0.82rem", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >{dia}</motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* HORAS DEL DÍA */}
        <div className="col-md-7">
          {!selectedDate ? (
            <div className="rounded-4 p-5 text-center" style={{ backgroundColor: "#FFFDF9", border: "1px solid #E9DED2" }}>
              <p style={{ color: "#8B7060" }}>Selecciona un día para gestionar las horas.</p>
            </div>
          ) : (
            <div className="rounded-4 p-4 shadow-sm" style={{ backgroundColor: "#FFFDF9", border: "1px solid #E9DED2" }}>
              <h5 className="fw-semibold mb-3" style={{ color: "#4E3B2B" }}>📅 {selectedDate}</h5>

              {/* Motivo de bloqueo */}
              <div className="mb-3 d-flex gap-2 align-items-center">
                <input
                  className="form-control form-control-sm"
                  placeholder="Motivo del bloqueo"
                  value={motivoNuevo}
                  onChange={(e) => setMotivoNuevo(e.target.value)}
                  style={{ borderColor: "#E9DED2", maxWidth: 260 }}
                />
              </div>

              {loadingDia ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm" style={{ color: "#B08968" }} role="status" />
                </div>
              ) : (
                <div className="d-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {HORAS_BASE.map((hora) => {
                    const bloqueada = esBloqueada(hora);
                    const citada = esCita(hora);
                    return (
                      <button
                        key={hora}
                        onClick={() => { if (!citada) bloqueada ? handleDesbloquear(hora) : handleBloquear(hora); }}
                        disabled={citada}
                        className="btn btn-sm rounded-pill fw-semibold py-2"
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: citada ? "#EEF7EE" : bloqueada ? "#FDE8D8" : "#F5EEE6",
                          color: citada ? "#2D6A4F" : bloqueada ? "#922B21" : "#4E3B2B",
                          border: citada ? "1px solid #A8D8B9" : bloqueada ? "1px solid #F0A898" : "1px solid #E9DED2",
                          cursor: citada ? "not-allowed" : "pointer",
                        }}
                        title={citada ? "Hora con cita activa" : bloqueada ? "Click para desbloquear" : "Click para bloquear"}
                      >
                        {citada ? "🗓" : bloqueada ? "🔒" : "✓"} {hora}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Leyenda */}
              <div className="d-flex gap-3 mt-3 flex-wrap" style={{ fontSize: "0.75rem", color: "#8B7060" }}>
                <span>✓ Disponible</span>
                <span>🔒 Bloqueada (click para desbloquear)</span>
                <span>🗓 Con cita activa</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}