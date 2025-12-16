import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../infra/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  orgIdAtiva: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; hasOrg?: boolean }>;
  signOut: () => Promise<void>;
  refreshOrg: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_ORG_ID = 'planco_active_org_id';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [orgIdAtiva, setOrgIdAtiva] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);

  // Buscar org_id do usuário
  const fetchUserOrg = async (userId: string): Promise<string | null> => {
    if (!supabase) {
      if (isDev) {
        console.warn('[AuthContext] Supabase não configurado, não é possível buscar org');
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        if (isDev) {
          console.warn('[AuthContext] Erro ao buscar org do usuário:', error);
        }
        return null;
      }

      if (data) {
        const orgId = data.org_id as string;
        if (isDev) {
          console.debug('[AuthContext] Org encontrada:', { orgId, role: data.role });
        }
        return orgId;
      }

      return null;
    } catch (err) {
      if (isDev) {
        console.error('[AuthContext] Erro ao buscar org:', err);
      }
      return null;
    }
  };

  // Carregar org_id do localStorage primeiro (bootstrap rápido)
  // Depois validar/atualizar do backend via refreshOrg
  const loadOrgId = async (userId: string) => {
    // Bootstrap: carregar do localStorage imediatamente
    const cachedOrgId = localStorage.getItem(STORAGE_KEY_ORG_ID);
    if (cachedOrgId) {
      if (isDev) {
        console.debug('[AuthContext] Bootstrap: org carregada do cache:', cachedOrgId);
      }
      setOrgIdAtiva(cachedOrgId);
    }

    // Validar/atualizar do backend via refreshOrg
    const hasOrg = await refreshOrg();
    if (!hasOrg && cachedOrgId) {
      // Se refreshOrg retornou false mas tinha cache, limpar
      if (isDev) {
        console.warn('[AuthContext] Org não encontrada no backend, limpando cache');
      }
      setOrgIdAtiva(null);
      localStorage.removeItem(STORAGE_KEY_ORG_ID);
    }
  };

  // Refresh org (útil quando o usuário trocar de org no futuro)
  // Retorna true se encontrou org, false se não encontrou
  const refreshOrg = async (): Promise<boolean> => {
    if (!user?.id) {
      if (isDev) {
        console.warn('[AuthContext] refreshOrg chamado sem user.id');
      }
      return false;
    }
    
    const orgId = await fetchUserOrg(user.id);
    if (orgId) {
      setOrgIdAtiva(orgId);
      localStorage.setItem(STORAGE_KEY_ORG_ID, orgId);
      if (isDev) {
        console.debug('[AuthContext] Org refreshada:', orgId);
      }
      return true;
    } else {
      setOrgIdAtiva(null);
      localStorage.removeItem(STORAGE_KEY_ORG_ID);
      if (isDev) {
        console.warn('[AuthContext] Org não encontrada no refresh');
      }
      return false;
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    // Validar se Supabase está configurado
    if (!isSupabaseConfigured || !supabase) {
      const error = new Error('Supabase não está configurado. Verifique as variáveis de ambiente.');
      if (isDev) {
        console.error('[AuthContext]', error.message);
      }
      return { error, hasOrg: false };
    }

    try {
      // Já validado acima que supabase não é null
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (isDev) {
          console.error('[AuthContext] Erro ao fazer login:', error);
        }
        return { error, hasOrg: false };
      }

      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        
        // Carregar org (com bootstrap do cache + validação do backend)
        await loadOrgId(data.user.id, false);
        
        // Verificar se tem org após carregar
        const hasOrg = !!localStorage.getItem(STORAGE_KEY_ORG_ID);
        
        if (isDev) {
          console.debug('[AuthContext] Login bem-sucedido:', {
            userId: data.user.id,
            hasOrg,
          });
        }
        
        return { error: null, hasOrg };
      }

      return { error: null, hasOrg: false };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido ao fazer login');
      if (isDev) {
        console.error('[AuthContext] Erro ao fazer login:', err);
      }
      return { error, hasOrg: false };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setSession(null);
      setUser(null);
      setOrgIdAtiva(null);
      // Limpar orgId do localStorage
      localStorage.removeItem(STORAGE_KEY_ORG_ID);
      if (isDev) {
        console.debug('[AuthContext] Logout realizado, orgId limpo');
      }
    } catch (err) {
      if (isDev) {
        console.error('[AuthContext] Erro ao fazer logout:', err);
      }
      throw err;
    }
  };

  // Inicializar sessão (bootstrap)
  useEffect(() => {
    if (!supabase) {
      // Se Supabase não está configurado, apenas finalizar loading
      setLoading(false);
      return;
    }

    // Bootstrap: carregar orgId do localStorage imediatamente se existir
    const cachedOrgId = localStorage.getItem(STORAGE_KEY_ORG_ID);
    if (cachedOrgId) {
      if (isDev) {
        console.debug('[AuthContext] Bootstrap: orgId carregada do localStorage:', cachedOrgId);
      }
      setOrgIdAtiva(cachedOrgId);
    }

    // Verificar sessão atual (supabase já validado no início do useEffect)
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        // Carregar org (bootstrap do cache + validação via refreshOrg)
        loadOrgId(session.user.id);
      }
      setLoading(false);
    });

    // Escutar mudanças de auth (supabase já validado no início do useEffect)
    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange(async (event, session) => {
      if (isDev) {
        console.debug('[AuthContext] Auth state changed:', event);
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        // Carregar org (bootstrap do cache + validação via refreshOrg)
        await loadOrgId(session.user.id);
      } else {
        setSession(null);
        setUser(null);
        setOrgIdAtiva(null);
        localStorage.removeItem(STORAGE_KEY_ORG_ID);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    session,
    user,
    orgIdAtiva,
    loading,
    signIn,
    signOut,
    refreshOrg,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
