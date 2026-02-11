// src/App.tsx
import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, CircularProgress, Typography } from "@mui/material";
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

import { TrdPage } from "./modules/trd/pages/TrdPage";
import { TrdHistoryPage } from "./modules/trd/pages/TrdHistoryPage";
import { TrdResultPage } from "./modules/trd/pages/TrdResultPage";

import { UiSettingsProvider, useUiSettings } from "./contexts/UiSettingsContext";

function AppBootFallback() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <CircularProgress size={22} />
        <Typography variant="body2" color="text.secondary">
          Carregando aplicação…
        </Typography>
      </Box>
    </Box>
  );
}

function AppShell() {
  const { muiTheme } = useUiSettings();

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          {/* Suspense evita tela branca caso algum chunk/provider demore */}
          <Suspense fallback={<AppBootFallback />}>
            {/* basename fica seguro pra ambientes com base path */}
            <BrowserRouter basename={import.meta.env.BASE_URL ?? "/"}>
              <Routes>
                {/* Debug: se isso abrir, router + deploy estão OK */}
                <Route
                  path="/health"
                  element={
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6">OK</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Router funcionando.
                      </Typography>
                    </Box>
                  }
                />

                {/* Public */}
                <Route path="/login" element={<LoginPage />} />

                {/* Root: deixa explícito pra evitar "nada" */}
                <Route path="/" element={<Navigate to="/agents" replace />} />

                {/* ===================== PROTECTED GROUP ===================== */}
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

                {/* TRD aliases */}
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

                {/* Fallback: manda pro login primeiro pra evitar loop com auth */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </Suspense>
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
