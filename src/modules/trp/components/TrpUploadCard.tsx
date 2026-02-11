import React, { useRef, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeleteIcon from '@mui/icons-material/Delete';

interface TrpUploadCardProps {
  fichaContratualizacaoFile: File | null;
  notaFiscalFile: File | null;
  ordemFornecimentoFile: File | null;
  onFichaContratualizacaoChange: (file: File | null) => void;
  onNotaFiscalChange: (file: File | null) => void;
  onOrdemFornecimentoChange: (file: File | null) => void;
  disabled?: boolean;
}

export const TrpUploadCard: React.FC<TrpUploadCardProps> = ({
  fichaContratualizacaoFile,
  notaFiscalFile,
  ordemFornecimentoFile,
  onFichaContratualizacaoChange,
  onNotaFiscalChange,
  onOrdemFornecimentoChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const fichaInputRef = useRef<HTMLInputElement>(null);
  const notaFiscalInputRef = useRef<HTMLInputElement>(null);
  const ordemFornecimentoInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<{
    ficha?: string;
    notaFiscal?: string;
    ordemFornecimento?: string;
  }>({});

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Apenas arquivos PDF são permitidos';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'O arquivo deve ter no máximo 10MB';
    }
    return null;
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'ficha' | 'notaFiscal' | 'ordemFornecimento'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors((prev) => ({ ...prev, [type]: error }));
      return;
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[type];
      return newErrors;
    });

    if (type === 'ficha') {
      onFichaContratualizacaoChange(file);
    } else if (type === 'notaFiscal') {
      onNotaFiscalChange(file);
    } else {
      onOrdemFornecimentoChange(file);
    }
  };

  const handleRemove = (type: 'ficha' | 'notaFiscal' | 'ordemFornecimento') => {
    if (type === 'ficha') {
      if (fichaInputRef.current) fichaInputRef.current.value = '';
      onFichaContratualizacaoChange(null);
    } else if (type === 'notaFiscal') {
      if (notaFiscalInputRef.current) notaFiscalInputRef.current.value = '';
      onNotaFiscalChange(null);
    } else {
      if (ordemFornecimentoInputRef.current) ordemFornecimentoInputRef.current.value = '';
      onOrdemFornecimentoChange(null);
    }
  };

  const renderFileUpload = (
    type: 'ficha' | 'notaFiscal' | 'ordemFornecimento',
    label: string,
    description: string,
    file: File | null,
    inputRef: React.RefObject<HTMLInputElement | null>,
    error?: string
  ) => {
    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    return (
      <Box>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ mb: 1, color: theme.palette.text.primary }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 2, color: theme.palette.text.secondary, fontSize: '0.8125rem' }}
        >
          {description}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileChange(e, type)}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        {!file ? (
          <Box
            onClick={handleClick}
            sx={{
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
              borderRadius: 3,
              p: 3,
              textAlign: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              opacity: disabled ? 0.6 : 1,
              '&:hover': disabled
                ? {}
                : {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    transform: 'translateY(-2px)',
                  },
            }}
          >
            <UploadFileIcon
              sx={{
                fontSize: 32,
                color: theme.palette.primary.main,
                mb: 1,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.875rem',
              }}
            >
              Clique para selecionar PDF
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              borderRadius: 3,
              p: 2.5,
              bgcolor: alpha(theme.palette.success.main, 0.04),
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 24 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => handleRemove(type)}
              disabled={disabled}
              startIcon={<DeleteIcon />}
              sx={{ textTransform: 'none', minWidth: 'auto' }}
            >
              Remover
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 5,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 4px 16px ${alpha('#000', 0.06)}`,
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 3,
          color: theme.palette.text.primary,
          fontSize: '1.25rem',
        }}
      >
        1. Upload de Documentos
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          mb: 4,
          p: 2.5,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.info.main, 0.06),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        }}
      >
        <InfoOutlinedIcon
          sx={{
            color: theme.palette.info.main,
            fontSize: 22,
            mt: 0.25,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.primary,
            fontSize: '0.875rem',
            lineHeight: 1.6,
          }}
        >
          <strong>Importante:</strong> Envie os três documentos em PDF separadamente. Todos os arquivos são opcionais, mas recomendamos enviar pelo menos um deles para melhor análise.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          {renderFileUpload(
            'ficha',
            'Ficha de Contratualização',
            'PDF da ficha de contratualização (opcional)',
            fichaContratualizacaoFile,
            fichaInputRef,
            errors.ficha
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          {renderFileUpload(
            'notaFiscal',
            'Nota Fiscal',
            'PDF da nota fiscal (opcional)',
            notaFiscalFile,
            notaFiscalInputRef,
            errors.notaFiscal
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          {renderFileUpload(
            'ordemFornecimento',
            'Ordem de Fornecimento',
            'PDF da ordem de fornecimento (opcional)',
            ordemFornecimentoFile,
            ordemFornecimentoInputRef,
            errors.ordemFornecimento
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};
