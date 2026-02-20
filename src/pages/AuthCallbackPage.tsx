// src/pages/AuthCallbackPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { supabase } from "../infra/supabaseClient";

function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Timeout validando o link (Supabase).")), ms);
    promise
      .then((v) => {
        clearTimeout(id);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(id);
        reject(e);
      });
  });
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const next = useMemo(() => params.get("next") || "/agents", [params]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        // 1) Se o Supabase já redirecionou com erro, encerra imediatamente
        const err = params.get("error");
        const errDesc = params.get("error_description");
        const errCode = params.get("error_code");

        if (err) {
          // Ex.: otp_expired, access_denied
          const msg =
            errCode === "otp_expired"
              ? "Esse link expirou. Solicite um novo 'Esqueci minha senha'."
              : errDesc || "Falha ao validar o link. Solicite um novo link.";
          if (!mounted) return;
          setError(msg);

          // limpa a URL pra não ficar reprocessando ao voltar/atualizar
          window.history.replaceState({}, document.title, "/login");
          return;
        }

        // 2) Se detectSessionInUrl já criou a sessão, só redireciona
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          // limpa URL do callback
          window.history.replaceState({}, document.title, "/");
          const goTo = next.startsWith("/") ? next : `/${next}`;
          if (mounted) navigate(goTo, { replace: true });
          return;
        }

        // 3) Fluxo PKCE: precisa do ?code=
        const code = params.get("code");
        if (!code) {
          // Sem code e sem sessão -> link inválido/expirado
          if (!mounted) return;
          setError("Link inválido ou expirado. Solicite um novo link de recuperação.");

          window.history.replaceState({}, document.title, "/login");
          return;
        }

        // 4) Troca code por sessão (com timeout para não travar)
        const { error: exchangeError } = await withTimeout(
          supabase.auth.exchangeCodeForSession(code),
          12000
        );

        if (exchangeError) throw exchangeError;

        // 5) Confirma que sessão existe
        const { data: finalSession } = await supabase.auth.getSession();
        if (!finalSession?.session) {
          throw new Error("Não foi possível criar sessão a partir do link. Tente novamente.");
        }

        // limpa URL do callback
        window.history.replaceState({}, document.title, "/");

        const goTo = next.startsWith("/") ? next : `/${next}`;
        if (mounted) navigate(goTo, { replace: true });
      } catch (e: any) {
        if (!mounted) return;
        const msg = e?.message || "Falha ao validar o link. Solicite um novo link.";
        setError(msg);

        window.history.replaceState({}, document.title, "/login");
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [navigate, params, next]);

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          Validando link…
        </Typography>

        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">
              Aguarde um instante.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}