// src/pages/AuthCallbackPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { supabase } from "../infra/supabaseClient";

function safeNext(next: string | null | undefined) {
  const n = (next || "").trim();
  if (!n) return "/agents";
  if (n.startsWith("/")) return n;
  return `/${n}`;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const code = qs.get("code");
        const next = safeNext(qs.get("next"));
        const err = qs.get("error");
        const errDesc = qs.get("error_description");
        const errCode = qs.get("error_code");

        // ✅ Se o Supabase devolveu erro (ex: otp_expired), não tenta trocar code.
        if (err) {
          const msg =
            errCode === "otp_expired"
              ? "Esse link expirou. Solicite a redefinição novamente."
              : errDesc || "Falha ao validar o link. Tente novamente.";
          if (!alive) return;
          setError(msg);
          return;
        }

        // ✅ Trava anti-loop: cada URL (code) só pode ser processada 1 vez neste navegador
        // (evita refresh/re-render/dupla troca de code por sessão)
        const guardKey = `authcb:${location.search}`;
        if (sessionStorage.getItem(guardKey) === "1") {
          // Já processado → só navega
          navigate(next, { replace: true });
          return;
        }
        sessionStorage.setItem(guardKey, "1");

        if (!code) {
          // Sem code = não tem como trocar por sessão (PKCE)
          navigate("/login", {
            replace: true,
            state: { message: "Link inválido ou expirado. Solicite novamente." },
          });
          return;
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;

        // ✅ Agora sim vai pro destino (reset-password / agents etc.)
        navigate(next, { replace: true });
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Falha ao validar o link. Solicite novamente.");
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [navigate, location.search, qs]);

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
      <Box sx={{ width: "100%", maxWidth: 520 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
          Validando link…
        </Typography>

        {error ? (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
            action={
              <Typography
                component="button"
                onClick={() => navigate("/login", { replace: true })}
                style={{ background: "transparent", border: 0, cursor: "pointer" }}
              >
                Ir para login
              </Typography>
            }
          >
            {error}
          </Alert>
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