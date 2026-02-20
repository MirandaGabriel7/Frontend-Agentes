// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../infra/supabaseClient";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userId: string | null;
  orgIdAtiva: string | null;
  authLoading: boolean;
  orgLoading: boolean;

  signIn: (email: string, password: string) => Promise<{ error: Error | null; hasOrg?: boolean }>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;

  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;

  refreshOrg: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY_ORG_ID = "planco_active_org_id";

function normalizeBaseUrl(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function getAppUrl(): string {
  const envUrl = normalizeBaseUrl((import.meta.env.VITE_APP_URL as string) ?? "");
  const origin = normalizeBaseUrl(window.location.origin);
  return envUrl || origin;
}

function isAuthSpecialRoute(): boolean {
  const p = (window.location.pathname || "").toLowerCase();
  return p.startsWith("/auth/callback") || p.startsWith("/reset-password");
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [orgIdAtiva, setOrgIdAtiva] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(true);

  const isDev = useMemo(
    () => import.meta.env?.MODE === "development" || import.meta.env?.DEV === true,
    [],
  );

  const setOrgCache = (orgId: string | null) => {
    if (orgId) localStorage.setItem(STORAGE_KEY_ORG_ID, orgId);
    else localStorage.removeItem(STORAGE_KEY_ORG_ID);
  };

  const getOrgCache = () => localStorage.getItem(STORAGE_KEY_ORG_ID);

  const ensureAndFetchUserOrg = useCallback(
    async (uid: string): Promise<string | null> => {
      try {
        const { data, error } = await supabase
          .from("organization_members")
          .select("org_id, role, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: true })
          .limit(1);

        if (!error && data && data.length > 0 && data[0]?.org_id) {
          const orgId = String(data[0].org_id);
          if (isDev) console.debug("[AuthContext] Org encontrada:", { orgId, role: data[0].role });
          return orgId;
        }

        const { data: orgId, error: rpcError } = await supabase.rpc("ensure_org_for_user");
        if (rpcError) {
          if (isDev) console.warn("[AuthContext] ensure_org_for_user error:", rpcError);
          return null;
        }

        return orgId ? String(orgId) : null;
      } catch (err) {
        if (isDev) console.error("[AuthContext] Erro inesperado ao buscar/criar org:", err);
        return null;
      }
    },
    [isDev],
  );

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) return;

      if (data?.user) {
        setUser(data.user);
        setUserId(data.user.id);
        setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
      }
    } catch {
      // noop
    }
  }, []);

  const refreshOrg = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    setOrgLoading(true);
    try {
      const orgId = await ensureAndFetchUserOrg(userId);
      setOrgIdAtiva(orgId);
      setOrgCache(orgId);
      return !!orgId;
    } finally {
      setOrgLoading(false);
    }
  }, [userId, ensureAndFetchUserOrg]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) return { error: error as unknown as Error, hasOrg: false };

        if (data.session && data.user) {
          setSession(data.session);
          setUser(data.user);
          setUserId(data.user.id);

          const orgId = await ensureAndFetchUserOrg(data.user.id);
          setOrgIdAtiva(orgId);
          setOrgCache(orgId);

          return { error: null, hasOrg: !!orgId };
        }

        return { error: null, hasOrg: false };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erro desconhecido ao fazer login");
        return { error, hasOrg: false };
      }
    },
    [ensureAndFetchUserOrg],
  );

  const signUp = useCallback(
    async (fullName: string, email: string, password: string) => {
      try {
        const appUrl = getAppUrl();
        const emailRedirectTo = `${appUrl}/auth/callback`;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo,
            data: { full_name: fullName.trim() },
          },
        });

        if (error) return { error: error as unknown as Error };

        const needsEmailConfirmation = !!data.user && !data.session;

        if (data.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          setUserId(data.session.user.id);

          const orgId = await ensureAndFetchUserOrg(data.session.user.id);
          setOrgIdAtiva(orgId);
          setOrgCache(orgId);
        }

        return { error: null, needsEmailConfirmation };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erro desconhecido ao criar conta");
        return { error };
      }
    },
    [ensureAndFetchUserOrg],
  );

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        const appUrl = getAppUrl();
        const redirectTo = `${appUrl}/auth/callback?next=/reset-password`;

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

        if (error) return { error: error as unknown as Error };
        return { error: null };
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Erro desconhecido ao enviar recuperação");
        return { error };
      }
    },
    [],
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { error: error as unknown as Error };
        await refreshUser();
        return { error: null };
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Erro desconhecido ao atualizar senha");
        return { error };
      }
    },
    [refreshUser],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserId(null);
    setOrgIdAtiva(null);
    setOrgCache(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setAuthLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          setSession(null);
          setUser(null);
          setUserId(null);
          setOrgIdAtiva(null);
          setOrgCache(null);
          return;
        }

        if (data.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          setUserId(data.session.user.id);

          const cached = getOrgCache();
          if (cached) setOrgIdAtiva(cached);

          // ✅ NÃO trava o app em rotas de auth/reset
          if (!isAuthSpecialRoute()) {
            setOrgLoading(true);
            try {
              const orgId = await ensureAndFetchUserOrg(data.session.user.id);
              setOrgIdAtiva(orgId);
              setOrgCache(orgId);
            } finally {
              setOrgLoading(false);
            }
          } else {
            setOrgLoading(false);
          }
        } else {
          setSession(null);
          setUser(null);
          setUserId(null);
          setOrgIdAtiva(null);
          setOrgCache(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
          if (isAuthSpecialRoute()) setOrgLoading(false);
        }
      }
    })();

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (isDev) console.debug("[AuthContext] Auth state changed:", event);

      // ✅ Rotas especiais: nunca buscar org aqui
      if (isAuthSpecialRoute() || event === "PASSWORD_RECOVERY") {
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
        setUserId(newSession?.user?.id ?? null);
        setAuthLoading(false);
        setOrgLoading(false);
        return;
      }

      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        setUserId(newSession.user.id);

        const cached = getOrgCache();
        if (cached) setOrgIdAtiva(cached);

        setOrgLoading(true);
        try {
          const orgId = await ensureAndFetchUserOrg(newSession.user.id);
          setOrgIdAtiva(orgId);
          setOrgCache(orgId);
        } finally {
          setOrgLoading(false);
        }
      } else {
        setSession(null);
        setUser(null);
        setUserId(null);
        setOrgIdAtiva(null);
        setOrgCache(null);
        setOrgLoading(false);
      }

      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [ensureAndFetchUserOrg, isDev]);

  const value: AuthContextType = {
    session,
    user,
    userId,
    orgIdAtiva,
    authLoading,
    orgLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshOrg,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};