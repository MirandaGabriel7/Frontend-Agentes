import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../infra/supabaseClient";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userId: string | null;
  orgIdAtiva: string | null;
  authLoading: boolean;
  orgLoading: boolean;

  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null; hasOrg?: boolean }>;

  signOut: () => Promise<void>;

  refreshOrg: () => Promise<boolean>;

  // ✅ NOVO: força re-carregar user (user_metadata etc) para atualizar topbar/menus na hora
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_ORG_ID = "planco_active_org_id";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [orgIdAtiva, setOrgIdAtiva] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(false);

  const isDev = useMemo(
    () => import.meta.env?.MODE === "development" || import.meta.env?.DEV === true,
    []
  );

  // Buscar org_id do usuário
  const fetchUserOrg = async (uid: string): Promise<string | null> => {
    if (!supabase) {
      if (isDev) console.warn("[AuthContext] Supabase não configurado, não é possível buscar org");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("org_members")
        .select("org_id, role")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error) {
        if (isDev) console.warn("[AuthContext] Erro ao buscar org do usuário:", error);
        return null;
      }

      if (data) {
        const orgId = data.org_id as string;
        if (isDev) console.debug("[AuthContext] Org encontrada:", { orgId, role: data.role });
        return orgId;
      }

      return null;
    } catch (err) {
      if (isDev) console.error("[AuthContext] Erro ao buscar org:", err);
      return null;
    }
  };

  // ✅ NOVO: refresh do usuário (puxa metadata atualizado e força rerender na UI)
  const refreshUser = async (): Promise<void> => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (isDev) console.warn("[AuthContext] Erro ao refreshUser:", error);
        return;
      }

      if (data?.user) {
        setUser(data.user);
        setUserId(data.user.id);

        // mantém session coerente quando possível (sem depender de onAuthStateChange)
        setSession((prev) => (prev ? { ...prev, user: data.user } : prev));

        if (isDev) console.debug("[AuthContext] ✅ user atualizado via refreshUser");
      }
    } catch (err) {
      if (isDev) console.error("[AuthContext] Erro inesperado no refreshUser:", err);
    }
  };

  // Refresh org (útil quando o usuário trocar de org no futuro)
  // Retorna true se encontrou org, false se não encontrou
  const refreshOrg = async (): Promise<boolean> => {
    if (!userId) return false;

    const orgId = await fetchUserOrg(userId);
    if (orgId) {
      setOrgIdAtiva(orgId);
      localStorage.setItem(STORAGE_KEY_ORG_ID, orgId);
      if (isDev) console.debug("[AuthContext] Org refreshada:", orgId);
      return true;
    } else {
      setOrgIdAtiva(null);
      localStorage.removeItem(STORAGE_KEY_ORG_ID);
      if (isDev) console.debug("[AuthContext] Org não encontrada no refresh");
      return false;
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const error = new Error("Supabase não está configurado. Verifique as variáveis de ambiente.");
      if (isDev) console.error("[AuthContext]", error.message);
      return { error, hasOrg: false };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (isDev) console.error("[AuthContext] Erro ao fazer login:", error);
        return { error, hasOrg: false };
      }

      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        setUserId(data.user.id);

        // O useEffect [userId] vai carregar a org automaticamente
        const hasOrg = !!localStorage.getItem(STORAGE_KEY_ORG_ID);

        if (isDev) {
          console.debug("[AuthContext] Login bem-sucedido:", {
            userId: data.user.id,
            hasOrg,
          });
        }

        return { error: null, hasOrg };
      }

      return { error: null, hasOrg: false };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido ao fazer login");
      if (isDev) console.error("[AuthContext] Erro ao fazer login:", err);
      return { error, hasOrg: false };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      if (supabase) await supabase.auth.signOut();

      setSession(null);
      setUser(null);
      setUserId(null);
      setOrgIdAtiva(null);

      localStorage.removeItem(STORAGE_KEY_ORG_ID);

      if (isDev) console.debug("[AuthContext] Logout realizado, orgId limpo");
    } catch (err) {
      if (isDev) console.error("[AuthContext] Erro ao fazer logout:", err);
      throw err;
    }
  };

  // Inicializar sessão (bootstrap)
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          setSession(session);
          setUser(session.user);
          setUserId(session.user.id);
        } else {
          setSession(null);
          setUser(null);
          setUserId(null);
        }
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isDev) console.debug("[AuthContext] Auth state changed:", event);

      if (session) {
        setSession(session);
        setUser(session.user);
        setUserId(session.user.id);
      } else {
        setSession(null);
        setUser(null);
        setUserId(null);
        setOrgIdAtiva(null);
        localStorage.removeItem(STORAGE_KEY_ORG_ID);
      }

      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDev]);

  // Carregar org quando userId mudar
  useEffect(() => {
    if (!userId) {
      setOrgIdAtiva(null);
      setOrgLoading(false);
      return;
    }

    setOrgLoading(true);

    const cachedOrgId = localStorage.getItem(STORAGE_KEY_ORG_ID);
    if (cachedOrgId) {
      if (isDev) console.debug("[AuthContext] Bootstrap: org carregada do cache:", cachedOrgId);
      setOrgIdAtiva(cachedOrgId);
    }

    fetchUserOrg(userId)
      .then((orgId) => {
        if (orgId) {
          setOrgIdAtiva(orgId);
          localStorage.setItem(STORAGE_KEY_ORG_ID, orgId);
          if (isDev) console.debug("[AuthContext] Org validada do backend:", orgId);
        } else {
          if (cachedOrgId) {
            if (isDev) console.warn("[AuthContext] Org não encontrada no backend, limpando cache");
            setOrgIdAtiva(null);
            localStorage.removeItem(STORAGE_KEY_ORG_ID);
          }
        }
        setOrgLoading(false);
      })
      .catch((err) => {
        if (isDev) console.error("[AuthContext] Erro ao buscar org:", err);
        setOrgLoading(false);
      });
  }, [userId, isDev]);

  const value: AuthContextType = {
    session,
    user,
    userId,
    orgIdAtiva,
    authLoading,
    orgLoading,
    signIn,
    signOut,
    refreshOrg,
    refreshUser, // ✅
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
