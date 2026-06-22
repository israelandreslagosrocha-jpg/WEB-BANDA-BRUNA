-- SCRIPT DE SEGURIDAD Y TABLAS COMPLEMENTARIAS - DASHBOARD BANDA BRUNA 2.0

-- 1. Crear tabla de logs de actividad (Auditoría)
create table if not exists public.logs_actividad (
  id uuid primary key default gen_random_uuid(),
  usuario_email text not null,
  accion text not null,
  created_at timestamptz default now()
);

-- 2. Habilitar RLS en logs_actividad
alter table public.logs_actividad enable row level security;

-- 3. Eliminar políticas previas para evitar conflictos de sobreescritura
drop policy if exists "Permitir lectura publica de noticias" on public.noticias;
drop policy if exists "Lectura pública de noticias" on public.noticias;
drop policy if exists "Lectura pública de eventos" on public.eventos;
drop policy if exists "Lectura pública de integrantes" on public.integrantes;
drop policy if exists "Lectura pública de equipo técnico" on public.equipo_tecnico;
drop policy if exists "Lectura pública de configuracion" on public.configuracion;
drop policy if exists "Inserción pública de contactos" on public.contactos;
drop policy if exists "Inserción pública de cotizaciones" on public.cotizaciones;
drop policy if exists "Permitir insercion publica de cotizaciones" on public.cotizaciones;

-- 4. POLÍTICAS DE ACCESO EXCLUSIVAS PARA ADMINISTRADOR (contacto@bandabruna.cl)

-- Noticias
create policy "Lectura pública de noticias" on public.noticias for select using (publicado = true);
create policy "Administrador noticias completo" on public.noticias 
  using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- Eventos
create policy "Lectura pública de eventos" on public.eventos for select using (publicado = true);
create policy "Administrador eventos completo" on public.eventos 
  using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- Integrantes
create policy "Lectura pública de integrantes" on public.integrantes for select using (activo = true);
create policy "Administrador integrantes completo" on public.integrantes 
  using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- Equipo Técnico
create policy "Lectura pública de equipo técnico" on public.equipo_tecnico for select using (activo = true);
create policy "Administrador equipo técnico completo" on public.equipo_tecnico 
  using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- Configuración
create policy "Lectura pública de configuracion" on public.configuracion for select using (true);
create policy "Administrador configuracion completo" on public.configuracion 
  using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- Contactos
create policy "Inserción pública de contactos" on public.contactos for insert with check (true);
create policy "Administrador contactos completo" on public.contactos 
  using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- Cotizaciones
create policy "Inserción pública de cotizaciones" on public.cotizaciones for insert with check (true);
create policy "Administrador cotizaciones completo" on public.cotizaciones 
  using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');

-- Logs de Actividad (Solo el administrador lee y escribe)
create policy "Administrador logs completo" on public.logs_actividad 
  using (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl')
  with check (auth.jwt() ->> 'email' = 'contacto@bandabruna.cl');
