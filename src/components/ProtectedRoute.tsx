// src/routes/ProtectedRoute.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { CircularProgress, Box, Typography, Button } from "@mui/material";
import { isUuid } from "../utils/uuid";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ✅ Rotas que NUNCA devem depender de orgLoading.
 * (Evita travar login e reset de senha em loop.)
 */
function isPublicOrAuthRoute(pathname: string): boolean {
  const p = (pathname || "").toLowerCase();
  return (
    p.startsWith("/login") ||
    p.startsWith("/reset-password") ||
    p.startsWith("/auth/callback") ||
    p.startsWith("/signup") ||
    p.startsWith("/forgot-password")
  );
}

const LoadingScreen: React.FC<{
  label?: string;
  onForceContinue?: () => void;
}> = ({ label = "Carregando…", onForceContinue }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      gap: 2,
      px: 3,
    }}
  >
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>

    {onForceContinue && (
      <Button
        variant="text"
        onClick={onForceContinue}
        sx={{ textTransform: "none" }}
      >
        Continuar mesmo assim
      </Button>
    )}
  </Box>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, orgIdAtiva, authLoading, orgLoading } = useAuth();
  const location = useLocation();

  const isBypass = useMemo(
    () => isPublicOrAuthRoute(location.pathname),
    [location.pathname],
  );

  /**
   * ✅ Fail-safe: se orgLoading travar, não prende o app pra sempre.
   * Em produção isso salva sua vida quando uma policy/RPC dá ruim.
   */
  const [orgTimeout, setOrgTimeout] = useState(false);
  useEffect(() => {
    setOrgTimeout(false);

    if (isBypass) return; // rotas públicas/auth não precisam disso

    if (!orgLoading) return;

    const t = window.setTimeout(() => {
      setOrgTimeout(true);
    }, 4500); // 4.5s é suficiente pra não dar sensação de travamento

    return () => window.clearTimeout(t);
  }, [orgLoading, isBypass]);

  /**
   * ✅ 1) Rotas públicas/auth: NUNCA bloqueia por loading.
   * (Login/reset/callback precisam carregar mesmo sem org.)
   */
  if (isBypass) {
    return <>{children}</>;
  }

  /**
   * ✅ 2) Enquanto auth está carregando, pode mostrar loader.
   * (authLoading é aceitável bloquear porque sem sessão não decide nada)
   */
  if (authLoading) {
    return <LoadingScreen label="Verificando sessão…" />;
  }

  /**
   * ✅ 3) Se não tem sessão, manda pro login
   */
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  /**
   * ✅ 4) Se org ainda está carregando:
   * - mostra loader, MAS com timeout (fallback)
   */
  if (orgLoading && !orgTimeout) {
    return <LoadingScreen label="Carregando organização…" />;
  }

  /**
   * ✅ 5) Se deu timeout no orgLoading, não trava.
   * Você pode:
   * - deixar o usuário seguir (recomendado), OU
   * - mandar pro login com msg.
   *
   * Eu recomendo deixar seguir e tratar falta de org nas telas que realmente exigem.
   */
  if (orgLoading && orgTimeout) {
    return (
      <LoadingScreen
        label="A organização demorou para carregar. Você pode continuar e tentar novamente."
        onForceContinue={() => setOrgTimeout(false)}
      />
    );
  }

  /**
   * ✅ 6) Org válida (quando exigida)
   */
  const hasValidOrgId = !!orgIdAtiva && isUuid(orgIdAtiva);

  if (!hasValidOrgId) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message:
            "Usuário sem organização válida. Se isso persistir, solicite acesso ao administrador.",
        }}
      />
    );
  }

  return <>{children}</>;
};