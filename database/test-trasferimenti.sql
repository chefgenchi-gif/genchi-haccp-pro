begin;
create temporary table fg_locations(lot text, location text, qty numeric not null check(qty>=0), primary key(lot,location));
insert into fg_locations values('TEST','Cella A',9);
create function pg_temp.fg_transfer(l text, a text,b text,q numeric) returns void language plpgsql as $$ begin
if q is null or q<=0 or q::text in ('NaN','Infinity','-Infinity') or a is null or b is null or a=b or btrim(b)='' then raise exception 'Trasferimento non valido' using errcode='22023'; end if;
update pg_temp.fg_locations set qty=qty-q where lot=l and location=a and qty>=q;
if not found then raise exception 'Disponibilita insufficiente' using errcode='22023'; end if;
insert into pg_temp.fg_locations values(l,b,q) on conflict(lot,location) do update set qty=fg_locations.qty+excluded.qty;
end $$;
do $$ begin
perform pg_temp.fg_transfer('TEST','Cella A','Cella B',4);
if (select qty from fg_locations where location='Cella A')<>5 or (select qty from fg_locations where location='Cella B')<>4 then raise exception 'FAIL transfer'; end if;
begin perform pg_temp.fg_transfer('TEST','Cella A','Cella B',6); raise exception 'FAIL excessive'; exception when sqlstate '22023' then null; end;
begin perform pg_temp.fg_transfer('TEST','Cella A','Cella A',1); raise exception 'FAIL same'; exception when sqlstate '22023' then null; end;
if (select sum(qty) from fg_locations)<>9 then raise exception 'FAIL total'; end if;
end $$;
select 'PASS transfer, insufficient stock, same location, conservation of quantity' as result;
rollback;