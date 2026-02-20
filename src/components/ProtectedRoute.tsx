// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { isUuid } from "../utils/uuid";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const LoadingScreen: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
    }}
  >
    <CircularProgress />
  </Box>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, orgIdAtiva, authLoading, orgLoading } = useAuth();
  const location = useLocation();

  // ✅ Regra 1: só travar tela pelo authLoading (bootstrap inicial)
  if (authLoading) return <LoadingScreen />;

  // ✅ Sem sessão = manda pro login
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;

  // ✅ Se já tem org válida, NUNCA bloquear a tela por orgLoading (evita loop multi-tab)
  const hasValidOrgId = !!orgIdAtiva && isUuid(orgIdAtiva);
  if (hasValidOrgId) return <>{children}</>;

  // ✅ Se não tem org válida e está carregando org, aí sim mostra loading
  if (orgLoading) return <LoadingScreen />;

  // ✅ Sem org válida e não está carregando: bloqueia e avisa
  return (
    <Navigate
      to="/login"
      replace
      state={{
        from: location,
        message:
          "Usuário não vinculado a nenhuma organização. Entre em contato com o administrador.",
      }}
    />
  );
};