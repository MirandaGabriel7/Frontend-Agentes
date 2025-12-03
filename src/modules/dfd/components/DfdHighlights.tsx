import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { DfdDestaques } from '../../../lib/types/dfdResult';

interface DfdHighlightsProps {
  destaques: DfdDestaques;
}

export const DfdHighlights: React.FC<DfdHighlightsProps> = ({ destaques }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        background: theme.palette.background.paper,
        boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 8px 24px ${alpha('#000', 0.04)}`,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: { xs: 3, sm: 4 },
          py: 3,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            letterSpacing: '-0.01em',
          }}
        >
          Destaques da análise
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          px: { xs: 2, sm: 3 },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
          },
        }}
      >
        <Tab label={`Pontos positivos (${destaques.pontos_positivos.length})`} />
        <Tab label={`Pontos de atenção (${destaques.pontos_de_atencao.length})`} />
        <Tab label={`Riscos relevantes (${destaques.riscos_relevantes.length})`} />
      </Tabs>

      <Box sx={{ p: { xs: 3, sm: 4 } }}>
        {activeTab === 0 && (
          <List sx={{ p: 0 }}>
            {destaques.pontos_positivos.map((ponto, index) => (
              <ListItem key={index} sx={{ px: 0, py: 1.5, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={ponto}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: {
                      lineHeight: 1.7,
                      color: theme.palette.text.primary,
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {activeTab === 1 && (
          <List sx={{ p: 0 }}>
            {destaques.pontos_de_atencao.map((ponto, index) => (
              <ListItem key={index} sx={{ px: 0, py: 1.5, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={ponto}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: {
                      lineHeight: 1.7,
                      color: theme.palette.text.primary,
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {activeTab === 2 && (
          <List sx={{ p: 0 }}>
            {destaques.riscos_relevantes.map((risco, index) => (
              <ListItem key={index} sx={{ px: 0, py: 1.5, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={risco}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: {
                      lineHeight: 1.7,
                      color: theme.palette.text.primary,
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

