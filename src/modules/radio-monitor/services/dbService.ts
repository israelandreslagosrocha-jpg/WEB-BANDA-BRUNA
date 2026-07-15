import { supabase } from '../../../services/supabaseClient.js';
import type { Radio, RadioTrack, NowPlaying, MonitoredArtist, MonitoredTrack, StatsOverview, SystemHealth } from '../types';

export class DbService {
  /**
   * Obtiene la lista de radios registradas.
   */
  async getRadios(onlyActive = true): Promise<Radio[]> {
    let query = supabase
      .from('radios')
      .select('*, radio_providers(nombre)');

    if (onlyActive) {
      query = query.eq('activo', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(r => ({
      ...r,
      provider_name: r.radio_providers?.nombre || 'Otro'
    }));
  }

  /**
   * Obtiene todos los artistas bajo monitoreo con sus alias.
   */
  async getMonitoredArtists(): Promise<MonitoredArtist[]> {
    const { data, error } = await supabase
      .from('monitored_artists')
      .select('*')
      .eq('activo', true);

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene todas las canciones bajo monitoreo con sus alias.
   */
  async getMonitoredTracks(): Promise<MonitoredTrack[]> {
    const { data, error } = await supabase
      .from('monitored_tracks')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtiene las canciones que están sonando actualmente en vivo (Now Playing).
   */
  async getNowPlaying(): Promise<NowPlaying[]> {
    const { data, error } = await supabase
      .from('now_playing')
      .select('*, radios(nombre, logo_url, stream_url)');

    if (error) throw error;

    return (data || []).map(np => ({
      radio_id: np.radio_id,
      artist: np.artist,
      title: np.title,
      artwork: np.artwork,
      started_at: np.started_at,
      updated_at: np.updated_at,
      radio_name: np.radios?.nombre,
      radio_logo: np.radios?.logo_url,
      stream_url: np.radios?.stream_url
    }));
  }

  /**
   * Obtiene el historial reciente de detecciones.
   */
  async getRecentHistory(limit = 50, filters?: { radioId?: string; search?: string }): Promise<RadioTrack[]> {
    let query = supabase
      .from('radio_tracks')
      .select('*, radios(nombre, logo_url)')
      .order('detected_at', { ascending: false });

    if (filters?.radioId) {
      query = query.eq('radio_id', filters.radioId);
    }

    if (filters?.search) {
      // Búsqueda insensible a mayúsculas por artista o título
      query = query.or(`artist.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id,
      radio_id: t.radio_id,
      artist: t.artist,
      title: t.title,
      metadata_raw: t.metadata_raw,
      stream_url: t.stream_url,
      detected_at: t.detected_at,
      radio_name: t.radios?.nombre,
      radio_logo: t.radios?.logo_url
    }));
  }

  /**
   * Registra una detección en el historial y actualiza el Now Playing.
   * Evita duplicar inserciones si la canción ya estaba sonando.
   */
  async registerDetection(radioId: string, artist: string, title: string, metadataRaw?: any, streamUrl?: string): Promise<boolean> {
    // 1. Verificar el estado actual en now_playing
    const { data: current, error: currentError } = await supabase
      .from('now_playing')
      .select('*')
      .eq('radio_id', radioId)
      .maybeSingle();

    if (currentError) throw currentError;

    const cleanArtist = artist.trim();
    const cleanTitle = title.trim();

    // 2. Si ya estaba sonando exactamente la misma canción, solo actualizamos el timestamp de actualización
    if (current && current.artist === cleanArtist && current.title === cleanTitle) {
      const { error: updateError } = await supabase
        .from('now_playing')
        .update({ updated_at: new Date().toISOString() })
        .eq('radio_id', radioId);

      if (updateError) throw updateError;
      return false; // Retornamos false indicando que no fue un registro "nuevo"
    }

    // 3. Si es una canción nueva o diferente, la insertamos en el historial (radio_tracks)
    const { error: insertError } = await supabase
      .from('radio_tracks')
      .insert({
        radio_id: radioId,
        artist: cleanArtist,
        title: cleanTitle,
        metadata_raw: metadataRaw,
        stream_url: streamUrl
      });

    if (insertError) throw insertError;

    // 4. Actualizamos el estado actual en now_playing (haciendo un upsert)
    const { error: upsertError } = await supabase
      .from('now_playing')
      .upsert({
        radio_id: radioId,
        artist: cleanArtist,
        title: cleanTitle,
        artwork: metadataRaw?.artwork || null,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (upsertError) throw upsertError;
    return true; // Retornamos true indicando que es una nueva detección histórica
  }

  /**
   * Limpia el now_playing de una radio si pasa a estar offline o cambia a otro tema no monitoreado.
   */
  async clearNowPlaying(radioId: string): Promise<void> {
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

  /**
   * Genera estadísticas consolidadas del sistema.
   */
  async getStats(): Promise<StatsOverview> {
    // Total reproducciones
    const { count: totalDetections, error: countError } = await supabase
      .from('radio_tracks')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Conteo de radios activas vs inactivas
    const { data: radios, error: radiosError } = await supabase
      .from('radios')
      .select('activo, verificado');

    if (radiosError) throw radiosError;

    const activeRadiosCount = radios.filter(r => r.activo).length;
    const offlineRadiosCount = radios.filter(r => r.activo && r.verificado === false).length;

    // Ranking de canciones monitoreadas más sonadas (Top 10)
    const { data: trackStats, error: trackStatsError } = await supabase
      .rpc('get_track_stats_ranking'); // Nota: Si no existe el rpc, lo calcularemos por código o proveeremos una consulta alternativa
    
    let detectionsByTrack: { title: string; count: number }[] = [];
    if (!trackStatsError && trackStats) {
      detectionsByTrack = trackStats;
    } else {
      // Consulta fallback utilizando JS grouping si RPC falla
      const { data: rawTracks } = await supabase.from('radio_tracks').select('title');
      const counts = (rawTracks || []).reduce((acc: any, curr) => {
        acc[curr.title] = (acc[curr.title] || 0) + 1;
        return acc;
      }, {});
      detectionsByTrack = Object.entries(counts)
        .map(([title, count]) => ({ title, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // Ranking de radios más activas (Top 10)
    let detectionsByRadio: { name: string; count: number }[] = [];
    const { data: rawRadioTracks } = await supabase
      .from('radio_tracks')
      .select('radios(nombre)');
    
    const radioCounts = (rawRadioTracks || []).reduce((acc: any, curr: any) => {
      const name = curr.radios?.nombre || 'Desconocida';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    
    detectionsByRadio = Object.entries(radioCounts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalDetections: totalDetections || 0,
      activeRadiosCount,
      offlineRadiosCount,
      detectionsByTrack,
      detectionsByRadio,
      detectionsByRegion: [], // Expandible en analítica futura
      detectionsByHour: [] // Expandible
    };
  }

  /**
   * Obtiene la información sobre salud del sistema.
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const { data: radios, error } = await supabase
      .from('radios')
      .select('id, nombre, stream_url, verificado, ultima_actualizacion')
      .eq('activo', true);

    if (error) throw error;

    // Filtramos las radios que no se han actualizado en los últimos 5 minutos como "offline" o "con problemas de consulta"
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const offlineRadios = (radios || [])
      .filter(r => {
        const lastUpdate = r.ultima_actualizacion ? new Date(r.ultima_actualizacion) : null;
        return !lastUpdate || lastUpdate < fiveMinutesAgo;
      })
      .map(r => ({
        id: r.id,
        nombre: r.nombre,
        streamUrl: r.stream_url,
        lastOnline: r.ultima_actualizacion || 'Nunca'
      }));

    return {
      lastSync: new Date().toISOString(),
      activeCron: true,
      totalErrors: offlineRadios.length,
      recentErrors: [],
      offlineRadios
    };
  }
}

export const dbService = new DbService();
