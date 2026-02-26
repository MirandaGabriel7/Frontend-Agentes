// src/pages/AuthCallbackPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, CircularProgress, Typography, Button } from "@mui/material";
import { supabase } from "../infra/supabaseClient";

function safeNext(next: string | null | undefined) {
  const n = (next || "").trim();
  if (!n) return "/agents";
  if (n.startsWith("/")) return n;
  return `/${n}`;
}

function buildGuardKey(locationSearch: string) {
  // 🔒 Evita guardar token completo no key (reduz tamanho e exposição).
  // Usa só os params relevantes, mantendo unicidade suficiente.
  try {
    const qs = new URLSearchParams(locationSearch);
    const code = qs.get("code") || "";
    const type = qs.get("type") || "";
    const next = qs.get("next") || "";
    const error = qs.get("error") || "";
    const errorCode = qs.get("error_code") || "";
    return `authcb:v3:${code.slice(0, 12)}:${type}:${next}:${error}:${errorCode}`;
  } catch {
    return `authcb:v3:${locationSearch.slice(0, 64)}`;
  }
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  const qs = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  useEffect(() => {
    let alive = true;

    async function run() {
      setProcessing(true);
      setError(null);

      try {
        const code = qs.get("code");

        // Supabase manda type=recovery no reset de senha
        const type = (qs.get("type") || "").toLowerCase();

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
          setProcessing(false);
          return;
        }

        // ✅ Destino PROFISSIONAL:
        // - recovery SEMPRE vai para /reset-password (não depende de next)
        // - outros casos respeitam next
        const next =
          type === "recovery" ? "/reset-password" : safeNext(qs.get("next"));

        // ✅ Trava anti-loop: cada URL (code) só pode ser processada 1 vez neste navegador.
        const guardKey = buildGuardKey(location.search);

        if (sessionStorage.getItem(guardKey) === "1") {
          navigate(next, { replace: true });
          return;
        }
        sessionStorage.setItem(guardKey, "1");

        if (!code) {
          // Sem code = não tem como trocar por sessão (PKCE).
          navigate("/login", {
            replace: true,
            state: { message: "Link inválido ou expirado. Solicite novamente." },
          });
          return;
        }

        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          // Se falhou, libera o guard pra permitir retry com o mesmo link (caso necessário)
          sessionStorage.removeItem(guardKey);
          throw exchangeError;
        }

        // ✅ Agora sim vai pro destino (reset-password / agents etc.)
        navigate(next, { replace: true });
      } catch (e: any) {
        if (!alive) return;
        const msg = e?.message || "Falha ao validar o link. Solicite novamente.";
        setError(msg);
        setProcessing(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [navigate, location.search, qs]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 3,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 520 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
          Validando link…
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">{error}</Typography>

            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                onClick={() => navigate("/login", { replace: true })}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Ir para login
              </Button>

              <Button
                variant="outlined"
                onClick={() => {
                  navigate("/login", {
                    replace: true,
                    state: { message: "Solicite um novo link e tente novamente." },
                  });
                }}
                sx={{ textTransform: "none" }}
              >
                Solicitar novo link
              </Button>
            </Box>
          </Alert>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">
              {processing ? "Aguarde um instante." : "Redirecionando…"}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
