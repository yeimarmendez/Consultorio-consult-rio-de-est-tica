"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

interface Charla {
  id: number; titulo: string; descripcion: string;
  detalle: string; imagen: string; galeria?: string[]; fecha?: string;
}

const emptyForm = {
  titulo: "", descripcion: "", detalle: "",
  imagen: "", galeria: [] as string[], fecha: "",
};

export default function CharlasList() {
  const [charlas, setCharlas] = useState<Charla[]>([]);
  const [modo, setModo] = useState<"lista" | "crear" | "editar">("lista");
  const [actual, setActual] = useState<Charla | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCharlas = () => {
    api.get<{ ok: boolean; charlas: Charla[] }>("/charlas")
      .then((res) => { if (res.ok) setCharlas(res.charlas); })
      .catch(console.error);
  };

  useEffect(() => { loadCharlas(); }, []);

  /* ── Imagen principal → backend──────────────── */
  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Obtener token de Supabase para el Bearer
      const { supabase } = await import("@/lib/supabaseClient");
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/charlas/upload-imagen?bucket=charlas`,
        {
          method: "POST",
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Error subiendo imagen");
      setForm((prev) => ({ ...prev, imagen: data.url }));
    } catch (e: any) {
      setError("Error subiendo imagen: " + e.message);
    } finally {
      setUploadingImg(false);
    }
  };

  /* ── Galería → backend ───────────────────────── */
  const handleGaleriaUpload = async (files: FileList | null) => {
    if (!files) return;
    const { supabase } = await import("@/lib/supabaseClient");
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/charlas/upload-imagen?bucket=charlas&folder=galeria`,
          { method: "POST", headers, body: formData }
        );
        const data = await res.json();
        if (!res.ok || !data.ok) { setError("Error subiendo galería: " + data.error); continue; }
        setForm((prev) => ({ ...prev, galeria: [...prev.galeria, data.url] }));
      } catch (e: any) {
        setError("Error subiendo galería: " + e.message);
      }
    }
  };

  /* ── Guardar ──────────────────────────────────────────────────────────── */
  const handleGuardar = async () => {
    if (!form.titulo.trim() || !form.descripcion.trim() || !form.detalle.trim()) {
      setError("Título, descripción y detalle son obligatorios."); return;
    }
    setSaving(true); setError(null);
    try {
      const body = { ...form, fecha: form.fecha || null };
      if (modo === "crear") {
        await api.post("/charlas", body);
      } else if (actual) {
        await api.put(`/charlas/${actual.id}`, body);
      }
      loadCharlas();
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Eliminar ─────────────────────────────────────────────────────────── */
  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta charla?")) return;
    try {
      await api.delete(`/charlas/${id}`);
      loadCharlas();
    } catch (e: any) { setError(e.message); }
  };

  const resetForm = () => { setForm(emptyForm); setModo("lista"); setActual(null); };
  const startEditar = (c: Charla) => {
    setActual(c);
    setForm({
      titulo: c.titulo, descripcion: c.descripcion, detalle: c.detalle,
      imagen: c.imagen, galeria: c.galeria || [], fecha: c.fecha || "",
    });
    setModo("editar");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: "#4E3B2B" }}>Formación / Charlas</h2>
        {modo === "lista" && (
          <button
            onClick={() => setModo("crear")}
            className="btn rounded-pill px-4"
            style={{ backgroundColor: "#8B6A4B", color: "#fff", border: "none" }}
          >
            + Nueva charla
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

      {/* FORMULARIO */}
      <AnimatePresence>
        {(modo === "crear" || modo === "editar") && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="card border-0 rounded-4 shadow-sm p-4 mb-5"
            style={{ backgroundColor: "#FFFDF9" }}
          >
            <h4 className="fw-semibold mb-4" style={{ color: "#4E3B2B" }}>
              {modo === "crear" ? "Nueva charla" : "Editar charla"}
            </h4>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label small fw-semibold">Título *</label>
                <input
                  className="form-control"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Descripción corta *</label>
                <textarea
                  rows={2}
                  className="form-control"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Detalle completo *</label>
                <textarea
                  rows={4}
                  className="form-control"
                  value={form.detalle}
                  onChange={(e) => setForm({ ...form, detalle: e.target.value })}
                  style={{ borderColor: "#E9DED2" }}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Imagen principal</label>
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
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Galería (múltiples fotos)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="form-control"
                  style={{ maxWidth: 320, borderColor: "#E9DED2" }}
                  onChange={(e) => handleGaleriaUpload(e.target.files)}
                />
                {form.galeria.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap mt-2">
                    {form.galeria.map((url, i) => (
                      <div key={i} className="position-relative">
                        <img
                          src={url}
                          alt={`galería ${i}`}
                          style={{ height: 52, width: 52, borderRadius: 6, objectFit: "cover", border: "1px solid #E9DED2" }}
                        />
                        <button
                          className="position-absolute top-0 end-0 rounded-circle border-0 d-flex align-items-center justify-content-center"
                          style={{ width: 18, height: 18, backgroundColor: "#b02e2e", color: "#fff", fontSize: "0.6rem", lineHeight: 1 }}
                          onClick={() =>
                            setForm((prev) => ({ ...prev, galeria: prev.galeria.filter((_, j) => j !== i) }))
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
      {charlas.length === 0 ? (
        <p className="text-center py-5" style={{ color: "#8B7060" }}>No hay charlas aún.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {charlas.map((c) => (
            <div
              key={c.id}
              className="card border-0 rounded-4 shadow-sm p-3 d-flex flex-row gap-3 align-items-start"
              style={{ backgroundColor: "#FFFDF9" }}
            >
              {c.imagen && (
                <img
                  src={c.imagen}
                  alt={c.titulo}
                  style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: "1px solid #E9DED2", flexShrink: 0 }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="fw-bold mb-1" style={{ color: "#4E3B2B" }}>{c.titulo}</p>
                <p className="small mb-0 text-truncate" style={{ color: "#6C584C" }}>{c.descripcion}</p>
                {c.fecha && (
                  <p className="small mb-0" style={{ color: "#8B7060" }}>📅 {c.fecha}</p>
                )}
              </div>
              <div className="d-flex gap-2 flex-shrink-0">
                <button
                  onClick={() => startEditar(c)}
                  className="btn btn-sm rounded-pill"
                  style={{ backgroundColor: "#E9DED2", color: "#4E3B2B", border: "none" }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleEliminar(c.id)}
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