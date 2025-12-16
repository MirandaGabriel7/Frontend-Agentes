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
import { TrpInputForm, TrpAgentOutput, TrpCamposNormalizados } from '../../../lib/types/trp';
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

    // Condição de quantidade NF obrigatória
    if (!form.condicao_quantidade_nf) {
      return 'O campo "Quantidade conforme Nota Fiscal" é obrigatório.';
    }

    // Comentários obrigatórios quando PARCIAL na NF
    if (form.condicao_quantidade_nf === 'PARCIAL' && !form.comentarios_quantidade_nf) {
      return 'O campo "Comentários sobre divergência/pendências" é obrigatório quando a quantidade conforme Nota Fiscal é PARCIAL.';
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
        condicaoQuantidadeNF: form.condicao_quantidade_nf!,
        // Assinaturas serão preenchidas automaticamente pelo sistema
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

      if (form.condicao_quantidade_nf === 'PARCIAL' && form.comentarios_quantidade_nf) {
        payload.comentariosQuantidadeNF = form.comentarios_quantidade_nf;
      }

      if (form.observacoes_recebimento) {
        payload.observacoesRecebimento = form.observacoes_recebimento;
      }

      // Nota: Assinaturas (fiscalContratoNome, dataAssinatura, areaDemandanteNome) 
      // serão preenchidas automaticamente pelo sistema a partir dos documentos

      // ✅ Usa generateTrp do services/api.ts (usa api instance com proxy)
      // Nota: Assinaturas serão preenchidas automaticamente pelo sistema
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
          condicaoQuantidadeNF: payload.condicaoQuantidadeNF,
          comentariosQuantidadeNF: payload.comentariosQuantidadeNF || null,
          observacoesRecebimento: payload.observacoesRecebimento || null,
          // Assinaturas serão preenchidas automaticamente pelo sistema a partir dos documentos
        },
        files: {
          fichaContratualizacao: fichaContratualizacaoFile,
          notaFiscal: notaFiscalFile,
          ordemFornecimento: ordemFornecimentoFile,
        },
      });

      // ✅ generateTrp já retorna apenas o data (sem wrapper)
      // generateTrp já mapeou documento_markdown_final -> documento_markdown
      // e campos_trp_normalizados -> campos
      
      // Debug detalhado (apenas em dev)
      const isDev = (import.meta.env?.MODE === 'development') || (import.meta.env?.DEV === true);
      if (isDev) {
        console.debug('[TrpPage] Resultado do generateTrp:', {
          documentoMarkdownLength: result.documento_markdown?.length,
          documentoMarkdownPreview: result.documento_markdown?.substring(0, 200),
          camposKeys: Object.keys(result.campos),
          camposCriticos: {
            vencimento_nf: result.campos?.vencimento_nf,
            data_entrega: result.campos?.data_entrega,
            condicao_prazo: result.campos?.condicao_prazo,
            condicao_quantidade: result.campos?.condicao_quantidade,
            observacoes: result.campos?.observacoes,
          },
          todosOsCampos: result.campos,
        });
      }
      
      // Salvar resultado e navegar para página de resultado
      const fileName = fichaContratualizacaoFile?.name || 
                      notaFiscalFile?.name || 
                      ordemFornecimentoFile?.name || 
                      'TRP_Gerado.pdf';
      
      // Criar um run para salvar o resultado
      const run = await createTrpRun(form);
      
      // Preparar o output com os dados reais do backend
      // result.documento_markdown já contém documento_markdown_final (mapeado em generateTrp)
      // result.campos já contém campos_trp_normalizados (mapeado em generateTrp)
      const trpOutput: TrpAgentOutput = {
        documento_markdown: result.documento_markdown || '',
        campos: (result.campos || {}) as TrpCamposNormalizados,
        meta: {
          fileName: fileName,
          hash_tdr: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      };
      
      // Salvar o output diretamente no localStorage de forma robusta
      try {
        const stored = localStorage.getItem('trp_runs');
        let runs: any[] = [];
        
        if (stored) {
          try {
            runs = JSON.parse(stored);
          } catch (parseError) {
            console.warn('[TrpPage] Erro ao fazer parse do localStorage, criando novo array:', parseError);
            runs = [];
          }
        }
        
        // Buscar o run no array
        const runIndex = runs.findIndex((r: any) => r.id === run.id);
        
        if (runIndex !== -1) {
          // Atualizar run existente
          runs[runIndex].output = trpOutput;
          runs[runIndex].status = 'COMPLETED';
        } else {
          // Se não encontrou, adicionar o output ao run e adicionar ao array
          run.output = trpOutput;
          run.status = 'COMPLETED';
          runs.push(run);
        }
        
        // Salvar no localStorage
        localStorage.setItem('trp_runs', JSON.stringify(runs));
        
        // Debug: verificar o que foi salvo
        if (isDev) {
          console.debug('[TrpPage] Dados salvos no localStorage:', {
            runId: run.id,
            runIndex: runIndex !== -1 ? runIndex : 'novo',
            output: trpOutput,
            camposSalvos: trpOutput.campos,
            documentoMarkdownLength: trpOutput.documento_markdown?.length,
            totalRuns: runs.length,
          });
        }
      } catch (storageError) {
        console.error('[TrpPage] Erro ao salvar no localStorage:', storageError);
        // Continuar mesmo com erro, pois o run já foi criado
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
              contractNumber: run.output.campos?.numero_contrato || undefined,
              invoiceNumber: run.output.campos?.numero_nf || undefined,
              status: 'completed',
              createdAt: run.createdAt,
              totalValue: run.output.campos?.valor_efetivo_numero || undefined,
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

