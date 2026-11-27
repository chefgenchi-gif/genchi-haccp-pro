begin;
create temporary table fg_ledger_test(id int primary key, qty numeric not null, reason text not null, original_id int references fg_ledger_test(id));
insert into fg_ledger_test values(1,19,'Carico',null),(2,-10,'Consumo',1);
create function pg_temp.fg_immutable() returns trigger language plpgsql as $$ begin raise exception 'Registro immutabile' using errcode='55000'; end $$;
create trigger immutable before update or delete on fg_ledger_test for each row execute function pg_temp.fg_immutable();
do $$ begin
begin update fg_ledger_test set qty=99 where id=1; raise exception 'FAIL update consentito'; exception when sqlstate '55000' then null; end;
begin delete from fg_ledger_test where id=2; raise exception 'FAIL delete consentito'; exception when sqlstate '55000' then null; end;
insert into fg_ledger_test values(3,2,'Rettifica documentata',2);
if (select sum(qty) from fg_ledger_test)<>11 or (select qty from fg_ledger_test where id=1)<>19 then raise exception 'FAIL saldo'; end if;
end $$;
select 'PASS immutabilita e rettifica separata' as risultato;
rollback;