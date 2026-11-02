-- Ejecutar dentro de una transacción tras la migración; termina con ROLLBACK.
-- No entrega avisos reales: pg_net despacha solo después de COMMIT.
do $$ begin
 if (select count(*) from auth.users where lower(email) in ('jaimecardenas@bandabruna.cl','vicentenunez@bandabruna.cl','gersonulloa@bandabruna.cl'))<>3 then raise exception 'Faltan usuarios para probar los permisos'; end if;
 perform set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',lower(email),'role','authenticated')::text from auth.users where lower(email)='jaimecardenas@bandabruna.cl'),true);
end $$;
set local role authenticated;
do $$ declare entry uuid; begin
 entry:=public.publish_intranet_event(jsonb_build_object('kind','evento','title','TEST TRANSACCIONAL · no publicar','starts_at','2026-12-01T22:00:00Z','location','Lugar de prueba','rehearsal','{}'::jsonb,'event_details',jsonb_build_object('outfit_slug','azul-gala')),'[]'::jsonb);
 perform set_config('intranet.test_entry',entry::text,true);
 begin
  insert into public.intranet_entries(kind,title,starts_at,location,rehearsal) values('ensayo','No autorizado',now(),'Sala',jsonb_build_object('music','[]'::jsonb));
  raise exception 'TEST_FAIL: jefatura pudo escribir selección musical';
 exception when raise_exception then if sqlerrm like 'TEST_FAIL:%' then raise; end if; end;
 begin
  perform public.save_intranet_musical_plan('entry:'||entry::text,'[]'::jsonb,'No autorizado');
  raise exception 'TEST_FAIL: jefatura pudo editar el setlist';
 exception when raise_exception then if sqlerrm like 'TEST_FAIL:%' then raise; end if; end;
end $$;
reset role;
do $$ begin perform set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',lower(email),'role','authenticated')::text from auth.users where lower(email)='vicentenunez@bandabruna.cl'),true);end $$;
set local role authenticated;
do $$ declare plan uuid; begin
 plan:=public.save_intranet_musical_plan('entry:'||current_setting('intranet.test_entry'),'[{"id":"viking-1","purpose":"show","mode":"secuencia","notes":"Revisar cortes"}]'::jsonb,'Indicaciones de prueba');
 if not exists(select 1 from public.intranet_musical_plans where id=plan and music->0->>'id'='viking-1') then raise exception 'TEST_FAIL: no se guardó el plan del director';end if;
 begin
  insert into public.intranet_entries(kind,title,starts_at,location) values('evento','No autorizado',now(),'Teatro');
  raise exception 'TEST_FAIL: director pudo crear evento';
 exception when raise_exception then if sqlerrm like 'TEST_FAIL:%' then raise; end if; end;
 begin
  insert into public.intranet_entries(kind,title,recipients,outfit_text) values('personal','No autorizado',array['gersonulloa@bandabruna.cl'],'Tenida no permitida');
  raise exception 'TEST_FAIL: director pudo definir tenida';
 exception when raise_exception then if sqlerrm like 'TEST_FAIL:%' then raise; end if; end;
 insert into public.intranet_entries(kind,title,body) values('comunicado','TEST TRANSACCIONAL · director','Comunicado sin parámetros adicionales');
end $$;
reset role;
do $$ begin perform set_config('request.jwt.claims',(select jsonb_build_object('sub',id,'email',lower(email),'role','authenticated')::text from auth.users where lower(email)='gersonulloa@bandabruna.cl'),true);end $$;
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.intranet_musical_plans where entry_id=current_setting('intranet.test_entry')::uuid) then raise exception 'TEST_FAIL: el integrante no ve el plan compartido';end if;
 begin
  update public.intranet_musical_plans set music='[]'::jsonb;
  raise exception 'TEST_FAIL: integrante pudo editar setlist';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'Permisos verificados; todos los datos y avisos de prueba revertidos' as resultado;
