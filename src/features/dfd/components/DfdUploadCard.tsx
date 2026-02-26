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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface DfdUploadCardProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export const DfdUploadCard: React.FC<DfdUploadCardProps> = ({
  onFileSelect,
  selectedFile,
  disabled = false,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Apenas arquivos PDF são permitidos');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 10MB');
      return;
    }

    setError(null);
    onFileSelect(file);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
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
        1. Upload de Documento DFD
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          mb: 3,
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
          <strong>Importante:</strong> Envie o Documento de Formalização da Demanda (DFD) em formato PDF. O arquivo será processado apenas para análise automatizada.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      {!selectedFile ? (
        <Box
          onClick={handleClick}
          sx={{
            border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            borderRadius: 4,
            p: 6,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            opacity: disabled ? 0.6 : 1,
            '&:hover': {
              borderColor: disabled ? undefined : theme.palette.primary.main,
              bgcolor: disabled ? undefined : alpha(theme.palette.primary.main, 0.05),
              transform: disabled ? undefined : 'translateY(-2px)',
            },
          }}
        >
          <Box
            sx={{
              mx: 'auto',
              width: 80,
              height: 80,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              boxShadow: `0 0 0 8px ${alpha('#FFF', 1)}`,
            }}
          >
            <UploadFileIcon
              sx={{
                fontSize: 40,
                color: theme.palette.primary.main,
              }}
            />
          </Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: theme.palette.primary.main,
              mb: 1,
              fontSize: '1rem',
            }}
          >
            Clique para selecionar ou arraste o arquivo
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
            }}
          >
            Envie o DFD em PDF (até 10MB)
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            borderRadius: 3,
            p: 3.5,
            bgcolor: alpha(theme.palette.success.main, 0.04),
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
          }}
        >
          <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 32 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" fontWeight={600} mb={0.5}>
              {selectedFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                onFileSelect(null);
              }
            }}
            disabled={disabled}
            sx={{ textTransform: 'none' }}
          >
            Remover
          </Button>
        </Box>
      )}
    </Paper>
  );
};

