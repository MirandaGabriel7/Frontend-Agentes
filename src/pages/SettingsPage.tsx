// src/pages/SettingsPage.tsx
import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  alpha,
  useTheme,
  Stack,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";

type UiDensity = "COMFORTABLE" | "COMPACT";
type ThemeMode = "LIGHT" | "DARK";

export default function SettingsPage() {
  const theme = useTheme();

  // Estado local (por enquanto). Depois você pode plugar em contexto/Supabase.
  const [themeMode, setThemeMode] = useState<ThemeMode>("LIGHT");
  const [density, setDensity] = useState<UiDensity>("COMFORTABLE");
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [notifyNonCritical, setNotifyNonCritical] = useState(true);

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
        border: `1px solid ${alpha(theme.palette.divider, 0.14)}`,
        overflow: "hidden",
        background: theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.25,
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          background: alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            background: alpha(theme.palette.primary.main, 0.06),
            color: "primary.main",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 650,
              letterSpacing: "-0.015em",
              color: "text.primary",
              fontSize: "0.95rem",
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
                fontSize: "0.85rem",
                lineHeight: 1.35,
              }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.12) }} />

      <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>{children}</Box>
    </Paper>
  );

  const Row = ({ children }: { children: React.ReactNode }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        py: 1.25,
      }}
    >
      {children}
    </Box>
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: pageMaxWidth,
        mx: "auto",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              background: alpha(theme.palette.primary.main, 0.06),
              color: "primary.main",
            }}
          >
            <SettingsIcon fontSize="small" />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              Configurações
            </Typography>
            <Typography
              sx={{
                mt: 0.25,
                color: "text.secondary",
                fontSize: "0.9rem",
              }}
            >
              Preferências gerais da plataforma
            </Typography>
          </Box>
        </Box>
      </Box>

      <Stack spacing={2}>
        {/* Aparência */}
        <Card
          title="Aparência"
          description="Ajustes simples para deixar a interface mais confortável."
          icon={<DarkModeOutlinedIcon fontSize="small" />}
        >
          <Row>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Tema
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Escolha claro ou escuro.
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="theme-mode-label">Tema</InputLabel>
              <Select
                labelId="theme-mode-label"
                value={themeMode}
                label="Tema"
                onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
              >
                <MenuItem value="LIGHT">Claro</MenuItem>
                <MenuItem value="DARK">Escuro</MenuItem>
              </Select>
            </FormControl>
          </Row>

          <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.divider, 0.12) }} />

          <Row>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Densidade da interface
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Controle o espaçamento entre elementos.
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="density-label">Densidade</InputLabel>
              <Select
                labelId="density-label"
                value={density}
                label="Densidade"
                onChange={(e) => setDensity(e.target.value as UiDensity)}
              >
                <MenuItem value="COMFORTABLE">Confortável</MenuItem>
                <MenuItem value="COMPACT">Compacta</MenuItem>
              </Select>
            </FormControl>
          </Row>

          <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.divider, 0.12) }} />

          <FormControlLabel
            control={
              <Switch
                checked={tipsEnabled}
                onChange={(e) => setTipsEnabled(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  Mostrar dicas rápidas
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                  Exibe pequenos atalhos e orientações em pontos-chave.
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start", ml: 0 }}
          />
        </Card>

        {/* Idioma e região */}
        <Card
          title="Idioma e região"
          description="Preferências padrão para formatação e localização."
          icon={<LanguageOutlinedIcon fontSize="small" />}
        >
          <Row>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Idioma
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Idioma da interface.
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="lang-label">Idioma</InputLabel>
              <Select labelId="lang-label" value={"pt-BR"} label="Idioma" disabled>
                <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
              </Select>
            </FormControl>
          </Row>

          <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.divider, 0.12) }} />

          <Row>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Formato de data
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Padrão usado nos documentos e campos.
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="datefmt-label">Formato</InputLabel>
              <Select
                labelId="datefmt-label"
                value={"DD/MM/AAAA"}
                label="Formato"
                disabled
              >
                <MenuItem value="DD/MM/AAAA">DD/MM/AAAA</MenuItem>
              </Select>
            </FormControl>
          </Row>

          <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.divider, 0.12) }} />

          <Row>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Fuso horário
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Usado para registros de data e hora.
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="tz-label">Fuso</InputLabel>
              <Select labelId="tz-label" value={"America/Sao_Paulo"} label="Fuso" disabled>
                <MenuItem value="America/Sao_Paulo">Brasília (GMT-3)</MenuItem>
              </Select>
            </FormControl>
          </Row>
        </Card>

        {/* Notificações */}
        <Card
          title="Notificações"
          description="Controle o que o sistema te avisa durante o uso."
          icon={<NotificationsOutlinedIcon fontSize="small" />}
        >
          <FormControlLabel
            control={
              <Switch
                checked={notifyEnabled}
                onChange={(e) => setNotifyEnabled(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  Receber notificações
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                  Habilita alertas gerais do sistema.
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start", ml: 0 }}
          />

          <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.divider, 0.12) }} />

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
                <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  Notificações não críticas
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                  Mostra avisos informativos e dicas.
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start", ml: 0 }}
          />
        </Card>

        {/* Segurança/Conta */}
        <Card
          title="Conta"
          description="Ações rápidas de segurança e sessão."
          icon={<SecurityOutlinedIcon fontSize="small" />}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
            <Button variant="contained" disableElevation>
              Alterar senha
            </Button>
            <Button variant="outlined" color="inherit">
              Encerrar sessão
            </Button>
          </Box>

          <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: "0.85rem" }}>
            Algumas opções podem ser ajustadas pela administração do órgão.
          </Typography>
        </Card>
      </Stack>

      {/* Footer actions */}
      <Box
        sx={{
          mt: 2.5,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.25,
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          sx={{ borderColor: alpha(theme.palette.divider, 0.3) }}
        >
          Cancelar
        </Button>
        <Button variant="contained" disableElevation>
          Salvar alterações
        </Button>
      </Box>
    </Box>
  );
}
