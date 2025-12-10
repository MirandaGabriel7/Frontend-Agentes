import React from 'react';
import {
  Box,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { LoadingOverlay } from '../../../components/ui/LoadingOverlay';

interface TrpActionsBarProps {
  onExecute: () => void;
  onReset: () => void;
  isExecuting: boolean;
  canExecute: boolean;
}

export const TrpActionsBar: React.FC<TrpActionsBarProps> = ({
  onExecute,
  onReset,
  isExecuting,
  canExecute,
}) => {
  const theme = useTheme();

  return (
    <>
      {isExecuting && <LoadingOverlay />}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, mt: 6 }}>
        {!isExecuting && (
          <>
            <Button
              variant="contained"
              size="large"
              startIcon={<PsychologyIcon sx={{ fontSize: 24 }} />}
              onClick={onExecute}
              disabled={!canExecute}
              sx={{
                py: 2.5,
                px: 6,
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                letterSpacing: '0.01em',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Gerar Termo
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<DeleteSweepIcon />}
              onClick={onReset}
              sx={{
                py: 2.5,
                px: 5,
                borderRadius: 2.5,
                fontWeight: 600,
                fontSize: '0.9375rem',
                textTransform: 'none',
                borderColor: alpha(theme.palette.divider, 0.3),
                color: theme.palette.text.secondary,
                bgcolor: 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.05),
                  borderColor: alpha(theme.palette.divider, 0.4),
                },
                transition: 'all 0.2s ease',
              }}
            >
              Limpar Campos
            </Button>
          </>
        )}
      </Box>
    </>
  );
};

