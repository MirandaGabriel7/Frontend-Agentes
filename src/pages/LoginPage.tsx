import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  alpha,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, session, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar mensagem do state (vindo de ProtectedRoute)
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setError(state.message);
    }
  }, [location]);

  // Se já estiver logado, redirecionar
  useEffect(() => {
    if (!authLoading && session) {
      navigate('/agents', { replace: true });
    }
  }, [session, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError, hasOrg } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message || 'Erro ao fazer login. Verifique suas credenciais.');
        setLoading(false);
        return;
      }

      // Verificar se o usuário tem org vinculada
      if (hasOrg === false) {
        setError('Usuário não vinculado a nenhuma organização. Entre em contato com o administrador.');
        setLoading(false);
        return;
      }

      // Login bem-sucedido e tem org, redirecionar
      navigate('/agents', { replace: true });
    } catch (err) {
      setError('Erro inesperado ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica sessão
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.04)}`,
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: theme.palette.text.primary,
              }}
            >
              Entrar
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              Faça login para acessar o sistema
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              disabled={loading}
              autoFocus
            />

            <TextField
              label="Senha"
              type="password"
              fullWidth
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              disabled={loading}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};
