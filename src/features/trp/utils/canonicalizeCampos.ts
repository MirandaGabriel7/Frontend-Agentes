// src/modules/trp/utils/canonicalizeCampos.ts
//
// Lightweight frontend canonicalization of campos_trp_normalizados.
// Ensures the payload sent to the backend is clean:
//   - removes undefined / null / empty-string top-level values
//   - ensures itens_objeto is always an array (even if empty)
//   - trims string values
//   - recursively cleans nested objects (item rows)

export function canonicalizeCampos(campos: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [k, v] of Object.entries(campos)) {
    if (v === undefined || v === null) continue;

    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed === '' || trimmed === '—') continue; // skip blanks
      result[k] = trimmed;
    } else if (Array.isArray(v)) {
      // Recurse into arrays of objects (e.g., itens_objeto)
      const cleaned = v
        .map((item: any) =>
          typeof item === 'object' && !Array.isArray(item)
            ? canonicalizeCampos(item)
            : item
        )
        .filter((item: any) => {
          // Remove empty item rows (all values blank)
          if (typeof item === 'object') {
            return Object.values(item).some(
              (val) => val !== undefined && val !== null && val !== '' && val !== '—'
            );
          }
          return true;
        });
      result[k] = cleaned;
    } else if (typeof v === 'object') {
      const nested = canonicalizeCampos(v);
      if (Object.keys(nested).length > 0) result[k] = nested;
    } else {
      // number, boolean — keep as-is
      result[k] = v;
    }
  }

  // Always ensure itens_objeto is an array
  if (!Array.isArray(result['itens_objeto'])) {
    result['itens_objeto'] = [];
  }

  return result;
}
