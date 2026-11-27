-- Da collaudare con i due trigger di controllo sullo stesso archivio.
-- Il blocco RLS della versione operativa va rimosso solo al rilascio verificato.
begin;

create function public.haccp_registra_produzione(registrazione jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  titolare uuid := auth.uid();
  identificativo text := registrazione->>'id';
  precedente jsonb;
begin
  if titolare is null then
    raise exception 'Accesso richiesto' using errcode = '42501';
  end if;
  if identificativo is null or identificativo !~ '^FG-P-[a-f0-9-]{36}$'
     or registrazione->>'module' is distinct from 'Produzione'
     or jsonb_typeof(registrazione->'data') is distinct from 'object' then
    raise exception 'Registrazione produzione non valida' using errcode = '22023';
  end if;
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Isolamento della transazione non supportato' using errcode = '0A000';
  end if;

  -- Lo stesso lock serializza i controlli saldo e i tentativi con lo stesso ID.
  perform pg_advisory_xact_lock(hashtextextended('haccp-prelievi:' || titolare::text, 0));

  select payload into precedente
  from public.haccp_archive
  where owner_id = titolare and record_id = identificativo;

  if found then
    if precedente is distinct from registrazione then
      raise exception 'Identificativo già utilizzato per una registrazione diversa' using errcode = '23505';
    end if;
    return precedente;
  end if;

  insert into public.haccp_archive (owner_id, record_id, module, payload)
  values (titolare, identificativo, 'Produzione', registrazione);
  return registrazione;
end;
$$;

revoke all on function public.haccp_registra_produzione(jsonb) from public, anon, authenticated;
grant execute on function public.haccp_registra_produzione(jsonb) to authenticated;

commit;
