-- SCRIPT PARA CREAR LA TABLA DE COMENTARIOS DE LANZAMIENTOS - BANDA BRUNA
-- Ejecutar esta consulta en el SQL Editor de Supabase (https://supabase.com)

-- 1. Crear tabla comentarios_lanzamientos
create table if not exists public.comentarios_lanzamientos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ciudad text, -- Opcional (ej: "Temuco", "Santiago")
  comentario text not null,
  calificacion integer default 5 check (calificacion >= 1 and calificacion <= 5),
  aprobado boolean not null default false,
  lanzamiento_slug text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Habilitar Row Level Security (RLS)
alter table public.comentarios_lanzamientos enable row level security;

-- 3. Eliminar políticas previas para evitar duplicados en re-ejecuciones
drop policy if exists "Lectura pública de comentarios aprobados" on public.comentarios_lanzamientos;
drop policy if exists "Inserción pública de comentarios" on public.comentarios_lanzamientos;
drop policy if exists "Administrador comentarios completo" on public.comentarios_lanzamientos;

-- 4. Crear políticas de acceso
-- Lectura pública para comentarios aprobados
create policy "Lectura pública de comentarios aprobados" on public.comentarios_lanzamientos
  for select using (aprobado = true);

-- Inserción pública para que los fans puedan comentar desde la landing
create policy "Inserción pública de comentarios" on public.comentarios_lanzamientos
  for insert with check (true);

-- Administrador tiene acceso completo (contacto@bandabruna.cl)
create policy "Administrador comentarios completo" on public.comentarios_lanzamientos
  for all using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');
