import React, { useState } from "react";
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
import { useAuth } from "../contexts/AuthContext";

export const ResetPasswordPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { updatePassword, authLoading } = useAuth();

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (p1.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (p1 !== p2) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(p1);
      if (error) {
        setError(error.message || "Erro ao atualizar senha.");
        return;
      }

      setOk("Senha atualizada com sucesso! Você já pode entrar.");
      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch {
      setError("Erro inesperado ao atualizar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary }}>
              Redefinir senha
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Digite sua nova senha abaixo.
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

          <form onSubmit={onSubmit}>
            <TextField
              label="Nova senha"
              type="password"
              fullWidth
              required
              autoComplete="new-password"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              margin="normal"
              disabled={loading}
              autoFocus
            />

            <TextField
              label="Confirmar nova senha"
              type="password"
              fullWidth
              required
              autoComplete="new-password"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              margin="normal"
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 3, py: 1.5, textTransform: "none", fontWeight: 700 }}
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>

            <Button
              type="button"
              fullWidth
              disabled={loading}
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
