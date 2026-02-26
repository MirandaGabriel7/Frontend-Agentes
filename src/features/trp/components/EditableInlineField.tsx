// src/modules/trp/components/EditableInlineField.tsx
//
// A single editable field that renders as plain text in view mode
// and transforms into an inline MUI TextField in edit mode.
// Supports text, number (pt-BR), date (DD/MM/YYYY), and textarea types.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { TrpFieldDef } from '@/features/trp/config/trpFieldMap';
import { displayValue, parsePtBRNumber, parsePtBRDate } from '@/features/trp/utils/trpFormatters';

interface EditableInlineFieldProps {
  fieldDef: TrpFieldDef;
  rawValue: any;        // raw value from campos (e.g., ISO date string, JS number)
  editMode: boolean;    // global edit mode toggle; if false, field is read-only
  onCommit: (fieldId: string, parsedValue: any) => void;
}

export const EditableInlineField: React.FC<EditableInlineFieldProps> = ({
  fieldDef,
  rawValue,
  editMode,
  onCommit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  // What to display in the document (formatted)
  const formatted = displayValue(rawValue, fieldDef.type, fieldDef.fieldId);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEdit = useCallback(() => {
    if (!editMode) return;
    // Initialize local value with formatted display (so user sees current state)
    setLocalValue(formatted === '—' ? '' : formatted);
    setError(undefined);
    setIsEditing(true);
  }, [editMode, formatted]);

  const commit = useCallback(() => {
    // Required validation
    if (fieldDef.required && !localValue.trim()) {
      setError('Campo obrigatório');
      return;
    }

    // Custom validation
    if (fieldDef.validate) {
      const err = fieldDef.validate(localValue);
      if (err) {
        setError(err);
        return;
      }
    }

    // Type-aware parsing
    let parsed: any = localValue;
    if (fieldDef.type === 'number') {
      const num = parsePtBRNumber(localValue);
      parsed = num !== null ? num : localValue; // fallback to raw string if unparseable
    }
    if (fieldDef.type === 'date') {
      parsed = parsePtBRDate(localValue) || localValue;
    }

    onCommit(fieldDef.fieldId, parsed);
    setIsEditing(false);
    setError(undefined);
  }, [localValue, fieldDef, onCommit]);

  const cancelThisField = useCallback(() => {
    setIsEditing(false);
    setLocalValue('');
    setError(undefined);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fieldDef.type !== 'textarea') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelThisField();
    }
  };

  // ── Edit mode: show inline TextField ──────────────────────────────────────
  if (isEditing) {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'flex-start',
          gap: 0.5,
          verticalAlign: 'middle',
        }}
      >
        <TextField
          inputRef={inputRef}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            setError(undefined);
          }}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          size="small"
          multiline={fieldDef.type === 'textarea'}
          minRows={fieldDef.type === 'textarea' ? 2 : undefined}
          error={!!error}
          helperText={error}
          placeholder={
            fieldDef.type === 'date'
              ? 'DD/MM/AAAA'
              : fieldDef.type === 'number'
              ? '0,00'
              : undefined
          }
          sx={{
            minWidth: fieldDef.type === 'textarea' ? 320 : fieldDef.type === 'number' ? 120 : 180,
            '& .MuiInputBase-input': {
              fontSize: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
              py: 0.35,
              px: 0.75,
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              backgroundColor: 'background.paper',
              '& fieldset': { borderColor: 'primary.main', borderWidth: 2 },
              '&:hover fieldset': { borderColor: 'primary.dark' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' },
            },
          }}
          inputProps={{ 'aria-label': fieldDef.label }}
        />
        <Tooltip title="Confirmar (Enter)" arrow placement="top">
          <IconButton
            size="small"
            onMouseDown={(e) => { e.preventDefault(); commit(); }} // mouseDown prevents blur before click
            color="success"
            sx={{ mt: 0.25 }}
          >
            <CheckIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancelar (Esc)" arrow placement="top">
          <IconButton
            size="small"
            onMouseDown={(e) => { e.preventDefault(); cancelThisField(); }}
            color="error"
            sx={{ mt: 0.25 }}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  // ── View mode: display formatted value ────────────────────────────────────
  return (
    <Tooltip
      title={editMode ? `Clique para editar: ${fieldDef.label}` : ''}
      placement="top"
      arrow
      disableHoverListener={!editMode}
    >
      <Box
        component="span"
        onClick={startEdit}
        role={editMode ? 'button' : undefined}
        tabIndex={editMode ? 0 : undefined}
        onKeyDown={editMode ? (e) => { if (e.key === 'Enter' || e.key === ' ') startEdit(); } : undefined}
        aria-label={editMode ? `Editar ${fieldDef.label}: ${formatted}` : undefined}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.3,
          cursor: editMode ? 'pointer' : 'text',
          px: 0.5,
          py: 0.125,
          borderRadius: 0.75,
          transition: 'all 0.15s ease',
          outline: 'none',
          // Hover & focus styles only in edit mode
          ...(editMode && {
            '&:hover, &:focus-visible': {
              backgroundColor: 'primary.50',
              outline: '1.5px dashed',
              outlineColor: 'primary.300',
              outlineOffset: 1,
              '& .edit-icon-hint': {
                opacity: 1,
                transform: 'scale(1)',
              },
            },
          }),
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
            lineHeight: 'inherit',
          }}
        >
          {formatted}
        </Typography>

        {editMode && (
          <EditIcon
            className="edit-icon-hint"
            sx={{
              fontSize: '0.65em',
              color: 'primary.main',
              opacity: 0,
              transform: 'scale(0.7)',
              transition: 'opacity 0.15s, transform 0.15s',
              ml: 0.25,
              flexShrink: 0,
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default EditableInlineField;
