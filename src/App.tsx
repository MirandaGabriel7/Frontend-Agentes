import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { theme } from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./layout/MainLayout";

import { LoginPage } from "./pages/LoginPage";
import { AgentsPage } from "./pages/AgentsPage";
import { DfdAgentPage } from "./pages/DfdAgentPage";
import AgenteDfdResultado from "./pages/AgenteDfdResultado";

// ✅ PÁGINAS DE CONTA
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

// TRP
import { TrpPage } from "./modules/trp/pages/TrpPage";
import { TrpResultPage } from "./modules/trp/pages/TrpResultPage";
import { TrpHistoryPage } from "./modules/trp/pages/TrpHistoryPage";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* ===================== */}
              {/* ROTA PÚBLICA */}
              {/* ===================== */}
              <Route path="/login" element={<LoginPage />} />

              {/* ===================== */}
              {/* HOME */}
              {/* ===================== */}
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

              {/* ===================== */}
              {/* DASHBOARD / AGENTS */}
              {/* ===================== */}
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

              {/* ===================== */}
              {/* CONFIGURAÇÕES */}
              {/* ===================== */}
              <Route
                path="/agents/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* ===================== */}
              {/* MEU PERFIL */}
              {/* ===================== */}
              <Route
                path="/agents/profile"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ProfilePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* ===================== */}
              {/* TRP */}
              {/* ===================== */}
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

              {/* Redirects (rotas antigas TRP) */}
              <Route
                path="/agents/trp/novo"
                element={<Navigate to="/agents/trp" replace />}
              />
              <Route
                path="/agents/trp/lista"
                element={<Navigate to="/agents/trp/historico" replace />}
              />
              <Route
                path="/agents/trp/:id"
                element={<Navigate to="/agents/trp/historico" replace />}
              />

              {/* ===================== */}
              {/* DFD */}
              {/* ===================== */}
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

              {/* ===================== */}
              {/* FALLBACK */}
              {/* ===================== */}
              <Route path="*" element={<Navigate to="/agents" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
