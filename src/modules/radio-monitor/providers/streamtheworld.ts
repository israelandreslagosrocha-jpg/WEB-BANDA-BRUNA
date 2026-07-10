import type { NowPlayingResult } from '../types';
import { type RadioMetadataProvider, cleanMetadataText } from './baseProvider';

export class StreamTheWorldProvider implements RadioMetadataProvider {
  async getNowPlaying(streamUrl: string, metadataUrl?: string): Promise<NowPlayingResult> {
    const stationCode = this.extractStationCode(streamUrl, metadataUrl);
    if (!stationCode) {
      return { artist: '', title: '', online: false, raw: { error: 'No station code found' } };
    }

    const apiUrl = `https://playerservices.streamtheworld.com/public/nowplaying?station=${stationCode}`;

    try {
      const response = await fetch(apiUrl, {
        signal: AbortSignal.timeout(4000)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const xmlText = await response.text();
      return this.parseXml(xmlText);
    } catch (error: any) {
      return {
        artist: '',
        title: '',
        online: false,
        raw: { error: error.message }
      };
    }
  }

  private extractStationCode(streamUrl: string, metadataUrl?: string): string {
    if (metadataUrl) {
      // Si el usuario nos provee el código directamente en metadataUrl o una URL
      try {
        const parsed = new URL(metadataUrl);
        const code = parsed.searchParams.get('station');
        if (code) return code;
      } catch {}
      return metadataUrl; // Si no es una URL, asumimos que es el código de estación directamente
    }

    // Intentamos extraer el código de estación de la URL del stream
    // Las URLs de StreamTheWorld suelen ser: https://<server>.streamtheworld.com/audio/<STATION_CODE>.mp3
    try {
      const parsed = new URL(streamUrl);
      const pathname = parsed.pathname; // ej: /audio/CORAZONAAC.mp3 o /CORAZON
      const parts = pathname.split('/');
      const lastPart = parts[parts.length - 1];
      const code = lastPart.replace('.mp3', '').replace('.aac', '');
      return code || '';
    } catch {
      return '';
    }
  }

  private parseXml(xmlText: string): NowPlayingResult {
    // Triton XML estructura aproximada:
    // <nowplaying ...>
    //   <property name="cue_title">Ahogado en un Bar</property>
    //   <property name="cue_artist">Banda Bruna</property>
    //   ...
    // </nowplaying>
    
    // Usamos expresiones regulares para extraer de forma eficiente y sin dependencias pesadas
    const titleRegex = /name="cue_title"[^>]*>([^<]+)/i;
    const artistRegex = /name="cue_artist"[^>]*>([^<]+)/i;

    const titleMatch = xmlText.match(titleRegex);
    const artistMatch = xmlText.match(artistRegex);

    const title = titleMatch ? titleMatch[1] : '';
    const artist = artistMatch ? artistMatch[1] : '';

    // Si no coincide, buscamos el formato alternativo <track><title>...</title><artist>...</artist></track>
    if (!title && !artist) {
      const altTitleRegex = /<title>([^<]+)<\/title>/i;
      const altArtistRegex = /<artist>([^<]+)<\/artist>/i;
      
      const altTitleMatch = xmlText.match(altTitleRegex);
      const altArtistMatch = xmlText.match(altArtistRegex);

      return {
        artist: cleanMetadataText(altArtistMatch ? altArtistMatch[1] : ''),
        title: cleanMetadataText(altTitleMatch ? altTitleMatch[1] : ''),
        online: !!altTitleMatch,
        raw: { xml: xmlText }
      };
    }

    return {
      artist: cleanMetadataText(artist),
      title: cleanMetadataText(title),
      online: !!title,
      raw: { xml: xmlText }
    };
  }
}
