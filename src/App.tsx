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
              <Route path="/login" element={<LoginPage />} />

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

              <Route path="/agents/trp/novo" element={<Navigate to="/agents/trp" replace />} />
              <Route path="/agents/trp/lista" element={<Navigate to="/agents/trp/historico" replace />} />
              <Route path="/agents/trp/:id" element={<Navigate to="/agents/trp/historico" replace />} />

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
