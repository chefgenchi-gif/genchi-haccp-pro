-- Diagnostica in sola lettura. Eseguire sul database da collaudare.
select
  to_regprocedure('public.haccp_registra_produzione(jsonb)') is not null as api_produzione,
  to_regprocedure('public.haccp_leggi_avvisi_prelievo(bigint)') is not null as api_avvisi,
  to_regclass('haccp_private.procedure_approvate') is not null as registro_approvazioni,
  to_regclass('haccp_private.avvisi_prelievo') is not null as registro_avvisi,
  (select count(*) from pg_trigger where tgrelid=to_regclass('public.haccp_archive')
    and not tgisinternal and tgenabled in ('O','A')
    and tgname in ('haccp_controlla_prelievi','haccp_verifica_procedura',
                   'haccp_proteggi_storico_prelievi','haccp_crea_avvisi_prelievo')) as controlli_attivi,
  exists(select 1 from pg_policies where schemaname='public'
    and tablename='haccp_archive' and policyname='collaudo_no_production_insert') as blocco_produzione_inserimento;
