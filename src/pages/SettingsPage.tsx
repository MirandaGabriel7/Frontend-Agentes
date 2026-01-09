// src/pages/SettingsPage.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Button,
  alpha,
  useTheme,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import ComputerOutlinedIcon from "@mui/icons-material/ComputerOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

import { useUiSettings, ThemeMode } from "../contexts/UiSettingsContext";

const LS_TIPS = "planco_ui_tips_enabled";
const LS_NOTIFY = "planco_ui_notify_enabled";
const LS_NOTIFY_NONCRIT = "planco_ui_notify_noncritical";

export default function SettingsPage() {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useUiSettings();

  // Preferências simples em localStorage
  const [tipsEnabled, setTipsEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem(LS_TIPS);
    return v ? v === "true" : true;
  });

  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem(LS_NOTIFY);
    return v ? v === "true" : true;
  });

  const [notifyNonCritical, setNotifyNonCritical] = useState<boolean>(() => {
    const v = localStorage.getItem(LS_NOTIFY_NONCRIT);
    return v ? v === "true" : true;
  });

  const [savedToast, setSavedToast] = useState(false);

  const pageMaxWidth = useMemo(() => 980, []);

  const Card = ({
    title,
    description,
    icon,
    children,
  }: {
    title: string;
    description?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.22 : 0.14)}`,
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 10px 28px ${alpha("#000", 0.45)}`
            : `0 10px 28px ${alpha("#0F172A", 0.06)}`,
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.25,
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          background: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.06),
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.38 : 0.20)}`,
            background: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.10),
            color: "primary.main",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "text.primary",
              fontSize: "0.98rem",
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              sx={{
                mt: 0.5,
                color: "text.secondary",
                fontSize: "0.88rem",
                lineHeight: 1.35,
              }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.35 : 0.25) }} />

      <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>{children}</Box>
    </Paper>
  );

  const Row = ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
        py: 1.25,
        flexDirection: { xs: "column", sm: "row" },
      }}
    >
      <Box sx={{ flex: 1 }}>{left}</Box>
      <Box sx={{ flexShrink: 0 }}>{right}</Box>
    </Box>
  );

  const handleSave = () => {
    localStorage.setItem(LS_TIPS, String(tipsEnabled));
    localStorage.setItem(LS_NOTIFY, String(notifyEnabled));
    localStorage.setItem(LS_NOTIFY_NONCRIT, String(notifyNonCritical));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1400);
  };

  const handleCancel = () => {
    const t = localStorage.getItem(LS_TIPS);
    const n = localStorage.getItem(LS_NOTIFY);
    const nn = localStorage.getItem(LS_NOTIFY_NONCRIT);

    setTipsEnabled(t ? t === "true" : true);
    setNotifyEnabled(n ? n === "true" : true);
    setNotifyNonCritical(nn ? nn === "true" : true);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: pageMaxWidth, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 2.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.75,
                display: "grid",
                placeItems: "center",
                border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.38 : 0.20)}`,
                background: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.10),
                color: "primary.main",
              }}
            >
              <SettingsIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-0.04em" }}>
                Configurações
              </Typography>
              <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: "0.92rem" }}>
                Preferências gerais da plataforma
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.30 : 0.22)}`,
              color: savedToast ? "success.main" : "text.secondary",
              background: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.35 : 0.60),
              fontSize: "0.82rem",
              fontWeight: 800,
              opacity: savedToast ? 1 : 0.92,
              transition: "all .2s ease",
              userSelect: "none",
            }}
          >
            {savedToast ? "Salvo" : "Preferências"}
          </Box>
        </Box>
      </Box>

      <Stack spacing={2}>
        {/* Aparência */}
        <Card
          title="Aparência"
          description="Tema claro, escuro ou seguir o sistema."
          icon={<DarkModeOutlinedIcon fontSize="small" />}
        >
          <Row
            left={
              <>
                <Typography sx={{ fontWeight: 900, fontSize: "0.94rem" }}>Tema</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.88rem" }}>
                  A troca é imediata e fica salva.
                </Typography>
              </>
            }
            right={
              <ToggleButtonGroup
                exclusive
                value={themeMode}
                onChange={(_, v) => v && setThemeMode(v as ThemeMode)}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    borderRadius: 999,
                    px: 1.6,
                    py: 0.8,
                    borderColor: alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.35 : 0.28),
                    fontWeight: 900,
                    gap: 0.8,
                    textTransform: "none",
                  },
                  "& .Mui-selected": {
                    background: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.25 : 0.12),
                    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.60 : 0.40),
                  },
                }}
              >
                <ToggleButton value="LIGHT">
                  <LightModeOutlinedIcon sx={{ fontSize: 18 }} /> Claro
                </ToggleButton>
                <ToggleButton value="DARK">
                  <DarkModeOutlinedIcon sx={{ fontSize: 18 }} /> Escuro
                </ToggleButton>
                <ToggleButton value="SYSTEM">
                  <ComputerOutlinedIcon sx={{ fontSize: 18 }} /> Sistema
                </ToggleButton>
              </ToggleButtonGroup>
            }
          />

          <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.35 : 0.22) }} />

          <FormControlLabel
            control={<Switch checked={tipsEnabled} onChange={(e) => setTipsEnabled(e.target.checked)} />}
            label={
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: "0.94rem" }}>Mostrar dicas rápidas</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.88rem" }}>
                  Exibe atalhos e orientações em pontos-chave.
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start", ml: 0 }}
          />
        </Card>

        {/* Idioma e região */}
        <Card
          title="Idioma e região"
          description="Preferências de idioma e formatação (por enquanto fixas)."
          icon={<LanguageOutlinedIcon fontSize="small" />}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
            <Typography sx={{ fontWeight: 900, color: "text.primary" }}>Português (Brasil)</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.90rem" }}>Formato de data: DD/MM/AAAA</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.90rem" }}>Fuso horário: Brasília (GMT-3)</Typography>
          </Box>
        </Card>

        {/* Notificações */}
        <Card
          title="Notificações"
          description="Controle o que o sistema te avisa durante o uso."
          icon={<NotificationsOutlinedIcon fontSize="small" />}
        >
          <FormControlLabel
            control={<Switch checked={notifyEnabled} onChange={(e) => setNotifyEnabled(e.target.checked)} />}
            label={
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: "0.94rem" }}>Receber notificações</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.88rem" }}>
                  Habilita alertas gerais do sistema.
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start", ml: 0 }}
          />

          <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.35 : 0.22) }} />

          <FormControlLabel
            control={
              <Switch
                checked={notifyNonCritical}
                disabled={!notifyEnabled}
                onChange={(e) => setNotifyNonCritical(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: "0.94rem" }}>Notificações não críticas</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.88rem" }}>
                  Mostra avisos informativos e dicas.
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start", ml: 0 }}
          />
        </Card>

        {/* Conta */}
        <Card title="Conta" description="Ações rápidas de conta e acesso." icon={<SecurityOutlinedIcon fontSize="small" />}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
            <Button
              variant="contained"
              disableElevation
              onClick={() => window.location.assign("/agents/profile")}
            >
              Gerenciar perfil
            </Button>
            <Button variant="outlined" color="inherit" onClick={handleSave}>
              Salvar agora
            </Button>
          </Box>

          <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: "0.88rem" }}>
            Algumas opções podem ser ajustadas pela administração do órgão.
          </Typography>
        </Card>
      </Stack>

      {/* Footer actions */}
      <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end", gap: 1.25 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleCancel}
          sx={{ borderColor: alpha(theme.palette.divider, theme.palette.mode === "dark" ? 0.40 : 0.30) }}
        >
          Cancelar
        </Button>
        <Button variant="contained" disableElevation onClick={handleSave}>
          Salvar alterações
        </Button>
      </Box>
    </Box>
  );
}
