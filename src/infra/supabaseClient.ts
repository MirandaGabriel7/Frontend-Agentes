// src/infra/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

const MODE = (import.meta.env.MODE as string) ?? "development";
const isDev = MODE === "development";

// Fail-fast
const missing: string[] = [];
if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
if (!SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");
if (missing.length > 0) {
  throw new Error(
    `[Supabase] Variáveis de ambiente ausentes: ${missing.join(", ")}. ` +
      `Configure no .env (local) e/ou no Netlify (Environment variables).`,
  );
}

if (isDev) {
  console.debug("[Supabase] ✅ Configuração carregada:", {
    mode: MODE,
    urlPreview: SUPABASE_URL.slice(0, 30) + "...",
    hasAnonKey: !!SUPABASE_ANON_KEY,
  });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,

    // ✅ IMPORTANTE: nós mesmos processamos o callback PKCE em /auth/callback
    detectSessionInUrl: false,

    flowType: "pkce",
    storageKey: "planco.supabase.auth",
  },
});
