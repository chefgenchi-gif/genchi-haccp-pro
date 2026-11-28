-- Fixture da eseguire dopo aver installato i moduli SQL in uno schema isolato.
-- Il runner sostituisce SCHEMA_TEST con lo schema di collaudo.
begin;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000861';

do $$
declare
  titolare uuid := auth.uid();
  registrazione jsonb := '{"id":"FG-P-00000000-0000-0000-0000-000000000861","module":"Produzione","data":{"Ricetta id":"RIC-TEST","Revisione ricetta":1,"prelievi":{"LOT-TEST":5}}}';
  tentativo jsonb;
  avvisi jsonb;
begin
  insert into SCHEMA_TEST.haccp_archive(owner_id,record_id,module,payload) values
    (titolare,'DDT-TEST','Registro fatture','{"id":"DDT-TEST","module":"Registro fatture","data":{"Tipo documento":"DDT"}}'),
    (titolare,'LOT-TEST','Ricevimento merci','{"id":"LOT-TEST","module":"Ricevimento merci","data":{"Documento":"DDT-TEST","Prodotto":"Merluzzo prova","Ubicazione":"Congelatore pesce","Unità":"kg","Quantità":5,"Scadenza":"2099-01-01","Esito":"Conforme"}}'),
    (titolare,'RIC-TEST','Ricette e procedure','{"id":"RIC-TEST","module":"Ricette e procedure","data":{"Preparazione":"Merluzzo prova"}}');

  begin
    perform SCHEMA_TEST.haccp_registra_produzione(registrazione);
    raise exception 'Produzione accettata prima dell’approvazione';
  exception when invalid_parameter_value then
    if sqlerrm not like 'Procedura priva di validazione%' then raise; end if;
  end;
  insert into SCHEMA_TEST.procedure_approvate(owner_id,recipe_id,revisione,dati_ricetta,riferimento_validazione)
  select owner_id,record_id,revision,payload->'data','SOLO COLLAUDO'
  from SCHEMA_TEST.haccp_archive where owner_id=titolare and record_id='RIC-TEST';

  begin
    perform SCHEMA_TEST.haccp_registra_produzione(
      jsonb_set(registrazione, '{data,Revisione ricetta}', '2')
    );
    raise exception 'Produzione accettata con revisione diversa';
  exception when invalid_parameter_value then
    if sqlerrm not like 'Revisione%' then raise; end if;
  end;

  begin
    perform SCHEMA_TEST.haccp_registra_produzione(registrazione);
    raise exception 'Annullamento della transazione di prova' using errcode='P0086';
  exception when sqlstate 'P0086' then null;
  end;
  if exists(select 1 from SCHEMA_TEST.avvisi_prelievo where owner_id=titolare)
     or exists(select 1 from SCHEMA_TEST.haccp_archive where owner_id=titolare and module='Produzione') then
    raise exception 'Rollback incompleto';
  end if;

  perform SCHEMA_TEST.haccp_registra_produzione(registrazione);
  perform SCHEMA_TEST.haccp_registra_produzione(registrazione);
  avvisi := SCHEMA_TEST.haccp_leggi_avvisi_prelievo();
  if jsonb_array_length(avvisi)<>1 or (avvisi->0->>'prelevato')::numeric<>5
     or (avvisi->0->>'residuo')::numeric<>0
     or avvisi->0->>'ubicazione'<>'Congelatore pesce' then
    raise exception 'Avviso duplicato o saldo inatteso';
  end if;

  tentativo := jsonb_set(jsonb_set(registrazione,'{id}','"FG-P-00000000-0000-0000-0000-000000000862"'),'{data,prelievi,LOT-TEST}','1');
  begin
    perform SCHEMA_TEST.haccp_registra_produzione(tentativo);
    raise exception 'Prelievo da lotto esaurito accettato';
  exception when invalid_parameter_value then
    if sqlerrm not like 'Disponibilità insufficiente%' then raise; end if;
  end;
end;
$$;
select 'PASS revisione approvata, rollback, un solo avviso, saldo zero, nuovo prelievo respinto' as esito;
rollback;
