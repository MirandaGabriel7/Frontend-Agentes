import { TRP_GENERATE_URL } from '../config/api';
import type { DadosRecebimentoPayload } from '../lib/types/trp';

function sanitizeFileName(input?: unknown): string | null {
  if (input === null || input === undefined) return null;

  let s = String(input).trim();

  if (!s) return null;

  // remove quebras, tabs, e normaliza espaços
  s = s.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  // remove caracteres problemáticos para filename/logs
  s = s.replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ').replace(/\s{2,}/g, ' ').trim();

  // limite simples (para não ficar gigante)
  if (s.length > 120) s = s.slice(0, 120).trim();

  return s || null;
}

export async function generateTrpDocument(
  dadosRecebimento: DadosRecebimentoPayload,
  files: {
    fichaContratualizacaoFile?: File | null;
    notaFiscalFile?: File | null;
    ordemFornecimentoFile?: File | null;
  }
): Promise<any> {
  const formData = new FormData();

  // ✅ FOCO: garantir que fileName (nome do fiscal) vá no JSON
  const safeFileName = sanitizeFileName((dadosRecebimento as any)?.fileName);
  const dadosRecebimentoFinal = safeFileName
    ? { ...(dadosRecebimento as any), fileName: safeFileName }
    : { ...(dadosRecebimento as any) };

  // JSON com dados do recebimento
  formData.append('dadosRecebimento', JSON.stringify(dadosRecebimentoFinal));

  // PDFs (apenas se existirem)
  if (files.fichaContratualizacaoFile) {
    formData.append('fichaContratualizacao', files.fichaContratualizacaoFile);
  }

  if (files.notaFiscalFile) {
    formData.append('notaFiscal', files.notaFiscalFile);
  }

  if (files.ordemFornecimentoFile) {
    formData.append('ordemFornecimento', files.ordemFornecimentoFile);
  }

  const response = await fetch(TRP_GENERATE_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Erro ao gerar TRP (${response.status}): ${text || response.statusText}`
    );
  }

  const data = (await response.json()) as any;
  return data;
}
