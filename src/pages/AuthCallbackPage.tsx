import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../infra/supabaseClient";

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Processando autenticação…");

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        if (!supabase) {
          navigate("/login", { replace: true });
          return;
        }

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        // Se veio ?code=..., troca por sessão
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // Se for recovery, manda pro reset
        // (Em muitos casos o Supabase já manda pra /reset-password direto,
        // mas esse fallback garante)
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setMsg("Sessão confirmada. Redirecionando…");
          navigate("/reset-password", { replace: true });
          return;
        }

        navigate("/login", { replace: true });
      } catch (e: any) {
        if (!mounted) return;
        setMsg(e?.message ?? "Falha no callback. Volte para o login.");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <CircularProgress size={22} />
        <Typography variant="body2" color="text.secondary">
          {msg}
        </Typography>
      </Box>
    </Box>
  );
};