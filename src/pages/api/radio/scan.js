import { supabase } from '../../../services/supabaseClient.js';

export const prerender = false;

// 1. UTILIDADES Y MATCHER DE ALIAS
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesAlias(value, aliases) {
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

function cleanMetadataText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

// 2. PROVEEDORES DE STREAMING
async function getIcecastMetadata(streamUrl, metadataUrl) {
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
  } catch (error) {
    return { artist: '', title: '', online: false, raw: { error: error.message } };
  }
}

async function getShoutcastMetadata(streamUrl, metadataUrl) {
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
  } catch (v2Error) {
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

async function getAzuraMetadata(streamUrl, metadataUrl) {
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
  } catch (error) {
    return { artist: '', title: '', online: false, raw: { error: error.message } };
  }
}

async function getStreamTheWorldMetadata(streamUrl, metadataUrl) {
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
  } catch (error) {
    return { artist: '', title: '', online: false, raw: { error: error.message } };
  }
}

// 3. HANDLER PRINCIPAL DE LA API ROUTE
export async function GET({ request }) {
  try {
    console.log('Iniciando escaneo del Radio Monitor...');

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

    const artistAliases = (artists || []).flatMap(a => a.aliases || []);
    const trackAliases = (tracks || []).flatMap(t => t.aliases || []);

    const results = [];

    // 4. Procesar radios en paralelo
    const scanPromises = (radios || []).map(async (radio) => {
      const provider = radio.radio_providers?.nombre;
      let nowPlaying = { artist: '', title: '', online: false, raw: null, artwork: null };

      try {
        if (provider === 'Icecast') {
          nowPlaying = await getIcecastMetadata(radio.stream_url, radio.metadata_url);
        } else if (provider === 'Shoutcast') {
          nowPlaying = await getShoutcastMetadata(radio.stream_url, radio.metadata_url);
        } else if (provider === 'AzuraCast') {
          nowPlaying = await getAzuraMetadata(radio.stream_url, radio.metadata_url);
        } else if (provider === 'StreamTheWorld') {
          nowPlaying = await getStreamTheWorldMetadata(radio.stream_url, radio.metadata_url);
        } else {
          nowPlaying = await getIcecastMetadata(radio.stream_url, radio.metadata_url);
        }
      } catch (err) {
        nowPlaying = { artist: '', title: '', online: false, raw: { exception: err.message }, artwork: null };
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
      // 1. Si la radio nos entrega tanto el artista como el título:
      //    Ambos deben coincidir (el artista debe ser Banda Bruna y la canción una de sus canciones).
      // 2. Si la radio nos entrega solo el título:
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
        // Encontramos una coincidencia. Registramos la detección.
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
        // No está sonando nada monitoreado o la radio está caída.
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

        results.push({ radio: radio.nombre, status: nowPlaying.online ? 'NO_MATCH' : 'OFFLINE' });
      }
    });

    await Promise.all(scanPromises);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: radios?.length || 0, 
      results 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al escanear radios:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
