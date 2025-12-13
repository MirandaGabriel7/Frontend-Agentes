import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  alpha,
  useTheme,
  Button,
  Paper,
} from '@mui/material';
import { TrpUploadCard } from '../components/TrpUploadCard';
import { TrpFormCard } from '../components/TrpFormCard';
import { TrpActionsBar } from '../components/TrpActionsBar';
import { TrpResultPanel } from '../components/TrpResultPanel';
import { TrpHistoryCard, TrpHistoryItem } from '../components/TrpHistoryCard';
import { TrpInputForm } from '../../../lib/types/trp';
import { generateTrp } from '../../../services/api';
import type { DadosRecebimentoPayload } from '../../../types/trp';
import { createTrpRun } from '../../../lib/services/trpService';

export const TrpPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Estados dos arquivos
  const [fichaContratualizacaoFile, setFichaContratualizacaoFile] = useState<File | null>(null);
  const [notaFiscalFile, setNotaFiscalFile] = useState<File | null>(null);
  const [ordemFornecimentoFile, setOrdemFornecimentoFile] = useState<File | null>(null);

  // Estados do formulário
  const [form, setForm] = useState<TrpInputForm>({
    tipo_contratacao: undefined,
    data_recebimento_nf_real: '',
    tipo_base_prazo: undefined,
    condicao_prazo: undefined,
    condicao_quantidade: undefined,
    competencia_mes_ano: undefined,
    observacoes_recebimento: '',
    detalhe_pendencias: '',
    arquivoTdrNome: '',
  });

  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canExecute = Boolean(
    (fichaContratualizacaoFile || notaFiscalFile || ordemFornecimentoFile) &&
    form.data_recebimento_nf_real &&
    form.tipo_contratacao // Campo obrigatório
  );

  const handleGenerateTrp = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Mapear campos do formulário para o payload da API
      const payload: DadosRecebimentoPayload = {
        tipoContratacao: form.tipo_contratacao || undefined,
        dataRecebimento: form.data_recebimento_nf_real || '',
        tipoBasePrazo: (form.tipo_base_prazo || 'NF') as 'NF' | 'SERVICO',
        condicaoPrazo: (form.condicao_prazo || 'NO_PRAZO') as 'NO_PRAZO' | 'FORA_DO_PRAZO' | 'NAO_SE_APLICA',
        condicaoQuantidade: (form.condicao_quantidade || 'TOTAL') as 'TOTAL' | 'PARCIAL',
        competenciaMesAno: form.competencia_mes_ano || undefined, // Só será enviado se tipo_contratacao == "SERVIÇOS"
        dataPrevistaEntregaContrato: form.data_prevista_entrega_contrato || undefined,
        dataEntregaReal: form.data_entrega_real || undefined,
        motivoAtraso: form.motivo_atraso || undefined,
        detalhePendencias: form.detalhe_pendencias || undefined,
        observacoesRecebimento: form.observacoes_recebimento || undefined,
      };

      // Remover campos opcionais vazios
      if (!payload.tipoContratacao) delete payload.tipoContratacao;
      if (!payload.competenciaMesAno) delete payload.competenciaMesAno;
      if (!payload.dataPrevistaEntregaContrato) delete payload.dataPrevistaEntregaContrato;
      if (!payload.dataEntregaReal) delete payload.dataEntregaReal;
      if (!payload.motivoAtraso) delete payload.motivoAtraso;
      if (!payload.detalhePendencias) delete payload.detalhePendencias;
      if (!payload.observacoesRecebimento) delete payload.observacoesRecebimento;

      // ✅ Usa generateTrp do services/api.ts (usa api instance com proxy)
      const result = await generateTrp({
        dadosRecebimento: {
          dataRecebimento: payload.dataRecebimento,
          condicaoPrazo: payload.condicaoPrazo,
          condicaoQuantidade: payload.condicaoQuantidade,
          observacoesRecebimento: payload.observacoesRecebimento || null,
          tipoBasePrazo: payload.tipoBasePrazo,
          tipoContratacao: payload.tipoContratacao || null,
          competenciaMesAno: payload.competenciaMesAno || null,
          dataPrevistaEntregaContrato: payload.dataPrevistaEntregaContrato || null,
          dataEntregaReal: payload.dataEntregaReal || null,
          motivoAtraso: payload.motivoAtraso || null,
          detalhePendencias: payload.detalhePendencias || null,
        },
        files: {
          fichaContratualizacao: fichaContratualizacaoFile,
          notaFiscal: notaFiscalFile,
          ordemFornecimento: ordemFornecimentoFile,
        },
      });

      // ✅ generateTrp já retorna apenas o data (sem wrapper)
      // Salvar resultado e navegar para página de resultado
      const fileName = fichaContratualizacaoFile?.name || 
                      notaFiscalFile?.name || 
                      ordemFornecimentoFile?.name || 
                      'TRP_Gerado.pdf';
      
      // Criar um run para salvar o resultado
      const run = await createTrpRun(form);
      
      // Preparar o output com os dados reais do backend
      const trpOutput = {
        documento_markdown_final: result.documento_markdown_final,
        documento_markdown_prime: result.documento_markdown_prime || result.documento_markdown_final,
        campos_trp_normalizados: result.campos_trp_normalizados as any,
        meta: {
          fileName: fileName,
          hash_tdr: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      };
      
      // Salvar o output diretamente no localStorage
      const stored = localStorage.getItem('trp_runs');
      if (stored) {
        const runs = JSON.parse(stored);
        const runIndex = runs.findIndex((r: any) => r.id === run.id);
        if (runIndex !== -1) {
          runs[runIndex].output = trpOutput;
          runs[runIndex].status = 'COMPLETED';
          localStorage.setItem('trp_runs', JSON.stringify(runs));
        }
      }
      
      // Navegar para a página de resultado
      navigate(`/agents/trp/resultado/${run.id}`);
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
      data_recebimento_nf_real: '',
      tipo_base_prazo: undefined,
      condicao_prazo: undefined,
      condicao_quantidade: undefined,
      competencia_mes_ano: undefined,
      observacoes_recebimento: '',
      detalhe_pendencias: '',
      arquivoTdrNome: '',
    });
    setErrorMessage(null);
  };

  /**
   * Retorna os itens do histórico
   * Busca do serviço de TRPs salvos
   */
  const getHistoryItems = (): TrpHistoryItem[] => {
    const items: TrpHistoryItem[] = [];

    // Buscar TRPs salvos do localStorage
    try {
      const stored = localStorage.getItem('trp_runs');
      if (stored) {
        const runs = JSON.parse(stored);
        const completedRuns = runs
          .filter((run: any) => run.status === 'COMPLETED' && run.output)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5); // Limitar a 5 itens mais recentes
        
        completedRuns.forEach((run: any) => {
          if (run.output) {
            items.push({
              id: run.id,
              fileName: run.output.meta?.fileName || 'TRP_Gerado.pdf',
              contractNumber: run.output.campos_trp_normalizados?.numero_contrato || undefined,
              invoiceNumber: run.output.campos_trp_normalizados?.numero_nf || undefined,
              status: 'completed',
              createdAt: run.createdAt,
              totalValue: run.output.campos_trp_normalizados?.valor_efetivo_numero || undefined,
            });
          }
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar histórico de TRPs:', err);
    }

    // Se não houver itens, adiciona itens mockados para demonstração
    if (items.length === 0) {
      items.push(
        {
          id: 'mock-1',
          fileName: 'TRP_Contrato_12345.pdf',
          contractNumber: '12345/2024',
          invoiceNumber: 'NF-001234',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          totalValue: 125000.50,
        },
        {
          id: 'mock-2',
          fileName: 'TRP_Obra_11B.pdf',
          contractNumber: '11B/2024',
          invoiceNumber: 'NF-005678',
          status: 'completed',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
          totalValue: 85000.00,
        }
      );
    }

    return items;
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
      {!isLoading && (
        <Box sx={{ mt: 6 }}>
          <TrpHistoryCard
            items={getHistoryItems()}
            onView={(id) => {
              navigate(`/agents/trp/resultado/${id}`);
            }}
            onDownload={(id) => {
              // TODO: Implementar download
              console.log('Baixar TRP:', id);
            }}
          />
        </Box>
      )}
    </Box>
  );
};

