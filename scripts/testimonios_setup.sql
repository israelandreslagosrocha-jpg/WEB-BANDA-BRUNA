-- SCRIPT PARA CREAR LA TABLA DE TESTIMONIOS - BANDA BRUNA

-- 1. Crear tabla testimonios
create table if not exists public.testimonios (
  id uuid primary key default gen_random_uuid(),
  nombre_cliente text not null,
  cargo_cliente text,
  organizacion_cliente text,
  contenido text not null,
  calificacion integer default 5 check (calificacion >= 1 and calificacion <= 5),
  aprobado boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Habilitar Row Level Security (RLS)
alter table public.testimonios enable row level security;

-- 3. Eliminar políticas previas para evitar duplicados
drop policy if exists "Lectura pública de testimonios aprobados" on public.testimonios;
drop policy if exists "Inserción pública de testimonios" on public.testimonios;
drop policy if exists "Administrador testimonios completo" on public.testimonios;

-- 4. Crear políticas de acceso
-- Lectura pública para comentarios aprobados
create policy "Lectura pública de testimonios aprobados" on public.testimonios
  for select using (aprobado = true);

-- Inserción pública para que los clientes puedan enviar comentarios
create policy "Inserción pública de testimonios" on public.testimonios
  for insert with check (true);

-- Administrador tiene acceso completo (contacto@bandabruna.cl)
create policy "Administrador testimonios completo" on public.testimonios
  for all using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');
