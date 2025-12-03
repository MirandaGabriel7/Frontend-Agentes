import React, { useState, useMemo } from 'react';
import { Box, alpha, useTheme } from '@mui/material';

export interface DonutChartSegment {
  value: number;
  color: string;
  label: string;
  [key: string]: unknown;
}

interface DonutChartProps {
  data: DonutChartSegment[];
  totalValue?: number;
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
  highlightOnHover?: boolean;
  centerContent?: React.ReactNode;
  onSegmentHover?: (segment: DonutChartSegment | null) => void;
  sx?: object;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  totalValue: propTotalValue,
  size = 200,
  strokeWidth = 20,
  animationDuration = 1,
  highlightOnHover = true,
  centerContent,
  onSegmentHover,
  sx,
}) => {
  const theme = useTheme();
  const [hoveredSegment, setHoveredSegment] = useState<DonutChartSegment | null>(null);

  const internalTotalValue = useMemo(
    () => propTotalValue || data.reduce((sum, segment) => sum + segment.value, 0),
    [data, propTotalValue]
  );

  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercentage = 0;

  React.useEffect(() => {
    onSegmentHover?.(hoveredSegment);
  }, [hoveredSegment, onSegmentHover]);

  const handleMouseLeave = () => {
    setHoveredSegment(null);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        ...sx,
      }}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        component="svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        sx={{
          overflow: 'visible',
          transform: 'rotate(-90deg)',
        }}
      >
        {/* Base background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={alpha(theme.palette.divider, 0.3)}
          strokeWidth={strokeWidth}
        />

        {/* Data Segments */}
        {data.map((segment, index) => {
          if (segment.value === 0) return null;

          const percentage =
            internalTotalValue === 0 ? 0 : (segment.value / internalTotalValue) * 100;

          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = (cumulativePercentage / 100) * circumference;

          const isActive = hoveredSegment?.label === segment.label;

          cumulativePercentage += percentage;

          return (
            <circle
              key={segment.label || index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={-strokeDashoffset}
              strokeLinecap="round"
              style={{
                filter: isActive
                  ? `drop-shadow(0px 0px 6px ${segment.color}) brightness(1.1)`
                  : 'none',
                transform: isActive ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.2s ease-out',
                cursor: highlightOnHover ? 'pointer' : 'default',
              }}
              onMouseEnter={() => setHoveredSegment(segment)}
            />
          );
        })}
      </Box>

      {/* Center Content */}
      {centerContent && (
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            width: size - strokeWidth * 2.5,
            height: size - strokeWidth * 2.5,
          }}
        >
          {centerContent}
        </Box>
      )}
    </Box>
  );
};

