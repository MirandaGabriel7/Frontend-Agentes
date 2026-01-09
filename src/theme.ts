// src/theme.ts
import { createTheme, Theme } from "@mui/material/styles";

export type AppThemeMode = "light" | "dark";

/**
 * Shadows com 25 níveis (0..24) - MUI exige 25 strings.
 * No DARK: sombras mais "difusas" e profundas (sem ficar sujo).
 * No LIGHT: sombras suaves.
 */
const buildShadows = (isDark: boolean): Theme["shadows"] => {
  if (!isDark) {
    return [
      "none",
      "0 1px 2px rgba(15, 23, 42, 0.06)",
      "0 2px 6px rgba(15, 23, 42, 0.08)",
      "0 6px 16px rgba(15, 23, 42, 0.10)",
      "0 10px 22px rgba(15, 23, 42, 0.12)",
      "0 14px 28px rgba(15, 23, 42, 0.14)",
      "0 18px 34px rgba(15, 23, 42, 0.16)",
      "0 22px 40px rgba(15, 23, 42, 0.18)",
      "0 26px 46px rgba(15, 23, 42, 0.20)",
      "0 30px 52px rgba(15, 23, 42, 0.22)",
      "0 34px 58px rgba(15, 23, 42, 0.24)",
      "0 38px 64px rgba(15, 23, 42, 0.26)",
      "0 42px 70px rgba(15, 23, 42, 0.28)",
      "0 46px 76px rgba(15, 23, 42, 0.30)",
      "0 50px 82px rgba(15, 23, 42, 0.32)",
      "0 54px 88px rgba(15, 23, 42, 0.34)",
      "0 58px 94px rgba(15, 23, 42, 0.36)",
      "0 62px 100px rgba(15, 23, 42, 0.38)",
      "0 66px 106px rgba(15, 23, 42, 0.40)",
      "0 70px 112px rgba(15, 23, 42, 0.42)",
      "0 74px 118px rgba(15, 23, 42, 0.44)",
      "0 78px 124px rgba(15, 23, 42, 0.46)",
      "0 82px 130px rgba(15, 23, 42, 0.48)",
      "0 86px 136px rgba(15, 23, 42, 0.50)",
      "0 90px 142px rgba(15, 23, 42, 0.52)",
    ];
  }

  return [
    "none",
    "0 1px 2px rgba(0, 0, 0, 0.35)",
    "0 2px 8px rgba(0, 0, 0, 0.40)",
    "0 8px 18px rgba(0, 0, 0, 0.45)",
    "0 10px 26px rgba(0, 0, 0, 0.50)",
    "0 12px 34px rgba(0, 0, 0, 0.55)",
    "0 14px 40px rgba(0, 0, 0, 0.58)",
    "0 16px 46px rgba(0, 0, 0, 0.60)",
    "0 18px 52px rgba(0, 0, 0, 0.62)",
    "0 20px 58px rgba(0, 0, 0, 0.64)",
    "0 22px 64px rgba(0, 0, 0, 0.66)",
    "0 24px 70px rgba(0, 0, 0, 0.68)",
    "0 26px 76px rgba(0, 0, 0, 0.70)",
    "0 28px 82px rgba(0, 0, 0, 0.72)",
    "0 30px 88px rgba(0, 0, 0, 0.74)",
    "0 32px 94px rgba(0, 0, 0, 0.76)",
    "0 34px 100px rgba(0, 0, 0, 0.78)",
    "0 36px 106px rgba(0, 0, 0, 0.80)",
    "0 38px 112px rgba(0, 0, 0, 0.82)",
    "0 40px 118px rgba(0, 0, 0, 0.84)",
    "0 42px 124px rgba(0, 0, 0, 0.86)",
    "0 44px 130px rgba(0, 0, 0, 0.88)",
    "0 46px 136px rgba(0, 0, 0, 0.90)",
    "0 48px 142px rgba(0, 0, 0, 0.92)",
    "0 50px 148px rgba(0, 0, 0, 0.94)",
  ];
};

const buildTheme = (mode: AppThemeMode): Theme => {
  const isDark = mode === "dark";

  /**
   * Paleta DARK estilo "enterprise premium"
   * - Background bem escuro (não azulão)
   * - Cards mais claros
   * - Inputs em uma camada levemente mais clara + borda visível
   * - Texto secundário legível
   */
  const DARK = {
    bg: "#070B14", // background principal
    bg2: "#0B1220", // paper base
    surface1: "#0F1B2D", // cards / surfaces elevadas
    surface2: "#0C1628", // inputs/fields
    border: "rgba(120, 160, 220, 0.18)",
    divider: "rgba(255,255,255,0.10)",
    textPrimary: "#E6EDF7",
    textSecondary: "#A6B3C6",
    textDisabled: "#6E7C93",
    hover: "rgba(255,255,255,0.04)",
    selected: "rgba(24,119,242,0.14)",
    focusRing: "rgba(24,119,242,0.35)",
  };

  const LIGHT = {
    bg: "#f8fafc",
    bg2: "#ffffff",
    surface1: "#ffffff",
    surface2: "#ffffff",
    border: "rgba(15,23,42,0.12)",
    divider: "rgba(15,23,42,0.12)",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    textDisabled: "#94A3B8",
    hover: "rgba(15,23,42,0.04)",
    selected: "rgba(24,119,242,0.10)",
    focusRing: "rgba(24,119,242,0.22)",
  };

  const T = isDark ? DARK : LIGHT;

  const base = createTheme({
    palette: {
      mode,
      primary: {
        main: "#1877F2",
        light: "#E9F1FF",
        dark: "#105BBE",
      },
      secondary: { main: "#22d3ee" },

      background: {
        default: T.bg,
        paper: T.bg2,
      },

      text: {
        primary: T.textPrimary,
        secondary: T.textSecondary,
        disabled: T.textDisabled,
      },

      divider: T.divider,

      // melhora comportamento padrão do MUI no dark (hover/selected/disabled)
      action: {
        hover: T.hover,
        selected: T.selected,
        disabled: isDark ? "rgba(230,237,247,0.30)" : "rgba(15,23,42,0.28)",
        disabledBackground: isDark ? "rgba(230,237,247,0.10)" : "rgba(15,23,42,0.08)",
        focus: isDark ? "rgba(230,237,247,0.10)" : "rgba(15,23,42,0.08)",
        active: isDark ? "rgba(230,237,247,0.90)" : "rgba(15,23,42,0.80)",
      },

      success: { main: "#10B981", light: "#D1FAE5" },
      warning: { main: "#F59E0B", light: "#FEF3C7" },
      error: { main: "#EF4444" },
      info: { main: "#1877F2" },
    },

    typography: {
      fontFamily: [
        "Inter",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
      ].join(","),
      h1: { fontWeight: 800, letterSpacing: "-0.02em" },
      h2: { fontWeight: 750, letterSpacing: "-0.02em" },
      h3: { fontWeight: 720, letterSpacing: "-0.015em" },
      h4: { fontWeight: 700, letterSpacing: "-0.01em" },
      h5: { fontWeight: 650 },
      h6: { fontWeight: 650 },
      body1: { lineHeight: 1.55 },
      body2: { lineHeight: 1.55 },
    },

    shape: { borderRadius: 16 },

    shadows: buildShadows(isDark),
  });

  // Overrides dependem do theme pronto
  return createTheme(base, {
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: T.bg,
            backgroundImage: isDark
              ? // gradient discreto (não “mata” conteúdo)
                "linear-gradient(180deg, #070B14 0%, #070B14 35%, #060A12 100%)"
              : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #ffffff 100%)",
          },

          // melhora seleção de texto no dark
          "::selection": {
            background: isDark ? "rgba(24,119,242,0.35)" : "rgba(24,119,242,0.22)",
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },

          // Superfícies: paper base (bg2) e elevadas (surface1)
          elevation0: {
            backgroundColor: T.bg2,
          },
          elevation1: {
            backgroundColor: isDark ? DARK.surface1 : LIGHT.surface1,
            border: `1px solid ${T.divider}`,
          },
          elevation2: {
            backgroundColor: isDark ? "#101F35" : "#ffffff",
            border: `1px solid ${T.divider}`,
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "rgba(11,18,32,0.85)" : "#ffffff",
            backdropFilter: "saturate(140%) blur(10px)",
            borderBottom: `1px solid ${T.divider}`,
          },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#081020" : "#ffffff",
            borderRight: `1px solid ${T.divider}`,
          },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: T.divider,
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            textTransform: "none",
            fontWeight: 800,
            letterSpacing: "-0.01em",
          },
          contained: {
            boxShadow: "none",
          },
        },
      },

      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 800,
            borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.12)",
            color: base.palette.text.secondary,
            backgroundColor: "transparent",
            "&.Mui-selected": {
              color: base.palette.text.primary,
              backgroundColor: isDark ? "rgba(24,119,242,0.16)" : "rgba(24,119,242,0.10)",
              borderColor: isDark ? "rgba(24,119,242,0.45)" : "rgba(24,119,242,0.35)",
            },
            "&:hover": {
              backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
            },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 800,
          },
        },
      },

      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#0B1220" : "#ffffff",
            border: `1px solid ${T.divider}`,
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? "rgba(10,16,30,0.95)" : "rgba(15,23,42,0.92)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.12)"}`,
            fontSize: "0.78rem",
          },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: base.palette.text.secondary,
            "&.Mui-focused": {
              color: base.palette.primary.main,
            },
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundColor: isDark ? DARK.surface2 : "#ffffff",
            transition: "box-shadow .15s ease, border-color .15s ease, background-color .15s ease",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(120,160,220,0.28)" : "rgba(15,23,42,0.18)",
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${T.focusRing}`,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: base.palette.primary.main,
            },
          },
          notchedOutline: {
            borderColor: isDark ? DARK.border : LIGHT.border,
          },
          input: {
            color: base.palette.text.primary,
            paddingTop: 12,
            paddingBottom: 12,
            "&::placeholder": {
              color: isDark ? "rgba(166,179,198,0.70)" : "rgba(100,116,139,0.70)",
              opacity: 1,
            },
          },
        },
      },

      MuiFormHelperText: {
        styleOverrides: {
          root: {
            marginLeft: 2,
            marginRight: 2,
            color: base.palette.text.secondary,
          },
        },
      },

      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            "&:hover": {
              backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
            },
          },
        },
      },
    },
  });
};

export const getAppTheme = (mode: AppThemeMode) => buildTheme(mode);
