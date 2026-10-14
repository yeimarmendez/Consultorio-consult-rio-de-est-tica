"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";

// ✅ Importar Cita desde la fuente única — helpers.ts
import type { Cita } from "../../administrar/citas/helpers";

// ✅ Componentes
import CitasAgendadasCard from "../../administrar/citas/citasAgendadasCard";
import CitasAgendadasModal from "../../administrar/citas/citasAgendadasModal"; 

export default function CitasAgendadas() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Cita | null>(null);
  const [ascendente, setAscendente] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);

  // ── Cargar citas del día seleccionado ─────────────────────────────────
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingCitas(true);
    api.get<{ ok: boolean; citas: Cita[] }>(`/citas?fecha=${selectedDate}`)
      .then((res) => { if (res.ok) setCitas(res.citas); })
      .catch(console.error)
      .finally(() => setLoadingCitas(false));
  }, [selectedDate]);

  // ── Citas filtradas y ordenadas ────────────────────────────────────────
  const citasDia = useMemo(() => {
    let lista = [...citas];
    if (filtroEstado !== "todos") lista = lista.filter((c) => c.estado === filtroEstado);
    return lista.sort((a, b) =>
      ascendente ? a.hora.localeCompare(b.hora) : b.hora.localeCompare(a.hora)
    );
  }, [citas, ascendente, filtroEstado]);

  // ── Resumen del día ────────────────────────────────────────────────────
  const resumen = useMemo(() => ({
    pendiente:  citas.filter((c) => c.estado === "pendiente").length,
    confirmada: citas.filter((c) => c.estado === "confirmada").length,
    atendida:   citas.filter((c) => c.estado === "atendida").length,
    cancelada:  citas.filter((c) => c.estado === "cancelada").length,
  }), [citas]);

  // ── Refrescar tras actualizar ──────────────────────────────────────────
  const handleUpdated = () => {
    if (!selectedDate) return;
    api.get<{ ok: boolean; citas: Cita[] }>(`/citas?fecha=${selectedDate}`)
      .then((res) => { if (res.ok) { setCitas(res.citas); setDetalle(null); } })
      .catch(console.error);
  };

  // ── Calendario ─────────────────────────────────────────────────────────
  const primerDia = new Date(anio, mes, 1).getDay() || 7;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diasCal: (number | null)[] = [];
  for (let i = 1; i < primerDia; i++) diasCal.push(null);
  for (let d = 1; d <= diasEnMes; d++) diasCal.push(d);

  const nombresMes = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];

  const irMesAnterior = () => {
    if (mes === 0) { setMes(11); setAnio((a) => a - 1); } else setMes((m) => m - 1);
  };
  const irMesSiguiente = () => {
    if (mes === 11) { setMes(0); setAnio((a) => a + 1); } else setMes((m) => m + 1);
  };

  const seleccionarDia = (dia: number) => {
    const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    setSelectedDate(iso);
    setCitas([]);
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-[#4E3B2B]">Mis Citas Agendadas</h2>

      {/* ── CALENDARIO ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white shadow-sm border border-[#E9DED2] p-5">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={irMesAnterior}
            className="btn btn-sm rounded-circle"
            style={{ backgroundColor: "#E9DED2", color: "#4E3B2B" }}
          >
            ‹
          </button>
          <h3 className="font-semibold text-[#4E3B2B]">
            {nombresMes[mes]} {anio}
          </h3>
          <button
            onClick={irMesSiguiente}
            className="btn btn-sm rounded-circle"
            style={{ backgroundColor: "#E9DED2", color: "#4E3B2B" }}
          >
            ›
          </button>
        </div>

        <div className="d-grid" style={{ gridTemplateColumns: "repeat(7,1fr)", gap: 4, textAlign: "center" }}>
          {["L","M","X","J","V","S","D"].map((d) => (
            <div key={d} style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8B7060", paddingBottom: 4 }}>
              {d}
            </div>
          ))}

          {diasCal.map((dia, i) => {
            if (!dia) return <div key={`e-${i}`} />;
            const iso = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            const isSelected = iso === selectedDate;
            return (
              <motion.button
                key={`d-${dia}`}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => seleccionarDia(dia)}
                style={{
                  width: 34, height: 34,
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: isSelected ? "#8B6A4B" : "#F5EEE6",
                  color: isSelected ? "#fff" : "#4E3B2B",
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {dia}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── CITAS DEL DÍA ──────────────────────────────────────────────── */}
      {selectedDate && (
        <div className="rounded-2xl bg-white shadow-sm border border-[#E9DED2] p-5">
          {/* Cabecera + filtros */}
          <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
            <h4 className="font-semibold text-[#4E3B2B] flex items-center gap-2">
              <CalendarDays size={18} /> {selectedDate}
            </h4>

            <div className="flex gap-2 flex-wrap">
              {["todos","pendiente","confirmada","atendida","cancelada"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroEstado(f)}
                  className="btn btn-sm rounded-pill text-capitalize"
                  style={{
                    backgroundColor: filtroEstado === f ? "#8B6A4B" : "#F5EEE6",
                    color: filtroEstado === f ? "#fff" : "#4E3B2B",
                    border: "none",
                  }}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={() => setAscendente((a) => !a)}
                className="btn btn-sm rounded-pill"
                style={{ backgroundColor: "#F5EEE6", color: "#4E3B2B", border: "none" }}
              >
                {ascendente ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Hora
              </button>
            </div>
          </div>

          {/* Resumen */}
          <div className="d-flex gap-3 flex-wrap mb-4">
            {Object.entries(resumen).map(([estado, count]) => (
              <span
                key={estado}
                className="badge rounded-pill px-3 py-2 text-capitalize fw-semibold"
                style={{ backgroundColor: "#E9DED2", color: "#4E3B2B" }}
              >
                {estado}: {count}
              </span>
            ))}
          </div>

          {/* Lista */}
          {loadingCitas ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm" style={{ color: "#B08968" }} role="status" />
            </div>
          ) : citasDia.length === 0 ? (
            <p className="text-center py-4" style={{ color: "#8B7060" }}>
              No hay citas{filtroEstado !== "todos" ? ` con estado "${filtroEstado}"` : ""} para este día.
            </p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {citasDia.map((cita) => (
                <CitasAgendadasCard
  key={cita.id}
  cita={cita}
  onVerDetalles={(cita) => setDetalle(cita)} 
/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL DETALLE ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {detalle && (
          <CitasAgendadasModal
            cita={detalle}
            onClose={() => setDetalle(null)}
            onUpdated={handleUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}