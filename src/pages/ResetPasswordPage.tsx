// src/pages/ResetPasswordPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { supabase } from "../infra/supabaseClient"; // ✅ ajuste o path se necessário

export const ResetPasswordPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const canSubmit = useMemo(() => {
    if (!password || !password2) return false;
    if (password !== password2) return false;
    if (password.length < 8) return false;
    return true;
  }, [password, password2]);

  // ✅ Garante que existe sessão de recovery (já trocada pelo callback)
  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const { data } = await supabase.auth.getSession();
        const hasSession = !!data?.session;

        if (!hasSession) {
          // Sem sessão, não dá pra trocar senha.
          navigate("/login", {
            replace: true,
            state: { message: "Link de redefinição inválido/expirado. Solicite novamente." },
          });
          return;
        }

        if (mounted) setChecking(false);
      } catch (e: any) {
        if (!mounted) return;
        setError("Não foi possível validar sua sessão. Tente novamente.");
        setChecking(false);
      }
    }

    check();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!canSubmit) {
      if (password.length < 8) {
        setError("A senha deve ter pelo menos 8 caracteres.");
      } else if (password !== password2) {
        setError("As senhas não coincidem.");
      } else {
        setError("Preencha os campos corretamente.");
      }
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setOk("Senha alterada com sucesso. Você já pode entrar com a nova senha.");

      // opcional: desloga e manda pro login
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (e: any) {
      setError(e?.message || "Erro ao alterar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Carregando…
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
            />

            <TextField
              label="Confirmar nova senha"
              type="password"
              fullWidth
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              margin="normal"
              disabled={loading}
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
};