-- Da installare dopo avvisi-prelievo-magazzino.sql.
begin;

alter table haccp_private.avvisi_prelievo
  add column sequenza bigint generated always as identity;
create unique index avvisi_prelievo_owner_sequenza
  on haccp_private.avvisi_prelievo (owner_id, sequenza);

create function public.haccp_leggi_avvisi_prelievo(dopo bigint default null)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with pagina as (
    (select sequenza, prodotto, lotto_id, ubicazione, unita, prelevato, residuo
     from haccp_private.avvisi_prelievo
     where dopo is null and owner_id = (select auth.uid())
     order by sequenza desc limit 20)
    union all
    (select sequenza, prodotto, lotto_id, ubicazione, unita, prelevato, residuo
     from haccp_private.avvisi_prelievo
     where dopo is not null and owner_id = (select auth.uid()) and sequenza > dopo
     order by sequenza asc limit 100)
  )
  select coalesce(jsonb_agg(
    (to_jsonb(pagina) - 'sequenza') || jsonb_build_object('sequenza', sequenza::text)
    order by sequenza
  ), '[]'::jsonb) from pagina;
$$;

revoke all on function public.haccp_leggi_avvisi_prelievo(bigint) from public, anon, authenticated;
grant execute on function public.haccp_leggi_avvisi_prelievo(bigint) to authenticated;

commit;
