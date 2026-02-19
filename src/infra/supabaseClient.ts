// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

const MODE = (import.meta.env.MODE as string) ?? "development";
const isDev = MODE === "development";

// Validação de envs (fail-fast sempre — melhor do que supabase null)
const missing: string[] = [];
if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
if (!SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");

if (missing.length > 0) {
  const msg =
    `[Supabase] Variáveis de ambiente ausentes: ${missing.join(", ")}. ` +
    `Configure no .env (local) e/ou no Netlify (Environment variables).`;

  // Em dev: erro explícito logo ao iniciar (evita debug infinito)
  // Em prod: também deve quebrar o build/deploy se faltar
  throw new Error(msg);
}

// Logs úteis em dev (sem vazar segredo)
if (isDev) {
  // não loga a key, só se existe
  console.debug("[Supabase] ✅ Configuração carregada:", {
    mode: MODE,
    urlPreview: SUPABASE_URL.slice(0, 30) + "...",
    hasAnonKey: !!SUPABASE_ANON_KEY,
  });
}

// Cliente Supabase (sempre definido)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // necessário para reset-password via link
    flowType: "pkce",
    storageKey: "planco.supabase.auth", // troque se quiser outro nome
  },
});

// Tipos opcionais para ajudar no TS (se quiser)
// export type SupabaseClientType = typeof supabase;
