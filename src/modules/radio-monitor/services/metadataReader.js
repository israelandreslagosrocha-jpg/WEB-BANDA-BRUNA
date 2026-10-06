// Lecturas compartidas solo durante un escaneo. Nunca interpreta audio como metadata.
const empty = (status, error) => ({ artist: '', title: '', online: false, status, raw: { error } });
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const path = value => { try { return new URL(value).pathname.replace(/\/$/, ''); } catch { return ''; } };
const splitSong = value => {
  const parts = clean(value).split(' - ');
  return parts.length > 1 ? { artist: parts.shift(), title: parts.join(' - ') } : { artist: '', title: clean(value) };
};

export function createMetadataReader({ fetchImpl = fetch, concurrency = 16, timeoutMs = 3000, budgetMs = 65000 } = {}) {
  const deadline = Date.now() + budgetMs;
  const cache = new Map();
  let active = 0;
  const queue = [];
  let requests = 0;
  async function read(url, fresh) {
    const key = `${fresh ? 'confirmation' : 'initial'}:${url}`;
    if (cache.has(key)) return cache.get(key);
    const promise = (async () => {
      if (active >= concurrency) await new Promise(resolve => queue.push(resolve));
      else active++;
      requests++;
      try {
        if (Date.now() >= deadline) { requests--; throw new Error('SCAN_TIME_LIMIT'); }
        const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (/^(audio|video)\//i.test(response.headers.get('content-type') || '')) {
          await response.body?.cancel();
          throw new Error('El endpoint devuelve audio, no metadata');
        }
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Respuesta vacía');
        const decoder = new TextDecoder();
        let text = '', size = 0;
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 512 * 1024) throw new Error('Metadata supera el límite de lectura');
            text += decoder.decode(value, { stream: true });
          }
          return text + decoder.decode();
        } finally { await reader.cancel(); }
      } finally {
        // Transferir el cupo al próximo solicitante evita sobrepasar el límite.
        const next = queue.shift();
        if (next) next(); else active--;
      }
    })();
    cache.set(key, promise);
    return promise;
  }

  async function get(radio, fresh = false) {
    try {
      const stream = new URL(radio.stream_url);
      const provider = radio.radio_providers?.nombre || '';
      let url = radio.metadata_url;
      let kind = provider;
      if (!url && /zeno\./i.test(stream.hostname)) return empty('UNSUPPORTED_SOURCE', 'Esta fuente no tiene endpoint de canciones configurado');
      if (/emisora\.cl/i.test(url || '')) kind = 'Emisora';
      else if (/azuracast|stationlink/i.test(stream.hostname) || /^\/listen\//.test(stream.pathname)) kind = 'AzuraCast';
      else if (/sonic\./i.test(stream.hostname)) kind = 'Shoutcast';

      if (kind === 'StreamTheWorld') {
        if (!/^https?:\/\//i.test(url || '')) {
          const code = url || stream.pathname.split('/').pop().replace(/\.(mp3|aac)$/i, '').replace(/_SC$/i, '');
          url = `https://playerservices.streamtheworld.com/public/nowplaying?station=${encodeURIComponent(code)}`;
        }
      } else if (!url) {
        const proxy = stream.pathname.match(/^\/(\d{4,5})(?:\/|$)/)?.[1];
        url = new URL(kind === 'AzuraCast' ? '/api/nowplaying' : kind === 'Shoutcast' ? `${proxy ? '/' + proxy : ''}/stats` : '/status-json.xsl', stream.origin).href;
      }
      if (kind === 'Shoutcast') { const parsed = new URL(url); parsed.searchParams.set('json', '1'); url = parsed.href; }
      const text = await read(url, fresh);
      let result;
      if (kind === 'Emisora') {
        const current = text.match(/<div data-playlist-current-song[\s\S]*?<span class="playlist__song-name">([^<]+)<\/span>[\s\S]*?<span class="playlist__artist-name">([^<]+)<\/span>/i);
        const history = [...text.matchAll(/<li class="playlist__item"[\s\S]*?<span class="playlist__song-name">([^<]+)<\/span>[\s\S]*?<span class="playlist__artist-name">([^<]+)<\/span>/gi)].map(m => ({ title: clean(m[1]), artist: clean(m[2]) }));
        result = { artist: clean(current?.[2]), title: clean(current?.[1]), history };
      } else if (kind === 'StreamTheWorld') {
        // Un <title> de una página HTML no es el título de una canción.
        result = { artist: clean(text.match(/name="cue_artist"[^>]*>([^<]+)/i)?.[1]), title: clean(text.match(/name="cue_title"[^>]*>([^<]+)/i)?.[1]) };
      } else if (kind === 'Shoutcast') {
        let song = text.match(/<SONGTITLE>([\s\S]*?)<\/SONGTITLE>/i)?.[1];
        if (!song) { try { song = JSON.parse(text).songtitle; } catch {} }
        if (!song && !radio.metadata_url) {
          const fallback = new URL(url); fallback.pathname = fallback.pathname.replace(/\/stats$/, '/7.html'); fallback.search = '';
          const legacy = await read(fallback.href, fresh);
          const body = legacy.match(/<body[^>]*>([^<]+)<\/body>/i)?.[1]?.split(',');
          if (body?.length >= 7) song = body.slice(6).join(',');
        }
        result = splitSong(song);
      } else {
        let data;
        try { data = JSON.parse(text); } catch { return empty('INVALID_METADATA', 'La fuente no devolvió metadata JSON válida'); }
        if (kind === 'AzuraCast' || data.now_playing || (Array.isArray(data) && data.some(s => s.now_playing))) {
          const shortcode = stream.pathname.match(/^\/listen\/([^/]+)/)?.[1];
          const stations = Array.isArray(data) ? data : [data];
          const station = stations.find(s => shortcode && s.station?.shortcode === shortcode)
            || stations.find(s => [...(s.station?.mounts || []), ...(s.station?.remotes || [])].some(m => path(m.url) === path(stream.href)));
          // Una respuesta de una sola estación solo es segura si es un endpoint explícito.
          const selected = station || (!Array.isArray(data) && radio.metadata_url ? data : null);
          if (!selected) return empty('SOURCE_MISMATCH', 'No se encontró la emisora solicitada en el servidor');
          if (selected.is_online === false) return empty('SOURCE_OFFLINE', 'La fuente indica que la emisora está desconectada');
          const song = selected.now_playing?.song;
          result = { artist: clean(song?.artist), title: clean(song?.title), artwork: song?.art,
            history: (selected.song_history || []).map(item => ({ artist: clean(item.song?.artist), title: clean(item.song?.title), played_at: item.played_at })) };
        } else {
          const sources = data?.icestats?.source;
          const list = Array.isArray(sources) ? sources : sources ? [sources] : [];
          const source = list.find(s => s.listenurl && path(s.listenurl) === path(stream.href))
            || (list.length === 1 && !list[0].listenurl ? list[0] : null);
          if (!source) return empty(list.length ? 'SOURCE_MISMATCH' : 'NO_METADATA', 'No se encontró metadata del montaje solicitado');
          result = source.artist ? { artist: clean(source.artist), title: clean(source.title_only || source.title) } : splitSong(source.title || source.yp_currently_playing);
        }
      }
      const available = !!(result.artist && result.title);
      return { ...result, online: available || !!result.history?.length, status: available ? 'METADATA_OK' : 'NO_SONG_METADATA',
        raw: { provider: kind || 'Icecast', current: { artist: result.artist, title: result.title } } };
    } catch (error) {
      if (error.message === 'SCAN_TIME_LIMIT') return empty('SCAN_TIME_LIMIT', 'Consulta no realizada: se agotó el tiempo disponible del escaneo');
      // No registrar URLs ni tokens del stream en los logs.
      return empty('QUERY_ERROR', /HTTP \d+/.test(error.message) ? error.message : error.name === 'TimeoutError' ? 'Tiempo de consulta agotado' : 'No se pudo leer metadata de la fuente');
    }
  }
  return { get, get requestCount() { return requests; } };
}
