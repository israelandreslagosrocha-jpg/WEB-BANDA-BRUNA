-- SCRIPT PARA CREAR LA TABLA DE CAMPAÑAS DESTACADAS - BANDA BRUNA

-- 1. Crear tabla featured_campaigns
create table if not exists public.featured_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  button_text text not null default 'SOLICITAR COTIZACIÓN',
  button_url text not null default '/eventos/fiestas-patrias',
  active boolean not null default true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Habilitar Row Level Security (RLS)
alter table public.featured_campaigns enable row level security;

-- 3. Eliminar políticas previas para evitar duplicados
drop policy if exists "Lectura pública de campañas destacadas" on public.featured_campaigns;
drop policy if exists "Administrador campañas completo" on public.featured_campaigns;

-- 4. Crear política de lectura pública (cualquier usuario lee campañas activas en rango de fechas)
create policy "Lectura pública de campañas destacadas" on public.featured_campaigns
  for select using (
    active = true 
    and (start_date is null or start_date <= now())
    and (end_date is null or end_date >= now())
  );

-- 5. Crear política de escritura/administración para el correo administrador
create policy "Administrador campañas completo" on public.featured_campaigns
  for all using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- 6. Insertar campaña inicial activa de Fiestas Patrias 2026
insert into public.featured_campaigns (
  title, 
  subtitle, 
  image_url, 
  button_text, 
  button_url, 
  active, 
  start_date, 
  end_date
) values (
  'CONTRATA BANDA BRUNA PARA FIESTAS PATRIAS 2026',
  'Música en vivo para fondas, municipalidades, empresas y celebraciones privadas en todo Chile.',
  'https://res.cloudinary.com/dhgifjpkh/image/upload/v1781892645/compressed_PORTADA-01_nxu3ws.webp',
  'SOLICITAR COTIZACIÓN',
  '/eventos/fiestas-patrias',
  true,
  null,
  null
) on conflict do nothing;
