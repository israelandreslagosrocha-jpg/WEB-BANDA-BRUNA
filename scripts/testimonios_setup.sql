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

-- Los visitantes sólo pueden crear testimonios pendientes, con tamaño acotado.
create policy "Inserción pública de testimonios" on public.testimonios
  for insert to anon with check (
    aprobado = false
    and char_length(trim(nombre_cliente)) between 2 and 80
    and char_length(trim(contenido)) between 10 and 1200
    and (cargo_cliente is null or char_length(trim(cargo_cliente)) <= 100)
    and (organizacion_cliente is null or char_length(trim(organizacion_cliente)) <= 140)
    and calificacion between 1 and 5
  );

-- Administrador tiene acceso completo (contacto@bandabruna.cl)
create policy "Administrador testimonios completo" on public.testimonios
  for all using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');
