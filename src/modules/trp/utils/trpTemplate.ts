// src/modules/trp/utils/trpTemplate.ts
//
// Estratégia: ao invés de gerar um template fixo, pega o documento_markdown_final
// REAL que veio do backend e injeta tokens {{campo:X}} substituindo os valores
// que já aparecem no texto — baseado nos campos_trp_normalizados reais.
//
// Isso garante que:
// - Nenhum campo é inventado
// - Nenhum campo existente é omitido
// - A estrutura visual do documento é preservada 100%

// ─── Helpers de path ─────────────────────────────────────────────────────────

export function getValueByPath(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return (acc as any)[key];
  }, obj as any);
}

export function setValueByPath(
  obj: Record<string, any>,
  path: string,
  value: any,
): Record<string, any> {
  const cloned = JSON.parse(JSON.stringify(obj));
  const keys = path.split(".");
  let cursor: any = cloned;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    if (cursor[key] === undefined || cursor[key] === null) {
      cursor[key] = isNaN(Number(nextKey)) ? {} : [];
    }
    cursor = cursor[key];
  }

  cursor[keys[keys.length - 1]] = value;
  return cloned;
}

// ─── Formatadores pt-BR (espelha exatamente o que o backend faz) ─────────────

function formatNumberPtBr(v: any): string | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  try {
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(n);
  } catch {
    return String(n);
  }
}

function formatMoneyPtBr(v: any): string | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    })
      .format(n)
      .replace(/\u00A0/g, " ");
  } catch {
    return `R$ ${n.toFixed(2).replace(".", ",")}`;
  }
}

/**
 * Retorna todas as representações textuais possíveis de um valor.
 * Necessário porque o backend pode ter formatado de formas diferentes.
 */
function getTextRepresentations(
  value: any,
  isMoney = false,
  isQty = false,
): string[] {
  if (value === null || value === undefined) return [];

  const reps = new Set<string>();
  const str = String(value).trim();
  if (str && str !== "—" && str !== "-") reps.add(str);

  const n =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(",", "."));

  if (Number.isFinite(n)) {
    if (isMoney) {
      const m = formatMoneyPtBr(n);
      if (m) reps.add(m);
    }
    if (isQty || !isMoney) {
      const q = formatNumberPtBr(n);
      if (q) reps.add(q);
    }
    if (Number.isInteger(n)) reps.add(String(n));
  }

  return Array.from(reps).filter(Boolean);
}

// ─── Escaping ─────────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Substituição em célula de tabela markdown (2 colunas) ───────────────────

function injectTokenInTableCell(
  markdown: string,
  rowLabel: string,
  fieldId: string,
  value: any,
  isMoney = false,
  isQty = false,
): string {
  const reps = getTextRepresentations(value, isMoney, isQty);
  const labelEsc = escapeRegex(rowLabel);

  // Tenta cada representação do valor
  for (const rep of reps) {
    const valueEsc = escapeRegex(rep);
    const re = new RegExp(
      `^(\\|\\s*${labelEsc}\\s*\\|\\s*)${valueEsc}(\\s*\\|\\s*)$`,
      "gim",
    );
    if (re.test(markdown)) {
      return markdown.replace(re, `$1{{campo:${fieldId}}}$2`);
    }
  }

  // Fallback: substitui qualquer valor na célula (busca só pelo label)
  const reFallback = new RegExp(
    `^(\\|\\s*${labelEsc}\\s*\\|\\s*)([^\\n|]*)(\\s*\\|\\s*)$`,
    "gim",
  );
  return markdown.replace(reFallback, `$1{{campo:${fieldId}}}$3`);
}

// ─── Substituição em célula da tabela de itens (5 colunas) ───────────────────

function injectTokenInItemsTable(
  markdown: string,
  itemIndex: number,
  colIndex: number,
  fieldId: string,
  value: any,
  isMoney = false,
  isQty = false,
): string {
  const reps = getTextRepresentations(value, isMoney, isQty);

  // Coleta todas as linhas de dados da tabela de itens
  const dataLines: Array<{ match: string; index: number }> = [];
  const re = /^\|([^|\n]+\|){4,}[^\n]*$/gm;
  let m: RegExpExecArray | null;

  while ((m = re.exec(markdown)) !== null) {
    const line = m[0];
    if (/^\|[\s|:-]+\|$/.test(line.trim())) continue; // separador
    if (/descrição|unidade|quantidade|valor unit/i.test(line)) continue; // header
    if (/total geral/i.test(line)) continue; // total
    dataLines.push({ match: line, index: m.index });
  }

  if (itemIndex >= dataLines.length) return markdown;

  const targetLine = dataLines[itemIndex];

  // Tenta substituir pela representação exata do valor
  let newLine = targetLine.match;
  let replaced = false;

  for (const rep of reps) {
    const repEsc = escapeRegex(rep);
    let colCount = -1; // -1 porque o split começa com |vazio

    const candidate = targetLine.match.replace(
      /\|([^|\n]*)/g,
      (full, cell) => {
        colCount++;
        if (colCount === colIndex) {
          if (new RegExp(`^\\s*${repEsc}\\s*$`).test(cell)) {
            replaced = true;
            return `|{{campo:${fieldId}}}`;
          }
        }
        return full;
      },
    );

    if (replaced) {
      newLine = candidate;
      break;
    }
  }

  // Fallback: substitui qualquer valor na posição da coluna
  if (!replaced) {
    let colCount = -1;
    newLine = targetLine.match.replace(/\|([^|\n]*)/g, (full, _cell) => {
      colCount++;
      if (colCount === colIndex) {
        return `|{{campo:${fieldId}}}`;
      }
      return full;
    });
  }

  return (
    markdown.slice(0, targetLine.index) +
    newLine +
    markdown.slice(targetLine.index + targetLine.match.length)
  );
}

// ─── Mapeamento campos → labels no documento ──────────────────────────────────
//
// "labels" são os textos exatos da coluna esquerda da tabela markdown.
// Colocamos variações porque a IA pode gerar o label de formas ligeiramente
// diferentes (capitalização, acento, etc).

const FIELD_LABEL_MAP: Array<{
  fieldId: string;
  labels: string[];
  isMoney?: boolean;
  isQty?: boolean;
}> = [
  // Identificação
  {
    fieldId: "numero_contrato",
    labels: ["Número do contrato", "Nº do contrato", "Número do Contrato", "N° do Contrato"],
  },
  {
    fieldId: "processo_licitatorio",
    labels: ["Processo licitatório", "Processo Licitatório", "Processo licitatorio"],
  },
  {
    fieldId: "tipo_contrato",
    labels: ["Tipo de contrato", "Tipo de Contrato"],
  },
  {
    fieldId: "objeto_contrato",
    labels: ["Objeto do contrato", "Objeto do Contrato", "Objeto"],
  },
  {
    fieldId: "numero_nf",
    labels: ["Número da NF", "Nº da NF", "Número NF", "Número da nota fiscal"],
  },
  {
    fieldId: "cnpj_contratada",
    labels: ["CNPJ da contratada", "CNPJ", "CNPJ da Contratada"],
  },
  {
    fieldId: "nome_contratada",
    labels: ["Contratada", "Nome da contratada", "Empresa contratada"],
  },
  {
    fieldId: "unidade_gestora",
    labels: ["Unidade gestora", "Unidade Gestora"],
  },
  {
    fieldId: "fiscal_contrato",
    labels: ["Fiscal do contrato", "Fiscal do Contrato", "Fiscal"],
  },
  {
    fieldId: "local_entrega",
    labels: ["Local de entrega", "Local de Entrega"],
  },

  // Valores monetários
  {
    fieldId: "valor_efetivo_formatado",
    labels: ["Valor efetivo", "Valor Efetivo"],
    isMoney: true,
  },
  {
    fieldId: "valor_total_geral",
    labels: ["Valor total geral", "Valor Total Geral", "Valor total", "Valor Total"],
    isMoney: true,
  },

  // Regime de execução / prazos
  {
    fieldId: "tipo_base_prazo",
    labels: ["Tipo de base de prazo", "Tipo de Base de Prazo"],
  },
  {
    fieldId: "condicao_prazo",
    labels: ["Condição quanto ao prazo", "Condição Quanto ao Prazo"],
  },
  {
    fieldId: "condicao_quantidade_ordem",
    labels: [
      "Condição quanto à quantidade (Ordem)",
      "Condição quanto à quantidade",
      "Condição Quanto à Quantidade (Ordem)",
    ],
  },
  {
    fieldId: "motivo_atraso",
    labels: ["Motivo do atraso", "Motivo de atraso", "Motivo do Atraso"],
  },
  {
    fieldId: "comentarios_quantidade_ordem",
    labels: [
      "Comentários sobre quantidade (Ordem)",
      "Comentários sobre a quantidade",
      "Comentários quantidade",
    ],
  },
  {
    fieldId: "observacoes",
    labels: ["Observações", "Observacoes", "Observações gerais"],
  },

  // Prazos numéricos
  {
    fieldId: "prazo_provisorio_dias_uteis",
    labels: ["Prazo provisório (dias úteis)", "Prazo provisório", "Prazo Provisório (dias úteis)"],
  },
  {
    fieldId: "prazo_definitivo_dias_uteis",
    labels: ["Prazo definitivo (dias úteis)", "Prazo definitivo", "Prazo Definitivo (dias úteis)"],
  },
  {
    fieldId: "prazo_liquidacao_dias_corridos",
    labels: [
      "Prazo de liquidação (dias corridos)",
      "Prazo de liquidação",
      "Prazo de Liquidação (dias corridos)",
    ],
  },
  {
    fieldId: "vencimento_nf",
    labels: ["Vencimento da NF", "Vencimento NF", "Vencimento da nota fiscal"],
  },
];

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Recebe o markdown REAL do backend e os campos REAIS,
 * e devolve o mesmo markdown com tokens {{campo:X}} nos valores editáveis.
 *
 * Não inventa campos — só injeta tokens onde os valores reais já aparecem.
 */
export function buildTrpMarkdownWithTokens(
  markdownReal: string,
  campos: Record<string, any>,
): string {
  if (!markdownReal || !campos) return markdownReal ?? "";

  let out = markdownReal;

  // 1) Campos escalares (tabelas | Label | Valor |)
  for (const def of FIELD_LABEL_MAP) {
    const value = getValueByPath(campos, def.fieldId);
    if (value === null || value === undefined) continue;

    for (const label of def.labels) {
      const before = out;
      out = injectTokenInTableCell(
        out,
        label,
        def.fieldId,
        value,
        def.isMoney ?? false,
        def.isQty ?? false,
      );
      if (out !== before) break; // achou e substituiu — passa pro próximo campo
    }
  }

  // 2) Itens do objeto (tabela de 5 colunas)
  const itens: any[] = Array.isArray(campos.itens_objeto)
    ? campos.itens_objeto
    : [];

  itens.forEach((item: any, i: number) => {
    if (!item) return;

    // col 0: descricao
    if (item.descricao != null) {
      out = injectTokenInItemsTable(
        out, i, 0, `itens_objeto.${i}.descricao`, item.descricao,
      );
    }
    // col 1: unidade_medida
    if (item.unidade_medida != null) {
      out = injectTokenInItemsTable(
        out, i, 1, `itens_objeto.${i}.unidade_medida`, item.unidade_medida,
      );
    }
    // col 2: quantidade_recebida
    if (item.quantidade_recebida != null) {
      out = injectTokenInItemsTable(
        out, i, 2, `itens_objeto.${i}.quantidade_recebida`,
        item.quantidade_recebida, false, true,
      );
    }
    // col 3: valor unitário (backend usa valor_unitario_num para display)
    const vu = item.valor_unitario_num ?? item.valor_unitario;
    if (vu != null) {
      out = injectTokenInItemsTable(
        out, i, 3, `itens_objeto.${i}.valor_unitario_num`, vu, true,
      );
    }
    // col 4: valor_total_calculado
    if (item.valor_total_calculado != null) {
      out = injectTokenInItemsTable(
        out, i, 4, `itens_objeto.${i}.valor_total_calculado`,
        item.valor_total_calculado, true,
      );
    }
  });

  return out;
}

/**
 * Resolve tokens {{campo:X}} de volta para os valores formatados.
 * Usado para gerar o markdown final limpo antes de salvar no backend.
 */
export function resolveTemplateToMarkdown(
  markdownWithTokens: string,
  campos: Record<string, any>,
): string {
  return markdownWithTokens.replace(
    /\{\{campo:([^}]+)\}\}/g,
    (_, fieldId) => {
      const value = getValueByPath(campos, fieldId);
      if (value === null || value === undefined || value === "") return "—";

      const isMoney =
        fieldId.includes("valor") ||
        fieldId.includes("efetivo") ||
        fieldId.endsWith("_calculado");
      const isQty = fieldId.includes("quantidade");

      if (isMoney) return formatMoneyPtBr(value) ?? String(value);
      if (isQty) return formatNumberPtBr(value) ?? String(value);
      return String(value);
    },
  );
}