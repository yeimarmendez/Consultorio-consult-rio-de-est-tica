
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RestablecerPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const parametros = new URLSearchParams(
      window.location.search
    );

    const errorEnlace =
      parametros.get("error_description") ||
      parametros.get("error");

    if (errorEnlace) {
      setError("El enlace es inválido o ha expirado.");
      setVerificando(false);
      return;
    }

    // Escuchar la autenticación del enlace de recuperación.
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((evento, sesion) => {
        if (!activo) return;

        if (evento === "PASSWORD_RECOVERY" && sesion) {
          setAutorizado(true);
          setError("");
          setVerificando(false);
        }
      });

    // Validar que exista una sesión autenticada.
    supabase.auth.getUser()
      .then(({ data, error: authError }) => {
        if (!activo) return;

        if (data.user && !authError) {
          setAutorizado(true);
          setError("");
        } else {
          setError(
            "No existe una sesión válida. Solicita un nuevo enlace."
          );
        }
      })
      .catch(() => {
        if (activo) {
          setError("No se pudo verificar el enlace.");
        }
      })
      .finally(() => {
        if (activo) setVerificando(false);
      });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  const cambiarPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    if (!autorizado) {
      setError("Debes abrir un enlace de recuperación válido.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password: password,
        });

      if (updateError) {
        throw updateError;
      }

      setExito(true);
      setPassword("");
      setConfirmar("");

      // Cerrar esta sesión para volver a iniciar con
      // la contraseña nueva.
      await supabase.auth.signOut({ scope: "local" });
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      setError(
        "No fue posible actualizar la contraseña. Verifica el enlace e inténtalo nuevamente."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <main
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #FAF9F7, #F1E9E0)",
        padding: "20px",
      }}
    >
      <div
        className="card shadow-lg border-0 rounded-4"
        style={{
          maxWidth: "460px",
          width: "100%",
          backgroundColor: "#FFFDF9",
        }}
      >
        <div className="card-body p-4 p-md-5">
          <h2
            className="text-center fw-bold mb-3"
            style={{ color: "#4E3B2B" }}
          >
            Nueva contraseña
          </h2>

          {verificando ? (
            <p className="text-center">
              Verificando enlace de recuperación...
            </p>
          ) : exito ? (
            <div className="text-center">
              <div className="alert alert-success" role="status">
                ¡Contraseña actualizada correctamente!
              </div>

              <button
                className="btn w-100"
                style={{
                  backgroundColor: "#B08968",
                  color: "white",
                }}
                onClick={() => router.push("/login")}
              >
                Iniciar sesión
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div
                  className="alert alert-danger"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {autorizado ? (
                <form onSubmit={cambiarPassword}>
                  <p className="text-muted text-center">
                    Ingresa tu nueva contraseña.
                  </p>

                  <label className="form-label">
                    Nueva contraseña
                  </label>

                  <input
                    className="form-control mb-3"
                    type={verPassword ? "text" : "password"}
                    value={password}
                    minLength={8}
                    required
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    autoComplete="new-password"
                  />

                  <label className="form-label">
                    Confirmar contraseña
                  </label>

                  <input
                    className="form-control mb-3"
                    type={verPassword ? "text" : "password"}
                    value={confirmar}
                    required
                    onChange={(e) =>
                      setConfirmar(e.target.value)
                    }
                    autoComplete="new-password"
                  />

                  <div className="form-check mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="verPassword"
                      checked={verPassword}
                      onChange={(e) =>
                        setVerPassword(e.target.checked)
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor="verPassword"
                    >
                      Mostrar contraseñas
                    </label>
                  </div>

                  <button
                    className="btn w-100 fw-semibold"
                    type="submit"
                    disabled={cargando}
                    style={{
                      backgroundColor: "#B08968",
                      color: "white",
                      borderRadius: "50px",
                    }}
                  >
                    {cargando
                      ? "Actualizando..."
                      : "Guardar nueva contraseña"}
                  </button>
                </form>
              ) : (
                <button
                  className="btn w-100"
                  onClick={() => router.push("/recuperar")}
                  style={{
                    backgroundColor: "#B08968",
                    color: "white",
                  }}
                >
                  Solicitar otro enlace
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

