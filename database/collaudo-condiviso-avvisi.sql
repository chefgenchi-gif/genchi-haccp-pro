begin;
create schema haccp_demo_avvisi;
revoke all on schema haccp_demo_avvisi from public, anon, authenticated;
create table haccp_demo_avvisi.sessione (
  codice uuid primary key,
  residuo integer not null default 5 check (residuo in (5,1)),
  scade timestamptz not null
);
create function public.haccp_collaudo_avvisi(codice_prova uuid, operazione text default 'leggi')
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare saldo integer;
begin
  if operazione not in ('leggi','preleva4','prova3') or operazione is null then
    raise exception 'Operazione non valida' using errcode='22023';
  end if;
  if operazione='preleva4' then
    update haccp_demo_avvisi.sessione set residuo=1
    where codice=codice_prova and scade>clock_timestamp() and residuo=5;
  end if;
  select residuo into saldo from haccp_demo_avvisi.sessione
  where codice=codice_prova and scade>clock_timestamp();
  if not found then return jsonb_build_object('scaduta',true); end if;
  return jsonb_build_object('saldo',saldo,'avviso',saldo=1,'respinto',operazione='prova3' and saldo=1);
end;
$$;
revoke all on function public.haccp_collaudo_avvisi(uuid,text) from public, anon, authenticated;
grant execute on function public.haccp_collaudo_avvisi(uuid,text) to anon, authenticated;
commit;
