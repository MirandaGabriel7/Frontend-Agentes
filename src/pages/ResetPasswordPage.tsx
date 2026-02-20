// src/pages/ResetPasswordPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  alpha,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { supabase } from "../infra/supabaseClient";

/**
 * ResetPasswordPage "à prova de loop"
 *
 * Proteções:
 * - Não depende de params na URL (o callback já troca code por session).
 * - Verifica sessão com timeout (evita "checking" infinito).
 * - Se não houver sessão => redireciona pro /login (sem reprocessar).
 * - Bloqueia duplo-submit.
 * - Limpa URL (remove qualquer lixo de callback) pra não re-triggerar fluxo.
 * - Mostra feedback e finaliza com signOut + redirect login.
 */

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error("Timeout validando sessão.")), ms);
    promise
      .then((v) => {
        window.clearTimeout(id);
        resolve(v);
      })
      .catch((e) => {
        window.clearTimeout(id);
        reject(e);
      });
  });
}

function isStrongEnough(pw: string) {
  // regra simples (você pode fortalecer depois)
  return pw.length >= 8;
}

export default function ResetPasswordPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const submitLockRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const canSubmit = useMemo(() => {
    if (!password || !password2) return false;
    if (password !== password2) return false;
    if (!isStrongEnough(password)) return false;
    return true;
  }, [password, password2]);

  // ✅ 1) Bootstrap: garante sessão válida (recovery já trocado no callback)
  useEffect(() => {
    let mounted = true;

    // limpeza da URL: se alguém cair aqui com querystring, remove pra não reprocessar nada
    // (mantém o path atual)
    if (location.search) {
      window.history.replaceState({}, document.title, location.pathname);
    }

    async function check() {
      try {
        setChecking(true);

        const { data } = await withTimeout(supabase.auth.getSession(), 8000);
        const hasSession = !!data?.session;

        if (!hasSession) {
          // Sem sessão => não existe fluxo de recovery válido
          navigate("/login", {
            replace: true,
            state: { message: "Link de redefinição inválido ou expirado. Solicite novamente." },
          });
          return;
        }

        // opcional: se quiser garantir que é um usuário logado
        // const { data: u } = await supabase.auth.getUser();
        // if (!u?.user) ...

        if (!mounted) return;
        setChecking(false);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Não foi possível validar sua sessão. Tente novamente.");
        setChecking(false);

        // Se deu erro ao validar sessão, manda pro login para não prender usuário
        navigate("/login", {
          replace: true,
          state: { message: "Sessão inválida. Solicite um novo link de redefinição." },
        });
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, [navigate, location.pathname, location.search]);

  // ✅ 2) Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (submitLockRef.current) return;
    if (!canSubmit) {
      if (!isStrongEnough(password)) setError("A senha deve ter pelo menos 8 caracteres.");
      else if (password !== password2) setError("As senhas não coincidem.");
      else setError("Preencha os campos corretamente.");
      return;
    }

    submitLockRef.current = true;
    setLoading(true);

    try {
      // revalida sessão antes de atualizar (evita update sem sessão)
      const { data } = await withTimeout(supabase.auth.getSession(), 8000);
      if (!data?.session) {
        navigate("/login", {
          replace: true,
          state: { message: "Sessão inválida. Solicite um novo link de redefinição." },
        });
        return;
      }

      const { error: updateError } = await withTimeout(
        supabase.auth.updateUser({ password }),
        12000
      );

      if (updateError) throw updateError;

      setOk("Senha alterada com sucesso. Faça login com a nova senha.");

      // Importante: encerra a sessão de recovery para não afetar outras abas
      await supabase.auth.signOut();

      // redireciona rápido, sem loop
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 700);
    } catch (e: any) {
      setError(e?.message || "Erro ao alterar senha. Tente novamente.");
    } finally {
      setLoading(false);
      submitLockRef.current = false;
    }
  };

  if (checking) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Validando sessão…
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: `0 1px 3px ${alpha("#000", 0.04)}, 0 8px 24px ${alpha("#000", 0.04)}`,
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              Redefinir senha
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Defina uma nova senha para sua conta.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {ok && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk(null)}>
              {ok}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Nova senha"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              disabled={loading}
              helperText="Mínimo de 8 caracteres."
              autoComplete="new-password"
            />

            <TextField
              label="Confirmar nova senha"
              type="password"
              fullWidth
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              margin="normal"
              disabled={loading}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || !canSubmit}
              sx={{ mt: 2.5, py: 1.4, textTransform: "none", fontWeight: 700 }}
            >
              {loading ? "Salvando…" : "Salvar nova senha"}
            </Button>

            <Button
              type="button"
              fullWidth
              disabled={loading}
              onClick={() => navigate("/login")}
              sx={{ mt: 1.2, textTransform: "none" }}
            >
              Voltar para o login
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}