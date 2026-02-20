// src/pages/AuthCallbackPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";
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
        const code = params.get("code");
        const next = params.get("next") || "/agents";

        console.log("Callback params:", Object.fromEntries(params.entries()));

        if (!code) {
          throw new Error("Código de autenticação não encontrado.");
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) throw error;

        console.log("Session criada:", data);

        const goTo = next.startsWith("/") ? next : `/${next}`;
        navigate(goTo, { replace: true });

      } catch (e: any) {
        console.error("Erro no callback:", e);
        if (mounted) {
          setError(e?.message || "Erro ao validar o link.");
        }
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [location.search, navigate]);

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

export default AuthCallbackPage;