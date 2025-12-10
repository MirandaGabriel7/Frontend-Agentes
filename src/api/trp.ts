import { TRP_GENERATE_URL } from '../config/api';
import type { DadosRecebimentoPayload, TrpApiResponse } from '../types/trp';

export async function generateTrpDocument(
  dadosRecebimento: DadosRecebimentoPayload,
  files: {
    fichaContratualizacaoFile?: File | null;
    notaFiscalFile?: File | null;
    ordemFornecimentoFile?: File | null;
  }
): Promise<TrpApiResponse> {
  const formData = new FormData();

  // JSON com dados do recebimento
  formData.append('dadosRecebimento', JSON.stringify(dadosRecebimento));

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

  const data = (await response.json()) as TrpApiResponse;
  return data;
}

