import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  useTheme,
  Button,
  Snackbar,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, History as HistoryIcon } from '@mui/icons-material';
import { TrpUploadCard } from '../components/TrpUploadCard';
import { TrpFormCard } from '../components/TrpFormCard';
import { TrpActionsBar } from '../components/TrpActionsBar';
import { TrpHistoryCard, TrpHistoryItem } from '../components/TrpHistoryCard';
import { TrpInputForm } from '../../../lib/types/trp';
import { generateTrp, listTrpRuns, downloadTrpRun } from '../../../services/api';
import type { DadosRecebimentoPayload } from '../../../types/trp';
import { useAuth } from '../../../contexts/AuthContext';
import { isUuid } from '../../../utils/uuid';

export const TrpPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { signOut } = useAuth();
const [snackbar, setSnackbar] = useState<{
  open: boolean;
  message: string;
  severity?: 'error' | 'success' | 'warning';
}>({
  open: false,
  message: '',
});


  // Estados dos arquivos
  const [fichaContratualizacaoFile, setFichaContratualizacaoFile] = useState<File | null>(null);
  const [notaFiscalFile, setNotaFiscalFile] = useState<File | null>(null);
  const [ordemFornecimentoFile, setOrdemFornecimentoFile] = useState<File | null>(null);

  // Estados do formulário
  const [form, setForm] = useState<TrpInputForm>({
    tipo_contratacao: undefined,
    data_recebimento: undefined,
    data_conclusao_servico: undefined,
    tipo_base_prazo: undefined,
    condicao_prazo: undefined,
    condicao_quantidade_ordem: undefined,
    condicao_quantidade_nf: undefined,
    competencia_mes_ano: undefined,
    observacoes_recebimento: undefined,
    motivo_atraso: undefined,
    comentarios_quantidade_ordem: undefined,
    comentarios_quantidade_nf: undefined,
    data_prevista_entrega_contrato: undefined,
    data_entrega_real: undefined,
    fiscal_contrato_nome: undefined,
    data_assinatura: undefined,
    area_demandante_nome: undefined,
    arquivoTdrNome: '',
  });

  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validação completa do formulário
  const validateForm = (): string | null => {
    // Arquivos obrigatórios
    if (!fichaContratualizacaoFile && !notaFiscalFile && !ordemFornecimentoFile) {
      return 'É necessário enviar pelo menos um arquivo (Ficha de Contratualização, Nota Fiscal ou Ordem de Fornecimento).';
    }

    // Campos obrigatórios
    if (!form.tipo_contratacao) {
      return 'O campo "Tipo de contrato" é obrigatório.';
    }

    // Competência obrigatória para SERVIÇOS
    if (form.tipo_contratacao === 'SERVIÇOS' && !form.competencia_mes_ano) {
      return 'O campo "Mês/Ano de competência" é obrigatório quando o tipo de contrato é SERVIÇOS.';
    }

    // Validação de formato MM/AAAA
    if (form.competencia_mes_ano && !/^\d{2}\/\d{4}$/.test(form.competencia_mes_ano)) {
      return 'O campo "Mês/Ano de competência" deve estar no formato MM/AAAA (ex: 12/2025).';
    }

    // Base de prazo obrigatória
    if (!form.tipo_base_prazo) {
      return 'O campo "Base para contagem de Prazo" é obrigatório.';
    }

    // Data de recebimento obrigatória quando base = DATA_RECEBIMENTO
    if (form.tipo_base_prazo === 'DATA_RECEBIMENTO' && !form.data_recebimento) {
      return 'O campo "Data de Recebimento" é obrigatório quando a base de prazo é DATA_RECEBIMENTO.';
    }

    // Data de conclusão obrigatória quando base = SERVICO
    if (form.tipo_base_prazo === 'SERVICO' && !form.data_conclusao_servico) {
      return 'O campo "Data de Conclusão do Serviço" é obrigatório quando a base de prazo é SERVICO.';
    }

    // Condição de prazo obrigatória
    if (!form.condicao_prazo) {
      return 'O campo "Condição quanto ao prazo" é obrigatório.';
    }

    // Motivo do atraso obrigatório quando FORA_DO_PRAZO
    if (form.condicao_prazo === 'FORA_DO_PRAZO' && !form.motivo_atraso) {
      return 'O campo "Motivo do atraso" é obrigatório quando a condição de prazo é FORA_DO_PRAZO.';
    }

    // Condição de quantidade Ordem obrigatória
    if (!form.condicao_quantidade_ordem) {
      return 'O campo "Quantidade conforme Ordem de Fornecimento" é obrigatório.';
    }

    // Comentários obrigatórios quando PARCIAL na Ordem
    if (form.condicao_quantidade_ordem === 'PARCIAL' && !form.comentarios_quantidade_ordem) {
      return 'O campo "Comentários sobre divergência/pendências" é obrigatório quando a quantidade conforme Ordem de Fornecimento é PARCIAL.';
    }

    return null;
  };

  const canExecute = Boolean(
    (fichaContratualizacaoFile || notaFiscalFile || ordemFornecimentoFile) &&
    validateForm() === null
  );

  const handleGenerateTrp = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Validar formulário antes de enviar
      const validationError = validateForm();
      if (validationError) {
        setErrorMessage(validationError);
        setIsLoading(false);
        return;
      }

      // Mapear campos do formulário para o payload da API
const payload: DadosRecebimentoPayload = {
  tipoContratacao: form.tipo_contratacao!,
  tipoBasePrazo: form.tipo_base_prazo!,
  condicaoPrazo: form.condicao_prazo!,
  condicaoQuantidadeOrdem: form.condicao_quantidade_ordem!,
};


      // Campos condicionais
      if (form.tipo_contratacao === 'SERVIÇOS' && form.competencia_mes_ano) {
        payload.competenciaMesAno = form.competencia_mes_ano;
      }

      if (form.tipo_base_prazo === 'DATA_RECEBIMENTO' && form.data_recebimento) {
        payload.dataRecebimento = form.data_recebimento;
      }

      if (form.tipo_base_prazo === 'SERVICO' && form.data_conclusao_servico) {
        payload.dataConclusaoServico = form.data_conclusao_servico;
      }

      if (form.data_prevista_entrega_contrato) {
        payload.dataPrevistaEntregaContrato = form.data_prevista_entrega_contrato;
      }

      if (form.data_entrega_real) {
        payload.dataEntregaReal = form.data_entrega_real;
      }

      if (form.condicao_prazo === 'FORA_DO_PRAZO') {
        if (form.motivo_atraso) {
          payload.motivoAtraso = form.motivo_atraso;
        }
      }

      if (form.condicao_quantidade_ordem === 'PARCIAL' && form.comentarios_quantidade_ordem) {
        payload.comentariosQuantidadeOrdem = form.comentarios_quantidade_ordem;
      }


      if (form.observacoes_recebimento) {
        payload.observacoesRecebimento = form.observacoes_recebimento;
      }

      // Nota: Assinaturas (fiscalContratoNome, dataAssinatura, areaDemandanteNome) 
      // serão preenchidas automaticamente pelo sistema a partir dos documentos

      // ✅ Gerar TRP - retorna apenas runId, status e createdAt
      const result = await generateTrp({
        dadosRecebimento: {
          tipoContratacao: payload.tipoContratacao,
          competenciaMesAno: payload.competenciaMesAno || null,
          tipoBasePrazo: payload.tipoBasePrazo,
          dataRecebimento: payload.dataRecebimento || null,
          dataConclusaoServico: payload.dataConclusaoServico || null,
          dataPrevistaEntregaContrato: payload.dataPrevistaEntregaContrato || null,
          dataEntregaReal: payload.dataEntregaReal || null,
          condicaoPrazo: payload.condicaoPrazo,
          motivoAtraso: payload.motivoAtraso || null,
          condicaoQuantidadeOrdem: payload.condicaoQuantidadeOrdem,
          comentariosQuantidadeOrdem: payload.comentariosQuantidadeOrdem || null,
          observacoesRecebimento: payload.observacoesRecebimento || null,
          // Assinaturas serão preenchidas automaticamente pelo sistema a partir dos documentos
        },
        files: {
          fichaContratualizacao: fichaContratualizacaoFile,
          notaFiscal: notaFiscalFile,
          ordemFornecimento: ordemFornecimentoFile,
        },
      });

      // Debug (apenas em dev)
      const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);
      if (isDev) {
        console.debug('[TrpPage] TRP gerado:', {
          runId: result.runId,
          status: result.status,
          createdAt: result.createdAt,
        });
      }
      
      // Salvar runId no histórico (opcional, apenas para cache)
      try {
        const historyKey = 'trp_run_history';
        const stored = localStorage.getItem(historyKey);
        const history: string[] = stored ? JSON.parse(stored) : [];
        if (!history.includes(result.runId)) {
          history.unshift(result.runId);
          // Manter apenas os últimos 50
          const limitedHistory = history.slice(0, 50);
          localStorage.setItem(historyKey, JSON.stringify(limitedHistory));
        }
      } catch (e) {
        // Ignorar erros de localStorage
        console.warn('[TrpPage] Erro ao salvar histórico:', e);
      }
      
      // Navegar para a página de resultado usando runId
      navigate(`/agents/trp/resultado/${result.runId}`);
    } catch (err: any) {
      console.error('Erro ao gerar TRP:', err);
      setErrorMessage(err?.message || 'Erro inesperado ao gerar o Termo de Recebimento Provisório.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFichaContratualizacaoFile(null);
    setNotaFiscalFile(null);
    setOrdemFornecimentoFile(null);
    setForm({
      tipo_contratacao: undefined,
      data_recebimento: undefined,
      data_conclusao_servico: undefined,
      tipo_base_prazo: undefined,
      condicao_prazo: undefined,
      condicao_quantidade_ordem: undefined,
      condicao_quantidade_nf: undefined,
      competencia_mes_ano: undefined,
      observacoes_recebimento: undefined,
      motivo_atraso: undefined,
      comentarios_quantidade_ordem: undefined,
      comentarios_quantidade_nf: undefined,
      data_prevista_entrega_contrato: undefined,
      data_entrega_real: undefined,
      arquivoTdrNome: '',
    });
    setErrorMessage(null);
  };

  // Estado para histórico
  const [historyItems, setHistoryItems] = useState<TrpHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const didFetchHistory = React.useRef(false);

  /**
   * Carrega histórico do backend
   */
  React.useEffect(() => {
    // Evitar double-fetch em React StrictMode
    if (didFetchHistory.current) return;
    didFetchHistory.current = true;

    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        const runs = await listTrpRuns(20);
        
        // ✅ GARANTIR que runs é sempre um array antes de fazer filter
        const runsArray = Array.isArray(runs) ? runs : [];
        
        const items: TrpHistoryItem[] = runsArray
          .filter(run => run && run.status === 'COMPLETED')
          .map(run => ({
            id: run.runId,
            fileName: `TRP_${run.runId.substring(0, 8)}.pdf`,
            contractNumber: run.numero_contrato || undefined,
            invoiceNumber: run.numero_nf || undefined,
            status: 'completed' as const,
            createdAt: run.createdAt,
            totalValue: run.valor_efetivo_numero || undefined,
          }));
        
        setHistoryItems(items);
      } catch (err) {
        console.warn('[TrpPage] Erro ao carregar histórico do backend:', err);
        // Em caso de erro, não exibir histórico (não usar mocks)
        setHistoryItems([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleDownload = async (runId: string, format: 'pdf' | 'docx') => {
    // ✅ VALIDAÇÃO CRÍTICA: runId deve vir EXCLUSIVAMENTE do item do histórico
    // ✅ BLOQUEIO: Nunca usar runId de state global, cache, último run, ou qualquer outra fonte
    if (!runId) {
      setSnackbar({ open: true, message: 'ID do TRP não encontrado', severity: 'error' });
      return;
    }

    // ✅ VALIDAÇÃO: runId deve ser UUID válido
    if (!isUuid(runId)) {
      setSnackbar({ open: true, message: 'ID do TRP inválido', severity: 'error' });
      return;
    }

    try {
      // ✅ GARANTIA ABSOLUTA: runId vem EXCLUSIVAMENTE do item do histórico
      // ✅ Endpoint: GET /api/trp/runs/${runId}/download?format=${format}
      // ✅ NUNCA usar: estado global, cache, último run, etc.
      await downloadTrpRun(runId, format);
      setSnackbar({ open: true, message: `Exportando documento oficial do TRP em ${format.toUpperCase()}...`, severity: 'success' });
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao baixar arquivo';
      const status = err.status;
      
      // Tratar erros específicos conforme requisitos
      if (status === 401 || status === 403) {
        setSnackbar({ 
          open: true, 
          message: 'Sessão expirada / sem permissão', 
          severity: 'error' 
        });
        await signOut();
        navigate('/login', { replace: true, state: { message: 'Sua sessão expirou. Faça login novamente.' } });
        return;
      }
      
      if (status === 404) {
        setSnackbar({ open: true, message: 'Documento não encontrado', severity: 'error' });
      } else if (status === 409) {
        setSnackbar({ open: true, message: 'Documento ainda não finalizado', severity: 'warning' });
      } else if (status === 429) {
        setSnackbar({ open: true, message: 'Aguarde antes de gerar novamente', severity: 'warning' });
      } else {
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: '900px', md: '1000px', lg: '1100px' },
        mx: 'auto',
        px: { xs: 3, sm: 4, md: 5 },
        py: { xs: 4, sm: 5, md: 6 },
      }}
    >
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: theme.palette.text.primary,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
              }}
            >
              Novo Termo de Recebimento Provisório
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1rem',
                maxWidth: '600px',
                mx: 'auto',
              }}
            >
              Preencha os dados abaixo para gerar um novo TRP com assistência da nossa IA.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => navigate('/agents/trp/historico')}
            sx={{
              textTransform: 'none',
              minWidth: 'auto',
            }}
          >
            Histórico
          </Button>
        </Box>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4.5, mb: 4 }}>
        <TrpUploadCard
          fichaContratualizacaoFile={fichaContratualizacaoFile}
          notaFiscalFile={notaFiscalFile}
          ordemFornecimentoFile={ordemFornecimentoFile}
          onFichaContratualizacaoChange={setFichaContratualizacaoFile}
          onNotaFiscalChange={setNotaFiscalFile}
          onOrdemFornecimentoChange={setOrdemFornecimentoFile}
          disabled={isLoading}
        />
        <TrpFormCard
          value={form}
          onChange={(next) => setForm(() => next)}
          disabled={isLoading}
        />
      </Box>

      <TrpActionsBar
        onExecute={handleGenerateTrp}
        onReset={handleReset}
        isExecuting={isLoading}
        canExecute={canExecute}
      />

      {/* Histórico de TRPs */}
      {!isLoading && !historyLoading && historyItems.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <TrpHistoryCard
            items={historyItems}
            onView={(id) => {
              navigate(`/agents/trp/resultado/${id}`);
            }}
            onDownloadPdf={(id) => handleDownload(id, 'pdf')}
            onDownloadDocx={(id) => handleDownload(id, 'docx')}
          />
        </Box>
      )}

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

