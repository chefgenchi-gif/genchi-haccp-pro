-- Da installare dopo i controlli transazionali della produzione.
begin;

create table haccp_private.avvisi_prelievo (
  owner_id uuid not null,
  produzione_id text not null,
  lotto_id text not null,
  prodotto text not null,
  ubicazione text not null,
  unita text not null,
  prelevato numeric not null check (prelevato > 0),
  residuo numeric not null check (residuo >= 0),
  creato_il timestamptz not null default now(),
  primary key (owner_id, produzione_id, lotto_id)
);
alter table haccp_private.avvisi_prelievo enable row level security;
revoke all on haccp_private.avvisi_prelievo from public, anon, authenticated;
grant usage on schema haccp_private to authenticated;
grant select on haccp_private.avvisi_prelievo to authenticated;
create policy lettura_avvisi_propri on haccp_private.avvisi_prelievo
for select to authenticated using (owner_id = (select auth.uid()));

create function haccp_private.crea_avvisi_prelievo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.module <> 'Produzione' then
    return new;
  end if;
  if auth.uid() is distinct from new.owner_id then
    raise exception 'Archivio non autorizzato' using errcode = '42501';
  end if;

  -- I controlli BEFORE INSERT hanno già verificato i lotti e acquisito il lock.
  insert into haccp_private.avvisi_prelievo
    (owner_id, produzione_id, lotto_id, prodotto, ubicazione, unita, prelevato, residuo)
  select new.owner_id, new.record_id, p.key,
    coalesce(nullif(l.payload#>>'{data,Prodotto}',''), p.key),
    coalesce(nullif(l.payload#>>'{data,Ubicazione}',''), 'Ubicazione da verificare'),
    coalesce(nullif(l.payload#>>'{data,Unità}',''), 'kg'),
    p.value::numeric,
    coalesce(l.payload#>>'{data,Quantità}', l.payload#>>'{data,Quantità kg}')::numeric
    - (
      select sum((s.payload->'data'->'prelievi'->>p.key)::numeric)
      from public.haccp_archive s
      where s.owner_id = new.owner_id and s.module = 'Produzione'
        and (s.payload->'data'->'prelievi') ? p.key
    )
  from pg_catalog.jsonb_each_text(new.payload#>'{data,prelievi}') p
  join public.haccp_archive l
    on l.owner_id = new.owner_id and l.record_id = p.key and l.module = 'Ricevimento merci';

  if (select count(*) from haccp_private.avvisi_prelievo
      where owner_id = new.owner_id and produzione_id = new.record_id)
     <> (select count(*) from pg_catalog.jsonb_object_keys(new.payload#>'{data,prelievi}')) then
    raise exception 'Avvisi prelievo incompleti' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function haccp_private.crea_avvisi_prelievo() from public, anon, authenticated;
create trigger haccp_crea_avvisi_prelievo
after insert on public.haccp_archive
for each row execute function haccp_private.crea_avvisi_prelievo();

commit;
