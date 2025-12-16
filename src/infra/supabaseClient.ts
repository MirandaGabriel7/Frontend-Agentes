import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);
const isProduction = import.meta.env?.MODE === 'production';

// Validação de envs
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Fail-fast em produção se faltar envs
if (isProduction && !isSupabaseConfigured) {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
  
  throw new Error(
    `[Supabase] Configuração obrigatória faltando em produção: ${missing.join(', ')}. ` +
    `Configure as variáveis de ambiente antes de fazer build.`
  );
}

// Logs em dev
if (isDev) {
  if (!SUPABASE_URL) {
    console.error(
      '[Supabase] ❌ VITE_SUPABASE_URL não está definida. Configure no arquivo .env'
    );
  }
  if (!SUPABASE_ANON_KEY) {
    console.error(
      '[Supabase] ❌ VITE_SUPABASE_ANON_KEY não está definida. Configure no arquivo .env'
    );
  }
  if (isSupabaseConfigured) {
    console.debug('[Supabase] ✅ Configuração carregada:', {
      url: SUPABASE_URL.substring(0, 30) + '...',
      hasAnonKey: !!SUPABASE_ANON_KEY,
    });
  } else {
    console.warn(
      '[Supabase] ⚠️ Cliente não será criado. Configure as variáveis de ambiente.'
    );
  }
}

// Criar cliente apenas se envs estiverem configuradas
// Em dev, pode ser null se faltar envs (para não quebrar desenvolvimento)
// Em produção, já lançou erro acima se faltar
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
