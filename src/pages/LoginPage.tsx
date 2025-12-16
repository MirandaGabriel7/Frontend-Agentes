import React, { useState, useEffect, useRef } from 'react';
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
import { isUuid } from '../utils/uuid';

export const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, session, orgIdAtiva, authLoading, orgLoading, refreshOrg } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didRedirect = useRef(false);

  // Verificar mensagem do state (vindo de ProtectedRoute)
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setError(state.message);
    }
  }, [location]);

  // Redirecionar apenas quando session E orgId existirem (com guard para evitar loop)
  useEffect(() => {
    if (didRedirect.current) return;
    
    if (!authLoading && !orgLoading && session && orgIdAtiva && isUuid(orgIdAtiva)) {
      didRedirect.current = true;
      navigate('/agents', { replace: true });
    }
  }, [session, orgIdAtiva, authLoading, orgLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    didRedirect.current = false; // Reset guard ao tentar novo login

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message || 'Erro ao fazer login. Verifique suas credenciais.');
        setLoading(false);
        return;
      }

      // O useEffect vai verificar session + orgId e redirecionar se ambos existirem
      // Não redirecionar aqui para evitar loop
      setLoading(false);
    } catch (err) {
      setError('Erro inesperado ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  const handleRefreshOrg = async () => {
    setError(null);
    setLoading(true);
    try {
      const hasOrg = await refreshOrg();
      if (!hasOrg) {
        setError('Organização não encontrada. Entre em contato com o administrador.');
      }
      // Se encontrou, o useEffect vai redirecionar
    } catch (err) {
      setError('Erro ao atualizar organização. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica sessão ou org
  if (authLoading || orgLoading) {
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

  // Se tem session mas não tem orgId válido, mostrar mensagem e botão para atualizar
  const hasSessionButNoOrg = session && (!orgIdAtiva || !isUuid(orgIdAtiva));

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

          {hasSessionButNoOrg && !error && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={handleRefreshOrg} disabled={loading}>
                  Atualizar organização
                </Button>
              }
            >
              Usuário não vinculado a nenhuma organização. Clique em "Atualizar organização" para tentar novamente.
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
