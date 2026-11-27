-- Da integrare con la validazione della revisione della ricetta prima del rilascio.
-- I prelievi sono espressi nell'unità dell'entrata del lotto, come nello storico.
begin;

create schema if not exists haccp_private;

create or replace function haccp_private.controlla_prelievi_archivio()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prelievi jsonb := new.payload #> '{data,prelievi}';
  prelievo record;
  lotto jsonb;
  carico numeric;
  consumato numeric;
  richiesto numeric;
  unita text;
  ultimo_prelievo numeric;
  scadenza text;
  data_ora timestamp := pg_catalog.timezone('Europe/Rome', pg_catalog.clock_timestamp());
begin
  if new.payload->>'module' is distinct from new.module
     or new.payload->>'id' is distinct from new.record_id then
    raise exception 'Identificativo o modulo archivio incoerente' using errcode = '22023';
  end if;
  if new.module <> 'Produzione' then
    return new;
  end if;

  if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Isolamento della transazione non supportato per il prelievo'
      using errcode = '0A000';
  end if;
  if pg_catalog.jsonb_typeof(prelievi) is distinct from 'object' or prelievi = '{}'::jsonb then
    raise exception 'Indicare i lotti effettivamente prelevati' using errcode = '22023';
  end if;

  -- Tutte le produzioni dello stesso archivio attendono il commit precedente.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('haccp-prelievi:' || new.owner_id::text, 0)
  );

  for prelievo in select key, value from pg_catalog.jsonb_each_text(prelievi)
  loop
    if prelievo.value is null or prelievo.value !~ '^[0-9]+([.][0-9]+)?$' then
      raise exception 'Quantità di prelievo non valida' using errcode = '22023';
    end if;
    richiesto := prelievo.value::numeric;
    if richiesto <= 0 then
      raise exception 'Il prelievo deve essere positivo' using errcode = '22023';
    end if;

    select payload->'data' into lotto
    from public.haccp_archive
    where owner_id = new.owner_id and record_id = prelievo.key and module = 'Ricevimento merci';

    if not found or lotto->>'Esito' is distinct from 'Conforme' then
      raise exception 'Lotto assente o non conforme' using errcode = '22023';
    end if;
    scadenza := lotto->>'Scadenza';
    if scadenza is null
       or scadenza !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2}(:[0-9]{2})?)?$'
       or scadenza::timestamp <= data_ora then
      raise exception 'Lotto scaduto o privo di scadenza utilizzabile' using errcode = '22023';
    end if;

    carico := coalesce(lotto->>'Quantità', lotto->>'Quantità kg')::numeric;
    select coalesce(sum((payload->'data'->'prelievi'->>prelievo.key)::numeric), 0)
    into consumato
    from public.haccp_archive
    where owner_id = new.owner_id and module = 'Produzione'
      and (payload->'data'->'prelievi') ? prelievo.key;

    if carico is null or carico::text in ('NaN','Infinity','-Infinity')
       or consumato::text in ('NaN','Infinity','-Infinity') or consumato < 0
       then
      raise exception 'Saldo non valido per il lotto %', prelievo.key
        using errcode = '22023';
    end if;
    if richiesto > carico - consumato then
      unita := coalesce(nullif(lotto->>'Unità',''), 'kg');
      select (payload->'data'->'prelievi'->>prelievo.key)::numeric
      into ultimo_prelievo
      from public.haccp_archive
      where owner_id = new.owner_id and module = 'Produzione'
        and (payload->'data'->'prelievi') ? prelievo.key
      order by updated_at desc, record_id desc
      limit 1;

      if ultimo_prelievo is not null then
        raise exception 'Disponibilità insufficiente per il lotto %: in % resta % %. Ultimo prelievo: % %.',
          prelievo.key, coalesce(nullif(lotto->>'Ubicazione',''),'magazzino'),
          trim_scale(carico-consumato), unita, trim_scale(ultimo_prelievo), unita
          using errcode = '22023';
      end if;
      raise exception 'Disponibilità insufficiente per il lotto %: in % resta % %.',
        prelievo.key, coalesce(nullif(lotto->>'Ubicazione',''),'magazzino'),
        trim_scale(carico-consumato), unita using errcode = '22023';
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function haccp_private.controlla_prelievi_archivio() from public;

create trigger haccp_controlla_prelievi
before insert on public.haccp_archive
for each row execute function haccp_private.controlla_prelievi_archivio();

commit;
