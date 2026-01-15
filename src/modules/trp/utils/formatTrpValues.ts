/**
 * Utilitários para formatar valores do TRP para exibição na UI
 * NUNCA exibir valores técnicos internos - sempre usar textos institucionais
 *
 * ✅ REGRA-OURO:
 * - Se for "não declarado" -> retornar '' (vazio) para a UI cortar (não poluir)
 * - Se for enum técnico conhecido -> retornar texto institucional
 * - Campos numéricos (quantidade/moeda) devem ser formatados por fieldName
 */

const HIDDEN = new Set([
  "",
  "NAO_DECLARADO",
  "NÃO_DECLARADO",
  "NAO INFORMADO",
  "NÃO INFORMADO",
  "NAO_INFORMADO",
  "NÃO_INFORMADO",
  "NAO DECLARADO",
  "NÃO DECLARADO",
]);

function isHidden(v: string): boolean {
  const s = v.trim();
  if (!s) return true;
  const upper = s.toUpperCase();
  return HIDDEN.has(s) || HIDDEN.has(upper);
}

function formatNumberPtBr(value: number): string {
  try {
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(value);
  } catch {
    return String(value);
  }
}

function formatBRL(value: number): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    })
      .format(value)
      .replace(/\u00A0/g, " ");
  } catch {
    const fixed = value.toFixed(2).replace(".", ",");
    return `R$ ${fixed}`;
  }
}

/**
 * Aceita:
 * - number
 * - "44.080,00"
 * - "44080.00"
 * - "120000"
 * - "R$ 120,00"
 * - "R$120,00"
 * - "120,00"
 */
function parsePtBrNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  let s = String(value).trim();
  if (!s) return null;
  if (isHidden(s)) return null;

  s = s.replace(/\u00A0/g, " ");
  s = s.replace(/[Rr]\$\s?/g, "");
  s = s.replace(/[^0-9,.\-]/g, "");

  const cleaned = s.replace(/\s+/g, "");
  if (!cleaned) return null;

  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  }

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * ✅ Detecta enum-like: ALL_CAPS com underscores
 * Ex: FORA_DO_PRAZO, NAO_PRAZO, DATA_RECEBIMENTO
 */
function isEnumLike(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  return /^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(s);
}

/**
 * ✅ Humaniza enum fallback com pt-BR (sem underscores)
 * Ex: NAO_PRAZO -> "Não prazo"
 * Obs: se quiser "Não se aplica", mapear explicitamente em institutionalMappings.
 */
function humanizeEnumPtBr(enumValue: string): string {
  const lowerWords = new Set(["de", "do", "da", "dos", "das", "e", "em", "no", "na"]);
  const parts = enumValue
    .trim()
    .split("_")
    .filter(Boolean)
    .map((w) => w.toLowerCase());

  if (!parts.length) return enumValue;

  return parts
    .map((w, idx) => {
      // coloca acento básico em "nao" -> "não" (opcional, mas ajuda MUITO)
      const ww = w === "nao" ? "não" : w;

      if (idx > 0 && lowerWords.has(ww)) return ww;
      return ww.charAt(0).toUpperCase() + ww.slice(1);
    })
    .join(" ");
}

/**
 * Mapeia valores de condição de prazo para texto legível
 */
export function formatCondicaoPrazo(value: string | null | undefined): string {
  if (!value) return "";
  if (isHidden(value)) return "";

  const key = value.trim().toUpperCase();
  const mapping: Record<string, string> = {
    NO_PRAZO: "No prazo",
    FORA_DO_PRAZO: "Fora do prazo",

    // ✅ novos (blindagem)
    NAO_PRAZO: "Não se aplica",
    NAO_APLICA: "Não se aplica",
    NAO_SE_APLICA: "Não se aplica",
  };

  return mapping[key] ?? value.trim();
}

/**
 * Mapeia valores de condição de quantidade para texto legível
 */
export function formatCondicaoQuantidade(value: string | null | undefined): string {
  if (!value) return "";
  if (isHidden(value)) return "";

  const key = value.trim().toUpperCase();
  const mapping: Record<string, string> = {
    TOTAL: "Total",
    PARCIAL: "Parcial",

    // ✅ caso apareça
    NAO_APLICA: "Não se aplica",
    NAO_SE_APLICA: "Não se aplica",
  };

  return mapping[key] ?? value.trim();
}

/**
 * Mapeia tipo de base de prazo para texto legível
 */
export function formatTipoBasePrazo(value: string | null | undefined): string {
  if (!value) return "";
  if (isHidden(value)) return "";

  const key = value.trim().toUpperCase();
  const mapping: Record<string, string> = {
    DATA_RECEBIMENTO: "Data de Recebimento",
    DATA_ENTREGA: "Data de Entrega",
    DATA_CONCLUSAO_SERVICO: "Conclusão do Serviço",
    SERVICO: "Conclusão do Serviço",

    // ✅ compat
    NF: "Nota Fiscal",
  };

  return mapping[key] ?? value.trim();
}

/**
 * Mapeia tipo de contratação/contrato para texto legível
 */
export function formatTipoContratacao(value: string | null | undefined): string {
  if (!value) return "";
  if (isHidden(value)) return "";

  const key = value.trim().toUpperCase();
  const mapping: Record<string, string> = {
    BENS: "Bens",
    SERVIÇOS: "Serviços",
    SERVICOS: "Serviços",
    OBRA: "Obra",
    OBRAS: "Obras",
  };

  return mapping[key] ?? value.trim();
}

/**
 * ✅ Formata quantidade/unidade/valores
 */
function formatQuantidadesEValores(fieldName: string, raw: unknown): string | null {
  const key = fieldName.trim().toLowerCase();

  // ⚠️ valor_efetivo_formatado já vem pronto
  if (key === "valor_efetivo_formatado") return null;

  if (key === "quantidade_recebida") {
    const n = parsePtBrNumber(raw);
    if (n === null) return "";
    return formatNumberPtBr(n);
  }

  if (
    key === "valor_unitario" ||
    key === "valor_total_calculado" ||
    key === "valor_total_geral" ||
    key === "valor_efetivo" ||
    key === "valor_efetivo_numero"
  ) {
    const n = parsePtBrNumber(raw);
    if (n === null) return "";
    return formatBRL(n);
  }

  return null;
}

/**
 * Normaliza qualquer valor técnico do TRP para texto institucional
 * ✅ Se for "não declarado" retorna '' (para a UI remover)
 * ✅ Formata quantidade e moeda nos campos certos
 * ✅ BLINDAGEM: enum-like nunca passa cru (evita "Nao_Prazo"/"Não_Prazo")
 */
export function normalizeTrpValue(value: string | null | undefined, fieldName?: string): string {
  if (value === null || value === undefined) return "";

  const raw = String(value).trim();
  if (!raw) return "";
  if (isHidden(raw)) return "";

  // ✅ formata campos numéricos específicos
  if (fieldName) {
    const formatted = formatQuantidadesEValores(fieldName, raw);
    if (formatted !== null) return formatted;
  }

  const normalizedValue = raw.toUpperCase();

  // ✅ mapa institucional completo (inclui NAO_PRAZO)
  const institutionalMappings: Record<string, string> = {
    // prazo
    NO_PRAZO: "No prazo",
    FORA_DO_PRAZO: "Fora do prazo",
    NAO_PRAZO: "Não se aplica",
    NAO_APLICA: "Não se aplica",
    NAO_SE_APLICA: "Não se aplica",

    // quantidade
    TOTAL: "Total",
    PARCIAL: "Parcial",

    // base prazo
    DATA_RECEBIMENTO: "Data de Recebimento",
    DATA_ENTREGA: "Data de Entrega",
    DATA_CONCLUSAO_SERVICO: "Conclusão do Serviço",
    SERVICO: "Conclusão do Serviço",
    NF: "Nota Fiscal",

    // tipo
    BENS: "Bens",
    SERVIÇOS: "Serviços",
    SERVICOS: "Serviços",
    OBRA: "Obra",
    OBRAS: "Obras",
  };

  if (institutionalMappings[normalizedValue]) {
    return institutionalMappings[normalizedValue];
  }

  // por campo (se precisar)
  if (fieldName === "condicao_prazo") return formatCondicaoPrazo(raw);
  if (fieldName === "condicao_quantidade") return formatCondicaoQuantidade(raw);
  if (fieldName === "tipo_base_prazo" || fieldName === "tipoBasePrazo") return formatTipoBasePrazo(raw);
  if (
    fieldName === "tipo_contratacao" ||
    fieldName === "tipoContratacao" ||
    fieldName === "tipo_contrato" ||
    fieldName === "tipoContrato"
  ) {
    return formatTipoContratacao(raw);
  }

  // ✅ BLINDAGEM FINAL:
  // se for enum-like e não foi mapeado, humaniza (sem underscore) ao invés de deixar cru
  if (isEnumLike(normalizedValue)) {
    return humanizeEnumPtBr(normalizedValue);
  }

  return raw;
}

/**
 * @deprecated Use normalizeTrpValue
 */
export function formatTrpEnumValue(value: string | null | undefined, fieldName?: string): string {
  return normalizeTrpValue(value, fieldName);
}
