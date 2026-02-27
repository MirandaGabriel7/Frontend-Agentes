/**
 * Valida se uma string é um UUID válido (v4)
 * Formato esperado: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function isUuid(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Regex para UUID v4
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value);
}
