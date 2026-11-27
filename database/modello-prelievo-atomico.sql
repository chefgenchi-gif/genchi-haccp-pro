-- Modello isolato, non migrazione operativa.
-- Eseguire in una transazione di prova.
begin;
create temporary table fg_stock_test (
 id text primary key,
 qty numeric not null check(qty >= 0),
 expires date not null,
 conform boolean not null
) on commit drop;
insert into fg_stock_test values ('A',9,current_date+2,true);
do $$ declare n integer; begin
 update fg_stock_test set qty=qty-8 where id='A' and qty>=8 and expires>current_date and conform;
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Prelievo valido fallito'; end if;
 update fg_stock_test set qty=qty-2 where id='A' and qty>=2 and expires>current_date and conform;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Prelievo eccessivo accettato'; end if;
end $$;
rollback;
-- Il modello usa UPDATE condizionale e lock di riga PostgreSQL.
-- Prima della migrazione: test con due sessioni indipendenti,
-- integrazione transazionale con archivio, unità, trasferimenti,
-- rettifiche, autorizzazioni e procedure validate.
