-- SCRIPT PARA CREAR LA TABLA DE LANZAMIENTOS MUSICALES - BANDA BRUNA

-- 1. Crear tabla public.lanzamientos
create table if not exists public.lanzamientos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'single', -- single, album, videoclip, etc.
  fecha_inicio timestamptz not null default now(),
  fecha_lanzamiento timestamptz not null,
  estado text not null default 'borrador', -- borrador, publicado
  slug text not null unique,
  titulo text not null,
  subtitulo text,
  descripcion text,
  bold_text text,
  color_principal text not null default '#a80b0b', -- Rojo oscuro elegante de Banda Bruna
  color_secundario text not null default '#0e0b0b', -- Fondo oscuro
  imagen_desktop text,
  imagen_mobile text,
  imagen_banner text,
  imagen_compartir text,
  mostrar_home boolean not null default true,
  mostrar_contador boolean not null default true,
  mostrar_plataformas boolean not null default true,
  activar_auto boolean not null default true,
  desactivar_auto boolean not null default false,
  orden integer not null default 0,
  historia text,
  galeria_images text[] default '{}',
  making_of_images text[] default '{}',
  detras_camaras_videos jsonb default '[]'::jsonb, -- Array de objetos { url: string, tipo: 'vertical'|'horizontal', caption: string }
  plataformas_links jsonb default '{}'::jsonb, -- Objeto { youtube: string, spotify: string, apple_music: string, youtube_music: string, amazon_music: string, deezer: string }
  meta_title text,
  meta_description text,
  keywords text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Habilitar Row Level Security (RLS)
alter table public.lanzamientos enable row level security;

-- 3. Eliminar políticas previas para evitar duplicados
drop policy if exists "Lectura pública de lanzamientos publicados" on public.lanzamientos;
drop policy if exists "Administrador lanzamientos completo" on public.lanzamientos;

-- 4. Crear políticas de acceso
-- Lectura pública para lanzamientos publicados que ya entraron en fecha de inicio
create policy "Lectura pública de lanzamientos publicados" on public.lanzamientos
  for select using (
    estado = 'publicado' 
    and fecha_inicio <= now()
  );

-- Administrador tiene acceso completo (contacto@bandabruna.cl)
create policy "Administrador lanzamientos completo" on public.lanzamientos
  for all using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 5. Insertar datos semilla del lanzamiento inicial: "Ahogado en un Bar"
insert into public.lanzamientos (
  nombre,
  tipo,
  fecha_inicio,
  fecha_lanzamiento,
  estado,
  slug,
  titulo,
  subtitulo,
  descripcion,
  color_principal,
  color_secundario,
  imagen_desktop,
  imagen_mobile,
  imagen_banner,
  imagen_compartir,
  mostrar_home,
  mostrar_contador,
  bold_text,
  historia,
  galeria_images,
  making_of_images,
  detras_camaras_videos,
  plataformas_links,
  meta_title,
  meta_description,
  keywords
) values (
  'Ahogado en un Bar',
  'single',
  '2026-06-25 00:00:00-04', -- Ya visible
  '2026-07-04 19:00:00-04', -- Fecha de estreno
  'publicado',
  'ahogado-en-un-bar',
  'AHOGADO EN UN BAR',
  'Nuevo Single & Videoclip Oficial',
  'La escena tropical se enciende con el lanzamiento más esperado del invierno. La Banda Bruna presenta su nuevo tema original grabado en Cervecería Maquehue y Centro de Eventos Araucaria en Padre las Casas.',
  '#e21c1c',
  '#090707',
  'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781892645/compressed_PORTADA-01_nxu3ws.webp',
  'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781892645/compressed_PORTADA-01_nxu3ws.webp',
  'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781892645/compressed_PORTADA-01_nxu3ws.webp',
  'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781892645/compressed_PORTADA-01_nxu3ws.webp',
  true,
  true,
  '¡La espera está por terminar! Descubre la historia detrás de este nuevo éxito tropical de Banda Bruna.',
  '«Ahogado en un bar» nace de la necesidad de contar historias cotidianas a través del contagioso ritmo de la cumbia tropical de Banda Bruna. El proceso creativo comenzó en el sur de Chile, donde combinamos el folclor urbano y la energía de los metales y las percusiones. El rodaje se llevó a cabo en Cervecería Maquehue y Centro de Eventos Araucaria, en la comuna de Padre las Casas, capturando la esencia perfecta y bohemia que la canción relata. Bajo la dirección de Agencia CK, logramos un estándar cinematográfico del cual estamos profundamente orgullosos y ansiosos de compartir.',
  array[
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910903/compressed_IMG_6752_muxcrr.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910902/compressed_IMG_6753_mbptzg.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910901/compressed_IMG_6754_aqr1i8.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910900/compressed_IMG_6755_zrkkil.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910899/compressed_IMG_6756_drc3lc.webp'
  ],
  array[
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910894/compressed_IMG_6760_nuvlrv.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910897/compressed_IMG_6757_ogzsly.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910897/compressed_IMG_6758_navguv.webp',
    'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910896/compressed_IMG_6759_uusspl.webp'
  ],
  '[
    {"url": "https://res.cloudinary.com/dhgifjpkh/video/upload/v1781910507/5d4418d0-6b17-4034-8ddc-58b3ee92db08_ubfdlx.mp4", "tipo": "vertical", "caption": "Grabación de metales en vivo"},
    {"url": "https://res.cloudinary.com/dhgifjpkh/video/upload/v1781910507/757c793c-3f28-4861-8be5-b383b2045af1_ggzjfz.mp4", "tipo": "vertical", "caption": "Detrás de cámaras"}
  ]'::jsonb,
  '{
    "youtube": "https://www.youtube.com/watch?v=mZhYl60ENAs",
    "spotify": "https://open.spotify.com/artist/3QpgBBp8CypsMEM5rgWo7D",
    "apple_music": "https://music.apple.com/cl/artist/banda-bruna/3QpgBBp8CypsMEM5rgWo7D",
    "youtube_music": "https://music.youtube.com/channel/3QpgBBp8CypsMEM5rgWo7D",
    "amazon_music": "https://music.amazon.com/artists/3QpgBBp8CypsMEM5rgWo7D",
    "deezer": "https://www.deezer.com/artist/3QpgBBp8CypsMEM5rgWo7D"
  }'::jsonb,
  'Ahogado en un Bar - Banda Bruna | Próximo Lanzamiento',
  'Descubre la cuenta regresiva, fotos exclusivas del rodaje en Cervecería Maquehue y Centro de Eventos Araucaria, el making of y todos los detalles del nuevo single de Banda Bruna.',
  'banda bruna, ahogado en un bar, cumbia sureña, cerveceria maquehue, centro eventos araucaria, padre las casas, musica chilena, proximo lanzamiento'
)
on conflict (slug) do update set
  nombre = excluded.nombre,
  tipo = excluded.tipo,
  fecha_inicio = excluded.fecha_inicio,
  fecha_lanzamiento = excluded.fecha_lanzamiento,
  estado = excluded.estado,
  titulo = excluded.titulo,
  subtitulo = excluded.subtitulo,
  descripcion = excluded.descripcion,
  bold_text = excluded.bold_text,
  color_principal = excluded.color_principal,
  color_secundario = excluded.color_secundario,
  imagen_desktop = excluded.imagen_desktop,
  imagen_mobile = excluded.imagen_mobile,
  imagen_banner = excluded.imagen_banner,
  imagen_compartir = excluded.imagen_compartir,
  mostrar_home = excluded.mostrar_home,
  mostrar_contador = excluded.mostrar_contador,
  historia = excluded.historia,
  galeria_images = excluded.galeria_images,
  making_of_images = excluded.making_of_images,
  detras_camaras_videos = excluded.detras_camaras_videos,
  plataformas_links = excluded.plataformas_links,
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  keywords = excluded.keywords;
