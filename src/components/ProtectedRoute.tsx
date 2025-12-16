import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { isUuid } from '../utils/uuid';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, orgIdAtiva, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
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
  }

  // Verificar sessão
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Verificar orgId válido (no estado OU localStorage)
  const orgIdFromStorage = localStorage.getItem('planco_active_org_id');
  const hasValidOrgId = (orgIdAtiva && isUuid(orgIdAtiva)) || (orgIdFromStorage && isUuid(orgIdFromStorage));

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
