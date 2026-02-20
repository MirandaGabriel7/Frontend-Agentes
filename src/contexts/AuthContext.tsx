// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../infra/supabaseClient";
import { isUuid } from "../utils/uuid";

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
    password: string
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

  // ✅ Single-flight / anti-loop refs
  const orgFetchPromiseRef = useRef<Promise<string | null> | null>(null);
  const lastOrgUserIdRef = useRef<string | null>(null);

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

        // fallback: RPC
        const { data: orgId, error: rpcError } = await supabase.rpc("ensure_org_for_user");
        if (rpcError) {
          if (isDev) console.warn("[AuthContext] RPC ensure_org_for_user erro:", rpcError);
          return null;
        }

        return orgId ? String(orgId) : null;
      } catch (err) {
        if (isDev) console.error("[AuthContext] ensureAndFetchUserOrg erro:", err);
        return null;
      }
    },
    [isDev]
  );

  /**
   * ✅ Busca org só quando necessário, com single-flight.
   */
  const fetchOrgIfNeeded = useCallback(
    async (uid: string): Promise<string | null> => {
      // Já tem org válida? não busca.
      if (orgIdAtiva && isUuid(orgIdAtiva)) return orgIdAtiva;

      // Mesmo user e já tentamos recentemente? evita spam.
      if (lastOrgUserIdRef.current === uid && orgIdAtiva && isUuid(orgIdAtiva)) return orgIdAtiva;

      // Single-flight: se já tem uma busca rodando, reaproveita.
      if (orgFetchPromiseRef.current) return orgFetchPromiseRef.current;

      setOrgLoading(true);

      orgFetchPromiseRef.current = (async () => {
        try {
          // cache rápido (não trava a UI do ProtectedRoute se já tiver org válida)
          const cached = getOrgCache();
          if (cached && isUuid(cached)) {
            setOrgIdAtiva(cached);
          }

          const orgId = await ensureAndFetchUserOrg(uid);
          setOrgIdAtiva(orgId);
          setOrgCache(orgId);

          lastOrgUserIdRef.current = uid;
          return orgId;
        } finally {
          orgFetchPromiseRef.current = null;
          setOrgLoading(false);
        }
      })();

      return orgFetchPromiseRef.current;
    },
    [ensureAndFetchUserOrg, orgIdAtiva]
  );

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (isDev) console.warn("[AuthContext] refreshUser error:", error);
        return;
      }
      if (data?.user) {
        setUser(data.user);
        setUserId(data.user.id);
        setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
      }
    } catch (err) {
      if (isDev) console.error("[AuthContext] refreshUser erro:", err);
    }
  }, [isDev]);

  const refreshOrg = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    const orgId = await fetchOrgIfNeeded(userId);
    return !!orgId;
  }, [userId, fetchOrgIfNeeded]);

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

          const orgId = await fetchOrgIfNeeded(data.user.id);
          return { error: null, hasOrg: !!orgId };
        }

        return { error: null, hasOrg: false };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erro desconhecido ao fazer login");
        return { error, hasOrg: false };
      }
    },
    [fetchOrgIfNeeded]
  );

  const signUp = useCallback(
    async (fullName: string, email: string, password: string) => {
      try {
        const appUrl = getAppUrl();
        const emailRedirectTo = `${appUrl}/auth/callback`;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo, data: { full_name: fullName.trim() } },
        });

        if (error) return { error: error as unknown as Error };

        const needsEmailConfirmation = !!data.user && !data.session;

        if (data.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          setUserId(data.session.user.id);
          await fetchOrgIfNeeded(data.session.user.id);
        }

        return { error: null, needsEmailConfirmation };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erro desconhecido ao criar conta");
        return { error };
      }
    },
    [fetchOrgIfNeeded]
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
    []
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
    [refreshUser]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserId(null);
    setOrgIdAtiva(null);
    setOrgCache(null);
    lastOrgUserIdRef.current = null;
  }, []);

  // =========================================================
  // Bootstrap + Listener (anti-loop)
  // =========================================================
  useEffect(() => {
    let mounted = true;

    (async () => {
      setAuthLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const s = data.session ?? null;
        setSession(s);
        setUser(s?.user ?? null);
        setUserId(s?.user?.id ?? null);

        // cache rápido
        const cached = getOrgCache();
        if (cached && isUuid(cached)) setOrgIdAtiva(cached);

        // ✅ Só busca org se tiver sessão e ainda não tiver org válida
        if (s?.user?.id) {
          void fetchOrgIfNeeded(s.user.id);
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (isDev) console.debug("[AuthContext] onAuthStateChange:", event);

      // ✅ 1) PASSWORD_RECOVERY: não busca org, não trava app
      if (event === "PASSWORD_RECOVERY") {
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
        setUserId(newSession?.user?.id ?? null);
        setAuthLoading(false);
        setOrgLoading(false);
        return;
      }

      // ✅ 2) TOKEN_REFRESHED: NUNCA rodar org fetch nem ligar orgLoading
      if (event === "TOKEN_REFRESHED") {
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
        setUserId(newSession?.user?.id ?? null);
        setAuthLoading(false);
        return;
      }

      // ✅ 3) SIGNED_OUT: limpa tudo
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setUserId(null);
        setOrgIdAtiva(null);
        setOrgCache(null);
        lastOrgUserIdRef.current = null;
        setAuthLoading(false);
        setOrgLoading(false);
        return;
      }

      // ✅ 4) SIGNED_IN / USER_UPDATED: só busca org se precisar
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      setUserId(newSession?.user?.id ?? null);
      setAuthLoading(false);

      const uid = newSession?.user?.id;
      if (uid) {
        // Só dispara se ainda não tem org válida
        if (!(orgIdAtiva && isUuid(orgIdAtiva))) {
          void fetchOrgIfNeeded(uid);
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchOrgIfNeeded, isDev, orgIdAtiva]);

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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};