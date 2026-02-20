// src/pages/AuthCallbackPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography, Alert, Button } from "@mui/material";
import { supabase } from "../infra/supabaseClient";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const params = new URLSearchParams(location.search);

        // ✅ Se o Supabase devolveu erro no link (ex: otp_expired)
        const err = params.get("error");
        const errCode = params.get("error_code");
        const errDesc = params.get("error_description");

        const next = params.get("next") || "/agents";
        const code = params.get("code");

        console.log("Callback params:", Object.fromEntries(params.entries()));

        if (err) {
          // otp_expired / access_denied etc.
          const msg =
            errCode === "otp_expired"
              ? "Esse link de recuperação expirou. Volte ao login e solicite novamente."
              : decodeURIComponent(errDesc || "Não foi possível validar o link.");

          throw new Error(msg);
        }

        if (!code) {
          throw new Error("Código de autenticação não encontrado. Solicite um novo link.");
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;

        const goTo = next.startsWith("/") ? next : `/${next}`;
        navigate(goTo, { replace: true });
      } catch (e: any) {
        console.error("Erro no callback:", e);
        if (!mounted) return;
        setError(e?.message || "Falha ao validar o link.");
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [location.search, navigate]);

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
      <Box sx={{ width: "100%", maxWidth: 460 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
          Validando link…
        </Typography>

        {error ? (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate("/login", { replace: true })}
              fullWidth
            >
              Voltar ao login
            </Button>
          </>
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

export default AuthCallbackPage;