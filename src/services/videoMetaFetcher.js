// Utilidad de extracción de metadatos y portadas de videos y reels
// Soporta YouTube, Facebook Reels, Instagram Reels y TikTok

export function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function cleanMetaTitle(rawTitle, platform) {
  if (!rawTitle) return '';
  let clean = decodeHtmlEntities(rawTitle).trim();

  if (platform === 'facebook') {
    // Facebook suele enviar "2,5 mil reproducciones · 54 reacciones | Titulo real | Banda Bruna BB"
    const parts = clean.split(/\s*\|\s*/);
    const candidate = parts.find(
      p => !p.toLowerCase().includes('reproducciones') &&
           !p.toLowerCase().includes('reacciones') &&
           p.toLowerCase() !== 'banda bruna bb' &&
           p.toLowerCase() !== 'facebook'
    );
    if (candidate) clean = candidate.trim();
  } else if (platform === 'instagram') {
    // Instagram suele enviar 'Banda Bruna ® on Instagram: "Pie de foto..."'
    const match = clean.match(/on Instagram:\s*"(.*)"$/s) || clean.match(/en Instagram:\s*"(.*)"$/s);
    if (match && match[1]) {
      clean = match[1].trim();
    }
  }

  // Acotar a longitud razonable para títulos de cards
  if (clean.length > 140) {
    clean = clean.slice(0, 137).trim() + '...';
  }
  return clean;
}

export function detectPlatform(url) {
  if (!url) return null;
  const str = url.toLowerCase();
  if (str.includes('youtube.com') || str.includes('youtu.be')) return 'youtube';
  if (str.includes('facebook.com') || str.includes('fb.watch')) return 'facebook';
  if (str.includes('instagram.com')) return 'instagram';
  if (str.includes('tiktok.com')) return 'tiktok';
  return null;
}

export function extractYouTubeId(url) {
  if (!url) return null;
  const str = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  const match = str.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|(?:shorts\/))|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function extractInstagramId(url) {
  if (!url) return null;
  const match = url.match(/(?:reel|p)\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

export function extractFacebookId(url) {
  if (!url) return null;
  const match = url.match(/(?:reel|videos|watch|share\/r)\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

export function extractTikTokId(url) {
  if (!url) return null;
  const match = url.match(/video\/([0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Consulta y extrae metadatos (portada HD, título original, ID) desde el enlace directo.
 * @param {string} url - Enlace del video o reel
 * @returns {Promise<{ success: boolean, platform: string, title: string, thumbnail: string, id: string, error?: string }>}
 */
export async function fetchVideoMetadata(url) {
  const trimmedUrl = (url || '').trim();
  const platform = detectPlatform(trimmedUrl);

  if (!platform) {
    return {
      success: false,
      platform: 'unknown',
      title: '',
      thumbnail: '',
      id: '',
      error: 'Plataforma no reconocida o URL inválida'
    };
  }

  const timeoutSignal = AbortSignal.timeout(6000);

  // 1. YOUTUBE
  if (platform === 'youtube') {
    const ytId = extractYouTubeId(trimmedUrl);
    let title = 'Banda Bruna - Video Oficial en YouTube';
    let thumbnail = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : '';

    if (ytId) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmedUrl)}&format=json`;
        const res = await fetch(oembedUrl, { signal: timeoutSignal });
        if (res.ok) {
          const data = await res.json();
          if (data.title) title = cleanMetaTitle(data.title, 'youtube');
          if (data.thumbnail_url) thumbnail = data.thumbnail_url;
        }
      } catch (e) {
        // En caso de fallo de red, conservamos el thumbnail directo de ytimg
      }
    }

    return {
      success: !!thumbnail,
      platform: 'youtube',
      title,
      thumbnail,
      id: ytId || ''
    };
  }

  // 2. TIKTOK
  if (platform === 'tiktok') {
    const ttId = extractTikTokId(trimmedUrl);
    let title = 'Banda Bruna en TikTok';
    let thumbnail = '';

    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(trimmedUrl)}`;
      const res = await fetch(oembedUrl, { signal: timeoutSignal });
      if (res.ok) {
        const data = await res.json();
        if (data.thumbnail_url) {
          thumbnail = data.thumbnail_url;
        }
        if (data.title && data.title.trim()) {
          title = cleanMetaTitle(data.title, 'tiktok');
        } else if (data.author_name) {
          title = `${data.author_name} - Video Oficial en TikTok`;
        }
      }
    } catch (e) {
      console.warn('[videoMetaFetcher] Error en oEmbed de TikTok:', e.message);
    }

    if (!thumbnail) {
      thumbnail = '/assets/images/tiktok/tiktok_minero.webp';
    }

    return {
      success: !!thumbnail,
      platform: 'tiktok',
      title,
      thumbnail,
      id: ttId || ''
    };
  }

  // 3. INSTAGRAM REELS
  if (platform === 'instagram') {
    const igId = extractInstagramId(trimmedUrl);
    let title = 'Banda Bruna en Instagram';
    let thumbnail = '';

    try {
      const res = await fetch(trimmedUrl, {
        signal: timeoutSignal,
        headers: {
          'User-Agent': 'facebookexternalhit/1.1; (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-ES,es;q=0.9'
        }
      });

      if (res.ok) {
        const html = await res.text();
        const imgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
        const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                           html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);

        if (imgMatch && imgMatch[1]) {
          thumbnail = decodeHtmlEntities(imgMatch[1]);
        }
        if (titleMatch && titleMatch[1]) {
          title = cleanMetaTitle(titleMatch[1], 'instagram');
        }
      }
    } catch (e) {
      console.warn('[videoMetaFetcher] Error en scraper de Instagram:', e.message);
    }

    if (!thumbnail) {
      thumbnail = '/assets/images/instagram/ig_boca_de_lobos.webp';
    }

    return {
      success: !!thumbnail,
      platform: 'instagram',
      title,
      thumbnail,
      id: igId || ''
    };
  }

  // 4. FACEBOOK REELS
  if (platform === 'facebook') {
    const fbId = extractFacebookId(trimmedUrl);
    let title = 'Banda Bruna en vivo - Facebook Reel';
    let thumbnail = '';

    try {
      const res = await fetch(trimmedUrl, {
        signal: timeoutSignal,
        headers: {
          'User-Agent': 'facebookexternalhit/1.1; (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-ES,es;q=0.9'
        }
      });

      if (res.ok) {
        const html = await res.text();
        const imgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
        const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                           html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);

        if (imgMatch && imgMatch[1]) {
          thumbnail = decodeHtmlEntities(imgMatch[1]);
        }
        if (titleMatch && titleMatch[1]) {
          title = cleanMetaTitle(titleMatch[1], 'facebook');
        }
      }
    } catch (e) {
      console.warn('[videoMetaFetcher] Error en scraper de Facebook:', e.message);
    }

    if (!thumbnail) {
      thumbnail = '/assets/images/facebook/fb_fiestas_patrias.webp';
    }

    return {
      success: !!thumbnail,
      platform: 'facebook',
      title,
      thumbnail,
      id: fbId || ''
    };
  }

  return {
    success: false,
    platform: 'unknown',
    title: '',
    thumbnail: '',
    id: ''
  };
}
