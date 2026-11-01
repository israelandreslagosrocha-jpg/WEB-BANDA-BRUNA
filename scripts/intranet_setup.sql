begin;
create table public.intranet_members (
 email text primary key, name text not null, role text not null check (role in ('miembro','jefatura','director'))
);
insert into public.intranet_members values
('gersonulloa@bandabruna.cl','Gerson Ulloa','miembro'),
('jaimecardenas@bandabruna.cl','Jaime Cárdenas','jefatura'),
('jaimecardenasjr@bandabruna.cl','Jaime Cárdenas Jr.','miembro'),
('vicentenunez@bandabruna.cl','Vicente Núñez','director'),
('israellagos@bandabruna.cl','Israel Lagos','miembro'),
('fabiangarrido@bandabruna.cl','Fabián Garrido','miembro'),
('cesarbruna@bandabruna.cl','César Bruna','jefatura');
create function public.intranet_role() returns text language sql stable security definer set search_path = public as $$
 select case when lower(auth.jwt()->>'email')='contacto@bandabruna.cl' then 'jefatura' else (select role from public.intranet_members where email = lower(auth.jwt()->>'email')) end
$$;
create table public.intranet_outfits (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 150), description text not null default ''
);
create table public.intranet_entries (
 id uuid primary key default gen_random_uuid(), author uuid not null default auth.uid() references auth.users(id),
 author_email text not null default lower(auth.jwt()->>'email'),
 kind text not null check(kind in ('comunicado','evento','ensayo','repertorio','cancion','personal','tenida')),
 title text not null check(length(title) between 1 and 200), body text not null default '',
 rehearsal jsonb not null default '{}'::jsonb check(jsonb_typeof(rehearsal)='object'),
 recipients text[] not null default '{}', starts_at timestamptz, location text not null default '',
 outfit_id uuid references public.intranet_outfits(id), outfit_text text not null default '',
 mix_mode text not null default '' check(mix_mode in ('','secuencia','bruto','mixto')),
 checklist text[] not null default '{}', file_path text, file_name text, file_mime text,
 created_at timestamptz not null default now(),
 check (cardinality(recipients) <= 7), check(kind <> 'personal' or cardinality(recipients)=1), check (cardinality(checklist) <= 50)
);
create index on public.intranet_entries(created_at desc);
create table public.intranet_receipts (
 entry_id uuid references public.intranet_entries(id) on delete cascade, user_id uuid default auth.uid() references auth.users(id),
 read_at timestamptz default now(), completed integer[] not null default '{}', primary key(entry_id,user_id)
);
alter table public.intranet_members enable row level security;
alter table public.intranet_entries enable row level security;
alter table public.intranet_outfits enable row level security;
alter table public.intranet_receipts enable row level security;
create policy members_read on public.intranet_members for select to authenticated using(public.intranet_role() is not null);
create policy outfits_read on public.intranet_outfits for select to authenticated using(public.intranet_role() is not null);
create policy outfits_write on public.intranet_outfits for insert to authenticated with check(public.intranet_role()='jefatura');
create policy entries_read on public.intranet_entries for select to authenticated using(
 public.intranet_role() is not null and (cardinality(recipients)=0 or lower(auth.jwt()->>'email')=any(recipients) or author=auth.uid())
);
create policy entries_write on public.intranet_entries for insert to authenticated with check(
 author=auth.uid() and author_email=lower(auth.jwt()->>'email') and
 (public.intranet_role()='jefatura' or (public.intranet_role()='director' and kind in ('ensayo','repertorio','cancion','personal'))) and
 recipients <@ array['gersonulloa@bandabruna.cl','jaimecardenas@bandabruna.cl','jaimecardenasjr@bandabruna.cl','vicentenunez@bandabruna.cl','israellagos@bandabruna.cl','fabiangarrido@bandabruna.cl','cesarbruna@bandabruna.cl']::text[]
 and (file_path is null or file_path like auth.uid()::text || '/%')
);
create policy receipts_read on public.intranet_receipts for select to authenticated using(user_id=auth.uid() and exists(select 1 from public.intranet_entries where id=entry_id));
create policy receipts_insert on public.intranet_receipts for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.intranet_entries where id=entry_id));
create policy receipts_update on public.intranet_receipts for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.intranet_entries where id=entry_id));
grant select on public.intranet_members to authenticated;
grant select,insert on public.intranet_entries,public.intranet_outfits to authenticated;
grant select,insert,update on public.intranet_receipts to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('intranet','intranet',false,52428800,array['application/pdf','audio/mpeg','audio/wav','audio/x-wav','audio/mp4','audio/ogg','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
create policy intranet_upload on storage.objects for insert to authenticated with check(bucket_id='intranet' and (storage.foldername(name))[1]=auth.uid()::text and public.intranet_role() in ('jefatura','director'));
create policy intranet_file_read on storage.objects for select to authenticated using(bucket_id='intranet' and exists(select 1 from public.intranet_entries e where e.file_path=name));
create policy intranet_file_cleanup on storage.objects for delete to authenticated using(bucket_id='intranet' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
