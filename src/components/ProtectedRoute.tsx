import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { isUuid } from '../utils/uuid';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const LoadingScreen: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, orgIdAtiva, authLoading, orgLoading } = useAuth();
  const location = useLocation();

  // Enquanto está carregando auth ou org, mostrar loading (não navegar)
  if (authLoading || orgLoading) {
    return <LoadingScreen />;
  }

  // Verificar sessão
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Verificar orgId válido
  const hasValidOrgId = orgIdAtiva && isUuid(orgIdAtiva);

  if (!hasValidOrgId) {
    // Usuário logado mas sem org válida
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: 'Usuário não vinculado a nenhuma organização. Entre em contato com o administrador.',
        }}
      />
    );
  }

  return <>{children}</>;
};
