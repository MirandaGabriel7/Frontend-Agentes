// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const MODE = import.meta.env.MODE ?? "development";
const isDev = MODE === "development";

// ===============================
// 🔒 Validação de variáveis (fail-fast)
// ===============================
const missing: string[] = [];

if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
if (!SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");

if (missing.length > 0) {
  throw new Error(
    `[Supabase] Variáveis ausentes: ${missing.join(
      ", "
    )}. Configure no .env e no Netlify (Environment variables).`
  );
}

// ===============================
// 🧠 Logs úteis em desenvolvimento
// ===============================
if (isDev) {
  console.debug("[Supabase] ✅ Configuração carregada:", {
    mode: MODE,
    urlPreview: SUPABASE_URL.slice(0, 30) + "...",
    hasAnonKey: !!SUPABASE_ANON_KEY,
  });
}

// ===============================
// 🚀 Cliente Supabase
// ===============================
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,

    /**
     * ESSENCIAL para:
     * - magic link
     * - reset password
     * - PKCE flow
     */
    detectSessionInUrl: true,

    /**
     * PKCE é o padrão seguro para SPA
     * Mantém compatível com exchangeCodeForSession
     */
    flowType: "pkce",

    /**
     * Nome isolado para evitar conflito
     * com outros projetos Supabase no mesmo domínio
     */
    storageKey: "agentesgov.supabase.auth",

    /**
     * (opcional mas recomendado)
     * Garante que sessão fique no localStorage
     */
    storage: window.localStorage,
  },
});