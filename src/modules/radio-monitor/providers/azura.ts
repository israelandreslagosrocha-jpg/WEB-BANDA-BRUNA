import type { NowPlayingResult } from '../types';
import { type RadioMetadataProvider, cleanMetadataText } from './baseProvider';

export class AzuraCastProvider implements RadioMetadataProvider {
  async getNowPlaying(streamUrl: string, metadataUrl?: string): Promise<NowPlayingResult> {
    // Para AzuraCast, si no se especifica metadataUrl, intentamos inferir el endpoint /api/nowplaying
    const apiUrl = metadataUrl || this.getApiUrl(streamUrl);

    try {
      const response = await fetch(apiUrl, {
        signal: AbortSignal.timeout(4000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      // Estructura de AzuraCast /api/nowplaying
      // Si la URL es la general (devuelve un array de estaciones)
      let stationData = data;
      if (Array.isArray(data)) {
        // Buscamos la estación que coincida con el slug o tomamos la primera
        stationData = data[0];
      }

      const nowPlaying = stationData?.now_playing;
      if (!nowPlaying) {
        return { artist: '', title: '', online: false, raw: data };
      }

      return {
        artist: cleanMetadataText(nowPlaying.song?.artist || ''),
        title: cleanMetadataText(nowPlaying.song?.title || ''),
        artwork: nowPlaying.song?.art || undefined,
        online: !!stationData?.station?.mounts?.[0]?.is_up || true,
        raw: data
      };
    } catch (error: any) {
      return {
        artist: '',
        title: '',
        online: false,
        raw: { error: error.message }
      };
    }
  }

  private getApiUrl(streamUrl: string): string {
    try {
      const parsed = new URL(streamUrl);
      // AzuraCast comúnmente tiene la API en el mismo dominio
      // Intentamos resolver /api/nowplaying
      parsed.pathname = '/api/nowplaying';
      parsed.search = '';
      return parsed.toString();
    } catch {
      return streamUrl + '/api/nowplaying';
    }
  }
}
