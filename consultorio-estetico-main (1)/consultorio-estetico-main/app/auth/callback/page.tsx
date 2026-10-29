
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function completarAutenticacion() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const errorOAuth =
          params.get("error_description") ||
          params.get("error");

        if (errorOAuth) {
          if (activo) setError(errorOAuth);
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!activo) return;

        if (sessionError || !session) {
          setError(
            sessionError?.message ||
              "No se pudo completar el inicio de sesión."
          );
          return;
        }

        router.replace("/");
      } catch (err) {
        console.error("Error de autenticación:", err);

        if (activo) {
          setError(
            "Ocurrió un error al iniciar sesión con Google."
          );
        }
      }
    }

    completarAutenticacion();

    return () => {
      activo = false;
    };
  }, [router]);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        backgroundColor: "#FAF7F2",
      }}
    >
      <div className="text-center p-4">
        {error ? (
          <>
            <h3 style={{ color: "#8C2B2B" }}>
              Error de autenticación
            </h3>

            <p>{error}</p>

            <button
              className="btn"
              style={{
                backgroundColor: "#B08968",
                color: "white",
              }}
              onClick={() => router.replace("/login")}
            >
              Volver al inicio de sesión
            </button>
          </>
        ) : (
          <>
            <div
              className="spinner-border"
              style={{ color: "#B08968" }}
              role="status"
            />

            <h4
              className="mt-4"
              style={{ color: "#4E3B2B" }}
            >
              Iniciando sesión...
            </h4>

            <p style={{ color: "#8B6A4B" }}>
              Estamos verificando tu cuenta.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
