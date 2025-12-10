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
import { generateTrpDocument } from '../../../api/trp';
import type { DadosRecebimentoPayload, TrpApiResponse } from '../../../types/trp';
import { TrpMarkdownView } from '../components/TrpMarkdownView';

export const TrpPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Estados dos arquivos
  const [fichaContratualizacaoFile, setFichaContratualizacaoFile] = useState<File | null>(null);
  const [notaFiscalFile, setNotaFiscalFile] = useState<File | null>(null);
  const [ordemFornecimentoFile, setOrdemFornecimentoFile] = useState<File | null>(null);

  // Estados do formulário
  const [form, setForm] = useState<TrpInputForm>({
    data_recebimento_nf_real: '',
    tipo_base_prazo: undefined,
    condicao_prazo: undefined,
    condicao_quantidade: undefined,
    observacoes_recebimento: '',
    detalhe_pendencias: '',
    arquivoTdrNome: '',
  });

  // Estados de resultado e controle
  const [trpMarkdown, setTrpMarkdown] = useState<string | null>(null);
  const [trpCampos, setTrpCampos] = useState<TrpApiResponse['campos_trp_normalizados'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canExecute = Boolean(
    (fichaContratualizacaoFile || notaFiscalFile || ordemFornecimentoFile) &&
    form.data_recebimento_nf_real
  );

  const handleGenerateTrp = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Mapear campos do formulário para o payload da API
      const payload: DadosRecebimentoPayload = {
        dataRecebimento: form.data_recebimento_nf_real || '',
        tipoBasePrazo: (form.tipo_base_prazo || 'NF') as 'NF' | 'SERVICO',
        condicaoPrazo: (form.condicao_prazo || 'NO_PRAZO') as 'NO_PRAZO' | 'FORA_DO_PRAZO' | 'NAO_SE_APLICA',
        condicaoQuantidade: (form.condicao_quantidade || 'TOTAL') as 'TOTAL' | 'PARCIAL',
        dataPrevistaEntregaContrato: form.data_prevista_entrega_contrato || undefined,
        dataEntregaReal: form.data_entrega_real || undefined,
        motivoAtraso: form.motivo_atraso || undefined,
        detalhePendencias: form.detalhe_pendencias || undefined,
        observacoesRecebimento: form.observacoes_recebimento || undefined,
      };

      // Remover campos opcionais vazios
      if (!payload.dataPrevistaEntregaContrato) delete payload.dataPrevistaEntregaContrato;
      if (!payload.dataEntregaReal) delete payload.dataEntregaReal;
      if (!payload.motivoAtraso) delete payload.motivoAtraso;
      if (!payload.detalhePendencias) delete payload.detalhePendencias;
      if (!payload.observacoesRecebimento) delete payload.observacoesRecebimento;

      const response = await generateTrpDocument(payload, {
        fichaContratualizacaoFile,
        notaFiscalFile,
        ordemFornecimentoFile,
      });

      setTrpMarkdown(response.documento_markdown_final);
      setTrpCampos(response.campos_trp_normalizados);
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
      data_recebimento_nf_real: '',
      tipo_base_prazo: undefined,
      condicao_prazo: undefined,
      condicao_quantidade: undefined,
      observacoes_recebimento: '',
      detalhe_pendencias: '',
      arquivoTdrNome: '',
    });
    setTrpMarkdown(null);
    setTrpCampos(null);
    setErrorMessage(null);
  };

  /**
   * Retorna os itens do histórico
   * Busca do serviço e adiciona o resultado atual se existir
   */
  const getHistoryItems = (): TrpHistoryItem[] => {
    const items: TrpHistoryItem[] = [];

    // Adiciona o resultado atual se existir
    if (trpMarkdown && trpCampos) {
      const fileName = fichaContratualizacaoFile?.name || 
                      notaFiscalFile?.name || 
                      ordemFornecimentoFile?.name || 
                      'TRP_Gerado.pdf';
      items.push({
        id: `current-${Date.now()}`,
        fileName: fileName,
        contractNumber: trpCampos.numero_contrato || undefined,
        invoiceNumber: trpCampos.numero_nf || undefined,
        status: 'completed',
        createdAt: new Date().toISOString(),
        totalValue: trpCampos.valor_efetivo_numero || undefined,
      });
    }

    // Adiciona outros TRPs do histórico (do serviço)
    // TODO: Integrar com API real para buscar todos os TRPs
    // Por enquanto, adiciona itens mockados apenas se não houver resultado atual
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

      {/* Seção de Resultado */}
      {trpMarkdown ? (
        <Box sx={{ mt: 6 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              background: theme.palette.background.paper,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 3,
                  color: theme.palette.text.primary,
                }}
              >
                3. Resultado da Geração
              </Typography>

              {/* Preview do Markdown */}
              <Box sx={{ mb: 4 }}>
                <TrpMarkdownView content={trpMarkdown} showTitle={false} />
              </Box>

              {/* Resumo dos Dados Normalizados */}
              {trpCampos && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: theme.palette.text.primary,
                      fontSize: '1.125rem',
                    }}
                  >
                    Resumo dos Dados Normalizados
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                      gap: 2,
                    }}
                  >
                    {trpCampos.numero_contrato && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Número do Contrato
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {trpCampos.numero_contrato}
                        </Typography>
                      </Box>
                    )}
                    {trpCampos.processo_licitatorio && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Processo Licitatório
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {trpCampos.processo_licitatorio}
                        </Typography>
                      </Box>
                    )}
                    {trpCampos.numero_nf && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Nota Fiscal
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {trpCampos.numero_nf}
                        </Typography>
                      </Box>
                    )}
                    {trpCampos.valor_efetivo_formatado && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Valor Efetivo
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {trpCampos.valor_efetivo_formatado}
                        </Typography>
                      </Box>
                    )}
                    {trpCampos.condicao_prazo && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Condição do Prazo
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {trpCampos.condicao_prazo}
                        </Typography>
                      </Box>
                    )}
                    {trpCampos.condicao_quantidade && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Condição da Quantidade
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {trpCampos.condicao_quantidade}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      ) : !isLoading && !errorMessage ? (
        <Box sx={{ mt: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              background: theme.palette.background.paper,
              textAlign: 'center',
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Nenhum Termo de Recebimento Provisório gerado ainda. Preencha os dados, anexe os documentos e clique em "Gerar Termo".
            </Typography>
          </Paper>
        </Box>
      ) : null}

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

