import React from 'react';
import {
  Paper,
  Box,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TrpMarkdownViewProps {
  content: string;
  showTitle?: boolean;
}

export const TrpMarkdownView: React.FC<TrpMarkdownViewProps> = ({ content, showTitle = true }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
      }}
    >
      {showTitle && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 3,
            color: theme.palette.text.primary,
          }}
        >
          Documento Markdown
        </Typography>
      )}
      <Box
        sx={{
          '& p': {
            marginBottom: 2,
            lineHeight: 1.8,
            color: theme.palette.text.primary,
          },
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            marginTop: 3,
            marginBottom: 2,
            fontWeight: 600,
            color: theme.palette.text.primary,
          },
          '& ul, & ol': {
            marginBottom: 2,
            paddingLeft: 3,
          },
          '& li': {
            marginBottom: 1,
            lineHeight: 1.8,
          },
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: 2,
            '& th, & td': {
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              padding: 1.5,
              textAlign: 'left',
            },
            '& th': {
              backgroundColor: alpha(theme.palette.primary.main, 0.06),
              fontWeight: 600,
            },
          },
          '& code': {
            backgroundColor: alpha(theme.palette.text.primary, 0.06),
            padding: '2px 6px',
            borderRadius: 1,
            fontSize: '0.875em',
          },
          '& pre': {
            backgroundColor: alpha(theme.palette.text.primary, 0.04),
            padding: 2,
            borderRadius: 2,
            overflow: 'auto',
            '& code': {
              backgroundColor: 'transparent',
              padding: 0,
            },
          },
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </Box>
    </Box>
  );
};

