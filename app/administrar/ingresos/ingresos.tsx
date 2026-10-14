"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import HistorialReportes from "./historialReportes";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

interface Resumen {
  total_citas_historico: number;
  total_atendidas: number;
  total_canceladas: number;
  total_pendientes: number;
  citas_este_mes: number;
  citas_hoy: number;
  procedimientos_distintos_usados: number;
  pacientes_unicos: number;
}

interface TopProc {
  nombre: string;
  categoria: string;
  imagen: string;
  total: number;
  atendidas: number;
  tasa_exito_pct: number;
}

interface CitasMes {
  mes: string;
  mes_num: number;
  anio: number;
  total_citas: number;
  atendidas: number;
  canceladas: number;
}

const COLORES = ["#B08968","#8B6A4B","#C9AD8D","#7F5539","#D6B895","#6B4E3D"];

export default function IngresosPage() {
  const [resumen, setResumen]       = useState<Resumen | null>(null);
  const [topProcs, setTopProcs]     = useState<TopProc[]>([]);
  const [citasMes, setCitasMes]     = useState<CitasMes[]>([]);
  const [loading, setLoading]       = useState(true);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [guardandoReporte, setGuardandoReporte] = useState(false);
  const [toast, setToast]           = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      api.get<{ ok: boolean; data: Resumen }>("/analytics/resumen"),
      api.get<{ ok: boolean; data: TopProc[] }>("/analytics/top-mes"),
      api.get<{ ok: boolean; data: CitasMes[] }>("/analytics/citas-por-mes?meses=6"),
    ])
      .then(([r, t, c]) => {
        if (r.ok) setResumen(r.data);
        if (t.ok) setTopProcs(t.data);
        if (c.ok) setCitasMes(c.data.reverse()); // más antiguo primero para el gráfico
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Guardar reporte manual ──────────────────────────────── */
  const handleGuardarReporte = async () => {
    const hoy = new Date();
    setGuardandoReporte(true);
    try {
      await api.post("/reportes", {
        mes:  hoy.getMonth() + 1,
        anio: hoy.getFullYear(),
      });
      showToast("✅ Reporte guardado correctamente");
    } catch (e: any) {
      showToast("❌ Error: " + e.message);
    } finally {
      setGuardandoReporte(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: "#B08968" }} role="status" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="fw-bold m-0" style={{ color: "#4E3B2B" }}>Analytics del Consultorio</h2>
        <button onClick={handleGuardarReporte} disabled={guardandoReporte}
          className="btn rounded-pill fw-semibold px-4"
          style={{ backgroundColor: "#8B6A4B", color: "#fff", border: "none" }}>
          {guardandoReporte ? "Guardando…" : "💾 Guardar reporte del mes"}
        </button>
      </div>

      {toast && (
        <div className="alert rounded-3 py-2 px-4 mb-4 text-center fw-semibold"
          style={{ backgroundColor: "#E9DED2", color: "#4E3B2B" }}>
          {toast}
        </div>
      )}

      {/* KPIs GENERALES */}
      {resumen && (
        <div className="row g-3 mb-5">
          {[
            { label: "Citas hoy",        value: resumen.citas_hoy,                  color: "#1B4F72", bg: "#D6EAF8" },
            { label: "Citas este mes",   value: resumen.citas_este_mes,             color: "#2D6A4F", bg: "#D8F3DC" },
            { label: "Total atendidas",  value: resumen.total_atendidas,            color: "#7F5539", bg: "#F5EEE6" },
            { label: "Pacientes únicos", value: resumen.pacientes_unicos,           color: "#6B4E3D", bg: "#EDE0D4" },
            { label: "Canceladas",       value: resumen.total_canceladas,           color: "#922B21", bg: "#FADBD8" },
            { label: "Procedimientos usados", value: resumen.procedimientos_distintos_usados, color: "#5B2C6F", bg: "#E8DAEF" },
          ].map((k) => (
            <div key={k.label} className="col-md-4 col-6">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-4 p-4 text-center shadow-sm"
                style={{ backgroundColor: k.bg, border: `1px solid ${k.color}22` }}>
                <p className="small fw-semibold mb-1" style={{ color: k.color }}>{k.label}</p>
                <h3 className="fw-bold m-0" style={{ color: k.color }}>{k.value ?? 0}</h3>
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* TOP PROCEDIMIENTOS ESTE MES */}
      {topProcs.length > 0 && (
        <div className="rounded-4 p-4 shadow-sm mb-5" style={{ backgroundColor: "#FFFDF9", border: "1px solid #E9DED2" }}>
          <h5 className="fw-semibold mb-4" style={{ color: "#4E3B2B" }}>
            🏆 Top procedimientos este mes
          </h5>
          <div className="d-flex flex-column gap-3">
            {topProcs.map((p, i) => (
              <div key={p.nombre} className="d-flex align-items-center gap-3">
                <span className="fw-bold" style={{ color: "#B08968", minWidth: 24 }}>#{i + 1}</span>
                {p.imagen && (
                  <img src={p.imagen} alt={p.nombre}
                    style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover",
                      border: "1px solid #E9DED2", flexShrink: 0 }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="fw-semibold mb-0 text-truncate" style={{ color: "#4E3B2B" }}>{p.nombre}</p>
                  <p className="small mb-0" style={{ color: "#8B7060" }}>
                    {p.total} citas · {p.atendidas} atendidas · {p.tasa_exito_pct}% éxito
                  </p>
                </div>
                {/* Barra de progreso */}
                <div style={{ minWidth: 80 }}>
                  <div className="rounded-pill overflow-hidden" style={{ height: 8, backgroundColor: "#E9DED2" }}>
                    <div style={{
                      width: `${p.tasa_exito_pct}%`, height: "100%",
                      backgroundColor: COLORES[i % COLORES.length], transition: "width 0.6s",
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRÁFICO TENDENCIA MENSUAL */}
      {citasMes.length > 0 && (
        <div className="rounded-4 p-4 shadow-sm mb-5" style={{ backgroundColor: "#FFFDF9", border: "1px solid #E9DED2" }}>
          <h5 className="fw-semibold mb-4" style={{ color: "#4E3B2B" }}>📈 Tendencia últimos 6 meses</h5>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={citasMes} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9DED2" />
              <XAxis dataKey="mes_num"
                tickFormatter={(v) => MESES[v - 1]?.slice(0, 3) || v}
                tick={{ fontSize: 12, fill: "#8B7060" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8B7060" }} />
              <Tooltip
                formatter={(v: number, name: string) => [v, name === "total_citas" ? "Total" : name === "atendidas" ? "Atendidas" : "Canceladas"]}
                labelFormatter={(v) => MESES[Number(v) - 1] || v}
              />
              <Bar dataKey="total_citas" name="total_citas" radius={[4,4,0,0]}>
                {citasMes.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* HISTORIAL DE REPORTES */}
      <div className="mt-2">
        <button onClick={() => setMostrarHistorial((v) => !v)}
          className="btn rounded-pill fw-semibold px-4 mb-3"
          style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "none" }}>
          {mostrarHistorial ? "▲ Ocultar" : "▼ Ver"} historial de reportes
        </button>
        {mostrarHistorial && <HistorialReportes />}
      </div>
    </div>
  );
}