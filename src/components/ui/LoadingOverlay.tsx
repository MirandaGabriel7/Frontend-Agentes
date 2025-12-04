import React from 'react';
import { Box, Typography, alpha, useTheme, keyframes } from '@mui/material';

interface LoadingOverlayProps {
  message?: string;
}

const loaderCircle = keyframes`
  0% {
    transform: rotate(90deg);
    box-shadow:
      0 6px 12px 0 rgba(56, 189, 248, 0.6) inset,
      0 12px 18px 0 rgba(0, 93, 255, 0.5) inset,
      0 36px 36px 0 rgba(30, 64, 175, 0.4) inset,
      0 0 3px 1.2px rgba(56, 189, 248, 0.3),
      0 0 6px 1.8px rgba(0, 93, 255, 0.2);
  }
  50% {
    transform: rotate(270deg);
    box-shadow:
      0 6px 12px 0 rgba(96, 165, 250, 0.6) inset,
      0 12px 6px 0 rgba(2, 132, 199, 0.5) inset,
      0 24px 36px 0 rgba(0, 93, 255, 0.4) inset,
      0 0 3px 1.2px rgba(56, 189, 248, 0.3),
      0 0 6px 1.8px rgba(0, 93, 255, 0.2);
  }
  100% {
    transform: rotate(450deg);
    box-shadow:
      0 6px 12px 0 rgba(77, 200, 253, 0.6) inset,
      0 12px 18px 0 rgba(0, 93, 255, 0.5) inset,
      0 36px 36px 0 rgba(30, 64, 175, 0.4) inset,
      0 0 3px 1.2px rgba(56, 189, 248, 0.3),
      0 0 6px 1.8px rgba(0, 93, 255, 0.2);
  }
`;

const loaderLetter = keyframes`
  0%, 100% {
    opacity: 0.4;
    transform: translateY(0);
  }
  20% {
    opacity: 1;
    transform: scale(1.15);
  }
  40% {
    opacity: 0.7;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(250%);
  }
`;

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Aguarde... a Planco AI está analisando os documentos',
}) => {
  const theme = useTheme();
  const text = 'Gerando';
  const letters = text.split('');

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {/* Círculo animado com texto */}
        <Box
          sx={{
            position: 'relative',
            width: 180,
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
          }}
        >
          {/* Círculo animado */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              animation: `${loaderCircle} 5s linear infinite`,
            }}
          />
          
          {/* Letras animadas */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: theme.typography.fontFamily,
            }}
          >
            {letters.map((letter, index) => (
              <Box
                key={index}
                component="span"
                sx={{
                  display: 'inline-block',
                  color: theme.palette.text.primary,
                  opacity: 0.4,
                  animation: `${loaderLetter} 3s infinite`,
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {letter}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Mensagem */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            textAlign: 'center',
            maxWidth: 400,
            px: 3,
          }}
        >
          {message}
        </Typography>

        {/* Indicador de progresso sutil */}
        <Box
          sx={{
            width: 200,
            height: 4,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            overflow: 'hidden',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '40%',
              bgcolor: theme.palette.primary.main,
              borderRadius: 2,
              animation: `${shimmer} 1.5s ease-in-out infinite`,
            },
          }}
        />
      </Box>
    </Box>
  );
};

