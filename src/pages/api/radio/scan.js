import {
  authenticateAdminRequest,
  createServiceSupabaseClient,
  isValidCronRequest,
  jsonResponse
} from '../../../services/serverAuth.js';

export const prerender = false;
import { createMetadataReader } from '../../../modules/radio-monitor/services/metadataReader.js';

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
      if (` ${normalizedValue} `.includes(` ${normalizedAlias} `)) {
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

// Una respuesta de metadata puede llegar retrasada respecto del audio real. Antes de
// anunciar una canción como "en vivo", exigimos una segunda lectura coherente.
const LIVE_CONFIRMATION_DELAY_MS = 12 * 1000;

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getMonitoredMatch(nowPlaying, artists, tracks, artistAliases, trackAliases) {
  if (!nowPlaying.online) return null;

  const isMonitoredArtist = matchesAlias(nowPlaying.artist, artistAliases);
  const isMonitoredSong = matchesAlias(nowPlaying.title, trackAliases);
  const mentionsArtistInTitle = matchesAlias(nowPlaying.title, artistAliases);
  const isMatch = nowPlaying.artist && nowPlaying.title
    ? isMonitoredArtist && isMonitoredSong
    : nowPlaying.title && isMonitoredSong && mentionsArtistInTitle;

  if (!isMatch) return null;

  return {
    artist: (artists || []).find(artist => matchesAlias(nowPlaying.artist, [artist.nombre, ...(artist.aliases || [])]))?.nombre
      || nowPlaying.artist
      || 'Banda Bruna',
    title: (tracks || []).find(track => matchesAlias(nowPlaying.title, [track.titulo, ...(track.aliases || [])]))?.titulo
      || nowPlaying.title
  };
}

function isSamePlayback(first, second) {
  return first && second
    && normalizeText(first.artist) === normalizeText(second.artist)
    && normalizeText(first.title) === normalizeText(second.title);
}

async function registerRecentDetection(supabase, radio, detection, metadataRaw) {
  // La misma canción no debe multiplicarse en el historial aunque la metadata siga
  // atrasada durante varias ejecuciones.
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const playedAtMs = Number(metadataRaw?.played_at) * 1000;
  const playedAt = Number.isFinite(playedAtMs) && playedAtMs > 0 && playedAtMs <= Date.now()
    ? new Date(playedAtMs).toISOString() : null;
  let recentQuery = supabase
    .from('radio_tracks')
    .select('id')
    .eq('radio_id', radio.id)
    .eq('title', detection.title);
  recentQuery = playedAt ? recentQuery.eq('detected_at', playedAt) : recentQuery.gte('detected_at', thirtyMinsAgo);
  const { data: recentPlays, error: recentPlaysError } = await recentQuery.limit(1);

  if (recentPlaysError) throw recentPlaysError;
  if (recentPlays?.length) return false;

  const { error } = await supabase
    .from('radio_tracks')
    .insert({
      radio_id: radio.id,
      artist: detection.artist,
      title: detection.title,
      metadata_raw: metadataRaw,
      ...(playedAt ? { detected_at: playedAt } : {}),
      stream_url: radio.stream_url
    });

  if (error) throw error;
  return true;
}

async function clearNowPlaying(supabase, radioId) {
  const { data: currentNp, error: currentNpError } = await supabase
    .from('now_playing')
    .select('artist')
    .eq('radio_id', radioId)
    .maybeSingle();

  if (currentNpError) throw currentNpError;
  if (!currentNp?.artist) return;

  const { error } = await supabase
    .from('now_playing')
    .update({
      artist: null,
      title: null,
      artwork: null,
      updated_at: new Date().toISOString()
    })
    .eq('radio_id', radioId);

  if (error) throw error;
}


export async function GET({ request }) {
  // Permite el cron de Vercel o una sesión autenticada del administrador para el disparo manual.
  const isCron = isValidCronRequest(request);
  const admin = isCron ? { authorized: false } : await authenticateAdminRequest(request);
  if (!isCron && !admin.authorized) {
    return jsonResponse({ success: false, error: 'No autorizado' }, 401);
  }

  try {
    // Este endpoint actualiza varias tablas protegidas por RLS; nunca debe usar la clave pública.
    const supabase = createServiceSupabaseClient();

    // 3.2. CONTROL PERSISTENTE DE CONCURRENCIA (Ventana mínima de 60 segundos entre escaneos)
    const COOLDOWN_SECONDS = 60;
    const { data: latestRadio } = await supabase
      .from('radios')
      .select('id, ultima_actualizacion')
      .eq('activo', true)
      .order('ultima_actualizacion', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRadio?.ultima_actualizacion) {
      const lastScanTime = new Date(latestRadio.ultima_actualizacion).getTime();
      const elapsedSeconds = (Date.now() - lastScanTime) / 1000;
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(COOLDOWN_SECONDS - elapsedSeconds);
        return new Response(JSON.stringify({
          success: false,
          error: 'Escaneo en curso o ejecutado recientemente. Espere antes de reintentar.',
          retryAfterSeconds: waitSeconds
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(waitSeconds)
          }
        });
      }
    }

    // Ventana de enfriamiento: no sustituye un bloqueo transaccional de toda la ejecución.
    if (latestRadio?.id) {
      const { error: cooldownError } = await supabase
        .from('radios')
        .update({ ultima_actualizacion: new Date().toISOString() })
        .eq('id', latestRadio.id);
      if (cooldownError) throw cooldownError;
    }

    console.log('Iniciando escaneo autorizado del Radio Monitor...');

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

    const artistAliases = (artists || []).flatMap(a => [a.nombre, ...(a.aliases || [])]);
    const trackAliases = (tracks || []).flatMap(t => [t.titulo, ...(t.aliases || [])]);
    const reader = createMetadataReader();
    const getRadioMetadata = (radio, fresh = false) => reader.get(radio, fresh);
    const startedAt = new Date().toISOString();

    const results = [];

    // 4. Procesar radios en paralelo
    const scanPromises = (radios || []).map(async (radio) => {
      const nowPlaying = await getRadioMetadata(radio);

      if (nowPlaying.status === 'SCAN_TIME_LIMIT') {
        results.push({ radio: radio.nombre, status: nowPlaying.status, error: nowPlaying.raw.error });
        return; // No fingir una consulta ni sobreescribir el último resultado.
      }

      // Actualizar timestamp de última consulta de la radio
      const { error: radioUpdateError } = await supabase
        .from('radios')
        .update({ 
          ultima_actualizacion: new Date().toISOString(),
          verificado: nowPlaying.online 
        })
        .eq('id', radio.id);
      if (radioUpdateError) throw radioUpdateError;

      const firstMatch = getMonitoredMatch(nowPlaying, artists, tracks, artistAliases, trackAliases);

      if (firstMatch) {
        // No guardar candidatos como reproducciones hasta confirmar la segunda lectura.
        await wait(LIVE_CONFIRMATION_DELAY_MS);
        const confirmedNowPlaying = await getRadioMetadata(radio, true);
        const confirmedMatch = getMonitoredMatch(
          confirmedNowPlaying,
          artists,
          tracks,
          artistAliases,
          trackAliases
        );

        if (!isSamePlayback(firstMatch, confirmedMatch)) {
          await clearNowPlaying(supabase, radio.id);
          results.push({
            radio: radio.nombre,
            status: 'UNCONFIRMED_DETECTION',
            artist: firstMatch.artist,
            track: firstMatch.title
          });
          return;
        }

        await registerRecentDetection(supabase, radio, firstMatch, {
          source: 'metadata_confirmed', observation: confirmedNowPlaying.raw || {}
        });

        // Ambas lecturas coinciden: recién ahora puede mostrarse como reproducción en vivo.
        const { data: currentNp, error: currentError } = await supabase
          .from('now_playing')
          .select('*')
          .eq('radio_id', radio.id)
          .maybeSingle();
        if (currentError) throw currentError;

        if (currentNp && currentNp.artist === firstMatch.artist && currentNp.title === firstMatch.title) {
          // Sigue sonando la misma canción. Actualizamos updated_at
          const { error: updateError } = await supabase
            .from('now_playing')
            .update({ updated_at: new Date().toISOString() })
            .eq('radio_id', radio.id);
          if (updateError) throw updateError;
        } else {
          const { error: upsertError } = await supabase
            .from('now_playing')
            .upsert({
              radio_id: radio.id,
              artist: firstMatch.artist,
              title: firstMatch.title,
              artwork: confirmedNowPlaying.artwork || nowPlaying.artwork || null,
              started_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          if (upsertError) throw upsertError;
        }

        results.push({ radio: radio.nombre, status: 'LIVE_CONFIRMED', artist: firstMatch.artist, track: firstMatch.title });
      } else {
        // Si no está sonando en este segundo exacto, verificar si sonó hace poco en el historial reciente (ej. Emisora.cl)
        let historyDetected = false;
        if (nowPlaying.history && nowPlaying.history.length > 0) {
          for (const prevItem of nowPlaying.history) {
            const hArtistMatch = matchesAlias(prevItem.artist, artistAliases);
            const hSongMatch = matchesAlias(prevItem.title, trackAliases);
            const hMentionsArtist = matchesAlias(prevItem.title, artistAliases);

            if ((hArtistMatch && hSongMatch) || (hSongMatch && hMentionsArtist)) {
              const matchedArtist = (artists || []).find(a => matchesAlias(prevItem.artist, [a.nombre, ...(a.aliases || [])]))?.nombre || prevItem.artist || 'Banda Bruna';
              const matchedTrack = (tracks || []).find(t => matchesAlias(prevItem.title, [t.titulo, ...(t.aliases || [])]))?.titulo || prevItem.title;

              const inserted = await registerRecentDetection(
                supabase,
                radio,
                { artist: matchedArtist, title: matchedTrack },
                { source: 'provider_history', ...prevItem }
              );
              historyDetected = true;
              results.push({ radio: radio.nombre, status: 'HISTORY_DETECTION', inserted, artist: matchedArtist, track: matchedTrack });
              break;
            }
          }
        }

        // Una lectura que ya no coincide invalida cualquier estado en vivo previo.
        await clearNowPlaying(supabase, radio.id);

        if (!historyDetected) {
          results.push({ radio: radio.nombre, status: nowPlaying.online ? 'NO_MATCH' : nowPlaying.status,
            metadataStatus: nowPlaying.status, error: nowPlaying.raw?.error || null,
            artist: nowPlaying.artist, track: nowPlaying.title });
        }
      }
    });

    const settled = await Promise.allSettled(scanPromises);
    settled.forEach((outcome, index) => {
      if (outcome.status === 'rejected') results.push({ radio: radios[index].nombre, status: 'DATABASE_ERROR', error: 'No se pudo guardar el resultado' });
    });
    const summary = results.reduce((counts, result) => {
      counts[result.status] = (counts[result.status] || 0) + 1;
      return counts;
    }, {});
    const failedWrites = summary.DATABASE_ERROR || 0;

    return new Response(JSON.stringify({ 
      success: failedWrites === 0,
      processed: radios?.length || 0, 
      startedAt, finishedAt: new Date().toISOString(), requests: reader.requestCount,
      partial: results.some(r => !['NO_MATCH', 'LIVE_CONFIRMED', 'HISTORY_DETECTION', 'UNCONFIRMED_DETECTION'].includes(r.status)),
      summary, results
    }), {
      status: failedWrites ? 500 : 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error interno al escanear radios:', error?.message || error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Error interno durante el procesamiento del escaneo radial' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
