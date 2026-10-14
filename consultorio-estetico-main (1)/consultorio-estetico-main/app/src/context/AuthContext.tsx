"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { api } from "@/lib/api";

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface AppUser {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  rol: "usuario" | "admin" | "developer" | "ayudante";
  photo?: string | null;
}

interface AuthContextValue {
  user: AppUser | null;          // usuario de NUESTRA tabla usuarios
  supabaseUser: User | null;     // usuario de Supabase Auth
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  supabaseUser: null,
  session: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /** Llama al backend para obtener/crear el usuario en nuestra tabla */
  async function syncUserWithBackend(token: string): Promise<AppUser | null> {
    try {
      const data = await api.post<{ ok: boolean; user: AppUser }>(
        "/auth/callback",
        { access_token: token }
      );
      return data.ok ? data.user : null;
    } catch (err) {
      console.error("Error sincronizando usuario con backend:", err);
      return null;
    }
  }

  /** Recarga el usuario desde el backend (útil tras editar perfil) */
  async function refreshUser() {
    try {
      const data = await api.get<{ ok: boolean; user: AppUser }>("/usuarios/me");
      if (data.ok) setUser(data.user);
    } catch (err) {
      console.error("Error recargando usuario:", err);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  }

  useEffect(() => {
    // 1. Sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.access_token) {
        const appUser = await syncUserWithBackend(session.access_token);
        setUser(appUser);
      }

      setLoading(false);
    });

    // 2. Escuchar cambios de auth (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.access_token) {
        const appUser = await syncUserWithBackend(session.access_token);
        setUser(appUser);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, supabaseUser, session, loading, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}