import React from 'react';
import {
  Box,
  Typography,
  Paper,
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

  // Processar o conteúdo para remover seções de "Regime de fornecimento/serviço"
  const processedContent = content
    .split(/(?=^##?\s)/gm) // Dividir por seções (h1 ou h2)
    .filter(section => {
      // Remover seções que contenham "Regime de fornecimento" ou "Regime de serviço"
      const lowerSection = section.toLowerCase();
      return !lowerSection.includes('regime de fornecimento') && 
             !lowerSection.includes('regime de serviço') &&
             !lowerSection.includes('regime de fornecimento/serviço');
    })
    .join('');

  // Dividir o conteúdo em seções principais (h1 ou h2)
  const sections = processedContent
    .split(/(?=^##?\s)/gm)
    .filter(s => s.trim());

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
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {sections.length > 0 ? (
          sections.map((section, index) => {
            const isMainSection = /^##?\s/.test(section);
            
            if (isMainSection) {
              return (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 4px 12px ${alpha('#000', 0.02)}`,
                  }}
                >
                  <Box
                    sx={{
                      '& p': {
                        marginBottom: 2,
                        lineHeight: 1.8,
                        color: theme.palette.text.primary,
                      },
                      '& h1': {
                        marginTop: 0,
                        marginBottom: 3,
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        fontSize: '1.75rem',
                        paddingBottom: 2,
                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                      '& h2': {
                        marginTop: 0,
                        marginBottom: 2.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        fontSize: '1.5rem',
                        paddingBottom: 1.5,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      },
                      '& h3, & h4, & h5, & h6': {
                        marginTop: 2,
                        marginBottom: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      },
                      '& ul, & ol': {
                        marginBottom: 2,
                        paddingLeft: 3,
                      },
                      '& li': {
                        marginBottom: 0.5,
                        lineHeight: 1.8,
                      },
                      '& table': {
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginTop: 2,
                        marginBottom: 2,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        boxShadow: `0 1px 3px ${alpha('#000', 0.08)}`,
                        '& th, & td': {
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          padding: 1.5,
                          textAlign: 'left',
                          fontSize: '0.9375rem',
                        },
                        '& th': {
                          backgroundColor: alpha(theme.palette.grey[500], 0.08),
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          fontSize: '0.875rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em',
                        },
                        '& td': {
                          color: theme.palette.text.primary,
                        },
                        '& tr:nth-of-type(even) td': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        },
                        '& tr:hover td': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{section}</ReactMarkdown>
                  </Box>
                </Paper>
              );
            }
            
            return (
              <Box key={index}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{section}</ReactMarkdown>
              </Box>
            );
          })
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              bgcolor: theme.palette.background.paper,
              boxShadow: `0 1px 3px ${alpha('#000', 0.04)}, 0 4px 12px ${alpha('#000', 0.02)}`,
            }}
          >
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
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  boxShadow: `0 1px 3px ${alpha('#000', 0.08)}`,
                  '& th, & td': {
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    padding: 1.5,
                    textAlign: 'left',
                    fontSize: '0.9375rem',
                  },
                  '& th': {
                    backgroundColor: alpha(theme.palette.grey[500], 0.08),
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  },
                  '& td': {
                    color: theme.palette.text.primary,
                  },
                  '& tr:nth-of-type(even) td': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                  '& tr:hover td': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
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
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedContent}</ReactMarkdown>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

