import React from "react";
import { Box, Paper, Typography, alpha, useTheme } from "@mui/material";
import {
  Description as ContractIcon,
  Business as SupplierIcon,
  Receipt as InvoiceIcon,
  AttachMoney as ValueIcon,
} from "@mui/icons-material";
import { TrpCamposNormalizados } from "../../../lib/types/trp";

type CamposLike = TrpCamposNormalizados | Record<string, unknown>;

interface TrpSummaryCardsProps {
  campos: CamposLike;
}

/**
 * Normaliza campos para exibição em cards-resumo.
 * ⚠️ REGRA DE UX:
 * - Este componente NUNCA deve renderizar:
 *   objeto_fornecido / objetoFornecido / objeto_prestado
 *   (esses campos pertencem exclusivamente ao documento oficial)
 */
const normalizeField = (value: string | null | undefined): string => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "NAO_DECLARADO"
  ) {
    return "Não informado";
  }
  return value;
};

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const toStr = (v: unknown): string | null => {
  if (typeof v === "string") return v;
  if (isFiniteNumber(v)) return String(v);
  return null;
};

/**
 * Busca um campo aceitando múltiplas chaves (aliases).
 * Ex.: ["numero_contrato", "numeroContrato", "contrato_numero", ...]
 */
const getCampoAny = (campos: CamposLike, keys: string[]): string | null => {
  const obj = campos as any;

  for (const key of keys) {
    const raw = obj?.[key];
    const s = toStr(raw);
    if (s !== null && s !== undefined && s !== "") return s;
  }

  return null;
};

export const TrpSummaryCards: React.FC<TrpSummaryCardsProps> = ({ campos }) => {
  const theme = useTheme();

  // ⚠️ NÃO adicionar aliases de objeto_fornecido aqui.
  const numeroContrato = getCampoAny(campos, [
    "numero_contrato",
    "numeroContrato",
    "contrato_numero",
    "numero_do_contrato",
    "contratoNumero",
  ]);

  const contratada = getCampoAny(campos, [
    "contratada",
    "fornecedor",
    "razao_social",
    "razaoSocial",
    "nome_fornecedor",
    "nomeFornecedor",
  ]);

  const numeroNf = getCampoAny(campos, [
    "numero_nf",
    "numeroNf",
    "nf_numero",
    "numero_nota_fiscal",
    "numeroNotaFiscal",
    "nota_fiscal_numero",
  ]);

  const valorEfetivoFormatado =
    getCampoAny(campos, [
      "valor_efetivo_formatado",
      "valorEfetivoFormatado",
      "valor_total_formatado",
      "valorTotalFormatado",
      "valor",
      "valor_formatado",
      "valorFormatado",
    ]) || null;

  const cards = [
    {
      label: "CONTRATO",
      primary: normalizeField(numeroContrato ?? undefined),
      icon: <ContractIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: "FORNECEDOR",
      primary: normalizeField(contratada ?? undefined),
      icon: <SupplierIcon />,
      color: theme.palette.info.main,
    },
    {
      label: "DOCUMENTO FISCAL",
      primary: `NF: ${normalizeField(numeroNf ?? undefined)}`,
      icon: <InvoiceIcon />,
      color: theme.palette.success.main,
    },
    {
      label: "VALOR",
      primary: valorEfetivoFormatado ? valorEfetivoFormatado : "Não informado",
      icon: <ValueIcon />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: 3,
        mb: 4,
      }}
    >
      {cards.map((card, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            background: theme.palette.background.paper,
            boxShadow: `0 1px 2px ${alpha("#000", 0.04)}, 0 2px 8px ${alpha(
              "#000",
              0.03
            )}`,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${card.color}, ${alpha(
                card.color,
                0.6
              )})`,
              opacity: 0,
              transition: "opacity 0.3s ease",
            },
            "&:hover": {
              boxShadow: `0 4px 12px ${alpha("#000", 0.08)}, 0 8px 24px ${alpha(
                "#000",
                0.06
              )}`,
              transform: "translateY(-4px)",
              borderColor: alpha(card.color, 0.3),
              "&::before": {
                opacity: 1,
              },
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              mb: 1.25,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: alpha(card.color, 0.1),
                color: card.color,
                flexShrink: 0,
                "& svg": {
                  fontSize: "1.25rem",
                },
              }}
            >
              {card.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: theme.palette.text.primary,
                opacity: 0.7,
                flex: 1,
                lineHeight: 1.2,
              }}
            >
              {card.label}
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: "1.0625rem",
              lineHeight: 1.35,
              wordBreak: "break-word",
              pl: 5.75,
            }}
          >
            {card.primary}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};
