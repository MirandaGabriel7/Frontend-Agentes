import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { AgentsPage } from './pages/AgentsPage';
import { DfdAgentPage } from './pages/DfdAgentPage';
import { TrpListPage } from './modules/trp/pages/TrpListPage';
import { TrpNewPage } from './modules/trp/pages/TrpNewPage';
import { TrpDetailPage } from './modules/trp/pages/TrpDetailPage';
import { TrpPage } from './modules/trp/pages/TrpPage';
import { TrpResultPage } from './modules/trp/pages/TrpResultPage';
import { TrpHistoryPage } from './modules/trp/pages/TrpHistoryPage';
import AgenteDfdResultado from './pages/AgenteDfdResultado';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Rota pública de login */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Rotas protegidas */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Navigate to="/agents" replace />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AgentsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/trp"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrpPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/trp/lista"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrpListPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/trp/novo"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrpNewPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/trp/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrpDetailPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/trp/resultado/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrpResultPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/trp/historico"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrpHistoryPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/dfd"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DfdAgentPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents/dfd/resultado/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AgenteDfdResultado />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;

