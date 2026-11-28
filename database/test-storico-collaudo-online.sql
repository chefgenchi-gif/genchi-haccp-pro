-- Eseguire le due transazioni in sessioni separate sul database di collaudo.
-- Le quattro schede fittizie restano nello schema isolato per la riapertura.
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000004208';
insert into fg_collaudo_haccp.haccp_archive(owner_id,record_id,module,payload)
select auth.uid(), id, modulo, jsonb_build_object(
  'id',id,'module',modulo,'at','2026-11-28T11:00:00Z','data',dati
)
from (values
  ('FG-COLLAUDO-STORICO-T','Temperature','{"Operatore":"SOLO COLLAUDO","Attrezzatura":"Cella di prova","Temperatura rilevata °C":3}'::jsonb),
  ('FG-COLLAUDO-STORICO-A','Abbattimento positivo','{"Operatore":"SOLO COLLAUDO","Lotto interno":"LOTTO-FITTIZIO"}'),
  ('FG-COLLAUDO-STORICO-C','Conservazione refrigerata','{"Operatore":"SOLO COLLAUDO","Ubicazione":"Cella di prova"}'),
  ('FG-COLLAUDO-STORICO-D','Registro fatture','{"Operatore":"SOLO COLLAUDO","Tipo documento":"DDT","Numero documento":"DDT-FITTIZIO"}')
) as dati_test(id,modulo,dati)
on conflict (owner_id,record_id) do nothing;
commit;

begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000004208';
do $$
begin
  if (select count(distinct module) from fg_collaudo_haccp.haccp_archive where record_id like 'FG-COLLAUDO-STORICO-%') <> 4
     or (select count(*) from fg_collaudo_haccp.haccp_archive where record_id like 'FG-COLLAUDO-STORICO-%') <> 4 then
    raise exception 'Rilettura dei quattro registri incompleta';
  end if;
end $$;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000004209';
do $$
begin
  if exists(select 1 from fg_collaudo_haccp.haccp_archive where record_id like 'FG-COLLAUDO-STORICO-%') then
    raise exception 'Le registrazioni sono visibili a un altro account';
  end if;
end $$;
select 'PASS quattro registri persistenti e isolamento accessi' as esito;
rollback;
