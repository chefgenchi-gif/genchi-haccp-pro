-- Da installare insieme al controllo dei prelievi, dopo il collaudo.
begin;

create function haccp_private.proteggi_storico_prelievi()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.owner_id is distinct from new.owner_id
     or old.record_id is distinct from new.record_id
     or old.module is distinct from new.module
     or new.payload->>'id' is distinct from new.record_id
     or new.payload->>'module' is distinct from new.module then
    raise exception 'Identità della registrazione non modificabile' using errcode = '22023';
  end if;

  if new.payload is not distinct from old.payload then
    return new;
  end if;
  if old.module = 'Produzione' then
    raise exception 'La produzione registrata richiede una rettifica separata'
      using errcode = '22023';
  end if;
  if old.module <> 'Ricevimento merci' then
    return new;
  end if;

  if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Isolamento della transazione non supportato' using errcode = '0A000';
  end if;

  -- Un aggiornamento del lotto e un prelievo sullo stesso archivio si escludono.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('haccp-prelievi:' || old.owner_id::text, 0)
  );
  if exists (
    select 1
    from public.haccp_archive
    where owner_id = old.owner_id and module = 'Produzione'
      and (payload->'data'->'prelievi') ? old.record_id
  ) then
    raise exception 'Il lotto già prelevato richiede una rettifica separata'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function haccp_private.proteggi_storico_prelievi() from public;
create trigger haccp_proteggi_storico_prelievi
before update on public.haccp_archive
for each row execute function haccp_private.proteggi_storico_prelievi();

commit;
