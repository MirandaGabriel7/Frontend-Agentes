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

// Helper para normalizar campos
const normalizeFieldValue = (value: string | null | undefined): string => {
  if (!value || value === 'NAO_DECLARADO') return 'Não informado';
  return value;
};

const generateMarkdown = (campos: TrpCamposNormalizados): string => {
  return `## TERMO DE RECEBIMENTO PROVISÓRIO

### 1. Identificação do Contrato

| Campo | Informação |
|-------|------------|
| Número do contrato | ${normalizeFieldValue(campos.numero_contrato)} |
| Processo licitatório | ${normalizeFieldValue(campos.processo_licitatorio)} |
| Objeto | ${normalizeFieldValue(campos.objeto_contrato)} |
| Contratada | ${normalizeFieldValue(campos.contratada)} |
| CNPJ | ${normalizeFieldValue(campos.cnpj)} |
| Vigência | ${normalizeFieldValue(campos.vigencia)} |
| Número do Empenho | ${normalizeFieldValue(campos.numero_empenho)} |
| Nota Fiscal | ${normalizeFieldValue(campos.numero_nf)} |
| Vencimento da NF | ${normalizeFieldValue(campos.vencimento_nf)} |
| Valor efetivo | ${normalizeFieldValue(campos.valor_efetivo_formatado)} |

### 2. Regime e Execução

| Item | Informação |
|------|------------|
| Regime de fornecimento/serviço | ${normalizeFieldValue(campos.regime_fornecimento)} |
| Tipo de contrato | ${normalizeFieldValue(campos.tipo_contrato)} |
| Data da entrega | ${normalizeFieldValue(campos.data_entrega)} |

### 3. Condições de Recebimento

| Item | Informação |
|------|------------|
| Condição quanto ao prazo | ${normalizeFieldValue(campos.condicao_prazo)} |
| Condição quanto à quantidade | ${normalizeFieldValue(campos.condicao_quantidade)} |

### 4. Observações

${normalizeFieldValue(campos.observacoes) || 'Não há observações adicionais.'}

### 5. Atesto

Atesto o recebimento provisório do objeto, conforme condições estabelecidas em contrato e documentação apresentada, sem que este ato implique quitação definitiva.

### 6. Assinaturas

**Área Demandante:** _____________________  

**Fiscal do Contrato:** _____________________  

**Data:** ____/____/________`;
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
      documento_markdown_prime: markdown, // For now, same as final
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

/**
 * Fetch TRP result by run ID
 * For now, this is a mock function that returns the result from a completed run.
 * Later, this will call a real API endpoint.
 */
export async function fetchTrpResult(runId: string): Promise<TrpAgentOutput> {
  const run = await getTrpRun(runId);
  if (!run) {
    throw new Error(`TRP run with id ${runId} not found`);
  }
  if (run.status !== 'COMPLETED' || !run.output) {
    throw new Error(`TRP run ${runId} is not completed or has no output`);
  }
  return run.output;
}

/**
 * Mock function that returns a sample TRP result for development/testing
 */
export async function fetchTrpResultMock(): Promise<TrpAgentOutput> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    documento_markdown_final: `## TERMO DE RECEBIMENTO PROVISÓRIO

### 1. Identificação do Contrato
| Campo | Informação |
|-------|------------|
| Número do contrato | 058/2025 |
| Processo licitatório | 003/2025 |
| Objeto | Contratação da empresa BLACK HAWK COMÉRCIO DE BOTAS ESPECIAIS LTDA para eventual e futura aquisição de EPIs e uniformes personalizados para o Serviço de Atendimento Móvel de Urgência (SAMU 192) e a sede administrativa do CIAS. |
| Contratada | BLACK HAWK COMÉRCIO DE BOTAS ESPECIAIS LTDA |
| CNPJ | 53.637.835/0001-13 |
| Vigência | 20/08/2025 até 20/08/2026 |
| Número do Empenho | 058/2025 |
| Nota Fiscal | 000179 |
| Vencimento da NF | Não informado |
| Valor efetivo | R$ 44.080,00 |

### 2. Regime e Execução
| Item | Informação |
|------|------------|
| Regime de fornecimento/serviço | Não informado |
| Tipo de contrato | BENS |
| Data da entrega | Não informado |

### 3. Condições de Recebimento
| Item | Informação |
|------|------------|
| Condição quanto ao prazo | Não informado |
| Condição quanto à quantidade | Não informado |

### 4. Observações
Não há observações adicionais.

### 5. Atesto
Atesto o recebimento provisório do objeto, conforme condições estabelecidas em contrato e documentação apresentada, sem que este ato implique quitação definitiva.

### 6. Assinaturas

**Área Demandante:** _____________________  

**Fiscal do Contrato:** _____________________  

**Data:** ____/____/________`,
    documento_markdown_prime: `## TERMO DE RECEBIMENTO PROVISÓRIO (PRIME)

### 1. Identificação do Contrato
| Campo | Informação |
|-------|------------|
| Número do contrato | 058/2025 |
| Processo licitatório | 003/2025 |
| Objeto | Contratação da empresa BLACK HAWK COMÉRCIO DE BOTAS ESPECIAIS LTDA para eventual e futura aquisição de EPIs e uniformes personalizados para o Serviço de Atendimento Móvel de Urgência (SAMU 192) e a sede administrativa do CIAS. |
| Contratada | BLACK HAWK COMÉRCIO DE BOTAS ESPECIAIS LTDA |
| CNPJ | 53.637.835/0001-13 |
| Vigência | 20/08/2025 até 20/08/2026 |
| Mês/Ano de competência | NAO_DECLARADO |
| Nota Fiscal | 000179 |
| Vencimento da NF | NAO_DECLARADO |
| Empenho | 058/2025 |
| Valor efetivo | 44080 |

### 2. Regime e Execução
| Item | Informação |
|------|------------|
| Regime de fornecimento/serviço | NAO_DECLARADO |
| Tipo de contrato | BENS |
| Data da entrega | NAO_DECLARADO |

### 3. Condições de Recebimento
| Item | Informação |
|------|------------|
| Condição quanto ao prazo | NAO_DECLARADO |
| Condição quanto à quantidade | NAO_DECLARADO |

### 4. Observações
Não há observações adicionais.`,
    campos_trp_normalizados: {
      numero_contrato: '058/2025',
      processo_licitatorio: '003/2025',
      objeto_contrato: 'Contratação da empresa BLACK HAWK COMÉRCIO DE BOTAS ESPECIAIS LTDA para eventual e futura aquisição de EPIs e uniformes personalizados para o Serviço de Atendimento Móvel de Urgência (SAMU 192) e a sede administrativa do CIAS.',
      contratada: 'BLACK HAWK COMÉRCIO DE BOTAS ESPECIAIS LTDA',
      cnpj: '53.637.835/0001-13',
      vigencia: '20/08/2025 até 20/08/2026',
      competencia_mes_ano: 'NAO_DECLARADO',
      numero_nf: '000179',
      vencimento_nf: 'NAO_DECLARADO',
      numero_empenho: '058/2025',
      valor_efetivo_numero: 44080,
      valor_efetivo_formatado: 'R$ 44.080,00',
      regime_fornecimento: 'NAO_DECLARADO',
      tipo_contrato: 'BENS',
      data_entrega: 'NAO_DECLARADO',
      condicao_prazo: 'NAO_DECLARADO',
      condicao_quantidade: 'NAO_DECLARADO',
      observacoes: 'Não há observações adicionais.',
    },
    meta: {
      fileName: '__TDR_sem_nome.pdf',
      hash_tdr: '919771717',
    },
  };
}

