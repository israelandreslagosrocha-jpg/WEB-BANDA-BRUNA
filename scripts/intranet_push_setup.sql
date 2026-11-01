-- Aplicar después de intranet_setup.sql. Sustituye WhatsApp como canal externo.
begin;
create table public.intranet_push_subscriptions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 member_email text not null references public.intranet_members(email),
 endpoint text unique not null check(length(endpoint) between 10 and 2500),
 subscription jsonb not null check(jsonb_typeof(subscription)='object'), created_at timestamptz not null default now()
);
alter table public.intranet_push_subscriptions enable row level security;
create policy push_own_select on public.intranet_push_subscriptions for select to authenticated using(user_id=auth.uid());
create policy push_own_insert on public.intranet_push_subscriptions for insert to authenticated with check(user_id=auth.uid() and member_email=lower(auth.jwt()->>'email') and public.intranet_role() is not null);
create policy push_own_update on public.intranet_push_subscriptions for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and member_email=lower(auth.jwt()->>'email') and public.intranet_role() is not null);
create policy push_own_delete on public.intranet_push_subscriptions for delete to authenticated using(user_id=auth.uid());
grant select,insert,update,delete on public.intranet_push_subscriptions to authenticated;
create table public.intranet_push_outbox (
 id uuid primary key default gen_random_uuid(), entry_id uuid not null references public.intranet_entries(id) on delete cascade,
 subscription_id uuid references public.intranet_push_subscriptions(id) on delete set null,
 status text not null default 'pending' check(status in ('pending','sending','accepted','failed','unknown','skipped','expired')),
 created_at timestamptz not null default now(),processed_at timestamptz,error_code text,
 unique(entry_id,subscription_id)
);
alter table public.intranet_push_outbox enable row level security;
revoke all on public.intranet_push_outbox from anon,authenticated;
grant all on public.intranet_push_subscriptions,public.intranet_push_outbox to service_role;
create index on public.intranet_push_outbox(created_at) where status='pending';
create function public.intranet_queue_push() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.author_email not in ('vicentenunez@bandabruna.cl','jaimecardenas@bandabruna.cl','cesarbruna@bandabruna.cl') then return new; end if;
 insert into public.intranet_push_outbox(entry_id,subscription_id)
 select new.id,s.id from public.intranet_push_subscriptions s where s.member_email<>new.author_email
 and (cardinality(new.recipients)=0 or s.member_email=any(new.recipients)) on conflict do nothing;
 return new;
end $$;
revoke all on function public.intranet_queue_push() from public,anon,authenticated;
create trigger intranet_push_after_publish after insert on public.intranet_entries for each row execute function public.intranet_queue_push();
create function public.intranet_claim_push(batch_size integer default 10) returns setof public.intranet_push_outbox language sql security definer set search_path=public as $$
 update public.intranet_push_outbox set status='sending',processed_at=now()
 where id in (select id from public.intranet_push_outbox where status='pending' order by created_at for update skip locked limit least(greatest(batch_size,1),20)) returning *;
$$;
revoke all on function public.intranet_claim_push(integer) from public,anon,authenticated;
grant execute on function public.intranet_claim_push(integer) to service_role;
-- Si la preparación anterior de WhatsApp fue aplicada, se desactiva su trigger.
do $$ begin
 if exists(select 1 from pg_trigger where tgname='intranet_whatsapp_after_publish' and tgrelid='public.intranet_entries'::regclass) then
 execute 'alter table public.intranet_entries disable trigger intranet_whatsapp_after_publish';
 end if;
end $$;
commit;
