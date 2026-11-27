-- PROPOSTA NON APPLICATA: richiede collaudo su database isolato.
-- Serializza le scritture per proprietario e verifica il saldo dei lotti.
create or replace function public.fg_guard_stock() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare k text; q numeric; available numeric; lot jsonb; picks jsonb;
begin
 if new.owner_id is distinct from auth.uid() then raise exception 'Accesso non autorizzato'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text,0));
 if new.module not in ('Produzione','Movimenti magazzino') then return new; end if;
 if new.module='Produzione' then
   picks := new.payload->'data'->'prelievi';
 else
   if new.payload->'data'->>'Operazione'='Trasferimento' then return new; end if;
   picks := jsonb_build_object(new.payload->'data'->>'Lotto',coalesce(new.payload->'data'->'Quantità',new.payload->'data'->'Quantità kg'));
 end if;
 if picks is null or jsonb_typeof(picks)<>'object' or picks='{}'::jsonb then raise exception 'Prelievi mancanti'; end if;
 for k,q in select key,value::numeric from jsonb_each_text(picks) loop
   if q is null or q::text in ('NaN','Infinity','-Infinity') or q<=0 then raise exception 'Quantità non valida'; end if;
   select payload->'data' into lot from public.haccp_archive where owner_id=new.owner_id and record_id=k and module='Ricevimento merci';
   if lot is null or lot->>'Esito' is distinct from 'Conforme' or nullif(lot->>'Scadenza','') is null or (lot->>'Scadenza')::date <= (now() at time zone 'Europe/Rome')::date then raise exception 'Lotto non utilizzabile'; end if;
   select coalesce((lot->>'Quantità')::numeric,(lot->>'Quantità kg')::numeric,0)
   - coalesce(sum(case when module='Produzione' then (payload->'data'->'prelievi'->>k)::numeric when module='Movimenti magazzino' and payload->'data'->>'Lotto'=k and payload->'data'->>'Operazione'<>'Trasferimento' then coalesce((payload->'data'->>'Quantità')::numeric,(payload->'data'->>'Quantità kg')::numeric) else 0 end),0)
   into available from public.haccp_archive where owner_id=new.owner_id;
   if available<q then raise exception 'Giacenza insufficiente: %',k; end if;
 end loop;
 return new;
end $$;
-- Attivazione deliberatamente omessa: verificare isolamento transazioni, aggiornamenti,
-- trasferimenti, resi, duplicati, procedure validate e compatibilità con archivio storico.
