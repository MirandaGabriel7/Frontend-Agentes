import React from "react";
import {
  Box,
  Typography,
  alpha,
  useTheme,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

// ✅ Grid legado (suporta item/xs/sm)
import Grid from "@mui/material/GridLegacy";

import type { TrpCamposNormalizados } from "../../../lib/types/trp";
import { normalizeTrpValue } from "../utils/formatTrpValues";
import { organizeFieldsBySections } from "../utils/trpFieldSections";

interface TrpStructuredDataPanelProps {
  campos: TrpCamposNormalizados & Record<string, unknown>;
}

interface DataFieldProps {
  label: string;
  value: React.ReactNode;
}

const DataField: React.FC<DataFieldProps> = ({ label, value }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: theme.palette.text.secondary,
          mb: 0.5,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          color: theme.palette.text.primary,
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Box>
    </Box>
  );
};

const HIDDEN_STRINGS = new Set([
  "NAO_DECLARADO",
  "NÃO_DECLARADO",
  "NAO INFORMADO",
  "NÃO INFORMADO",
  "NAO_INFORMADO",
  "NÃO_INFORMADO",
  "Não informado",
  "Nao informado",
  "Não há observações adicionais",
]);

function isHiddenOrEmptyString(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v !== "string") return false;

  const s = v.trim();
  if (!s) return true;
  if (HIDDEN_STRINGS.has(s)) return true;
  if (HIDDEN_STRINGS.has(s.toUpperCase())) return true;
  return false;
}

function isPlainObject(v: unknown) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * ✅ Detecta enum no formato TIPO_ENUM (ALL_CAPS com underscores)
 */
function isEnumLikeString(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;
  return /^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(s);
}

/**
 * ✅ Humaniza enum com fallback seguro (sem inventar)
 */
function humanizeEnumPtBr(value: string): string {
  const lowerWords = new Set([
    "de",
    "do",
    "da",
    "dos",
    "das",
    "e",
    "em",
    "no",
    "na",
  ]);

  const parts = value
    .trim()
    .split("_")
    .filter(Boolean)
    .map((w) => w.toLowerCase());

  if (!parts.length) return value;

  return parts
    .map((w, idx) => {
      if (idx > 0 && lowerWords.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/**
 * ✅ Mapa de enums por campo (controlado)
 */
const ENUM_LABELS_BY_FIELD: Record<string, Record<string, string>> = {
  condicao_prazo: {
    NO_PRAZO: "No prazo",
    FORA_DO_PRAZO: "Fora do prazo",
    NAO_PRAZO: "Não se aplica",
    NAO_APLICA: "Não se aplica",
  },
  condicao_quantidade_ordem: {
    TOTAL: "Total",
    PARCIAL: "Parcial",
    NAO_APLICA: "Não se aplica",
  },
  tipo_base_prazo: {
    DATA_RECEBIMENTO: "Data de recebimento",
    DATA_ENTREGA: "Data de entrega",
    DATA_CONCLUSAO_SERVICO: "Data de conclusão do serviço",
    NF: "Nota Fiscal",
  },
  tipo_contrato: {
    BENS: "Bens",
    SERVICOS: "Serviços",
    SERVIÇOS: "Serviços",
    OBRAS: "Obras",
  },
};

function formatValueForDisplay(fieldName: string, raw: unknown): string {
  if (raw === null || raw === undefined) return "";

  if (isEnumLikeString(raw)) {
    const mapped = ENUM_LABELS_BY_FIELD[fieldName]?.[raw.trim()];
    return mapped ?? humanizeEnumPtBr(raw.trim());
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return "";
    const norm = normalizeTrpValue(s, fieldName);
    return norm?.trim?.() ? norm : s;
  }

  if (typeof raw === "number") {
    const norm = normalizeTrpValue(String(raw), fieldName);
    return norm?.trim?.() ? norm : String(raw);
  }

  if (typeof raw === "boolean") return raw ? "Sim" : "Não";

  return String(raw);
}

type ItemObjetoLike = {
  descricao?: unknown;
  unidade_medida?: unknown;
  quantidade_recebida?: unknown;
  valor_unitario?: unknown;
  valor_unitario_num?: unknown;
  valor_unitario_raw?: unknown;
  valor_total_calculado?: unknown;
};

function getItemUnitValue(it: ItemObjetoLike) {
  return it.valor_unitario_num ?? it.valor_unitario ?? it.valor_unitario_raw;
}

function parsePtbrMoneyLike(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  const s = String(v).trim();
  if (!s) return null;

  const cleaned = s.replace(/[R$\s]/g, "");

  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * ✅ Componente (evita hook fora do React e remove duplicação de título)
 * - Não renderiza "Itens Objeto" aqui (já vem do label do DataField)
 * - Borda mais “quadrada”
 * - Um respiro entre label e tabela
 */
const ItensObjetoTable: React.FC<{
  itens: ItemObjetoLike[];
  totalGeral?: unknown;
}> = ({ itens, totalGeral }) => {
  const theme = useTheme();

  const safe = (Array.isArray(itens) ? itens : []).filter(Boolean);
  if (!safe.length) return null;

  let computedTotal: number | null = null;
  const tgNum = parsePtbrMoneyLike(totalGeral);

  if (tgNum === null) {
    try {
      const sum = safe.reduce((acc, it) => {
        const n = parsePtbrMoneyLike(it.valor_total_calculado);
        return acc + (n ?? 0);
      }, 0);
      computedTotal = Number.isFinite(sum) ? sum : null;
    } catch {
      computedTotal = null;
    }
  }

  const totalToShow =
    tgNum !== null
      ? normalizeTrpValue(String(tgNum), "valor_total_geral")
      : computedTotal !== null
      ? normalizeTrpValue(String(computedTotal), "valor_total_geral")
      : null;

  return (
    <Box sx={{ width: "100%", mt: 0.75 }}>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          // ✅ mais quadrado (menos pill)
          borderRadius: 1, // 4px (bem mais “quadrado”)
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          overflow: "hidden",
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Table size="small" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                "& th": {
                  fontWeight: 800,
                  color: theme.palette.text.primary,
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  py: 1.1,
                  px: 1.5,
                },
              }}
            >
              <TableCell sx={{ width: "46%", pl: 2 }}>Descrição</TableCell>
              <TableCell sx={{ width: 90, textAlign: "center" }}>UM</TableCell>
              <TableCell sx={{ width: 120 }} align="right">
                Quant.
              </TableCell>
              <TableCell sx={{ width: 160 }} align="right">
                Valor Unit.
              </TableCell>
              <TableCell sx={{ width: 160, pr: 2 }} align="right">
                Valor Total
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody
            sx={{
              "& td": {
                py: 1.15,
                px: 1.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                fontSize: "0.92rem",
              },
              "& tr:last-of-type td": { borderBottom: "none" },
              "& tr:nth-of-type(even) td": {
                bgcolor: alpha(theme.palette.grey[500], 0.03),
              },
              "& tr:hover td": {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            {safe.map((it, idx) => (
              <TableRow key={idx}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    lineHeight: 1.5,
                    pl: 2,
                  }}
                >
                  {String(it.descricao ?? "")}
                </TableCell>

                <TableCell
                  sx={{
                    textAlign: "center",
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    whiteSpace: "nowrap",
                  }}
                >
                  {String(it.unidade_medida ?? "")}
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {normalizeTrpValue(
                    String(it.quantidade_recebida ?? ""),
                    "quantidade_recebida"
                  )}
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {normalizeTrpValue(
                    String(getItemUnitValue(it) ?? ""),
                    "valor_unitario"
                  )}
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                    fontWeight: 500, // normal, consistente com os outros
                  }}
                >
                  {normalizeTrpValue(
                    String(it.valor_total_calculado ?? ""),
                    "valor_total_calculado"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {typeof totalToShow === "string" && totalToShow.trim() !== "" && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 1.25,
              px: 2,
              py: 1,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <Typography
              sx={{
                fontWeight: 800,
                color: theme.palette.text.primary,
                fontSize: "0.9rem",
              }}
            >
              Total Geral
            </Typography>

            <Typography
              sx={{
                fontWeight: 900,
                color: theme.palette.text.primary,
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {totalToShow}
            </Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
};

function toDisplayNode(
  fieldName: string,
  raw: unknown,
  totalGeral?: unknown
): React.ReactNode {
  if (raw === null || raw === undefined) return "";

  if (fieldName === "itens_objeto" && Array.isArray(raw)) {
    return (
      <ItensObjetoTable
        itens={raw as ItemObjetoLike[]}
        totalGeral={totalGeral}
      />
    );
  }

  if (Array.isArray(raw) || isPlainObject(raw)) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Conteúdo estruturado disponível (ver “JSON Bruto”).
      </Typography>
    );
  }

  const s = formatValueForDisplay(fieldName, raw);
  return s?.trim?.() ? s : "";
}

export const TrpStructuredDataPanel: React.FC<TrpStructuredDataPanelProps> = ({
  campos,
}) => {
  const theme = useTheme();

  const camposAsRecord = (campos ?? {}) as Record<string, unknown>;
  const sectionsWithFields = organizeFieldsBySections(camposAsRecord);

  const totalGeral =
    (camposAsRecord as any).valor_total_geral ??
    (camposAsRecord as any).valorTotalGeral;

  const ALWAYS_HIDE_FIELDS = new Set<string>([
    "tipo_contrato_label",
    "tipo_base_prazo_label",
    "condicao_prazo_label",
    "condicao_quantidade_ordem_label",

    "trechos_suporte",
    "origem_prazos",
    "schema_version",
    "n8n_webhook_url",
    "request_id",
    "status",
    "error_message",
    "source",
  ]);

  const VALUE_KEYS_TO_HIDE_OUTSIDE_ITEMS = new Set([
    "valor_total_geral",
    "valorTotalGeral",
    "valor_efetivo",
    "valor_efetivo_numero",
    "valor_efetivo_formatado",
    "valor_total",
    "valor_total_calculado",
    "valor_unitario",
    "valor_unitario_num",
    "valor_unitario_raw",
  ]);

  function shouldHideField(fieldName: string): boolean {
    if (!fieldName) return true;

    if (ALWAYS_HIDE_FIELDS.has(fieldName)) return true;

    if (/_label$/i.test(fieldName)) return true;
    if (/_raw$/i.test(fieldName)) return true;
    if (/_num$/i.test(fieldName)) return true;

    if (/\blabel\b/i.test(fieldName)) return true;

    return false;
  }

  const sections = sectionsWithFields
    .filter(
      ({ section }) =>
        section.title !== "ASSINATURAS" && section.title !== "OUTROS"
    )
    .map(({ section, fields }) => {
      const normalizedFields = fields
        .map((field) => {
          const raw = field.value;

          if (shouldHideField(field.fieldName)) return null;

          if (
            field.fieldName !== "itens_objeto" &&
            VALUE_KEYS_TO_HIDE_OUTSIDE_ITEMS.has(field.fieldName)
          ) {
            return null;
          }

          if (field.fieldName === "observacoes") {
            const display = formatValueForDisplay(field.fieldName, raw);
            if (isHiddenOrEmptyString(display)) return null;
          }

          if (typeof raw === "string" && isHiddenOrEmptyString(raw))
            return null;

          const node = toDisplayNode(field.fieldName, raw, totalGeral);

          if (typeof node === "string" && isHiddenOrEmptyString(node))
            return null;
          if (typeof node === "string" && !node.trim()) return null;

          return {
            fieldName: field.fieldName,
            label: field.label,
            value: node,
          };
        })
        .filter(Boolean) as Array<{
        fieldName: string;
        label: string;
        value: React.ReactNode;
      }>;

      return {
        title: section.title,
        fields: normalizedFields,
      };
    })
    .filter((section) => section.fields.length > 0);

  return (
    <Box>
      {sections.map((section, sectionIndex) => (
        <Box
          key={section.title}
          sx={{ mb: sectionIndex < sections.length - 1 ? 4 : 0 }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: theme.palette.text.primary,
              fontSize: "1.125rem",
            }}
          >
            {section.title}
          </Typography>

          <Grid container spacing={3}>
            {section.fields.map((field, fieldIndex) => {
              const isItens = field.fieldName === "itens_objeto";
              return (
                <Grid item key={fieldIndex} xs={12} sm={isItens ? 12 : 6}>
                  <DataField label={field.label} value={field.value} />
                </Grid>
              );
            })}
          </Grid>

          {sectionIndex < sections.length - 1 && (
            <Divider
              sx={{ mt: 4, borderColor: alpha(theme.palette.divider, 0.08) }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};
