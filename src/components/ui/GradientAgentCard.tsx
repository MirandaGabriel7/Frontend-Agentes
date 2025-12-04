import React, { useRef, useState } from 'react';
import { Box, Typography, Button, Chip, alpha, useTheme, Paper } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface GradientAgentCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  status: string;
  statusColor: 'success' | 'warning';
  onClick: () => void;
  glowColor?: string;
  averageTime?: string;
}

export const GradientAgentCard: React.FC<GradientAgentCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  status,
  statusColor,
  onClick,
  glowColor = '#4e63ff',
  averageTime = 'Média de 3–5 minutos por documento.',
}) => {
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = -(y / rect.height) * 5;
      const rotateY = (x / rect.width) * 5;
      setRotation({ x: rotateX, y: rotateY });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <Paper
      ref={cardRef}
      elevation={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      sx={{
        position: 'relative',
        borderRadius: '32px',
        overflow: 'hidden',
        width: '100%',
        minHeight: { xs: '380px', md: '400px' },
        backgroundColor: theme.palette.background.paper,
        boxShadow: isHovered
          ? `0 -10px 100px 10px ${alpha(glowColor, 0.15)}, 0 0 10px 0 ${alpha('#000', 0.05)}`
          : `0 -10px 100px 10px ${alpha(glowColor, 0.1)}, 0 0 10px 0 ${alpha('#000', 0.03)}`,
        transform: `translateY(${isHovered ? -5 : 0}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
      }}
    >
      {/* Glass reflection overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 35,
          pointerEvents: 'none',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.1) 100%)',
          backdropFilter: 'blur(2px)',
          opacity: isHovered ? 0.7 : 0.5,
          transition: 'opacity 0.4s ease-out',
        }}
      />

      {/* Light background gradient */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.95)} 70%)`,
        }}
      />

      {/* Noise texture overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.15,
          mixBlendMode: 'overlay',
          zIndex: 10,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Purple/blue glow effect */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '66%',
          zIndex: 20,
          background: `
            radial-gradient(ellipse at bottom right, ${alpha('#ac5cff', 0.3)} -10%, ${alpha('#4f46e5', 0)} 70%),
            radial-gradient(ellipse at bottom left, ${alpha('#38bdf8', 0.3)} -10%, ${alpha('#4f46e5', 0)} 70%)
          `,
          filter: 'blur(40px)',
          opacity: isHovered ? 0.9 : 0.7,
          transition: 'opacity 0.4s ease-out',
        }}
      />

      {/* Central purple glow */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '66%',
          zIndex: 21,
          background: `radial-gradient(circle at bottom center, ${alpha('#a13ae5', 0.3)} -20%, ${alpha('#4f46e5', 0)} 60%)`,
          filter: 'blur(45px)',
          opacity: isHovered ? 0.85 : 0.65,
          transition: 'opacity 0.4s ease-out',
        }}
      />

      {/* Bottom border glow */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          zIndex: 25,
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.1) 100%)',
          boxShadow: isHovered
            ? `0 0 20px 4px ${alpha('#ac5cff', 0.4)}, 0 0 30px 6px ${alpha('#8a3ab9', 0.3)}, 0 0 40px 8px ${alpha('#38bdf8', 0.2)}`
            : `0 0 15px 3px ${alpha('#ac5cff', 0.3)}, 0 0 25px 5px ${alpha('#8a3ab9', 0.2)}, 0 0 35px 7px ${alpha('#38bdf8', 0.15)}`,
          opacity: isHovered ? 1 : 0.8,
          transition: 'all 0.4s ease-out',
        }}
      />

      {/* Card content */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          p: { xs: 3, md: 3.5 },
          zIndex: 40,
        }}
      >
        {/* Header: Icon + Title + Status */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              mb: 2.5,
            }}
          >
            {/* Left: Icon + Title + Subtitle */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transform: isHovered ? `translateY(-2px) rotateX(${-rotation.x * 0.5}deg) rotateY(${-rotation.y * 0.5}deg)` : 'translateY(0)',
                  transition: 'all 0.4s ease-out',
                  '& svg': {
                    fontSize: { xs: 40, md: 44 },
                    color: theme.palette.text.primary,
                  },
                }}
              >
                {icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    mb: 0.75,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    fontSize: { xs: '1.125rem', md: '1.25rem' },
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: glowColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    opacity: 0.9,
                  }}
                >
                  {subtitle}
                </Typography>
              </Box>
            </Box>

            {/* Right: Status Chip */}
            <Chip
              label={status}
              size="small"
              icon={
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main,
                  }}
                />
              }
              sx={{
                bgcolor: alpha(statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main, 0.1),
                border: `1px solid ${alpha(statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main, 0.2)}`,
                color: statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main,
                fontSize: '0.6875rem',
                fontWeight: 600,
                height: 24,
                px: 1,
                borderRadius: '999px',
                '& .MuiChip-icon': {
                  marginLeft: '6px',
                  marginRight: '-4px',
                },
              }}
            />
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.65,
              fontWeight: 400,
              fontSize: '0.875rem',
              opacity: 0.85,
            }}
          >
            {description}
          </Typography>
        </Box>

        {/* Actions / CTA area */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 3,
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            size="small"
            onClick={onClick}
            endIcon={
              <ArrowForwardIosIcon
                sx={{
                  fontSize: 14,
                  transition: 'transform 0.3s ease-out',
                  transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                }}
              />
            }
            sx={{
              bgcolor: glowColor,
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 2.5,
              py: 1,
              borderRadius: 2,
              boxShadow: `0 4px 12px ${alpha(glowColor, 0.3)}`,
              '&:hover': {
                bgcolor: glowColor,
                boxShadow: `0 6px 16px ${alpha(glowColor, 0.4)}`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-out',
            }}
          >
            Iniciar análise
          </Button>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.6875rem',
              whiteSpace: 'nowrap',
              opacity: 0.7,
            }}
          >
            {averageTime}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

