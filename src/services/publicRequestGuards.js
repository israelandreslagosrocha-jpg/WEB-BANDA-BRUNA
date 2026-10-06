const requestBuckets = new Map();
const MAX_BUCKETS = 2_000;

function now() {
  return Date.now();
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-vercel-forwarded-for')
    || request.headers.get('x-forwarded-for')
    || '';

  return forwarded.split(',')[0].trim() || 'unknown';
}

export function isSameOriginRequest(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/**
 * Límite ligero por instancia para formularios públicos. No sustituye a una
 * protección perimetral, pero evita ráfagas accidentales o automatizadas antes
 * de que lleguen a Supabase.
 */
export function allowPublicSubmission(request, scope, { limit = 3, windowMs = 15 * 60 * 1000 } = {}) {
  const bucketKey = `${scope}:${getClientIp(request)}`;
  const timestamp = now();
  const existing = requestBuckets.get(bucketKey) || [];
  const recent = existing.filter(value => timestamp - value < windowMs);

  if (recent.length >= limit) {
    requestBuckets.set(bucketKey, recent);
    return { allowed: false, retryAfterSeconds: Math.ceil((windowMs - (timestamp - recent[0])) / 1000) };
  }

  recent.push(timestamp);
  requestBuckets.set(bucketKey, recent);

  if (requestBuckets.size > MAX_BUCKETS) {
    for (const [key, attempts] of requestBuckets) {
      if (!attempts.some(value => timestamp - value < windowMs)) requestBuckets.delete(key);
      if (requestBuckets.size <= MAX_BUCKETS) break;
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}
