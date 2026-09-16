import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// ==========================================
// 1. UTILIDADES Y MATCHER DE ALIAS (Deno compatible)
// ==========================================

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesAlias(value: string, aliases: string[]): boolean {
  if (!value || !aliases || aliases.length === 0) return false;
  
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return false;

  for (const alias of aliases) {
    const normalizedAlias = normalizeText(alias);
    if (!normalizedAlias) continue;

    if (normalizedValue === normalizedAlias) return true;

    if (normalizedAlias.length >= 4) {
      if (normalizedValue.includes(normalizedAlias) || normalizedAlias.includes(normalizedValue)) {
        return true;
      }
    }
  }
  return false;
}

function cleanMetadataText(text: string): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

// ==========================================
// 2. LÓGICA DE PROVEEDORES DE STREAMING
// ==========================================

interface NowPlayingResult {
  artist: string;
  title: string;
  artwork?: string;
  history?: Array<{ title: string; artist: string }>;
  online: boolean;
  raw?: any;
}

async function getIcecastMetadata(streamUrl: string, metadataUrl?: string): Promise<NowPlayingResult> {
  let jsonUrl = metadataUrl;
  if (!jsonUrl) {
    try {
      const parsed = new URL(streamUrl);
      parsed.pathname = '/status-json.xsl';
      parsed.search = '';
      jsonUrl = parsed.toString();
    } catch {
      jsonUrl = streamUrl + '/status-json.xsl';
    }
  }

  try {
    const response = await fetch(jsonUrl, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    
    const sources = data?.icestats?.source;
    if (!sources) return { artist: '', title: '', online: false, raw: data };

    let titleString = '';
    let artist = '';
    let song = '';

    if (Array.isArray(sources)) {
      const streamPath = new URL(streamUrl).pathname;
      const matched = sources.find(s => s.listenurl && s.listenurl.includes(streamPath)) || sources[0];
      titleString = matched.title || matched.yp_currently_playing || '';
      artist = matched.artist || '';
      song = matched.title_only || '';
    } else {
      titleString = sources.title || sources.yp_currently_playing || '';
      artist = sources.artist || '';
      song = sources.title_only || '';
    }

    if (artist && song) {
      return { artist: cleanMetadataText(artist), title: cleanMetadataText(song), online: true, raw: data };
    }
    if (titleString && titleString.includes(' - ')) {
      const parts = titleString.split(' - ');
      return { artist: cleanMetadataText(parts[0]), title: cleanMetadataText(parts.slice(1).join(' - ')), online: true, raw: data };
    }
    return { artist: '', title: cleanMetadataText(titleString || song), online: !!titleString, raw: data };
  } catch (error: any) {
    return { artist: '', title: '', online: false, raw: { error: error.message } };
  }
}

async function getShoutcastMetadata(streamUrl: string, metadataUrl?: string): Promise<NowPlayingResult> {
  let statsUrl = metadataUrl;
  if (!statsUrl) {
    try {
      const parsed = new URL(streamUrl);
      parsed.pathname = '/stats';
      parsed.search = '';
      statsUrl = parsed.toString();
    } catch {
      statsUrl = streamUrl + '/stats';
    }
  }

  try {
    const response = await fetch(statsUrl + '?json=1', { signal: AbortSignal.timeout(3000) });
    if (response.ok) {
      const data = await response.json();
      const title = data.songtitle || '';
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        return { artist: cleanMetadataText(parts[0]), title: cleanMetadataText(parts.slice(1).join(' - ')), online: true, raw: data };
      }
      return { artist: '', title: cleanMetadataText(title), online: !!title, raw: data };
    }
    throw new Error('Stats JSON fail');
  } catch (v2Error: any) {
    // Fallback Shoutcast v1 7.html
    try {
      const parsed = new URL(streamUrl);
      parsed.pathname = '/7.html';
      parsed.search = '';
      const v1Response = await fetch(parsed.toString(), { signal: AbortSignal.timeout(3000) });
      if (v1Response.ok) {
        const text = await v1Response.text();
        const match = text.match(/<body>(.*)<\/body>/i);
        if (match && match[1]) {
          const parts = match[1].split(',');
          if (parts.length >= 7) {
            const title = parts.slice(6).join(',');
            if (title.includes(' - ')) {
              const p = title.split(' - ');
              return { artist: cleanMetadataText(p[0]), title: cleanMetadataText(p.slice(1).join(' - ')), online: true, raw: { v1: text } };
            }
            return { artist: '', title: cleanMetadataText(title), online: !!title, raw: { v1: text } };
          }
        }
      }
    } catch {}
    return { artist: '', title: '', online: false, raw: { error: v2Error.message } };
  }
}

async function getAzuraMetadata(streamUrl: string, metadataUrl?: string): Promise<NowPlayingResult> {
  let apiUrl = metadataUrl;
  if (!apiUrl) {
    try {
      const parsed = new URL(streamUrl);
      parsed.pathname = '/api/nowplaying';
      parsed.search = '';
      apiUrl = parsed.toString();
    } catch {
      apiUrl = streamUrl + '/api/nowplaying';
    }
  }

  try {
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    let stationData = Array.isArray(data) ? data[0] : data;
    
    const nowPlaying = stationData?.now_playing;
    if (!nowPlaying) return { artist: '', title: '', online: false, raw: data };

    return {
      artist: cleanMetadataText(nowPlaying.song?.artist || ''),
      title: cleanMetadataText(nowPlaying.song?.title || ''),
      artwork: nowPlaying.song?.art || undefined,
      online: true,
      raw: data
    };
  } catch (error: any) {
    return { artist: '', title: '', online: false, raw: { error: error.message } };
  }
}

async function getStreamTheWorldMetadata(streamUrl: string, metadataUrl?: string): Promise<NowPlayingResult> {
  let code = metadataUrl;
  if (!code) {
    try {
      const parsed = new URL(streamUrl);
      const pathname = parsed.pathname;
      const parts = pathname.split('/');
      const lastPart = parts[parts.length - 1];
      code = lastPart.replace('.mp3', '').replace('.aac', '');
    } catch {
      code = '';
    }
  }

  if (!code) return { artist: '', title: '', online: false, raw: { error: 'No code' } };
  const apiUrl = `https://playerservices.streamtheworld.com/public/nowplaying?station=${code}`;

  try {
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const xml = await response.text();
    
    const titleRegex = /name="cue_title"[^>]*>([^<]+)/i;
    const artistRegex = /name="cue_artist"[^>]*>([^<]+)/i;

    const titleMatch = xml.match(titleRegex);
    const artistMatch = xml.match(artistRegex);

    if (titleMatch || artistMatch) {
      return {
        artist: cleanMetadataText(artistMatch ? artistMatch[1] : ''),
        title: cleanMetadataText(titleMatch ? titleMatch[1] : ''),
        online: true,
        raw: { xml }
      };
    }
    
    const altTitleRegex = /<title>([^<]+)<\/title>/i;
    const altArtistRegex = /<artist>([^<]+)<\/artist>/i;
    const altTitleMatch = xml.match(altTitleRegex);
    const altArtistMatch = xml.match(altArtistRegex);

    return {
      artist: cleanMetadataText(altArtistMatch ? altArtistMatch[1] : ''),
      title: cleanMetadataText(altTitleMatch ? altTitleMatch[1] : ''),
      online: !!altTitleMatch,
      raw: { xml }
    };
  } catch (error: any) {
    return { artist: '', title: '', online: false, raw: { error: error.message } };
  }
}

async function getEmisoraClMetadata(url: string): Promise<NowPlayingResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const html = await response.text();

    // 1. Canción actual en vivo
    const currentMatch = html.match(/<div data-playlist-current-song[\s\S]*?<span class="playlist__song-name">([^<]+)<\/span>[\s\S]*?<span class="playlist__artist-name">([^<]+)<\/span>/i);
    const currentSong = currentMatch ? cleanMetadataText(currentMatch[1]) : '';
    const currentArtist = currentMatch ? cleanMetadataText(currentMatch[2]) : '';

    // 2. Historial de temas recientes
    const prevMatches = [...html.matchAll(/<li class="playlist__item"[\s\S]*?<span class="playlist__song-name">([^<]+)<\/span>[\s\S]*?<span class="playlist__artist-name">([^<]+)<\/span>/gi)];
    const history = prevMatches.map(m => ({
      title: cleanMetadataText(m[1]),
      artist: cleanMetadataText(m[2])
    }));

    return {
      artist: currentArtist,
      title: currentSong,
      history,
      online: !!(currentSong || history.length > 0),
      raw: { current: { artist: currentArtist, title: currentSong }, history }
    };
  } catch (error: any) {
    return { artist: '', title: '', history: [], online: false, raw: { error: error.message } };
  }
}

// ==========================================
// 3. HANDLER PRINCIPAL DE LA EDGE FUNCTION
// ==========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Solo permitir peticiones POST o GET para disparar el cron
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''; // Usamos service role para bypass RLS y escribir auditorías
  
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Faltan variables de entorno de Supabase' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Obtener radios activas
    const { data: radios, error: radiosError } = await supabase
      .from('radios')
      .select('*, radio_providers(nombre)')
      .eq('activo', true);

    if (radiosError) throw radiosError;

    // 2. Obtener artistas monitoreados
    const { data: artists, error: artistsError } = await supabase
      .from('monitored_artists')
      .select('*')
      .eq('activo', true);

    if (artistsError) throw artistsError;

    // 3. Obtener canciones monitoreadas
    const { data: tracks, error: tracksError } = await supabase
      .from('monitored_tracks')
      .select('*');

    if (tracksError) throw tracksError;

    // Aplanamos todos los alias de artistas y canciones monitoreadas
    const artistAliases = (artists || []).flatMap(a => a.aliases || []);
    const trackAliases = (tracks || []).flatMap(t => t.aliases || []);

    const results = [];

    // 4. Procesar radios en paralelo
    const scanPromises = (radios || []).map(async (radio) => {
      const provider = radio.radio_providers?.nombre;
      let nowPlaying: NowPlayingResult = { artist: '', title: '', online: false };

      try {
        if (radio.metadata_url && radio.metadata_url.includes('emisora.cl')) {
          nowPlaying = await getEmisoraClMetadata(radio.metadata_url);
        } else if (provider === 'Icecast') {
          nowPlaying = await getIcecastMetadata(radio.stream_url, radio.metadata_url);
        } else if (provider === 'Shoutcast') {
          nowPlaying = await getShoutcastMetadata(radio.stream_url, radio.metadata_url);
        } else if (provider === 'AzuraCast') {
          nowPlaying = await getAzuraMetadata(radio.stream_url, radio.metadata_url);
        } else if (provider === 'StreamTheWorld') {
          nowPlaying = await getStreamTheWorldMetadata(radio.stream_url, radio.metadata_url);
        } else {
          // Proveedor genérico: intentamos Icecast por defecto
          nowPlaying = await getIcecastMetadata(radio.stream_url, radio.metadata_url);
        }
      } catch (err: any) {
        nowPlaying = { artist: '', title: '', online: false, raw: { exception: err.message } };
      }

      // Actualizar timestamp de última consulta de la radio
      await supabase
        .from('radios')
        .update({ 
          ultima_actualizacion: new Date().toISOString(),
          verificado: nowPlaying.online 
        })
        .eq('id', radio.id);

      // Si detectamos contenido e identificamos que es un artista / canción monitoreada
      const isMonitoredArtist = matchesAlias(nowPlaying.artist, artistAliases);
      const isMonitoredSong = matchesAlias(nowPlaying.title, trackAliases);
      const mentionsArtistInTitle = matchesAlias(nowPlaying.title, artistAliases);

      // Lógica de coincidencia estricta:
      // 1. Si la radio nos entrega tanto el artista como el título del tema:
      //    Ambos deben coincidir: el artista debe ser Banda Bruna, y el título debe ser una de sus canciones.
      // 2. Si la radio nos entrega solo el título (donde a veces viene el artista junto, ej. "Banda Bruna - Agonía"):
      //    El título debe coincidir con la canción, y además debe mencionar explícitamente a Banda Bruna en el título.
      let isMatch = false;
      if (nowPlaying.online) {
        if (nowPlaying.artist && nowPlaying.title) {
          isMatch = isMonitoredArtist && isMonitoredSong;
        } else if (nowPlaying.title) {
          isMatch = isMonitoredSong && mentionsArtistInTitle;
        }
      }

      if (isMatch) {
        // Encontramos una coincidencia en vivo. Registramos la detección.
        const matchedArtist = (artists || []).find(a => matchesAlias(nowPlaying.artist, a.aliases))?.nombre || nowPlaying.artist || 'Banda Bruna';
        const matchedTrack = (tracks || []).find(t => matchesAlias(nowPlaying.title, t.aliases))?.titulo || nowPlaying.title;

        // Comprobamos qué estaba sonando en now_playing para esta radio
        const { data: currentNp } = await supabase
          .from('now_playing')
          .select('*')
          .eq('radio_id', radio.id)
          .maybeSingle();

        if (currentNp && currentNp.artist === matchedArtist && currentNp.title === matchedTrack) {
          // Sigue sonando la misma canción. Actualizamos updated_at
          await supabase
            .from('now_playing')
            .update({ updated_at: new Date().toISOString() })
            .eq('radio_id', radio.id);
        } else {
          // Nueva detección. Insertamos historial.
          await supabase
            .from('radio_tracks')
            .insert({
              radio_id: radio.id,
              artist: matchedArtist,
              title: matchedTrack,
              metadata_raw: nowPlaying.raw || {},
              stream_url: radio.stream_url
            });

          // Actualizamos el now_playing
          await supabase
            .from('now_playing')
            .upsert({
              radio_id: radio.id,
              artist: matchedArtist,
              title: matchedTrack,
              artwork: nowPlaying.artwork || null,
              started_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        results.push({ radio: radio.nombre, status: 'DETECTION', artist: matchedArtist, track: matchedTrack });
      } else {
        // Si no está sonando en este segundo exacto, verificar si sonó hace poco en el historial reciente (ej. Emisora.cl)
        let historyDetected = false;
        if (nowPlaying.history && nowPlaying.history.length > 0) {
          for (const prevItem of nowPlaying.history) {
            const hArtistMatch = matchesAlias(prevItem.artist, artistAliases);
            const hSongMatch = matchesAlias(prevItem.title, trackAliases);
            const hMentionsArtist = matchesAlias(prevItem.title, artistAliases);

            if ((hArtistMatch && hSongMatch) || (hSongMatch && hMentionsArtist)) {
              const matchedArtist = (artists || []).find(a => matchesAlias(prevItem.artist, a.aliases))?.nombre || prevItem.artist || 'Banda Bruna';
              const matchedTrack = (tracks || []).find(t => matchesAlias(prevItem.title, t.aliases))?.titulo || prevItem.title;

              // Ventana de 30 minutos para no duplicar detecciones recientes
              const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
              const { data: recentPlays } = await supabase
                .from('radio_tracks')
                .select('id')
                .eq('radio_id', radio.id)
                .eq('title', matchedTrack)
                .gte('detected_at', thirtyMinsAgo)
                .limit(1);

              if (!recentPlays || recentPlays.length === 0) {
                await supabase
                  .from('radio_tracks')
                  .insert({
                    radio_id: radio.id,
                    artist: matchedArtist,
                    title: matchedTrack,
                    metadata_raw: { source: 'emisora.cl_history', ...prevItem },
                    stream_url: radio.stream_url
                  });

                results.push({ radio: radio.nombre, status: 'HISTORY_DETECTION', artist: matchedArtist, track: matchedTrack });
                historyDetected = true;
              }
              break;
            }
          }
        }

        // Limpiar now_playing si no está sonando en vivo actualmente
        const { data: currentNp } = await supabase
          .from('now_playing')
          .select('*')
          .eq('radio_id', radio.id)
          .maybeSingle();

        if (currentNp && currentNp.artist) {
          await supabase
            .from('now_playing')
            .update({
              artist: null,
              title: null,
              artwork: null,
              updated_at: new Date().toISOString()
            })
            .eq('radio_id', radio.id);
        }

        if (!historyDetected) {
          results.push({ radio: radio.nombre, status: nowPlaying.online ? 'NO_MATCH' : 'OFFLINE' });
        }
      }
    });

    await Promise.all(scanPromises);

    return new Response(JSON.stringify({ success: true, processed: radios?.length || 0, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
