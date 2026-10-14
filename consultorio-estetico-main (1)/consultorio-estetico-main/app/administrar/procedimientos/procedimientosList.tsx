"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

type Categoria = "Facial" | "Corporal" | "Capilar";

interface Procedimiento {
  id: number; nombre: string; desc: string;
  precio: number | string; imagen: string;
  categoria: Categoria; duracionMin?: number; destacado?: boolean;
}

const emptyForm = {
  nombre: "", desc: "", precio: "",
  imagen: "", categoria: "Facial" as Categoria,
  duracionMin: "", destacado: false,
};

export default function ProcedimientosList() {
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [modo, setModo] = useState<"lista" | "crear" | "editar">("lista");
  const [actual, setActual] = useState<Procedimiento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProcedimientos = () => {
    api.get<{ ok: boolean; data: Procedimiento[] }>("/procedimientos")
      .then((res) => { if (res.ok) setProcedimientos(res.data); })
      .catch(console.error);
  };

  useEffect(() => { loadProcedimientos(); }, []);

  /* ── Subir imagen al bucket "procedimientos" ──────────────────────────── */
  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("procedimientos")                                    // ✅ bucket correcto
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("procedimientos").getPublicUrl(path);
      setForm((prev) => ({ ...prev, imagen: data.publicUrl }));
    } catch (e: any) {
      setError("Error subiendo imagen: " + e.message);
    } finally {
      setUploadingImg(false);
    }
  };

  /* ── Guardar ──────────────────────────────────────────────────────────── */
  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.desc.trim()) {
      setError("Nombre y descripción son obligatorios."); return;
    }
    setSaving(true); setError(null);
    try {
      const body = {
        nombre: form.nombre,
        desc: form.desc,
        precio: Number(form.precio) || 0,
        imagen: form.imagen,
        categoria: form.categoria,
        duracionMin: Number(form.duracionMin) || null,
        destacado: form.destacado,
      };
      if (modo === "crear") {
        await api.post("/procedimientos", body);
      } else if (actual) {
        await api.put(`/procedimientos/${actual.id}`, body);
      }
      loadProcedimientos();
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Eliminar ─────────────────────────────────────────────────────────── */
  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este procedimiento?")) return;
    try {
      await api.delete(`/procedimientos/${id}`);
      loadProcedimientos();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const resetForm = () => { setForm(emptyForm); setModo("lista"); setActual(null); };

  const startEditar = (p: Procedimiento) => {
    setActual(p);
    setForm({
      nombre: p.nombre, desc: p.desc,
      precio: String(p.precio), imagen: p.imagen,
      categoria: p.categoria,
      duracionMin: p.duracionMin ? String(p.duracionMin) : "",
      destacado: p.destacado || false,
    });
    setModo("editar");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: "#4E3B2B" }}>Procedimientos</h2>
        {modo === "lista" && (
          <button
            onClick={() => setModo("crear")}
            className="btn rounded-pill px-4"
            style={{ backgroundColor: "#8B6A4B", color: "#fff", border: "none" }}
          >
            + Nuevo procedimiento
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

      {/* FORMULARIO */}
      <AnimatePresence>
        {(modo === "crear" || modo === "editar") && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="card border-0 rounded-4 shadow-sm p-4 mb-5"
            style={{ backgroundColor: "#FFFDF9" }}
          >
            <h4 className="fw-semibold mb-4" style={{ color: "#4E3B2B" }}>
              {modo === "crear" ? "Nuevo procedimiento" : "Editar procedimiento"}
            </h4>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Nombre *</label>
                <input
                  className="form-control"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Precio (COP)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Duración (min)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.duracionMin}
                  onChange={(e) => setForm({ ...form, duracionMin: e.target.value })}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Descripción *</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Categoría</label>
                <select
                  className="form-select"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}
                  style={{ borderColor: "#E9DED2" }}
                >
                  <option>Facial</option>
                  <option>Corporal</option>
                  <option>Capilar</option>
                </select>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={form.destacado}
                    onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
                    id="destacado"
                  />
                  <label className="form-check-label small fw-semibold" htmlFor="destacado">
                    Destacado
                  </label>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Imagen</label>
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    style={{ maxWidth: 280, borderColor: "#E9DED2" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                  />
                  {uploadingImg && (
                    <div className="spinner-border spinner-border-sm" style={{ color: "#B08968" }} role="status" />
                  )}
                  {form.imagen && !uploadingImg && (
                    <img
                      src={form.imagen}
                      alt="preview"
                      style={{ height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid #E9DED2" }}
                    />
                  )}
                </div>
                <small className="text-muted">O pega una URL:</small>
                <input
                  className="form-control mt-1"
                  placeholder="https://..."
                  value={form.imagen}
                  onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
            </div>

            <div className="d-flex gap-3 mt-4">
              <button
                onClick={handleGuardar}
                disabled={saving || uploadingImg}
                className="btn rounded-pill fw-semibold flex-1"
                style={{ backgroundColor: "#8B6A4B", color: "#fff", border: "none" }}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button
                onClick={resetForm}
                className="btn rounded-pill fw-semibold"
                style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "none" }}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTA */}
      {procedimientos.length === 0 ? (
        <p className="text-center py-5" style={{ color: "#8B7060" }}>No hay procedimientos aún.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {procedimientos.map((p) => (
            <div
              key={p.id}
              className="card border-0 rounded-4 shadow-sm p-3 d-flex flex-row align-items-center gap-3"
              style={{ backgroundColor: "#FFFDF9" }}
            >
              {p.imagen && (
                <img
                  src={p.imagen}
                  alt={p.nombre}
                  style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid #E9DED2", flexShrink: 0 }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <span className="fw-bold" style={{ color: "#4E3B2B" }}>{p.nombre}</span>
                  <span className="badge rounded-pill px-2" style={{ backgroundColor: "#E9DED2", color: "#8B6A4B", fontSize: "0.72rem" }}>
                    {p.categoria}
                  </span>
                  {p.destacado && (
                    <span className="badge rounded-pill px-2" style={{ backgroundColor: "#FFF3E6", color: "#B08968", fontSize: "0.72rem" }}>
                      ⭐ Destacado
                    </span>
                  )}
                </div>
                <p className="small mb-0 text-truncate" style={{ color: "#6C584C" }}>{p.desc}</p>
                {p.precio !== undefined && (
                  <p className="small mb-0 fw-semibold" style={{ color: "#B08968" }}>
                    ${Number(p.precio).toLocaleString("es-CO")} COP
                  </p>
                )}
              </div>
              <div className="d-flex gap-2 flex-shrink-0">
                <button
                  onClick={() => startEditar(p)}
                  className="btn btn-sm rounded-pill"
                  style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "none" }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleEliminar(p.id)}
                  className="btn btn-sm rounded-pill"
                  style={{ backgroundColor: "#fff3ef", color: "#b02e2e", border: "1px solid #e4bfbf" }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}