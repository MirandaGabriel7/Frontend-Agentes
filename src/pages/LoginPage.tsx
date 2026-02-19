import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { isUuid } from "../utils/uuid";

type TabKey = "signin" | "signup" | "forgot";

export const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    signIn,
    signUp,
    resetPassword,
    refreshOrg,
    session,
    orgIdAtiva,
    authLoading,
    orgLoading,
  } = useAuth();

  const [tab, setTab] = useState<TabKey>("signin");

  // shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const didRedirect = useRef(false);

  // signin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPassword2, setSignupPassword2] = useState("");

  // forgot
  const [forgotEmail, setForgotEmail] = useState("");

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  // Verificar mensagem do state (vindo de ProtectedRoute)
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) setError(state.message);
  }, [location]);

  // Redirecionar apenas quando session E orgId existirem (com guard para evitar loop)
  useEffect(() => {
    if (didRedirect.current) return;

    if (!authLoading && !orgLoading && session && orgIdAtiva && isUuid(orgIdAtiva)) {
      didRedirect.current = true;
      navigate("/agents", { replace: true });
    }
  }, [session, orgIdAtiva, authLoading, orgLoading, navigate]);

  // Se tem session mas não tem orgId válido, mostrar mensagem e botão para atualizar
  const hasSessionButNoOrg = useMemo(() => {
    return !!session && (!orgIdAtiva || !isUuid(orgIdAtiva));
  }, [session, orgIdAtiva]);

  const header = useMemo(() => {
    if (tab === "signin") return { title: "Entrar", subtitle: "Faça login para acessar o sistema" };
    if (tab === "signup") return { title: "Criar conta", subtitle: "Cadastre-se em poucos segundos" };
    return { title: "Recuperar senha", subtitle: "Vamos te enviar um link para redefinir sua senha" };
  }, [tab]);

  const handleRefreshOrg = async () => {
    resetMessages();
    setLoading(true);
    didRedirect.current = false;

    try {
      const hasOrg = await refreshOrg();
      if (!hasOrg) {
        setError("Organização não encontrada. Entre em contato com o administrador.");
      }
      // Se encontrou, o useEffect vai redirecionar
    } catch {
      setError("Erro ao atualizar organização. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    didRedirect.current = false;

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message || "Erro ao fazer login. Verifique suas credenciais.");
        return;
      }

      // Não redireciona aqui: useEffect faz isso quando orgIdAtiva ficar válido
    } catch {
      setError("Erro inesperado ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    didRedirect.current = false;

    const name = fullName.trim();
    const em = signupEmail.trim();

    if (name.length < 3) {
      setLoading(false);
      setError("Informe seu nome completo.");
      return;
    }

    if (signupPassword.length < 8) {
      setLoading(false);
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (signupPassword !== signupPassword2) {
      setLoading(false);
      setError("As senhas não conferem.");
      return;
    }

    try {
      const { error: signUpError, needsEmailConfirmation } = await signUp(name, em, signupPassword);

      if (signUpError) {
        setError(signUpError.message || "Erro ao criar conta. Tente novamente.");
        return;
      }

      // Se confirmação de email está ativa no Supabase, o usuário precisa confirmar antes de logar
      if (needsEmailConfirmation) {
        setInfo(
          'Conta criada! Agora confirme seu email para ativar o acesso (verifique sua caixa de entrada e spam).'
        );
        setTab("signin");
        setEmail(em);
        setPassword("");
        return;
      }

      // Se não precisa confirmar, em geral já loga e o effect redireciona
      setInfo("Conta criada com sucesso! Entrando...");
    } catch {
      setError("Erro inesperado ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const { error: resetError } = await resetPassword(forgotEmail);

      if (resetError) {
        setError(resetError.message || "Erro ao enviar email de recuperação.");
        return;
      }

      setInfo("Pronto! Se esse email existir, você receberá um link para redefinir sua senha.");
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica sessão ou org
  if (authLoading || orgLoading) {
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
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary }}
            >
              {header.title}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {header.subtitle}
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              resetMessages();
            }}
            variant="fullWidth"
            sx={{
              mb: 3,
              borderRadius: 2,
              "& .MuiTabs-indicator": { height: 3, borderRadius: 999 },
            }}
          >
            <Tab value="signin" label="Entrar" />
            <Tab value="signup" label="Criar conta" />
            <Tab value="forgot" label="Esqueci senha" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {info && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setInfo(null)}>
              {info}
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
              Usuário autenticado, mas ainda sem organização vinculada. Clique em "Atualizar organização".
            </Alert>
          )}

          {tab === "signin" && (
            <form onSubmit={handleSignIn}>
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
                sx={{ mt: 3, py: 1.5, textTransform: "none", fontWeight: 700 }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <Button
                type="button"
                fullWidth
                disabled={loading}
                onClick={() => {
                  setTab("forgot");
                  setForgotEmail(email);
                  resetMessages();
                }}
                sx={{ mt: 1, textTransform: "none" }}
              >
                Esqueci minha senha
              </Button>
            </form>
          )}

          {tab === "signup" && (
            <form onSubmit={handleSignUp}>
              <TextField
                label="Nome completo"
                fullWidth
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                margin="normal"
                disabled={loading}
                autoFocus
              />

              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                margin="normal"
                disabled={loading}
              />

              <TextField
                label="Senha"
                type="password"
                fullWidth
                required
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                margin="normal"
                disabled={loading}
                helperText="Mínimo de 8 caracteres"
              />

              <TextField
                label="Confirmar senha"
                type="password"
                fullWidth
                required
                autoComplete="new-password"
                value={signupPassword2}
                onChange={(e) => setSignupPassword2(e.target.value)}
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
                {loading ? "Criando..." : "Criar conta"}
              </Button>

              <Typography variant="caption" sx={{ display: "block", mt: 2, color: theme.palette.text.secondary }}>
                Ao criar a conta, uma organização padrão será criada automaticamente para você.
              </Typography>
            </form>
          )}

          {tab === "forgot" && (
            <form onSubmit={handleForgot}>
              <TextField
                label="Seu email"
                type="email"
                fullWidth
                required
                autoComplete="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                margin="normal"
                disabled={loading}
                autoFocus
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ mt: 3, py: 1.5, textTransform: "none", fontWeight: 700 }}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>

              <Button
                type="button"
                fullWidth
                disabled={loading}
                onClick={() => {
                  setTab("signin");
                  setEmail(forgotEmail);
                  resetMessages();
                }}
                sx={{ mt: 1, textTransform: "none" }}
              >
                Voltar para login
              </Button>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
};
