import React, { useEffect, useRef, ReactNode } from 'react';
import { Box, BoxProps, alpha, useTheme } from '@mui/material';

interface GlowCardProps extends BoxProps {
  children: ReactNode;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  customSize?: boolean;
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  glowColor = 'blue',
  size = 'md',
  customSize = false,
  sx,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;

      if (cardRef.current) {
        cardRef.current.style.setProperty('--x', x.toFixed(2));
        cardRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
        cardRef.current.style.setProperty('--y', y.toFixed(2));
        cardRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
      }
    };

    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const sizeStyles = !customSize
    ? {
        sm: { width: '192px', height: '256px' },
        md: { width: '256px', height: '320px' },
        lg: { width: '320px', height: '384px' },
      }[size]
    : {};

  return (
    <>
      <style>
        {`
          [data-glow]::before,
          [data-glow]::after {
            pointer-events: none;
            content: "";
            position: absolute;
            inset: 0;
            border: var(--border-size) solid transparent;
            border-radius: inherit;
            background-attachment: fixed;
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-position: 50% 50%;
            mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
            mask-clip: padding-box, border-box;
            mask-composite: intersect;
            -webkit-mask-composite: source-in;
          }
          
          [data-glow]::before {
            background-image: radial-gradient(
              calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
              calc(var(--x, 0) * 1px)
              calc(var(--y, 0) * 1px),
              hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
            );
            filter: brightness(2);
          }
          
          [data-glow]::after {
            background-image: radial-gradient(
              calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
              calc(var(--x, 0) * 1px)
              calc(var(--y, 0) * 1px),
              hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
            );
          }
          
          [data-glow] > [data-glow-inner] {
            position: absolute;
            inset: 0;
            will-change: filter;
            opacity: var(--outer, 1);
            border-radius: inherit;
            border-width: calc(var(--border-size) * 20);
            filter: blur(calc(var(--border-size) * 10));
            background: none;
            pointer-events: none;
            border: none;
          }
        `}
      </style>
      <Box
        ref={cardRef}
        data-glow
        {...props}
        sx={{
          position: 'relative',
          borderRadius: 3.5,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backdropFilter: 'blur(5px)',
          touchAction: 'none',
          overflow: 'hidden',
          '--base': base,
          '--spread': spread,
          '--radius': '14',
          '--border': '2',
          '--backdrop': alpha(theme.palette.text.primary, 0.12),
          '--backup-border': alpha(theme.palette.text.primary, 0.12),
          '--size': '200',
          '--outer': '1',
          '--border-size': 'calc(var(--border, 2) * 1px)',
          '--spotlight-size': 'calc(var(--size, 150) * 1px)',
          '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
          '--saturation': '100',
          '--lightness': '70',
          '--bg-spot-opacity': '0.1',
          '--border-spot-opacity': '0.8',
          '--border-light-opacity': '0.6',
          backgroundImage: `radial-gradient(
            var(--spotlight-size) var(--spotlight-size) at
            calc(var(--x, 0) * 1px)
            calc(var(--y, 0) * 1px),
            hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
          )`,
          backgroundColor: 'var(--backdrop, transparent)',
          backgroundSize: '100% 100%',
          backgroundPosition: '50% 50%',
          backgroundAttachment: 'fixed',
          border: 'var(--border-size) solid var(--backup-border)',
          boxShadow: `0 1rem 2rem -1rem ${alpha('#000', 0.3)}`,
          ...sizeStyles,
          ...sx,
        }}
      >
        <Box ref={innerRef} data-glow-inner />
        {children}
      </Box>
    </>
  );
};

