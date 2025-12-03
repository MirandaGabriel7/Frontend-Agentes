import { TrpRun, TrpInputForm, TrpAgentOutput, TrpCamposNormalizados } from '../types/trp';

const STORAGE_KEY = 'trp_runs';

let runsStore: TrpRun[] = [];

// Load from localStorage on init
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      runsStore = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load TRP runs from localStorage', e);
  }
}

const saveToStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(runsStore));
    } catch (e) {
      console.warn('Failed to save TRP runs to localStorage', e);
    }
  }
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateMarkdown = (campos: TrpCamposNormalizados): string => {
  return `## TERMO DE RECEBIMENTO PROVISÓRIO

### 1. DADOS DO CONTRATO

| Campo | Valor |
|-------|-------|
| Número do Contrato | ${campos.numero_contrato} |
| Processo Licitatório | ${campos.processo_licitatorio} |
| Objeto do Contrato | ${campos.objeto_contrato} |
| Contratada | ${campos.contratada} |
| CNPJ | ${campos.cnpj} |
| Vigência | ${campos.vigencia} |
| Tipo de Contrato | ${campos.tipo_contrato} |
| Regime de Fornecimento | ${campos.regime_fornecimento} |

### 2. DADOS DA NOTA FISCAL

| Campo | Valor |
|-------|-------|
| Número da NF | ${campos.numero_nf} |
| Vencimento da NF | ${campos.vencimento_nf} |
| Competência (Mês/Ano) | ${campos.competencia_mes_ano} |
| Número do Empenho | ${campos.numero_empenho} |
| Valor Efetivo | ${campos.valor_efetivo_formatado} |

### 3. DADOS DO RECEBIMENTO

| Campo | Valor |
|-------|-------|
| Data de Entrega | ${campos.data_entrega} |
| Condição do Prazo | ${campos.condicao_prazo} |
| Condição da Quantidade | ${campos.condicao_quantidade} |
| Observações | ${campos.observacoes || 'Nenhuma observação registrada.'} |

---

**Documento gerado automaticamente pelo sistema PLANCO.**

*Data de geração: ${new Date().toLocaleDateString('pt-BR')}*`;
};

const generateCamposNormalizados = (input: TrpInputForm): TrpCamposNormalizados => {
  const condicaoPrazo = input.condicao_prazo || 'NAO_SE_APLICA';
  const condicaoQuantidade = input.condicao_quantidade || 'TOTAL';
  
  // Formatar condição do prazo
  let condicaoPrazoLabel = 'Não se aplica';
  if (condicaoPrazo === 'NO_PRAZO') {
    condicaoPrazoLabel = 'No Prazo';
  } else if (condicaoPrazo === 'FORA_DO_PRAZO') {
    condicaoPrazoLabel = 'Fora do Prazo';
    if (input.data_prevista_entrega_contrato && input.data_entrega_real) {
      condicaoPrazoLabel += ` (Prevista: ${input.data_prevista_entrega_contrato}, Real: ${input.data_entrega_real})`;
    }
    if (input.motivo_atraso) {
      condicaoPrazoLabel += ` - ${input.motivo_atraso}`;
    }
  }

  // Formatar condição da quantidade
  let condicaoQuantidadeLabel = 'Total conforme empenho';
  if (condicaoQuantidade === 'PARCIAL') {
    condicaoQuantidadeLabel = 'Quantidade parcial (inferior ao empenho)';
    if (input.detalhe_pendencias) {
      condicaoQuantidadeLabel += ` - ${input.detalhe_pendencias}`;
    }
  } else if (condicaoQuantidade === 'DIVERGENCIA_SUPERIOR') {
    condicaoQuantidadeLabel = 'Quantidade divergente (superior ao empenho)';
    if (input.detalhe_pendencias) {
      condicaoQuantidadeLabel += ` - ${input.detalhe_pendencias}`;
    }
  }

  // Combinar observações
  let observacoes = input.observacoes_recebimento || '';
  if (input.detalhe_pendencias && (condicaoQuantidade === 'PARCIAL' || condicaoQuantidade === 'DIVERGENCIA_SUPERIOR')) {
    observacoes += observacoes ? `\n\nDetalhe das pendências: ${input.detalhe_pendencias}` : `Detalhe das pendências: ${input.detalhe_pendencias}`;
  }

  // Converter data de DD/MM/YYYY para Date se necessário
  const parseDate = (dateStr: string | undefined): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
    return new Date(dateStr);
  };

  const dataRecebimento = input.data_recebimento_nf_real 
    ? parseDate(input.data_recebimento_nf_real)
    : new Date();
  
  return {
    numero_contrato: '058/2025',
    processo_licitatorio: '003/2025',
    objeto_contrato: 'Contratação de empresa especializada para fornecimento de equipamentos de segurança e comunicação para aeronaves Black Hawk, incluindo instalação, treinamento e suporte técnico, conforme especificações técnicas constantes no Anexo I do Edital de Licitação nº 003/2025.',
    contratada: 'AeroDefense Solutions Ltda.',
    cnpj: '12.345.678/0001-90',
    vigencia: '12 meses',
    competencia_mes_ano: dataRecebimento.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
    numero_nf: '000123',
    vencimento_nf: dataRecebimento.toISOString().split('T')[0],
    numero_empenho: '2025NE000058',
    valor_efetivo_numero: 1250000.00,
    valor_efetivo_formatado: 'R$ 1.250.000,00',
    regime_fornecimento: 'Contínuo',
    tipo_contrato: 'Contrato de Fornecimento',
    data_entrega: input.data_entrega_real || input.data_recebimento_nf_real || dataRecebimento.toISOString().split('T')[0],
    condicao_prazo: condicaoPrazoLabel,
    condicao_quantidade: condicaoQuantidadeLabel,
    observacoes: observacoes,
  };
};

export async function listTrpRuns(): Promise<TrpRun[]> {
  return [...runsStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getTrpRun(id: string): Promise<TrpRun | undefined> {
  return runsStore.find(run => run.id === id);
}

export async function createTrpRun(input: TrpInputForm): Promise<TrpRun> {
  const run: TrpRun = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    input,
  };
  
  runsStore.push(run);
  saveToStorage();
  return run;
}

export async function simulateTrpAgent(runId: string): Promise<TrpRun> {
  const run = runsStore.find(r => r.id === runId);
  if (!run) {
    throw new Error(`TRP run with id ${runId} not found`);
  }

  run.status = 'RUNNING';
  saveToStorage();

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    const campos = generateCamposNormalizados(run.input);
    const markdown = generateMarkdown(campos);

    const output: TrpAgentOutput = {
      documento_markdown_final: markdown,
      campos_trp_normalizados: campos,
      meta: {
        fileName: run.input.arquivoTdrNome || '__TDR_sem_nome.pdf',
        hash_tdr: '919771717',
      },
    };

    run.status = 'COMPLETED';
    run.output = output;
    saveToStorage();

    return run;
  } catch (error) {
    run.status = 'FAILED';
    run.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar TRP';
    saveToStorage();
    throw error;
  }
}

