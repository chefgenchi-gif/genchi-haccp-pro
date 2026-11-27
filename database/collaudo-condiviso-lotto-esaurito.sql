begin;
alter table haccp_demo_avvisi.sessione
  drop constraint sessione_residuo_check,
  add constraint sessione_residuo_check check (residuo in (0,1,5)),
  add column ultimo_prelievo integer;
create or replace function public.haccp_collaudo_avvisi(codice_prova uuid, operazione text default 'leggi')
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare saldo integer; ultimo integer; quantita integer; respinto boolean := false;
begin
  if operazione is null or operazione not in ('leggi','preleva4','preleva5','preleva1','prova3') then
    raise exception 'Operazione non valida' using errcode='22023';
  end if;
  quantita := case operazione when 'preleva5' then 5 when 'preleva4' then 4 when 'preleva1' then 1 end;
  if quantita is not null then
    update haccp_demo_avvisi.sessione set residuo=residuo-quantita, ultimo_prelievo=quantita
    where codice=codice_prova and scade>clock_timestamp()
      and residuo=case when quantita=1 then 1 else 5 end;
    respinto := not found;
  end if;
  select residuo, coalesce(ultimo_prelievo,case when residuo=1 then 4 end) into saldo, ultimo
  from haccp_demo_avvisi.sessione where codice=codice_prova and scade>clock_timestamp();
  if not found then return jsonb_build_object('scaduta',true); end if;
  return jsonb_build_object('saldo',saldo,'avviso',ultimo is not null,'prelevato',ultimo,
    'respinto',respinto or (operazione='prova3' and saldo<3));
end;
$$;
commit;
