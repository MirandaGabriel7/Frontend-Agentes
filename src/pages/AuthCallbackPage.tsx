// src/pages/AuthCallbackPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";
import { supabase } from "../infra/supabaseClient"; // ✅ ajuste o path se necessário

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        // PKCE flow: Supabase volta com ?code=...
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const next = params.get("next") || "/agents";

        if (!code) {
          navigate("/login", {
            replace: true,
            state: { message: "Link inválido ou expirado. Tente novamente." },
          });
          return;
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) throw exchangeError;

        const goTo = next.startsWith("/") ? next : `/${next}`;
        if (mounted) navigate(goTo, { replace: true });
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Falha ao validar o link. Tente novamente.");
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [location.search, navigate]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 3,
      }}
    >
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

export default AuthCallbackPage;