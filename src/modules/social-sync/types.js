/**
 * Tipos y utilidades de normalización y métricas para el sistema de sincronización social.
 * Proyecto: Banda Bruna
 */

/**
 * Crea un acumulador inicializado para métricas de observabilidad.
 */
export function createMetricsTracker() {
  return {
    items_detected: 0,
    items_inserted: 0,
    items_updated: 0,
    items_unchanged: 0,
    items_404: 0,
    errors_transient: 0,
    duration_ms: 0
  };
}

/**
 * Compara un registro existente en base de datos con los datos técnicos recién scrapeados.
 * Retorna true ÚNICAMENTE si algún dato de contenido o métrica cambió.
 * Ignora timestamps de sistema (updated_at, created_at, last_scraped_at) y campos editoriales (show_on_web, web_order).
 *
 * @param {Object} existing - Registro existente en social_posts
 * @param {Object} scraped - Registro recién extraído por el scraper
 * @returns {boolean} true si cambió algún dato técnico, false si es idéntico
 */
export function hasDataChanged(existing, scraped) {
  if (!existing) return true;

  // Comparación tolerante y estricta de campos técnicos
  const titleChanged = (existing.title ?? null) !== (scraped.title ?? null);
  const captionChanged = (existing.caption ?? null) !== (scraped.caption ?? null);
  const thumbnailChanged = (existing.thumbnail_url ?? null) !== (scraped.thumbnail_url ?? null);
  const postTypeChanged = (existing.post_type ?? null) !== (scraped.post_type ?? null);
  
  // Métricas numéricas
  const likesChanged = Number(existing.likes ?? 0) !== Number(scraped.likes ?? 0);
  const viewsChanged = Number(existing.views ?? 0) !== Number(scraped.views ?? 0);
  const commentsChanged = Number(existing.comments ?? 0) !== Number(scraped.comments ?? 0);

  // Fecha de publicación (normalizada a ISO si existen ambas)
  const existingPub = existing.published_at ? new Date(existing.published_at).toISOString() : null;
  const scrapedPub = scraped.published_at ? new Date(scraped.published_at).toISOString() : null;
  const publishedChanged = existingPub !== scrapedPub;

  return (
    titleChanged ||
    captionChanged ||
    thumbnailChanged ||
    postTypeChanged ||
    likesChanged ||
    viewsChanged ||
    commentsChanged ||
    publishedChanged
  );
}

/**
 * Parsea textos con sufijos o separadores de miles (ej: "1.2K", "3,360", "29 vistas", "911 suscriptores") a número entero.
 * Si no es parseable o viene nulo, retorna null (nunca 0 artificial si no había dato).
 */
export function parseCount(str) {
  if (str === null || str === undefined) return null;
  if (typeof str === 'number') return Math.round(str);
  
  const cleanStr = String(str).trim();
  if (!cleanStr) return null;

  // 1. Si tiene multiplicador K o M (ej: 1.2K, 3,5M)
  const kmMatch = cleanStr.match(/([0-9]+(?:[.,][0-9]+)?)\s*([KkMm])/);
  if (kmMatch) {
    let num = parseFloat(kmMatch[1].replace(',', '.'));
    const mult = kmMatch[2].toUpperCase();
    if (mult === 'K') num *= 1000;
    if (mult === 'M') num *= 1000000;
    return Math.round(num);
  }

  // 2. Si no tiene multiplicador, eliminar separadores de miles (puntos o comas)
  // Ej: '3,360' -> '3360', '3.360' -> '3360', '10.500' -> '10500'
  const digitsMatch = cleanStr.match(/([0-9]+(?:[.,][0-9]{3})*)/);
  if (digitsMatch) {
    const sanitized = digitsMatch[1].replace(/[.,]/g, '');
    const res = parseInt(sanitized, 10);
    return isNaN(res) ? null : res;
  }

  const fallback = cleanStr.match(/\d+/);
  return fallback ? parseInt(fallback[0], 10) : null;
}
