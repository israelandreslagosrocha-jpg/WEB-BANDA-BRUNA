import type { NowPlayingResult } from '../types';

export interface RadioMetadataProvider {
  /**
   * Obtiene la canción actual del servidor de streaming.
   * @param streamUrl URL de reproducción de audio.
   * @param metadataUrl URL específica para consulta de metadatos (opcional).
   */
  getNowPlaying(streamUrl: string, metadataUrl?: string): Promise<NowPlayingResult>;
}

/**
 * Limpia y normaliza texto de artista y canción (quita espacios extras, etc.).
 */
export function cleanMetadataText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .trim();
}
