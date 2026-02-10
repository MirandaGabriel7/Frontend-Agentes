// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./layout/MainLayout";

import { LoginPage } from "./pages/LoginPage";
import { AgentsPage } from "./pages/AgentsPage";
import { DfdAgentPage } from "./pages/DfdAgentPage";
import AgenteDfdResultado from "./pages/AgenteDfdResultado";

import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { TrpPage } from "./modules/trp/pages/TrpPage";
import { TrpResultPage } from "./modules/trp/pages/TrpResultPage";
import { TrpHistoryPage } from "./modules/trp/pages/TrpHistoryPage";

// ✅ TRD
import { TrdPage } from "./modules/trd/pages/TrdPage";
import { TrdHistoryPage } from "./modules/trd/pages/TrdHistoryPage";
import { TrdResultPage } from "./modules/trd/pages/TrdResultPage";

import { UiSettingsProvider, useUiSettings } from "./contexts/UiSettingsContext";

function AppShell() {
  const { muiTheme } = useUiSettings();

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Root */}
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

              {/* Dashboard / Agents */}
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

              {/* Settings/Profile */}
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

              {/* ===================== TRP ===================== */}
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
                path="/agents/trp/resultado/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrpResultPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* TRP aliases */}
              <Route path="/agents/trp/novo" element={<Navigate to="/agents/trp" replace />} />
              <Route path="/agents/trp/lista" element={<Navigate to="/agents/trp/historico" replace />} />
              <Route path="/agents/trp/:id" element={<Navigate to="/agents/trp/historico" replace />} />

              {/* ===================== TRD ===================== */}
              {/* ✅ HOME do TRD (mostra os 10 últimos) */}
              <Route
                path="/agents/trd"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrdPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* ✅ Histórico completo do TRD */}
              <Route
                path="/agents/trd/historico"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrdHistoryPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* ✅ Resultado do TRD */}
              <Route
                path="/agents/trd/resultado/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <TrdResultPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* TRD aliases (opcional, evita rota solta cair no lugar errado) */}
              <Route path="/agents/trd/novo" element={<Navigate to="/agents/trd" replace />} />
              <Route path="/agents/trd/lista" element={<Navigate to="/agents/trd/historico" replace />} />
              <Route path="/agents/trd/:id" element={<Navigate to="/agents/trd/historico" replace />} />

              {/* ===================== DFD ===================== */}
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

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/agents" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <UiSettingsProvider>
      <AppShell />
    </UiSettingsProvider>
  );
}
