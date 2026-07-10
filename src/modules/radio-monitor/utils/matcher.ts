/**
 * Utilidades para comparar textos ignorando mayúsculas, minúsculas, tildes y caracteres especiales.
 */

/**
 * Normaliza un texto removiendo acentos, caracteres especiales y espacios innecesarios.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD') // Separa las tildes del caracter (ej: á -> a + ´)
    .replace(/[\u0300-\u036f]/g, '') // Remueve las marcas de tilde
    .replace(/[^a-z0-9\s]/g, '') // Remueve caracteres especiales (mantiene letras, números y espacios)
    .replace(/\s+/g, ' ') // Normaliza espacios múltiples
    .trim();
}

/**
 * Evalúa si una cadena coincide con alguno de los alias provistos.
 * Utiliza coincidencia exacta del texto normalizado o verifica si es una subcadena lo suficientemente larga.
 */
export function matchesAlias(value: string, aliases: string[]): boolean {
  if (!value || !aliases || aliases.length === 0) return false;
  
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return false;

  for (const alias of aliases) {
    const normalizedAlias = normalizeText(alias);
    if (!normalizedAlias) continue;

    // Coincidencia exacta tras normalización
    if (normalizedValue === normalizedAlias) {
      return true;
    }

    // Coincidencia de subcadena exacta si el alias es lo suficientemente descriptivo (mínimo 4 caracteres)
    if (normalizedAlias.length >= 4) {
      if (normalizedValue.includes(normalizedAlias) || normalizedAlias.includes(normalizedValue)) {
        return true;
      }
    }
  }

  return false;
}
