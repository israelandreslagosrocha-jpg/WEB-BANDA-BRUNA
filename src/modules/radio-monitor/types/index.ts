export interface RadioProvider {
  id: number;
  nombre: 'Icecast' | 'Shoutcast' | 'StreamTheWorld' | 'AzuraCast' | 'Otro';
  descripcion?: string;
  created_at?: string;
}

export interface Radio {
  id: string;
  nombre: string;
  slug: string;
  pais: string;
  region?: string;
  ciudad?: string;
  logo_url?: string;
  sitio_web?: string;
  stream_url: string;
  metadata_url?: string;
  provider_id: number;
  bitrate?: number;
  formato: string;
  activo: boolean;
  verificado: boolean;
  ultima_actualizacion?: string;
  created_at?: string;
  // Campos agregados por joins
  provider_name?: string;
}

export interface MonitoredArtist {
  id: string;
  nombre: string;
  aliases: string[];
  activo: boolean;
  created_at?: string;
}

export interface MonitoredTrack {
  id: string;
  artist_id: string;
  titulo: string;
  aliases: string[];
  created_at?: string;
}

export interface RadioTrack {
  id: string;
  radio_id: string;
  artist: string;
  title: string;
  metadata_raw?: any;
  stream_url?: string;
  detected_at: string;
  // Joins
  radio_name?: string;
  radio_logo?: string;
}

export interface NowPlaying {
  radio_id: string;
  artist: string;
  title: string;
  artwork?: string;
  started_at: string;
  updated_at: string;
  // Joins
  radio_name?: string;
  radio_logo?: string;
  stream_url?: string;
}

// Interfaz que devuelven los proveedores de streaming
export interface NowPlayingResult {
  artist: string;
  title: string;
  artwork?: string;
  raw?: any;
  online: boolean;
}

// Estructura de estadísticas para el Dashboard
export interface StatsOverview {
  totalDetections: number;
  activeRadiosCount: number;
  offlineRadiosCount: number;
  detectionsByTrack: { title: string; count: number }[];
  detectionsByRadio: { name: string; count: number }[];
  detectionsByRegion: { region: string; count: number }[];
  detectionsByHour: { hour: number; count: number }[];
}

// Estado de salud del sistema
export interface SystemHealth {
  lastSync: string;
  activeCron: boolean;
  totalErrors: number;
  recentErrors: { radio: string; error: string; time: string }[];
  offlineRadios: { id: string; nombre: string; streamUrl: string; lastOnline: string }[];
}
