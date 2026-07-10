import type { NowPlayingResult } from '../types';
import { type RadioMetadataProvider, cleanMetadataText } from './baseProvider';

export class ShoutcastProvider implements RadioMetadataProvider {
  async getNowPlaying(streamUrl: string, metadataUrl?: string): Promise<NowPlayingResult> {
    const statsUrl = metadataUrl || this.getStatsUrl(streamUrl);

    try {
      // Intentamos obtener JSON del endpoint /stats de Shoutcast v2
      const response = await fetch(statsUrl + '?json=1', {
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const data = await response.json();
        const title = data.songtitle || '';
        return this.parseTitle(title, data);
      }
      throw new Error('Stats JSON not available');
    } catch (v2Error: any) {
      // Fallback a Shoutcast v1 /7.html
      return await this.fetchV1Stats(streamUrl, v2Error);
    }
  }

  private getStatsUrl(streamUrl: string): string {
    try {
      const parsed = new URL(streamUrl);
      parsed.pathname = '/stats';
      parsed.search = '';
      return parsed.toString();
    } catch {
      return streamUrl + '/stats';
    }
  }

  private parseTitle(title: string, rawData: any): NowPlayingResult {
    if (!title) {
      return { artist: '', title: '', online: false, raw: rawData };
    }

    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      return {
        artist: cleanMetadataText(parts[0]),
        title: cleanMetadataText(parts.slice(1).join(' - ')),
        online: true,
        raw: rawData
      };
    }

    return {
      artist: '',
      title: cleanMetadataText(title),
      online: true,
      raw: rawData
    };
  }

  private async fetchV1Stats(streamUrl: string, v2Error: any): Promise<NowPlayingResult> {
    try {
      const parsed = new URL(streamUrl);
      parsed.pathname = '/7.html';
      parsed.search = '';

      const response = await fetch(parsed.toString(), {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.0.0' }, // Algunos Shoutcast bloquean scripts sin user-agent
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const text = await response.text();
        // El formato de 7.html es: <body>1,1,20,9999,15,128,Artista - Cancion</body>
        const match = text.match(/<body>(.*)<\/body>/i);
        if (match && match[1]) {
          const parts = match[1].split(',');
          if (parts.length >= 7) {
            const title = parts.slice(6).join(',');
            return this.parseTitle(title, { source: '7.html', raw: text });
          }
        }
      }
    } catch {}

    // Si todo falla, asumimos offline o inaccesible
    return {
      artist: '',
      title: '',
      online: false,
      raw: { v2Error: v2Error.message, v1Status: 'Failed or timed out' }
    };
  }
}
