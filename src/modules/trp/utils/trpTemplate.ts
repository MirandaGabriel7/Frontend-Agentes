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
    if (cursor[key] === undefined || cursor[key] === null)
      cursor[key] = isNaN(Number(nextKey)) ? {} : [];
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
  return cloned;
}

// ─── Enums ────────────────────────────────────────────────────────────────────

const ENUM_MAPS: Record<string, Record<string, string>> = {
  tipo_contrato: {
    BENS: "Bens",
    SERVICOS: "Serviços",
    SERVIÇOS: "Serviços",
    SERVICOS_CONTINUOS: "Serviços contínuos",
    SERVIÇOS_CONTINUOS: "Serviços contínuos",
    OBRA: "Obra",
  },
  tipo_base_prazo: {
    DATA_RECEBIMENTO: "Data de recebimento",
    DATA_ENTREGA: "Data de entrega",
    SERVICO: "Conclusão do serviço",
    DATA_CONCLUSAO_SERVICO: "Conclusão do serviço",
    NF: "Nota Fiscal",
    INICIO_SERVICO: "Início do serviço",
    INICIO_DO_SERVICO: "Início do serviço",
    DATA_INICIO_SERVICO: "Início do serviço",
  },
  condicao_prazo: {
    NO_PRAZO: "No prazo",
    FORA_DO_PRAZO: "Fora do prazo",
    NAO_PRAZO: "Não se aplica",
    NAO_APLICA: "Não se aplica",
    NAO_SE_APLICA: "Não se aplica",
    NAO_APLICAVEL: "Não se aplica",
    NAO_APLICÁVEL: "Não se aplica",
  },
  condicao_quantidade_ordem: {
    TOTAL: "Total (conforme a ordem)",
    PARCIAL: "Parcial",
    A_MAIOR: "A maior",
    A_MENOR: "A menor",
    NAO_APLICAVEL: "Não se aplica",
    NAO_APLICÁVEL: "Não se aplica",
    NAO_APLICA: "Não se aplica",
    NAO_SE_APLICA: "Não se aplica",
  },
  condicao_quantidade_nf: {
    TOTAL: "Total (conforme a NF)",
    PARCIAL: "Parcial",
    A_MAIOR: "A maior",
    A_MENOR: "A menor",
    NAO_APLICAVEL: "Não se aplica",
    NAO_SE_APLICA: "Não se aplica",
  },
};

function normEnumKey(v: string): string {
  return v.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function humanizeEnum(fieldId: string, value: any): string | null {
  if (!value || typeof value !== "string") return null;
  const map = ENUM_MAPS[fieldId];
  if (!map) return null;
  return map[normEnumKey(value)] ?? null;
}

// ─── Formatadores pt-BR ───────────────────────────────────────────────────────

function formatNumberPtBr(v: any): string | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(n);
}

function formatMoneyPtBr(v: any): string | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", minimumFractionDigits: 2,
  }).format(n).replace(/\u00A0/g, " ");
}

function getTextRepresentations(value: any, isMoney = false, isQty = false): string[] {
  if (value === null || value === undefined) return [];
  const reps = new Set<string>();
  const str = String(value).trim();
  if (str && str !== "—" && str !== "-") reps.add(str);
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (Number.isFinite(n)) {
    if (isMoney) { const m = formatMoneyPtBr(n); if (m) reps.add(m); }
    if (isQty || !isMoney) { const q = formatNumberPtBr(n); if (q) reps.add(q); }
    if (Number.isInteger(n)) reps.add(String(n));
  }
  return Array.from(reps).filter(Boolean);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Injeção em tabela | Label | Valor | ──────────────────────────────────────
// force=true: substitui qualquer conteúdo na célula (não tenta casar o valor)

function injectTokenInTableCell(
  markdown: string,
  rowLabel: string,
  fieldId: string,
  value: any,
  isMoney = false,
  isQty = false,
  enumValue?: string | null,
  force = false,
): string {
  const labelEsc = escapeRegex(rowLabel);

  if (!force) {
    // 1) Enum humanizado
    if (enumValue) {
      const re = new RegExp(
        `^(\\|\\s*${labelEsc}\\s*\\|\\s*)${escapeRegex(enumValue)}(\\s*\\|\\s*)$`, "gim",
      );
      if (re.test(markdown)) return markdown.replace(re, `$1{{campo:${fieldId}}}$2`);
    }
    // 2) Representações do valor
    for (const rep of getTextRepresentations(value, isMoney, isQty)) {
      const re = new RegExp(
        `^(\\|\\s*${labelEsc}\\s*\\|\\s*)${escapeRegex(rep)}(\\s*\\|\\s*)$`, "gim",
      );
      if (re.test(markdown)) return markdown.replace(re, `$1{{campo:${fieldId}}}$2`);
    }
  }

  // force ou fallback: substitui qualquer conteúdo na célula
  // Suporta conteúdo com <br> (objeto longo) — [^|]* é greedy mas não atravessa |
  const reFallback = new RegExp(
    `^(\\|\\s*${labelEsc}\\s*\\|\\s*)([^\\n]*?)(\\s*\\|\\s*)$`, "gim",
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
  const re = /^\|([^|\n]+\|){4,}[^\n]*$/gm;
  const dataLines: Array<{ match: string; index: number }> = [];
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
      if (colCount === colIndex && new RegExp(`^\\s*${repEsc}\\s*$`).test(cell)) {
        replaced = true;
        return `|{{campo:${fieldId}}}`;
      }
      return full;
    });
    if (replaced) { newLine = candidate; break; }
  }
  if (!replaced) {
    let colCount = -1;
    newLine = targetLine.match.replace(/\|([^|\n]*)/g, (full) => {
      colCount++;
      return colCount === colIndex ? `|{{campo:${fieldId}}}` : full;
    });
  }
  return (
    markdown.slice(0, targetLine.index) +
    newLine +
    markdown.slice(targetLine.index + targetLine.match.length)
  );
}

// ─── Mapeamento campos → labels de tabela ────────────────────────────────────

const FIELD_LABEL_MAP: Array<{
  fieldId: string;
  labels: string[];
  isMoney?: boolean;
  isQty?: boolean;
  isEnum?: boolean;
  force?: boolean;
}> = [
  // Identificação
  { fieldId: "numero_contrato",       labels: ["Número do contrato", "Nº do contrato"] },
  { fieldId: "processo_licitatorio",  labels: ["Processo licitatório", "Processo Licitatório"] },
  { fieldId: "tipo_contrato",         labels: ["Tipo de contrato"], isEnum: true },
  // objeto_contrato: força replace pois o valor tem \n e <br>
  { fieldId: "objeto_contrato",       labels: ["Objeto", "Objeto do contrato"], force: true },
  { fieldId: "contratada",            labels: ["Contratada"] },
  { fieldId: "cnpj",                  labels: ["CNPJ"] },
  { fieldId: "vigencia",              labels: ["Vigência", "Vigencia"] },
  { fieldId: "numero_ordem_compra",   labels: ["Ordem de compra", "Ordem de Compra"] },
  { fieldId: "competencia_mes_ano",   labels: ["Mês/Ano de competência", "Mês/Ano de Competência", "Competência", "Competencia"] },
  { fieldId: "numero_nf",             labels: ["Nota Fiscal", "Número da NF"] },
  { fieldId: "vencimento_nf",         labels: ["Vencimento da NF", "Vencimento NF"], force: true },
  { fieldId: "numero_empenho",        labels: ["Empenho", "Número do empenho"] },
  { fieldId: "unidade_gestora",       labels: ["Unidade gestora", "Unidade Gestora"] },
  { fieldId: "fiscal_contrato",       labels: ["Fiscal do contrato", "Fiscal do Contrato"] },
  { fieldId: "local_entrega",         labels: ["Local de entrega"] },
  { fieldId: "valor_efetivo_formatado", labels: ["Valor efetivo", "Valor Efetivo"], isMoney: true, force: true },

  // Regime e Execução
  { fieldId: "tipo_base_prazo",              labels: ["Tipo de base de prazo"], isEnum: true, force: true },
  { fieldId: "condicao_prazo",               labels: ["Condição quanto ao prazo"], isEnum: true, force: true },
  { fieldId: "condicao_quantidade_ordem",    labels: ["Condição quanto à quantidade (Ordem)", "Condição quanto à quantidade"], isEnum: true, force: true },
  { fieldId: "condicao_quantidade_nf",       labels: ["Condição quanto à quantidade (NF)"], isEnum: true, force: true },
  { fieldId: "motivo_atraso",                labels: ["Motivo do atraso", "Motivo de atraso"] },
  { fieldId: "comentarios_quantidade_ordem", labels: ["Comentários (Ordem)", "Comentários sobre a quantidade (Ordem)", "Comentários sobre quantidade (Ordem)"] },
  { fieldId: "comentarios_quantidade_nf",    labels: ["Comentários (NF)", "Comentários sobre quantidade (NF)"] },
  { fieldId: "observacoes",                  labels: ["Observações"] },
];

// ─── Prazos calculados: chaves reais do backend ───────────────────────────────
// prazos_calculados: { provisorio, definitivo, liquidacao, vencimento_nf }

const PRAZO_MAP: Array<{ field: string; labels: string[] }> = [
  { field: "provisorio",  labels: ["Termo de Recebimento Provisório",  "Termo de Recebimento Provisorio"] },
  { field: "definitivo",  labels: ["Termo de Recebimento Definitivo"] },
  { field: "liquidacao",  labels: ["Liquidação", "Liquidacao"] },
  { field: "vencimento_nf", labels: ["Vencimento da NF", "Vencimento NF"] },
];

// ─── Datas legadas (fallback quando não está em regime_execucao_datas_exibicao) ──

const LEGACY_DATE_MAP: Array<{ field: string; labels: string[] }> = [
  { field: "data_recebimento",               labels: ["Data de recebimento", "Data de Recebimento"] },
  { field: "data_inicio_servico",            labels: ["Data de início do serviço", "Data de Início do Serviço"] },
  { field: "data_entrega",                   labels: ["Data base (entrega)", "Data de entrega"] },
  { field: "data_entrega_real",              labels: ["Data de entrega real"] },
  { field: "data_conclusao_servico",         labels: ["Conclusão do serviço", "Conclusão do Serviço", "Data da prestação do serviço"] },
  { field: "data_prevista_entrega_contrato", labels: ["Data prevista em contrato", "Data Prevista em Contrato"] },
];

// ─── API pública ──────────────────────────────────────────────────────────────

export function buildTrpMarkdownWithTokens(
  markdownReal: string,
  campos: Record<string, any>,
): string {
  if (!markdownReal || !campos) return markdownReal ?? "";
  let out = markdownReal;

  // ── 1) Campos em tabelas scalares ──────────────────────────────────────────
  for (const def of FIELD_LABEL_MAP) {
    const value = getValueByPath(campos, def.fieldId);
    if (value === null || value === undefined) continue;
    const enumValue = def.isEnum ? humanizeEnum(def.fieldId, value) : null;
    for (const label of def.labels) {
      const before = out;
      out = injectTokenInTableCell(
        out, label, def.fieldId, value,
        def.isMoney ?? false, def.isQty ?? false, enumValue, def.force ?? false,
      );
      if (out !== before) break;
    }
  }

  // ── 2) Prazos Calculados ───────────────────────────────────────────────────
  // campos.prazos_calculados = { provisorio, definitivo, liquidacao, vencimento_nf }
  const prazos = campos.prazos_calculados;
  if (prazos && typeof prazos === "object") {
    for (const pm of PRAZO_MAP) {
      const val = prazos[pm.field];
      if (!val) continue;
      const fieldId = `prazos_calculados.${pm.field}`;
      for (const label of pm.labels) {
        const before = out;
        out = injectTokenInTableCell(out, label, fieldId, val, false, false, null, true);
        if (out !== before) break;
      }
    }
  }

  // ── 3) Datas dinâmicas (regime_execucao_datas_exibicao + data_base_calculo) ──
  // data_base_calculo usa data_base_calculo_label como label no markdown
  const baseLabel = String(campos.data_base_calculo_label ?? "").trim();
  const baseValue = String(campos.data_base_calculo ?? "").trim();
  if (baseLabel && baseValue) {
    out = injectTokenInTableCell(out, baseLabel, "data_base_calculo", baseValue, false, false, null, true);
  }

  // array extras
  const extras: any[] = Array.isArray(campos.regime_execucao_datas_exibicao)
    ? campos.regime_execucao_datas_exibicao : [];
  extras.forEach((row: any, idx: number) => {
    if (!row?.label || !row?.value) return;
    const label = String(row.label).trim();
    const val   = String(row.value).trim();
    const fieldId = `regime_execucao_datas_exibicao.${idx}.value`;
    out = injectTokenInTableCell(out, label, fieldId, val, false, false, null, true);
  });

  // datas legadas (caso não estejam no array dinâmico)
  for (const ld of LEGACY_DATE_MAP) {
    const val = campos[ld.field];
    if (!val) continue;
    for (const label of ld.labels) {
      const before = out;
      out = injectTokenInTableCell(out, label, ld.field, val, false, false, null, true);
      if (out !== before) break;
    }
  }

  // ── 4) Observações (bullet markdown "- texto") ────────────────────────────
  // observacoes OU observacoes_recebimento
  const obsValue = campos.observacoes ?? campos.observacoes_recebimento;
  if (obsValue && typeof obsValue === "string" && obsValue.trim()) {
    const obsEsc = escapeRegex(obsValue.trim());
    // bullet: "- valor" ou "* valor" — com possível espaço final
    const reBullet = new RegExp(`^([\\-\\*]\\s+)${obsEsc}(\\s*)$`, "gim");
    if (reBullet.test(out)) {
      out = out.replace(reBullet, `$1{{campo:observacoes}}$2`);
    }
  }

  // ── 5) Assinaturas ────────────────────────────────────────────────────────
  // Formato real: "- Fiscal do Contrato: Nome  \n- Data: 26/02/2026  \n"
  // (dois espaços antes do \n = markdown line break)
  const fiscalNome = campos.fiscal_contrato_nome;
  if (fiscalNome && typeof fiscalNome === "string" && fiscalNome.trim()) {
    const nomEsc = escapeRegex(fiscalNome.trim());
    // casa "Fiscal do Contrato: Nome" com trailing spaces opcionais
    out = out.replace(
      new RegExp(`(Fiscal\\s+do\\s+[Cc]ontrato:\\s*)${nomEsc}(\\s*)`, "g"),
      `$1{{campo:fiscal_contrato_nome}}$2`,
    );
  }

  const dataAss = campos.data_assinatura;
  if (dataAss && typeof dataAss === "string" && dataAss.trim()) {
    const dtEsc = escapeRegex(dataAss.trim());
    // casa "- Data: 26/02/2026" com trailing spaces opcionais
    out = out.replace(
      new RegExp(`([-\\*]\\s+Data:\\s*)${dtEsc}(\\s*)`, "g"),
      `$1{{campo:data_assinatura}}$2`,
    );
  }

  // ── 6) Itens do objeto ────────────────────────────────────────────────────
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

// ─── Resolve tokens → markdown final ─────────────────────────────────────────

export function resolveTemplateToMarkdown(
  markdownWithTokens: string,
  campos: Record<string, any>,
): string {
  return markdownWithTokens.replace(/\{\{campo:([^}]+)\}\}/g, (_, fieldId) => {
    const value = getValueByPath(campos, fieldId);
    if (value === null || value === undefined || value === "") return "—";

    const enumValue = humanizeEnum(fieldId.split(".").pop() ?? fieldId, value);
    if (enumValue) return enumValue;

    const isMoney = /valor|efetivo|calculado/.test(fieldId);
    const isQty   = /quantidade/.test(fieldId);

    if (isMoney) return formatMoneyPtBr(value) ?? String(value);
    if (isQty)   return formatNumberPtBr(value) ?? String(value);
    return String(value);
  });
}