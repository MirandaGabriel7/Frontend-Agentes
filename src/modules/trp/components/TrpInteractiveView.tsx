// src/modules/trp/components/TrpInteractiveView.tsx
//
// Renderiza o markdown com tokens {{campo:X}} de forma IDENTICA ao TrpMarkdownView,
// substituindo cada token por um EditableInlineField.
// Não tem Paper próprio, não tem fonte própria — herda 100% do estilo existente.

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Box, alpha, useTheme } from "@mui/material";
import { EditableInlineField } from "./EditableInlineField";
import { resolveFieldDef } from "../config/trpFieldMap";
import { getValueByPath } from "../utils/trpTemplate";
import { normalizeTrpValue } from "../utils/formatTrpValues";

interface TrpInteractiveViewProps {
  markdownWithTokens: string;
  campos: Record<string, any>;
  editMode: boolean;
  onCommit: (fieldId: string, value: any) => void;
}

// ─── Helpers copiados do TrpMarkdownView ─────────────────────────────────────

const HIDDEN_STRINGS = new Set([
  "NAO_DECLARADO", "NÃO_DECLARADO", "NAO INFORMADO", "NÃO INFORMADO",
  "NAO_INFORMADO", "NÃO_INFORMADO", "Não informado", "Nao informado",
]);

function extractText(node: any): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (React.isValidElement(node)) return extractText((node as any).props?.children);
  return "";
}

function isMeaningfulText(s: string): boolean {
  const t = (s ?? "").trim();
  if (!t) return false;
  if (HIDDEN_STRINGS.has(t)) return false;
  if (HIDDEN_STRINGS.has(t.toUpperCase())) return false;
  return true;
}

function rowHasValue(cellsNormalizedText: string[]): boolean {
  if (!cellsNormalizedText.length) return false;
  const candidates = cellsNormalizedText.length >= 2
    ? cellsNormalizedText.slice(1)
    : cellsNormalizedText;
  return candidates.some((txt) => isMeaningfulText(txt));
}

function fixBrokenTotalRowTables(md: string): string {
  if (!md || typeof md !== "string") return "";
  const lines = md.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i];
    const next = lines[i + 1];
    const curIsBlank = cur.trim() === "";
    const nextIsTotalRow =
      typeof next === "string" && /^\|\s*\*?\*?\s*Total\s+Geral/i.test(next.trim());
    if (curIsBlank && nextIsTotalRow) continue;
    if (/^\|\s*\*?\*?\s*Total\s+Geral/i.test(cur.trim())) {
      const raw = cur.trim();
      const parts = raw.replace(/^\|/, "").replace(/\|$/, "").split("|").map((p) => p.trim());
      if (parts.length >= 2) {
        const label = parts[0] || "Total Geral";
        const last = parts[parts.length - 1] || "";
        out.push(`| ${[label, "", "", "", last].join(" | ")} |`);
        continue;
      }
    }
    out.push(cur);
  }
  return out.join("\n");
}

// ─── Token parsing ────────────────────────────────────────────────────────────

const TOKEN_SPLIT = /(\{\{campo:[^}]+\}\})/;
const TOKEN_EXTRACT = /\{\{campo:([^}]+)\}\}/;

type Segment =
  | { kind: "text"; value: string }
  | { kind: "token"; fieldId: string };

function splitTokens(text: string): Segment[] {
  return text.split(TOKEN_SPLIT).map((part) => {
    const match = part.match(TOKEN_EXTRACT);
    if (match) return { kind: "token", fieldId: match[1] };
    return { kind: "text", value: part };
  });
}

// ─── RichText: processa uma string com tokens ─────────────────────────────────

interface RichTextProps {
  children: string;
  campos: Record<string, any>;
  editMode: boolean;
  onCommit: (fieldId: string, value: any) => void;
}

const RichText: React.FC<RichTextProps> = React.memo(
  ({ children, campos, editMode, onCommit }) => {
    const segments = useMemo(() => splitTokens(children), [children]);

    return (
      <>
        {segments.map((seg, i) => {
          if (seg.kind === "text") {
            return <React.Fragment key={i}>{seg.value}</React.Fragment>;
          }
          const { fieldId } = seg;
          const fieldDef = resolveFieldDef(fieldId);
          if (!fieldDef) {
            // token desconhecido — mostra valor resolvido (nunca mostra o token cru)
            const raw = getValueByPath(campos, fieldId);
            return (
              <React.Fragment key={i}>
                {raw !== undefined && raw !== null ? String(raw) : "—"}
              </React.Fragment>
            );
          }
          const rawValue = getValueByPath(campos, fieldDef.path);
          return (
            <EditableInlineField
              key={fieldId}
              fieldDef={fieldDef}
              rawValue={rawValue}
              editMode={editMode}
              onCommit={onCommit}
            />
          );
        })}
      </>
    );
  },
);
RichText.displayName = "RichText";

// ─── Processa children do ReactMarkdown ──────────────────────────────────────

function processChildren(
  children: React.ReactNode,
  richText: (s: string) => React.ReactNode,
): React.ReactNode {
  if (typeof children === "string") return richText(children);
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === "string"
        ? <React.Fragment key={i}>{richText(child)}</React.Fragment>
        : child,
    );
  }
  return children;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export const TrpInteractiveView: React.FC<TrpInteractiveViewProps> = ({
  markdownWithTokens,
  campos,
  editMode,
  onCommit,
}) => {
  const theme = useTheme();

  // Aplica as mesmas sanitizações do TrpMarkdownView
  const sanitizedContent = useMemo(() => {
    const base = (markdownWithTokens || "")
      .replace(/\bNAO_DECLARADO\b/gi, "")
      .replace(/\bNÃO_DECLARADO\b/gi, "")
      .replace(/\bNAO_INFORMADO\b/gi, "")
      .replace(/\bNÃO_INFORMADO\b/gi, "")
      .replace(/\bDATA_RECEBIMENTO\b/gi, "Data de Recebimento")
      .replace(/\bSERVICO\b/gi, "Conclusão do Serviço")
      .replace(/\bFORA_DO_PRAZO\b/gi, "Fora do prazo")
      .replace(/\bNO_PRAZO\b/gi, "No prazo")
      .replace(/\bTOTAL\b/gi, "Total")
      .replace(/\bPARCIAL\b/gi, "Parcial")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return fixBrokenTotalRowTables(base);
  }, [markdownWithTokens]);

  const richText = useMemo(
    () => (text: string) => (
      <RichText campos={campos} editMode={editMode} onCommit={onCommit}>
        {text}
      </RichText>
    ),
    [campos, editMode, onCommit],
  );

  // Componentes custom — IDÊNTICOS ao TrpMarkdownView, só com richText injetado
  const components = useMemo(
    () => ({
      // Processa texto em parágrafos, strong, em, li, etc.
      p: ({ children }: any) => (
        <p>{processChildren(children, richText)}</p>
      ),
      strong: ({ children }: any) => (
        <strong>{processChildren(children, richText)}</strong>
      ),
      em: ({ children }: any) => (
        <em>{processChildren(children, richText)}</em>
      ),
      li: ({ children }: any) => (
        <li>{processChildren(children, richText)}</li>
      ),
      h1: ({ children }: any) => (
        <h1>{processChildren(children, richText)}</h1>
      ),
      h2: ({ children }: any) => (
        <h2>{processChildren(children, richText)}</h2>
      ),
      h3: ({ children }: any) => (
        <h3>{processChildren(children, richText)}</h3>
      ),

      // td e th: idênticos ao TrpMarkdownView + richText
      td: ({ children }: any) => (
        <td>{processChildren(children, richText)}</td>
      ),
      th: ({ children }: any) => (
        <th>{processChildren(children, richText)}</th>
      ),

      // tr: lógica COPIADA do TrpMarkdownView (filtro de linhas vazias + Total Geral)
      tr: ({ node, children, ...props }: any) => {
        const parentTag = (node as any)?.parent?.tagName;
        const isHeaderRow = parentTag === "thead";
        if (isHeaderRow) return <tr {...props}>{children}</tr>;

        const cells = React.Children.toArray(children);
        if (!cells.length) return <tr {...props}>{children}</tr>;

        const cellsText = cells.map((cell: any) => extractText(cell));
        const cellsTextNormalized = cellsText.map((txt) =>
          txt ? normalizeTrpValue(txt, undefined) : "",
        );

        const firstCell = (cellsTextNormalized[0] || "").trim().toLowerCase();
        const isTotalRow = firstCell.includes("total geral");

        if (isTotalRow) {
          const lastValue = (
            cellsTextNormalized[cellsTextNormalized.length - 1] || ""
          ).trim();

          const borderTop = `1px solid ${alpha(theme.palette.divider, 0.2)}`;
          const rowBg = alpha(theme.palette.grey[500], 0.04);

          return (
            <tr {...props}>
              <td
                colSpan={4}
                style={{
                  fontWeight: 800,
                  textAlign: "right",
                  paddingRight: "10px",
                  borderLeft: "none",
                  borderRight: "none",
                  borderTop,
                  padding: "10px 12px",
                  background: rowBg,
                }}
              >
                Total Geral
              </td>
              <td
                style={{
                  fontWeight: 800,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  borderLeft: "none",
                  borderRight: "none",
                  borderTop,
                  padding: "10px 12px",
                  background: rowBg,
                }}
              >
                {lastValue}
              </td>
            </tr>
          );
        }

        const keep = rowHasValue(cellsTextNormalized);
        if (!keep) return null;

        return <tr {...props}>{children}</tr>;
      },
    }),
    [richText, theme],
  );

  // ── Render: Paper e Box IDÊNTICOS ao TrpMarkdownView ─────────────────────

  return (
    // Sem Paper próprio — o TrpResultPage já envolve com o Paper correto.
    // Só replica o Box de estilos do TrpMarkdownView.
    <Box
      sx={{
        "& p": {
          marginBottom: 2,
          lineHeight: 1.8,
          color: theme.palette.text.primary,
        },
        "& h1": {
          marginTop: 0,
          marginBottom: 3,
          fontWeight: 700,
          color: theme.palette.text.primary,
          fontSize: "1.75rem",
          paddingBottom: 2,
          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        },
        "& h2": {
          marginTop: 0,
          marginBottom: 2.5,
          fontWeight: 600,
          color: theme.palette.text.primary,
          fontSize: "1.5rem",
          paddingBottom: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        },
        "& h3, & h4, & h5, & h6": {
          marginTop: 2,
          marginBottom: 1.5,
          fontWeight: 600,
          color: theme.palette.text.primary,
        },
        "& ul, & ol": { marginBottom: 2, paddingLeft: 3 },
        "& li": { marginBottom: 0.5, lineHeight: 1.8 },
        "& table": {
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 2,
          marginBottom: 2,
          borderRadius: 2,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: `0 1px 3px ${alpha("#000", 0.08)}`,
          "& th, & td": {
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            padding: 1.5,
            textAlign: "left",
            fontSize: "0.9375rem",
            verticalAlign: "top",
          },
          "& th": {
            backgroundColor: alpha(theme.palette.grey[500], 0.08),
            fontWeight: 600,
            color: theme.palette.text.primary,
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          },
          "& td": { color: theme.palette.text.primary },
          "& tr:nth-of-type(even) td": {
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
          },
          // Hover diferenciado em modo edição
          "& tr:hover td": {
            backgroundColor: editMode
              ? alpha(theme.palette.primary.main, 0.06)
              : alpha(theme.palette.primary.main, 0.04),
          },
        },
        "& code": {
          backgroundColor: alpha(theme.palette.text.primary, 0.06),
          padding: "2px 6px",
          borderRadius: 1,
          fontSize: "0.875em",
        },
        "& pre": {
          backgroundColor: alpha(theme.palette.text.primary, 0.04),
          padding: 2,
          borderRadius: 2,
          overflow: "auto",
          "& code": { backgroundColor: "transparent", padding: 0 },
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components as any}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </Box>
  );
};

export default TrpInteractiveView;