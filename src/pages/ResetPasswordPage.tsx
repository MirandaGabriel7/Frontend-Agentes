import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { supabase } from "../infra/supabaseClient";

function getHashParams() {
  const hash = window.location.hash?.replace(/^#/, "") ?? "";
  const params = new URLSearchParams(hash);
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
    type: params.get("type"), // "recovery"
  };
}

export const ResetPasswordPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const hasClient = useMemo(() => !!supabase, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setError(null);
      setOk(null);

      if (!hasClient || !supabase) {
        setError("Supabase não configurado no frontend.");
        setLoading(false);
        return;
      }

      // ✅ Suporta o formato antigo (hash com tokens)
      const { access_token, refresh_token, type } = getHashParams();

      try {
        // Se veio token de recovery no hash, setamos a sessão
        if (type === "recovery" && access_token && refresh_token) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (setSessionError) {
            throw setSessionError;
          }
        }

        // Se já existe sessão (ou acabou de setar), segue
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          // Sem sessão => usuário clicou num link inválido/expirado, ou caiu aqui direto
          setError("Link de recuperação inválido ou expirado. Solicite novamente.");
        }
      } catch (e: any) {
        setError(e?.message ?? "Não foi possível validar o link de recuperação.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [hasClient]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!supabase) {
      setError("Supabase não configurado.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setSaving(true);
    try {
      const { error: updError } = await supabase.auth.updateUser({ password });
      if (updError) throw updError;

      setOk("Senha alterada com sucesso. Você já pode entrar com a nova senha.");
      // opcional: desloga por segurança e manda pro login
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao alterar senha.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
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
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Redefinir senha
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Crie uma nova senha para sua conta
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

          <form onSubmit={handleSave}>
            <TextField
              label="Nova senha"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              disabled={saving}
              autoFocus
            />
            <TextField
              label="Confirmar nova senha"
              type="password"
              fullWidth
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              margin="normal"
              disabled={saving}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={saving}
              sx={{ mt: 2.5, py: 1.4, textTransform: "none", fontWeight: 700 }}
            >
              {saving ? "Salvando..." : "Salvar nova senha"}
            </Button>

            <Button
              type="button"
              fullWidth
              onClick={() => navigate("/login")}
              sx={{ mt: 1, textTransform: "none" }}
            >
              Voltar para login
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};