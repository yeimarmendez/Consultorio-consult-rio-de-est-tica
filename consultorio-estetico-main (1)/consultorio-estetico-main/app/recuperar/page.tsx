
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RecuperarPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMensaje("");

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo:
              `${window.location.origin}/restablecer`,
          }
        );

      if (resetError) {
        throw resetError;
      }

      setMensaje(
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam."
      );
    } catch (err) {
      console.error("Error de recuperación:", err);
      setError(
        "No se pudo procesar la solicitud. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{
        background:
          "linear-gradient(180deg, #FAF9F7 0%, #F1E9E0 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="container text-center">
        <div className="col-md-6 mx-auto">
          <div
            className="card shadow-lg border-0 rounded-4"
            style={{ backgroundColor: "#FFFDF9" }}
          >
            <div className="card-body p-5">
              <h2
                className="fw-bold mb-3"
                style={{
                  color: "#4E3B2B",
                  fontFamily:
                    "'Playfair Display', serif",
                }}
              >
                Recuperar contraseña
              </h2>

              <p className="text-muted mb-4">
                Ingresa tu correo electrónico para
                recibir un enlace de recuperación.
              </p>

              {mensaje && (
                <div
                  className="alert alert-success"
                  role="status"
                >
                  {mensaje}
                </div>
              )}

              {error && (
                <div
                  className="alert alert-danger"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  className="form-control mb-3"
                  placeholder="tucorreo@dominio.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  style={{
                    borderColor: "#E9DED2",
                    backgroundColor: "#FFFDF9",
                  }}
                />

                <button
                  type="submit"
                  className="btn w-100 py-2 fw-semibold"
                  disabled={loading}
                  style={{
                    backgroundColor: "#B08968",
                    border: "none",
                    color: "#FFF",
                    borderRadius: "50px",
                  }}
                >
                  {loading
                    ? "Enviando enlace..."
                    : "Enviar enlace"}
                </button>
              </form>

              <button
                type="button"
                className="btn btn-link mt-3"
                style={{ color: "#B08968" }}
                onClick={() =>
                  router.push("/login")
                }
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
