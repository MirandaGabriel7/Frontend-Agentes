import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  Avatar,
  alpha,
  useTheme,
  Stack,
  IconButton,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";

// Ícones “premium”
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";

import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../infra/supabaseClient";

type AvatarPrimary = "INITIALS" | "ICON";

type AvatarColorKey =
  | "blue"
  | "indigo"
  | "violet"
  | "teal"
  | "green"
  | "orange"
  | "yellow"
  | "red"
  | "pink"
  | "hotpink"
  | "rose"
  | "lilac"
  | "cyan"
  | "slate"
  | "dark";

type AvatarIconKey =
  | "user"
  | "shield"
  | "work"
  | "org"
  | "doc"
  | "settings"
  | "star"
  | "bolt"
  | "verified"
  | "chat"
  | "key"
  | "sparkles";

const AVATAR_COLORS: { key: AvatarColorKey; label: string; hex: string }[] = [
  // azuis / corporativos
  { key: "blue", label: "Azul", hex: "#1877F2" },
  { key: "indigo", label: "Índigo", hex: "#3B82F6" },
  { key: "violet", label: "Violeta", hex: "#7C3AED" },

  // tons modernos
  { key: "teal", label: "Teal", hex: "#0EA5A4" },
  { key: "cyan", label: "Ciano", hex: "#06B6D4" },
  { key: "green", label: "Verde", hex: "#16A34A" },

  // quentes / bem usados
  { key: "orange", label: "Laranja", hex: "#F97316" },
  { key: "yellow", label: "Amarelo", hex: "#FACC15" },
  { key: "red", label: "Vermelho", hex: "#EF4444" },

  // femininos / usáveis
  { key: "pink", label: "Rosa", hex: "#EC4899" },
  { key: "hotpink", label: "Rosa choque", hex: "#FF2D91" },
  { key: "rose", label: "Rosé", hex: "#FB7185" },
  { key: "lilac", label: "Lilás", hex: "#A78BFA" },

  // neutros
  { key: "slate", label: "Cinza", hex: "#475569" },
  { key: "dark", label: "Escuro", hex: "#111827" },
];

const AVATAR_ICONS: { key: AvatarIconKey; label: string; node: React.ReactNode }[] = [
  { key: "user", label: "Usuário", node: <PersonOutlineIcon fontSize="small" /> },
  { key: "shield", label: "Segurança", node: <ShieldOutlinedIcon fontSize="small" /> },
  { key: "work", label: "Trabalho", node: <WorkOutlineIcon fontSize="small" /> },
  { key: "org", label: "Órgão", node: <BusinessOutlinedIcon fontSize="small" /> },
  { key: "doc", label: "Documento", node: <DescriptionOutlinedIcon fontSize="small" /> },
  { key: "settings", label: "Config", node: <SettingsOutlinedIcon fontSize="small" /> },
  { key: "star", label: "Destaque", node: <StarOutlineIcon fontSize="small" /> },
  { key: "bolt", label: "Rápido", node: <BoltOutlinedIcon fontSize="small" /> },
  { key: "verified", label: "Verificado", node: <VerifiedOutlinedIcon fontSize="small" /> },
  { key: "chat", label: "Chat", node: <ChatBubbleOutlineIcon fontSize="small" /> },
  { key: "key", label: "Chave", node: <KeyOutlinedIcon fontSize="small" /> },
  { key: "sparkles", label: "IA", node: <AutoAwesomeOutlinedIcon fontSize="small" /> },
];

function getColorHex(key?: AvatarColorKey) {
  return AVATAR_COLORS.find((c) => c.key === key)?.hex || "#1877F2";
}

function getIconNode(key?: AvatarIconKey) {
  return AVATAR_ICONS.find((i) => i.key === key)?.node || <PersonOutlineIcon fontSize="small" />;
}

function getInitials(email?: string) {
  const e = (email || "U").trim();
  const a = e.charAt(0).toUpperCase() || "U";
  const b = e.charAt(1).toUpperCase() || "";
  return (a + b).trim() || "U";
}

export default function ProfilePage() {
  const theme = useTheme();
  const { user, refreshUser } = useAuth(); // ✅ agora existe
  const pageMaxWidth = useMemo(() => 980, []);

  const [avatarPrimary, setAvatarPrimary] = useState<AvatarPrimary>("ICON");
  const [avatarColor, setAvatarColor] = useState<AvatarColorKey>("blue");
  const [avatarIcon, setAvatarIcon] = useState<AvatarIconKey>("user");
  const [savingIdentity, setSavingIdentity] = useState(false);

  const [email, setEmail] = useState(user?.email || "");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackSeverity, setSnackSeverity] = useState<"success" | "info" | "error">("info");
  const [snackMessage, setSnackMessage] = useState<string>("");

  const openSnack = (message: string, severity: "success" | "info" | "error" = "info") => {
    setSnackMessage(message);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  useEffect(() => {
    const uEmail = user?.email || "";
    setEmail(uEmail);
    setNewEmail(uEmail);

    const meta: any = user?.user_metadata || {};
    setAvatarPrimary((meta.avatar_primary as AvatarPrimary) || "ICON");
    setAvatarColor((meta.avatar_color as AvatarColorKey) || "blue");
    setAvatarIcon((meta.avatar_icon as AvatarIconKey) || "user");
  }, [user?.email, user?.user_metadata]);

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
          py: 2.1,
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
          <Typography sx={{ fontWeight: 950, letterSpacing: "-0.015em", fontSize: "0.95rem" }}>
            {title}
          </Typography>
          {description ? (
            <Typography sx={{ mt: 0.4, color: "text.secondary", fontSize: "0.85rem" }}>
              {description}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.12) }} />
      <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2.4 }}>{children}</Box>
    </Paper>
  );

  const handleResetIdentity = () => {
    setAvatarPrimary("ICON");
    setAvatarColor("blue");
    setAvatarIcon("user");
  };

  const handleSaveIdentity = async () => {
    if (!supabase) {
      openSnack("Serviço de autenticação indisponível.", "error");
      return;
    }

    setSavingIdentity(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_primary: avatarPrimary,
          avatar_color: avatarColor,
          avatar_icon: avatarIcon,
        },
      });
      if (error) throw error;

      // ✅ força a atualização do user no contexto → topbar reflete na hora
      await refreshUser();

      openSnack("Identidade atualizada.", "success");
    } catch (err: any) {
      openSnack(err?.message || "Erro ao salvar identidade.", "error");
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!supabase) {
      openSnack("Serviço de autenticação indisponível.", "error");
      return;
    }

    const next = newEmail.trim().toLowerCase();
    if (!next || !next.includes("@")) {
      openSnack("Digite um email válido.", "error");
      return;
    }

    const current = (user?.email || "").trim().toLowerCase();
    if (next === current) {
      openSnack("Esse já é o seu email atual.", "info");
      return;
    }

    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: next });
      if (error) throw error;

      // refresh pra refletir mudanças se o supabase já atualizar o email localmente
      await refreshUser();

      openSnack("Enviamos um link de confirmação para concluir a troca de email.", "info");
    } catch (err: any) {
      openSnack(err?.message || "Erro ao atualizar email.", "error");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!supabase) {
      openSnack("Serviço de autenticação indisponível.", "error");
      return;
    }

    if (!currentPassword) {
      openSnack("Digite sua senha atual para confirmar.", "error");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      openSnack("A nova senha precisa ter pelo menos 8 caracteres.", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      openSnack("As senhas não coincidem.", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      openSnack("Senha atualizada com sucesso.", "success");
    } catch (err: any) {
      openSnack(err?.message || "Erro ao atualizar senha.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const avatarBg = getColorHex(avatarColor);
  const avatarContent =
    avatarPrimary === "INITIALS" ? getInitials(user?.email) : getIconNode(avatarIcon);

  return (
    <Box sx={{ width: "100%", maxWidth: pageMaxWidth, mx: "auto" }}>
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
            <AccountCircleIcon fontSize="small" />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-0.02em" }}>
              Meu perfil
            </Typography>
            <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: "0.9rem" }}>
              Gerencie sua identidade e segurança da conta
            </Typography>
          </Box>

          <Box
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.success.main, 0.10),
              color: theme.palette.success.dark,
              border: `1px solid ${alpha(theme.palette.success.main, 0.18)}`,
              fontSize: "0.8rem",
              fontWeight: 800,
            }}
          >
            Conta ativa
          </Box>
        </Box>
      </Box>

      <Stack spacing={2}>
        <Card
          title="Identidade"
          description="Escolha cor e se o avatar será por letras ou ícone."
          icon={<PaletteOutlinedIcon fontSize="small" />}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: avatarBg,
                  color: "#fff",
                  fontWeight: 950,
                }}
              >
                {avatarContent}
              </Avatar>

              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: "0.95rem" }}>
                  {user?.email || "Usuário"}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                  Simples e consistente.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Tooltip title="Restaurar">
                <IconButton
                  onClick={handleResetIdentity}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.18)}`,
                  }}
                >
                  <RestartAltOutlinedIcon />
                </IconButton>
              </Tooltip>

              <Button variant="contained" disableElevation onClick={handleSaveIdentity} disabled={savingIdentity}>
                {savingIdentity ? "Salvando..." : "Salvar"}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: alpha(theme.palette.divider, 0.12) }} />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: "0.88rem", mb: 1 }}>Primário</Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                <Button
                  variant={avatarPrimary === "INITIALS" ? "contained" : "outlined"}
                  disableElevation
                  size="small"
                  onClick={() => setAvatarPrimary("INITIALS")}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800, borderColor: alpha(theme.palette.divider, 0.22) }}
                >
                  Letras
                </Button>
                <Button
                  variant={avatarPrimary === "ICON" ? "contained" : "outlined"}
                  disableElevation
                  size="small"
                  onClick={() => setAvatarPrimary("ICON")}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800, borderColor: alpha(theme.palette.divider, 0.22) }}
                >
                  Ícone
                </Button>
              </Box>

              <Typography sx={{ fontWeight: 900, fontSize: "0.88rem", mb: 1 }}>Cor</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {AVATAR_COLORS.map((c) => {
                  const selected = avatarColor === c.key;
                  return (
                    <Tooltip key={c.key} title={c.label}>
                      <Box
                        role="button"
                        onClick={() => setAvatarColor(c.key)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          bgcolor: c.hex,
                          cursor: "pointer",
                          border: selected ? `3px solid ${alpha(theme.palette.primary.main, 0.25)}` : `1px solid ${alpha("#000", 0.10)}`,
                          boxShadow: selected ? `0 0 0 3px ${alpha(c.hex, 0.22)}` : `0 10px 18px ${alpha("#000", 0.06)}`,
                          transition: "all .15s ease",
                          "&:hover": { transform: "translateY(-1px)", boxShadow: `0 12px 22px ${alpha("#000", 0.10)}` },
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ opacity: avatarPrimary === "ICON" ? 1 : 0.45 }}>
              <Typography sx={{ fontWeight: 900, fontSize: "0.88rem", mb: 1 }}>Ícone</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {AVATAR_ICONS.map((i) => {
                  const selected = avatarIcon === i.key;
                  return (
                    <Tooltip key={i.key} title={i.label}>
                      <span>
                        <IconButton
                          onClick={() => setAvatarIcon(i.key)}
                          disabled={avatarPrimary !== "ICON"}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.divider, 0.18)}`,
                            bgcolor: selected ? alpha(theme.palette.primary.main, 0.10) : "transparent",
                            color: selected ? "primary.main" : "text.secondary",
                            "&:hover": {
                              bgcolor: selected ? alpha(theme.palette.primary.main, 0.14) : alpha(theme.palette.action.hover, 0.05),
                            },
                          }}
                        >
                          {i.node as any}
                        </IconButton>
                      </span>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Card>

        <Card title="Email" description="Seu email é usado para acesso e notificações." icon={<EmailOutlinedIcon fontSize="small" />}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
              <TextField label="Email atual" value={email} disabled size="small" fullWidth />
              <TextField label="Novo email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} size="small" fullWidth />
            </Box>

            <Alert
              severity="info"
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor: alpha(theme.palette.info.main, 0.25),
                bgcolor: alpha(theme.palette.info.main, 0.06),
                color: "text.secondary",
                "& .MuiAlert-icon": { color: theme.palette.info.main },
              }}
            >
              Pode ser necessário confirmar a troca por um link enviado para o novo endereço.
            </Alert>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25 }}>
              <Button variant="outlined" color="inherit" sx={{ borderColor: alpha(theme.palette.divider, 0.3) }} onClick={() => setNewEmail(email)} disabled={savingEmail}>
                Cancelar
              </Button>
              <Button variant="contained" disableElevation onClick={handleSaveEmail} disabled={savingEmail}>
                {savingEmail ? "Salvando..." : "Salvar"}
              </Button>
            </Box>
          </Box>
        </Card>

        <Card title="Senha" description="Use uma senha forte e exclusiva." icon={<LockOutlinedIcon fontSize="small" />}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <TextField label="Senha atual" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} size="small" fullWidth />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
              <TextField label="Nova senha" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} size="small" fullWidth helperText="Mínimo de 8 caracteres." />
              <TextField label="Confirmar nova senha" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} size="small" fullWidth />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.25 }}>
              <Button
                variant="outlined"
                color="inherit"
                sx={{ borderColor: alpha(theme.palette.divider, 0.3) }}
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }}
                disabled={savingPassword}
              >
                Cancelar
              </Button>

              <Button
                variant="contained"
                disableElevation
                onClick={handleChangePassword}
                disabled={
                  savingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmNewPassword ||
                  newPassword !== confirmNewPassword ||
                  newPassword.length < 8
                }
              >
                {savingPassword ? "Alterando..." : "Alterar senha"}
              </Button>
            </Box>
          </Box>
        </Card>
      </Stack>

      <Snackbar open={snackOpen} autoHideDuration={3500} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} variant="filled" sx={{ borderRadius: 2, fontWeight: 800, boxShadow: `0 12px 28px ${alpha("#000", 0.18)}` }}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
