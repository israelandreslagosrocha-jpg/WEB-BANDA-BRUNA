const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/** Escape untrusted text before interpolating it into an HTML string. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => HTML_ENTITIES[character]);
}

/** Accept only web URLs or same-origin absolute paths for HTML href/src attributes. */
export function safeWebUrl(value, fallback = '') {
  const candidate = String(value ?? '').trim();
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate;

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : fallback;
  } catch {
    return fallback;
  }
}

export function safeRating(value) {
  const rating = Number.parseInt(value, 10);
  return Number.isInteger(rating) ? Math.min(5, Math.max(1, rating)) : 5;
}
