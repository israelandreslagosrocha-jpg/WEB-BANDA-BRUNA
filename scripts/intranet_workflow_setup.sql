-- Aplicar una vez después de intranet_setup.sql e intranet_events_setup.sql.
begin;
create function public.intranet_valid_music_rows(items jsonb) returns boolean language plpgsql immutable set search_path=public as $$
declare r jsonb; seen text[] := '{}'; allowed_ids text[] := array['viking-1','viking-1-01','viking-1-02','viking-1-03','viking-1-04','viking-1-05','viking-1-06','viking-1-07','avikingzao','avikingzao-01','avikingzao-02','avikingzao-03','viking-2','viking-2-01','viking-2-02','viking-2-03','viking-2-04','viking-2-05','viking-2-06','viking-2-07','viking-2-08','viking-3','viking-3-01','viking-3-02','viking-3-03','viking-3-04','viking-3-05','viking-3-06','viking-3-07','viking-3-08','viking-3-09','viking-3-10','viking-3-11','viking-3-12','viking-3-13','viking-4','viking-4-01','viking-4-02','viking-4-03','viking-4-04','viking-4-05','viking-4-06','viking-4-07','viking-valpo','viking-valpo-01','viking-valpo-02','viking-valpo-03','viking-valpo-04','viking-valpo-05','viking-valpo-06','viking-valpo-07','marco-antonio-solis','marco-antonio-solis-01','marco-antonio-solis-02','zalo-reyes','zalo-reyes-01','zalo-reyes-02','leo-dan','leo-dan-01','leo-dan-02','leo-dan-03','leo-dan-04','leo-dan-05','nueva-ola','koky','koky-01','koky-02','eros','vicente','adrian','adrian-01','adrian-02','adrian-03','adrian-04','la-noche','la-noche-01','la-noche-02','antonio-rios','antonio-rios-01','antonio-rios-02','antonio-rios-03','alegria','amar-azul','caricia','chileno','merengue','bruna','bruna-01','bruna-02','bruna-03','agonia','luna-amiga','ahogado','te-juro','no-sufrire','para-no-verte','chupacabras','yo-creia','me-tienes-loco','cuecas','rafaga','tao-tao','alegria-ensayo','intro-2027','outro-2027'];
begin
 if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items)>100 then return false; end if;
 for r in select value from jsonb_array_elements(items) loop
  if jsonb_typeof(r) is distinct from 'object' or not coalesce(r->>'id'=any(allowed_ids),false) or r->>'id'=any(seen) or not coalesce(r->>'purpose' in ('ensayo','show','nuevo','personal'),false) or not coalesce(r->>'mode' in ('por-confirmar','secuencia','bruto','mixto'),false) or jsonb_typeof(r->'notes') is distinct from 'string' or length(r->>'notes')>5000 then return false; end if;
  seen := array_append(seen,r->>'id');
 end loop;
 return true;
end $$;
create table public.intranet_musical_plans (
 id uuid primary key default gen_random_uuid(), target_key text unique not null,
 entry_id uuid references public.intranet_entries(id) on delete cascade,
 official_event_id text,
 music jsonb not null default '[]'::jsonb check(public.intranet_valid_music_rows(music)),
 general_notes text not null default '' check(length(general_notes)<=10000),
 author_email text not null default 'vicentenunez@bandabruna.cl' check(author_email='vicentenunez@bandabruna.cl'),
 revision integer not null default 1, updated_at timestamptz not null default now(),
 check ((entry_id is not null and official_event_id is null and target_key='entry:'||entry_id::text) or (entry_id is null and official_event_id is not null and target_key='official:'||official_event_id))
);
alter table public.intranet_musical_plans enable row level security;
create policy musical_plans_read on public.intranet_musical_plans for select to authenticated using (
 public.intranet_role() is not null and (
 (entry_id is not null and exists(select 1 from public.intranet_entries e where e.id=entry_id)) or
 (official_event_id is not null and exists(select 1 from public.eventos e where e.id::text=official_event_id and e.publicado=true))
 ));
revoke all on public.intranet_musical_plans from anon,authenticated;
grant select on public.intranet_musical_plans to authenticated;
grant all on public.intranet_musical_plans to service_role;
-- Conserva los planes antiguos publicados por Vicente; los de jefatura no se presentan como setlists aprobados.
insert into public.intranet_musical_plans(target_key,entry_id,music,general_notes)
select 'entry:'||id::text,id,rehearsal->'music',coalesce(rehearsal->>'internal_work','') from public.intranet_entries
where author_email='vicentenunez@bandabruna.cl' and kind in ('ensayo','evento','tenida') and public.intranet_valid_music_rows(rehearsal->'music') on conflict do nothing;
create function public.intranet_guard_publication() returns trigger language plpgsql set search_path=public as $$
declare role_name text := public.intranet_role();
begin
 if role_name not in ('jefatura','director') or role_name is null then raise exception 'No puedes publicar información'; end if;
 if new.kind not in ('comunicado','evento','ensayo','personal') then raise exception 'Elige comunicado, evento, ensayo o indicación personal'; end if;
 if new.kind='evento' and role_name<>'jefatura' then raise exception 'Solo Jaime y César definen eventos y tenidas'; end if;
 if new.kind<>'evento' and (new.outfit_id is not null or new.outfit_text<>'' or new.event_details<>'{}'::jsonb or cardinality(new.checklist)>0) then raise exception 'Tenidas y preparativos corresponden solo a eventos'; end if;
 if new.kind in ('comunicado','personal') and (new.starts_at is not null or new.location<>'') then raise exception 'Este aviso no lleva fecha ni lugar'; end if;
 if new.kind='ensayo' and (new.starts_at is null or length(trim(new.location))=0) then raise exception 'El ensayo requiere fecha, hora y lugar'; end if;
 if new.kind='evento' and new.starts_at is null and coalesce(new.event_details->>'official_event_id','')='' then raise exception 'El evento necesita una fecha'; end if;
 if new.rehearsal<>'{}'::jsonb or new.mix_mode<>'' then
  if lower(auth.jwt()->>'email')<>'vicentenunez@bandabruna.cl' or new.kind<>'personal' then raise exception 'El setlist lo prepara Vicente desde Dirección musical'; end if;
  if not public.intranet_valid_music_rows(coalesce(new.rehearsal->'music','[]'::jsonb)) then raise exception 'Selección musical inválida'; end if;
 end if;
 return new;
end $$;
create trigger intranet_guard_before_publish before insert on public.intranet_entries for each row execute function public.intranet_guard_publication();
-- La política anterior limitaba comunicados de Vicente. Ahora se autorizan sin permitirle crear eventos.
drop policy entries_write on public.intranet_entries;
create policy entries_write on public.intranet_entries for insert to authenticated with check(
 author=auth.uid() and author_email=lower(auth.jwt()->>'email') and
 ((public.intranet_role()='jefatura' and kind in ('comunicado','evento','ensayo','personal')) or (public.intranet_role()='director' and kind in ('comunicado','ensayo','personal'))) and
 recipients <@ array['gersonulloa@bandabruna.cl','jaimecardenas@bandabruna.cl','jaimecardenasjr@bandabruna.cl','vicentenunez@bandabruna.cl','israellagos@bandabruna.cl','fabiangarrido@bandabruna.cl','cesarbruna@bandabruna.cl']::text[] and
 (file_path is null or file_path like auth.uid()::text||'/%')
);
create function public.save_intranet_musical_plan(target text,selected_music jsonb,notes text default '') returns uuid language plpgsql security definer set search_path=public as $$
declare parent public.intranet_entries; event_title text; audience text[] := '{}'; entry_ref uuid; official_ref text; result_id uuid;
begin
 if lower(auth.jwt()->>'email') is distinct from 'vicentenunez@bandabruna.cl' or public.intranet_role() is distinct from 'director' then raise exception 'Solo Vicente puede proporcionar u ordenar el setlist'; end if;
 if not public.intranet_valid_music_rows(selected_music) or notes is null or length(notes)>10000 then raise exception 'Plan musical inválido'; end if;
 if target like 'entry:%' then
  entry_ref := substring(target from 7)::uuid;
  select * into parent from public.intranet_entries e where e.id=entry_ref and e.kind in ('evento','tenida','ensayo') and (cardinality(e.recipients)=0 or lower(auth.jwt()->>'email')=any(e.recipients) or e.author=auth.uid());
  if not found then raise exception 'La ficha no está disponible para dirección musical'; end if;
  event_title:=parent.title; audience:=parent.recipients;
 elsif target like 'official:%' then
  official_ref:=substring(target from 10);
  select nombre into event_title from public.eventos where id::text=official_ref and publicado=true;
  if not found then raise exception 'La fecha oficial no está confirmada/publicada'; end if;
 else raise exception 'Selecciona un evento o ensayo'; end if;
 insert into public.intranet_musical_plans(target_key,entry_id,official_event_id,music,general_notes)
 values(target,entry_ref,official_ref,selected_music,notes)
 on conflict(target_key) do update set music=excluded.music,general_notes=excluded.general_notes,revision=intranet_musical_plans.revision+1,updated_at=now()
 returning id into result_id;
 insert into public.intranet_entries(kind,title,body,recipients,author,author_email)
 values('comunicado',left('Dirección musical · '||event_title,200),'Vicente actualizó el setlist o las indicaciones musicales. Revisa la ficha del evento o ensayo en la intranet.',audience,auth.uid(),'vicentenunez@bandabruna.cl');
 return result_id;
end $$;
revoke all on function public.save_intranet_musical_plan(text,jsonb,text) from public,anon,authenticated;
grant execute on function public.save_intranet_musical_plan(text,jsonb,text) to authenticated;
commit;
