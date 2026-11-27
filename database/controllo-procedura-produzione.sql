-- Installare in collaudo dopo controllo-prelievi-archivio.sql.
-- Le approvazioni sono scritte esclusivamente dal processo amministrativo.
begin;

create table haccp_private.procedure_approvate (
  owner_id uuid not null,
  recipe_id text not null,
  revisione bigint not null check (revisione > 0),
  dati_ricetta jsonb not null check (jsonb_typeof(dati_ricetta) = 'object'),
  riferimento_validazione text not null check (btrim(riferimento_validazione) <> ''),
  approvata_il timestamptz not null default now(),
  primary key (owner_id, recipe_id, revisione),
  foreign key (owner_id, recipe_id) references public.haccp_archive (owner_id, record_id)
);
alter table haccp_private.procedure_approvate enable row level security;
revoke all on haccp_private.procedure_approvate from public, anon, authenticated;
grant usage on schema haccp_private to authenticated;
grant select on haccp_private.procedure_approvate to authenticated;
create policy lettura_proprie_approvazioni on haccp_private.procedure_approvate
for select to authenticated using (owner_id = (select auth.uid()));

create function haccp_private.verifica_procedura_produzione()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  ricetta_id text := new.payload #>> '{data,Ricetta id}';
  revisione_richiesta text := new.payload #>> '{data,Revisione ricetta}';
  ricetta record;
begin
  if new.module <> 'Produzione' then
    return new;
  end if;

  if ricetta_id is null or revisione_richiesta is null then
    raise exception 'Selezionare una revisione approvata della ricetta' using errcode = '22023';
  end if;

  select a.revision, a.payload->'data' as dati
  into ricetta
  from public.haccp_archive a
  where a.owner_id = new.owner_id and a.record_id = ricetta_id
    and a.module = 'Ricette e procedure'
  for share;

  if not found or ricetta.revision::text <> revisione_richiesta then
    raise exception 'Revisione ricetta superata o ricetta non disponibile' using errcode = '22023';
  end if;

  if not exists (
    select 1 from haccp_private.procedure_approvate p
    where p.owner_id = new.owner_id and p.recipe_id = ricetta_id
      and p.revisione = ricetta.revision and p.dati_ricetta = ricetta.dati
  ) then
    raise exception 'Procedura priva di validazione per questa revisione' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function haccp_private.verifica_procedura_produzione() from public;
create trigger haccp_verifica_procedura
before insert on public.haccp_archive
for each row execute function haccp_private.verifica_procedura_produzione();

commit;
