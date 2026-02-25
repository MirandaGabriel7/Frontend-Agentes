// src/modules/trp/components/TrpInteractiveView.tsx
//
// Custom markdown renderer that parses {{campo:X}} tokens inside text nodes
// and replaces them with <EditableInlineField> components.
// Everything else renders as normal, professional markdown.

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Typography } from '@mui/material';
import { EditableInlineField } from './EditableInlineField';
import { resolveFieldDef } from '../config/trpFieldMap';
import { getValueByPath } from '../utils/trpTemplate';

interface TrpInteractiveViewProps {
  /** Markdown string containing {{campo:fieldId}} tokens */
  markdownWithTokens: string;
  /** Current draft campos — used to read values for each token */
  campos: Record<string, any>;
  /** When true, fields are clickable and editable */
  editMode: boolean;
  /** Called when a field edit is committed */
  onCommit: (fieldId: string, value: any) => void;
}

// ─── Token parsing ────────────────────────────────────────────────────────────

const TOKEN_SPLIT = /(\{\{campo:[^}]+\}\})/;
const TOKEN_EXTRACT = /\{\{campo:([^}]+)\}\}/;

type TextSegment = { kind: 'text'; value: string };
type TokenSegment = { kind: 'token'; fieldId: string };
type Segment = TextSegment | TokenSegment;

function splitTokens(text: string): Segment[] {
  return text.split(TOKEN_SPLIT).map((part) => {
    const match = part.match(TOKEN_EXTRACT);
    if (match) return { kind: 'token', fieldId: match[1] };
    return { kind: 'text', value: part };
  });
}

// ─── Rich text renderer ───────────────────────────────────────────────────────

interface RichTextProps {
  children: string;
  campos: Record<string, any>;
  editMode: boolean;
  onCommit: (fieldId: string, value: any) => void;
}

const RichText: React.FC<RichTextProps> = React.memo(({ children, campos, editMode, onCommit }) => {
  const segments = useMemo(() => splitTokens(children), [children]);

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return <React.Fragment key={i}>{seg.value}</React.Fragment>;
        }
        const { fieldId } = seg;
        const fieldDef = resolveFieldDef(fieldId);
        if (!fieldDef) {
          // Unknown token — render raw as fallback (never exposes to end user in prod)
          return <React.Fragment key={i}>{fieldId}</React.Fragment>;
        }
        const rawValue = getValueByPath(campos, fieldDef.path);
        return (
          <EditableInlineField
            key={fieldId}
            fieldDef={fieldDef}
            rawValue={rawValue}
            editMode={editMode}
            onCommit={onCommit}
          />
        );
      })}
    </>
  );
});
RichText.displayName = 'RichText';

// ─── Child processing helper ──────────────────────────────────────────────────

/**
 * ReactMarkdown passes children as ReactNode. We intercept raw strings
 * and run them through RichText for token detection. Non-string children pass through.
 */
function processChildren(
  children: React.ReactNode,
  richText: (s: string, key?: number) => React.ReactNode
): React.ReactNode {
  if (typeof children === 'string') return richText(children);
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === 'string'
        ? <React.Fragment key={i}>{richText(child, i)}</React.Fragment>
        : child
    );
  }
  return children;
}

// ─── Custom component factories ───────────────────────────────────────────────

function makeComponents(
  campos: Record<string, any>,
  editMode: boolean,
  onCommit: (fieldId: string, value: any) => void
) {
  const richText = (text: string) => (
    <RichText campos={campos} editMode={editMode} onCommit={onCommit}>
      {text}
    </RichText>
  );

  return {
    h1: ({ children }: any) => (
      <Typography
        variant="h4"
        component="h1"
        fontWeight={700}
        sx={{ mt: 0, mb: 2.5, color: 'text.primary', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}
      >
        {processChildren(children, richText)}
      </Typography>
    ),

    h2: ({ children }: any) => (
      <Typography
        variant="h6"
        component="h2"
        fontWeight={600}
        sx={{ mt: 3, mb: 1.25, color: 'primary.dark', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}
      >
        {processChildren(children, richText)}
      </Typography>
    ),

    p: ({ children }: any) => (
      <Typography component="p" variant="body1" sx={{ my: 0.75, lineHeight: 1.7 }}>
        {processChildren(children, richText)}
      </Typography>
    ),

    strong: ({ children }: any) => (
      <Box component="strong" sx={{ fontWeight: 700 }}>
        {processChildren(children, richText)}
      </Box>
    ),

    em: ({ children }: any) => (
      <Box component="em">{processChildren(children, richText)}</Box>
    ),

    table: ({ children }: any) => (
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          my: 1.5,
          fontSize: '0.9rem',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    ),

    thead: ({ children }: any) => (
      <Box component="thead" sx={{ bgcolor: 'grey.50' }}>
        {children}
      </Box>
    ),

    tbody: ({ children }: any) => (
      <Box component="tbody">{children}</Box>
    ),

    tr: ({ children }: any) => (
      <Box
        component="tr"
        sx={{
          '&:nth-of-type(even)': { bgcolor: 'grey.50' },
          '&:hover': { bgcolor: editMode ? 'primary.50' : undefined },
          transition: 'background 0.1s',
        }}
      >
        {children}
      </Box>
    ),

    th: ({ children }: any) => (
      <Box
        component="th"
        sx={{
          px: 2,
          py: 1,
          fontWeight: 600,
          textAlign: 'left',
          borderBottom: '2px solid',
          borderColor: 'divider',
          color: 'text.secondary',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        {processChildren(children, richText)}
      </Box>
    ),

    td: ({ children }: any) => (
      <Box
        component="td"
        sx={{
          px: 2,
          py: 0.875,
          borderBottom: '1px solid',
          borderColor: 'divider',
          verticalAlign: 'middle',
        }}
      >
        {processChildren(children, richText)}
      </Box>
    ),

    ul: ({ children }: any) => (
      <Box component="ul" sx={{ pl: 3, my: 0.75 }}>
        {children}
      </Box>
    ),

    li: ({ children }: any) => (
      <Box component="li" sx={{ mb: 0.25 }}>
        {processChildren(children, richText)}
      </Box>
    ),

    hr: () => (
      <Box component="hr" sx={{ my: 2, border: 'none', borderTop: '1px solid', borderColor: 'divider' }} />
    ),

    blockquote: ({ children }: any) => (
      <Box
        component="blockquote"
        sx={{ borderLeft: '4px solid', borderColor: 'primary.light', pl: 2, my: 1, color: 'text.secondary' }}
      >
        {children}
      </Box>
    ),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const TrpInteractiveView: React.FC<TrpInteractiveViewProps> = ({
  markdownWithTokens,
  campos,
  editMode,
  onCommit,
}) => {
  // Only rebuild renderers when editMode or campos identity changes (not on every char)
  const components = useMemo(
    () => makeComponents(campos, editMode, onCommit),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campos, editMode, onCommit]
  );

  return (
    <Box
      sx={{
        fontFamily: '"Georgia", "Times New Roman", serif',
        lineHeight: 1.75,
        color: 'text.primary',
        maxWidth: 860,
        mx: 'auto',
        p: { xs: 2, sm: 4 },
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        position: 'relative',
      }}
    >
      {editMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            px: 1.25,
            py: 0.4,
            bgcolor: 'warning.light',
            color: 'warning.dark',
            borderRadius: 1,
            fontSize: '0.7rem',
            fontFamily: 'sans-serif',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}
        >
          Modo edição
        </Box>
      )}

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components as any}
      >
        {markdownWithTokens}
      </ReactMarkdown>
    </Box>
  );
};

export default TrpInteractiveView;