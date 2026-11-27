begin;
create temporary table fg_p_test(id int primary key, revision int not null, approved boolean not null);
create temporary table fg_s_test(id int primary key, qty numeric not null check(qty>=0), conform boolean, expiry date);
create temporary table fg_prod_test(id int primary key, procedure_id int, revision int, lot int, qty numeric);
insert into fg_p_test values(1,2,true),(2,1,false);
insert into fg_s_test values(1,9,true,current_date+2),(2,9,false,current_date+2);
create function pg_temp.fg_produce(i int,p int,v int,l int,q numeric) returns void language plpgsql as $$ begin
if q is null or q<=0 or q::text in ('NaN','Infinity','-Infinity') then raise exception 'Quantita non valida' using errcode='22023'; end if;
perform 1 from pg_temp.fg_p_test where id=p and revision=v and approved for share;
if not found then raise exception 'Procedura non approvata' using errcode='22023'; end if;
update pg_temp.fg_s_test set qty=qty-q where id=l and qty>=q and conform and expiry>current_date;
if not found then raise exception 'Lotto non utilizzabile' using errcode='22023'; end if;
insert into pg_temp.fg_prod_test values(i,p,v,l,q);
end $$;
do $$ begin
perform pg_temp.fg_produce(1,1,2,1,4);
begin perform pg_temp.fg_produce(2,2,1,1,1); raise exception 'FAIL unapproved'; exception when sqlstate '22023' then null; end;
begin perform pg_temp.fg_produce(2,1,1,1,1); raise exception 'FAIL revision'; exception when sqlstate '22023' then null; end;
begin perform pg_temp.fg_produce(2,1,2,2,1); raise exception 'FAIL lot'; exception when sqlstate '22023' then null; end;
begin perform pg_temp.fg_produce(2,1,2,1,6); raise exception 'FAIL stock'; exception when sqlstate '22023' then null; end;
begin perform pg_temp.fg_produce(1,1,2,1,1); raise exception 'FAIL duplicate'; exception when unique_violation then null; end;
if (select qty from fg_s_test where id=1)<>5 or (select count(*) from fg_prod_test)<>1 then raise exception 'FAIL atomicity'; end if;
end $$;
select 'PASS 6 production scenarios and atomic rollback' as result;
rollback;