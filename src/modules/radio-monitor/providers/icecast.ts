import type { NowPlayingResult } from '../types';
import { type RadioMetadataProvider, cleanMetadataText } from './baseProvider';

export class IcecastProvider implements RadioMetadataProvider {
  async getNowPlaying(streamUrl: string, metadataUrl?: string): Promise<NowPlayingResult> {
    const urlToFetch = metadataUrl || this.getJsonUrl(streamUrl);

    try {
      const response = await fetch(urlToFetch, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000) // Timeout de 4 segundos
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      return this.parseJson(data, streamUrl);
    } catch (error: any) {
      // Si falla status-json, intentamos una estrategia de fallback leyendo cabeceras HTTP del stream directo
      return await this.fallbackHeadersCheck(streamUrl, error);
    }
  }

  private getJsonUrl(streamUrl: string): string {
    try {
      const parsed = new URL(streamUrl);
      // Reemplazamos el path por status-json.xsl
      parsed.pathname = '/status-json.xsl';
      parsed.search = '';
      return parsed.toString();
    } catch {
      return streamUrl + '/status-json.xsl';
    }
  }

  private parseJson(data: any, streamUrl: string): NowPlayingResult {
    let titleString = '';
    let artist = '';
    let song = '';

    const sources = data?.icestats?.source;
    if (!sources) {
      return { artist: '', title: '', online: false, raw: data };
    }

    // Si hay múltiples fuentes, sources es un array
    if (Array.isArray(sources)) {
      // Intentamos buscar la fuente que coincida con nuestro stream o tomamos la primera
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

    // Si vienen artista y canción separados
    if (artist && song) {
      return {
        artist: cleanMetadataText(artist),
        title: cleanMetadataText(song),
        online: true,
        raw: data
      };
    }

    // Si viene todo en una sola cadena "Artista - Canción"
    if (titleString && titleString.includes(' - ')) {
      const parts = titleString.split(' - ');
      return {
        artist: cleanMetadataText(parts[0]),
        title: cleanMetadataText(parts.slice(1).join(' - ')),
        online: true,
        raw: data
      };
    }

    return {
      artist: '',
      title: cleanMetadataText(titleString || song),
      online: !!titleString,
      raw: data
    };
  }

  private async fallbackHeadersCheck(streamUrl: string, originalError: any): Promise<NowPlayingResult> {
    try {
      // Hacemos una petición HEAD al stream para validar si está online
      const response = await fetch(streamUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        // Extraemos metadatos básicos de cabeceras ICY si estuvieran presentes
        const icyName = response.headers.get('icy-name') || '';
        const contentType = response.headers.get('content-type') || '';
        
        return {
          artist: '',
          title: icyName ? `Streaming: ${icyName}` : 'Transmisión Online',
          online: contentType.startsWith('audio/') || response.ok,
          raw: { fallback: 'HEAD request success', originalError: originalError.message }
        };
      }
    } catch {}

    return {
      artist: '',
      title: '',
      online: false,
      raw: { error: originalError.message }
    };
  }
}
