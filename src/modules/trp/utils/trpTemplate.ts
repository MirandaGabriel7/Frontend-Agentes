// src/modules/trp/utils/trpTemplate.ts

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

// ─── Humanização de enums (espelha trpEnums.ts do backend) ───────────────────
// O backend já manda os valores humanizados no documento_markdown_final,
// mas precisamos saber qual texto procurar no markdown para cada valor de enum.

const ENUM_LABELS: Record<string, Record<string, string>> = {
  tipo_contrato: {
    BENS: "Bens",
    SERVICOS: "Serviços",
    OBRAS: "Obras",
    SERVICOS_ENGENHARIA: "Serviços de Engenharia",
  },
  tipo_base_prazo: {
    DATA_RECEBIMENTO: "Data de recebimento",
    INICIO_SERVICO: "Início do serviço",
    SERVICO: "Conclusão do serviço",
    ENTREGA_REAL: "Data de entrega real",
  },
  condicao_prazo: {
    NO_PRAZO: "No prazo",
    FORA_DO_PRAZO: "Fora do prazo",
    ATRASADO: "Fora do prazo",
  },
  condicao_quantidade_ordem: {
    TOTAL: "Total (conforme a ordem)",
    PARCIAL: "Parcial",
    MAIOR: "Maior que a ordem",
    CONFORME_EMPENHO: "Total (conforme a ordem)",
  },
};

function humanizeEnum(fieldId: string, value: any): string | null {
  if (!value || typeof value !== "string") return null;
  const map = ENUM_LABELS[fieldId];
  if (!map) return null;
  return map[value.toUpperCase()] ?? null;
}

// ─── Formatadores pt-BR ───────────────────────────────────────────────────────

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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Injeção em célula de tabela | Label | Valor | ────────────────────────────

function injectTokenInTableCell(
  markdown: string,
  rowLabel: string,
  fieldId: string,
  value: any,
  isMoney = false,
  isQty = false,
  enumValue?: string | null,
): string {
  const labelEsc = escapeRegex(rowLabel);

  // Tenta com o valor humanizado (enum) primeiro
  if (enumValue) {
    const enumEsc = escapeRegex(enumValue);
    const reEnum = new RegExp(
      `^(\\|\\s*${labelEsc}\\s*\\|\\s*)${enumEsc}(\\s*\\|\\s*)$`,
      "gim",
    );
    if (reEnum.test(markdown)) {
      return markdown.replace(reEnum, `$1{{campo:${fieldId}}}$2`);
    }
  }

  // Tenta com representações numéricas/texto
  const reps = getTextRepresentations(value, isMoney, isQty);
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

  // Fallback: substitui qualquer valor na célula pelo label
  const reFallback = new RegExp(
    `^(\\|\\s*${labelEsc}\\s*\\|\\s*)([^\\n|]*)(\\s*\\|\\s*)$`,
    "gim",
  );
  return markdown.replace(reFallback, `$1{{campo:${fieldId}}}$3`);
}

// ─── Injeção em tabela de itens (5 colunas) ───────────────────────────────────

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

  const dataLines: Array<{ match: string; index: number }> = [];
  const re = /^\|([^|\n]+\|){4,}[^\n]*$/gm;
  let m: RegExpExecArray | null;

  while ((m = re.exec(markdown)) !== null) {
    const line = m[0];
    if (/^\|[\s|:-]+\|$/.test(line.trim())) continue;
    if (/descrição|unidade|quantidade|valor unit/i.test(line)) continue;
    if (/total geral/i.test(line)) continue;
    dataLines.push({ match: line, index: m.index });
  }

  if (itemIndex >= dataLines.length) return markdown;
  const targetLine = dataLines[itemIndex];

  let newLine = targetLine.match;
  let replaced = false;

  for (const rep of reps) {
    const repEsc = escapeRegex(rep);
    let colCount = -1;
    const candidate = targetLine.match.replace(/\|([^|\n]*)/g, (full, cell) => {
      colCount++;
      if (colCount === colIndex) {
        if (new RegExp(`^\\s*${repEsc}\\s*$`).test(cell)) {
          replaced = true;
          return `|{{campo:${fieldId}}}`;
        }
      }
      return full;
    });
    if (replaced) { newLine = candidate; break; }
  }

  if (!replaced) {
    let colCount = -1;
    newLine = targetLine.match.replace(/\|([^|\n]*)/g, (full) => {
      colCount++;
      if (colCount === colIndex) return `|{{campo:${fieldId}}}`;
      return full;
    });
  }

  return (
    markdown.slice(0, targetLine.index) +
    newLine +
    markdown.slice(targetLine.index + targetLine.match.length)
  );
}

// ─── Mapeamento campos → labels ───────────────────────────────────────────────

const FIELD_LABEL_MAP: Array<{
  fieldId: string;
  labels: string[];
  isMoney?: boolean;
  isQty?: boolean;
  isEnum?: boolean;
}> = [
  // Identificação — labels exatos como aparecem na imagem
  { fieldId: "numero_contrato",     labels: ["Número do contrato", "Nº do contrato", "N° do contrato"] },
  { fieldId: "processo_licitatorio",labels: ["Processo licitatório", "Processo licitatorio"] },
  { fieldId: "tipo_contrato",       labels: ["Tipo de contrato"], isEnum: true },
  { fieldId: "objeto_contrato",     labels: ["Objeto", "Objeto do contrato"] },
  { fieldId: "contratada",          labels: ["Contratada"] },
  { fieldId: "cnpj",                labels: ["CNPJ"] },
  { fieldId: "vigencia",            labels: ["Vigência", "Vigencia"] },
  { fieldId: "numero_ordem_compra", labels: ["Ordem de compra", "Ordem de Compra"] },
  { fieldId: "numero_nf",           labels: ["Nota Fiscal", "Número da NF", "Nº da NF"] },
  { fieldId: "vencimento_nf",       labels: ["Vencimento da NF", "Vencimento NF"] },
  { fieldId: "numero_empenho",      labels: ["Empenho", "Número do empenho"] },
  { fieldId: "valor_efetivo_formatado", labels: ["Valor efetivo", "Valor Efetivo"], isMoney: true },

  // Regime e Execução
  { fieldId: "tipo_base_prazo",           labels: ["Tipo de base de prazo"], isEnum: true },
  { fieldId: "condicao_prazo",            labels: ["Condição quanto ao prazo"], isEnum: true },
  { fieldId: "condicao_quantidade_ordem", labels: ["Condição quanto à quantidade (Ordem)", "Condição quanto à quantidade"], isEnum: true },
  { fieldId: "motivo_atraso",             labels: ["Motivo do atraso", "Motivo de atraso"] },
  { fieldId: "comentarios_quantidade_ordem", labels: ["Comentários sobre quantidade (Ordem)", "Comentários sobre a quantidade"] },
  { fieldId: "observacoes",               labels: ["Observações"] },
];

// ─── API pública ──────────────────────────────────────────────────────────────

export function buildTrpMarkdownWithTokens(
  markdownReal: string,
  campos: Record<string, any>,
): string {
  if (!markdownReal || !campos) return markdownReal ?? "";

  let out = markdownReal;

  for (const def of FIELD_LABEL_MAP) {
    const value = getValueByPath(campos, def.fieldId);
    if (value === null || value === undefined) continue;

    // Para enums, pega o valor humanizado que já está no markdown
    const enumValue = def.isEnum ? humanizeEnum(def.fieldId, value) : null;

    for (const label of def.labels) {
      const before = out;
      out = injectTokenInTableCell(
        out, label, def.fieldId, value,
        def.isMoney ?? false,
        def.isQty ?? false,
        enumValue,
      );
      if (out !== before) break;
    }
  }

  // Itens do objeto
  const itens: any[] = Array.isArray(campos.itens_objeto) ? campos.itens_objeto : [];
  itens.forEach((item: any, i: number) => {
    if (!item) return;
    if (item.descricao != null)
      out = injectTokenInItemsTable(out, i, 0, `itens_objeto.${i}.descricao`, item.descricao);
    if (item.unidade_medida != null)
      out = injectTokenInItemsTable(out, i, 1, `itens_objeto.${i}.unidade_medida`, item.unidade_medida);
    if (item.quantidade_recebida != null)
      out = injectTokenInItemsTable(out, i, 2, `itens_objeto.${i}.quantidade_recebida`, item.quantidade_recebida, false, true);
    const vu = item.valor_unitario_num ?? item.valor_unitario;
    if (vu != null)
      out = injectTokenInItemsTable(out, i, 3, `itens_objeto.${i}.valor_unitario_num`, vu, true);
    if (item.valor_total_calculado != null)
      out = injectTokenInItemsTable(out, i, 4, `itens_objeto.${i}.valor_total_calculado`, item.valor_total_calculado, true);
  });

  return out;
}

export function resolveTemplateToMarkdown(
  markdownWithTokens: string,
  campos: Record<string, any>,
): string {
  return markdownWithTokens.replace(/\{\{campo:([^}]+)\}\}/g, (_, fieldId) => {
    const value = getValueByPath(campos, fieldId);
    if (value === null || value === undefined || value === "") return "—";

    // Para enums, resolve de volta para o texto humanizado
    const enumValue = humanizeEnum(fieldId, value);
    if (enumValue) return enumValue;

    const isMoney =
      fieldId.includes("valor") || fieldId.includes("efetivo") || fieldId.endsWith("_calculado");
    const isQty = fieldId.includes("quantidade");

    if (isMoney) return formatMoneyPtBr(value) ?? String(value);
    if (isQty) return formatNumberPtBr(value) ?? String(value);
    return String(value);
  });
}