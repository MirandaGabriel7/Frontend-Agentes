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

  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; hasOrg?: boolean }>;

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

/**
 * ✅ Fonte de verdade do "URL do app":
 * - Usa VITE_APP_URL se existir (prod/Netlify)
 * - Cai para window.location.origin se não existir (dev/local/staging)
 */
function getAppUrl(): string {
  const envUrl = normalizeBaseUrl(
    (import.meta.env.VITE_APP_URL as string) ?? "",
  );
  const origin = normalizeBaseUrl(window.location.origin);
  return envUrl || origin;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [orgIdAtiva, setOrgIdAtiva] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(true);

  const isDev = useMemo(
    () =>
      import.meta.env?.MODE === "development" || import.meta.env?.DEV === true,
    [],
  );

  // =========================================================
  // Helpers
  // =========================================================

  const setOrgCache = (orgId: string | null) => {
    if (orgId) localStorage.setItem(STORAGE_KEY_ORG_ID, orgId);
    else localStorage.removeItem(STORAGE_KEY_ORG_ID);
  };

  const getOrgCache = () => localStorage.getItem(STORAGE_KEY_ORG_ID);

  /**
   * Busca a primeira org do usuário. Se não existir, cria via RPC ensure_org_for_user()
   * e retorna o org_id criado.
   */
  const ensureAndFetchUserOrg = useCallback(
    async (uid: string): Promise<string | null> => {
      try {
        // 1) tenta buscar org existente
        const { data, error } = await supabase
          .from("organization_members")
          .select("org_id, role, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: true })
          .limit(1);

        if (error) {
          if (isDev)
            console.warn("[AuthContext] Erro ao buscar org do usuário:", error);
          // Mesmo que dê erro no select (policy/permissão), tenta RPC
        } else if (data && data.length > 0 && data[0]?.org_id) {
          const orgId = String(data[0].org_id);
          if (isDev)
            console.debug("[AuthContext] Org encontrada:", {
              orgId,
              role: data[0].role,
            });
          return orgId;
        }

        // 2) não tinha org (ou select falhou): cria/garante via RPC
        const { data: orgId, error: rpcError } = await supabase.rpc(
          "ensure_org_for_user",
        );
        if (rpcError) {
          if (isDev)
            console.warn(
              "[AuthContext] Erro ao executar ensure_org_for_user:",
              rpcError,
            );
          return null;
        }

        if (orgId) {
          const finalOrgId = String(orgId);
          if (isDev)
            console.debug(
              "[AuthContext] ✅ Org garantida/criada via RPC:",
              finalOrgId,
            );
          return finalOrgId;
        }

        return null;
      } catch (err) {
        if (isDev)
          console.error(
            "[AuthContext] Erro inesperado ao buscar/criar org:",
            err,
          );
        return null;
      }
    },
    [isDev],
  );

  // =========================================================
  // Public API
  // =========================================================

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (isDev) console.warn("[AuthContext] Erro ao refreshUser:", error);
        return;
      }

      if (data?.user) {
        setUser(data.user);
        setUserId(data.user.id);
        setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
        if (isDev)
          console.debug("[AuthContext] ✅ user atualizado via refreshUser");
      }
    } catch (err) {
      if (isDev)
        console.error("[AuthContext] Erro inesperado no refreshUser:", err);
    }
  }, [isDev]);

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

        if (error) {
          if (isDev) console.error("[AuthContext] Erro ao fazer login:", error);
          return { error: error as unknown as Error, hasOrg: false };
        }

        if (data.session && data.user) {
          setSession(data.session);
          setUser(data.user);
          setUserId(data.user.id);

          // garante org de verdade (não depende de localStorage)
          const orgId = await ensureAndFetchUserOrg(data.user.id);
          setOrgIdAtiva(orgId);
          setOrgCache(orgId);

          if (isDev) {
            console.debug("[AuthContext] Login bem-sucedido:", {
              userId: data.user.id,
              hasOrg: !!orgId,
            });
          }

          return { error: null, hasOrg: !!orgId };
        }

        return { error: null, hasOrg: false };
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Erro desconhecido ao fazer login");
        if (isDev) console.error("[AuthContext] Erro ao fazer login:", err);
        return { error, hasOrg: false };
      }
    },
    [isDev, ensureAndFetchUserOrg],
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
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          if (isDev) console.error("[AuthContext] Erro ao criar conta:", error);
          return { error: error as unknown as Error };
        }

        // Se "Confirm email" está ligado, não vem session aqui.
        const needsEmailConfirmation = !!data.user && !data.session;

        // Se veio session (confirm email desligado), garante org imediatamente
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
        const error =
          err instanceof Error
            ? err
            : new Error("Erro desconhecido ao criar conta");
        if (isDev) console.error("[AuthContext] Erro ao criar conta:", err);
        return { error };
      }
    },
    [isDev, ensureAndFetchUserOrg],
  );

  /**
   * ✅ Reset de senha (profissional) com PKCE:
   * - o email volta com ?code=...
   * - /auth/callback troca code por sessão
   * - e manda para /reset-password
   */
  const resetPassword = useCallback(
    async (email: string) => {
      try {
        // ✅ manda pro callback primeiro (PKCE), e depois vai pro reset-password
        const redirectTo = `${import.meta.env.VITE_APP_URL}/auth/callback?next=/reset-password`;

        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo,
          },
        );

        if (error) {
          if (isDev)
            console.error("[AuthContext] Erro no resetPassword:", error);
          return { error: error as unknown as Error };
        }

        if (isDev)
          console.debug(
            "[AuthContext] resetPassword enviado com redirectTo:",
            redirectTo,
          );
        return { error: null };
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Erro desconhecido ao enviar recuperação");
        if (isDev)
          console.error("[AuthContext] Erro inesperado no resetPassword:", err);
        return { error };
      }
    },
    [isDev],
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          if (isDev)
            console.error("[AuthContext] Erro ao updatePassword:", error);
          return { error: error as unknown as Error };
        }

        // Após atualizar senha, vale atualizar user/session
        await refreshUser();
        return { error: null };
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Erro desconhecido ao atualizar senha");
        if (isDev)
          console.error(
            "[AuthContext] Erro inesperado no updatePassword:",
            err,
          );
        return { error };
      }
    },
    [isDev, refreshUser],
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();

      setSession(null);
      setUser(null);
      setUserId(null);
      setOrgIdAtiva(null);

      setOrgCache(null);

      if (isDev) console.debug("[AuthContext] Logout realizado, orgId limpo");
    } catch (err) {
      if (isDev) console.error("[AuthContext] Erro ao fazer logout:", err);
      throw err;
    }
  }, [isDev]);

  // =========================================================
  // Bootstrap session + listener
  // =========================================================

  useEffect(() => {
    let mounted = true;

    (async () => {
      setAuthLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          if (isDev) console.warn("[AuthContext] getSession error:", error);
          setSession(null);
          setUser(null);
          setUserId(null);
          setOrgIdAtiva(null);
          setOrgCache(null);
          setAuthLoading(false);
          setOrgLoading(false);
          return;
        }

        if (data.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          setUserId(data.session.user.id);

          // bootstrap: usa cache rápido, mas valida no backend logo depois
          const cached = getOrgCache();
          if (cached) setOrgIdAtiva(cached);

          // valida/garante org
          const orgId = await ensureAndFetchUserOrg(data.session.user.id);
          setOrgIdAtiva(orgId);
          setOrgCache(orgId);
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
          setOrgLoading(false);
        }
      }
    })();

    const { data } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (isDev) console.debug("[AuthContext] Auth state changed:", event);

        // ✅ IMPORTANTÍSSIMO: recovery não deve travar o app buscando org
        if (event === "PASSWORD_RECOVERY") {
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
      },
    );

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [isDev, ensureAndFetchUserOrg]);

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
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
