import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

// Requisito locale: npm install --no-save embedded-postgres@17.12.0-beta.19
const databaseDir = await mkdtemp(join(tmpdir(), 'fg-pg-test-'));
const postgres = new EmbeddedPostgres({ databaseDir, user: 'postgres', password: 'test-locale', port: 55437, persistent: false, autoRehydrateSymlinks: true, postgresFlags: ['-c', 'unix_socket_directories='] });
const owner = '00000000-0000-0000-0000-000000000101';
const names = ['controllo-prelievi-archivio','controllo-procedura-produzione','registrazione-produzione','avvisi-prelievo-magazzino','lettura-avvisi-magazzino','protezione-storico-prelievi'];
const clients = [];
try {
  await postgres.initialise();
  await postgres.start();
  for (let i = 0; i < 3; i++) {
    const c = postgres.getPgClient();
    await c.connect();
    clients.push(c);
  }
  const [db,a,b] = clients;
  await db.query(`
    create role authenticated; create role anon; create schema auth;
    create function auth.uid() returns uuid language sql stable as
      'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    grant usage on schema auth to authenticated;
    create table public.haccp_archive(
      owner_id uuid not null, record_id text not null, module text not null,
      payload jsonb not null, revision bigint not null default 1,
      updated_at timestamptz not null default now(), primary key(owner_id,record_id));
    alter table public.haccp_archive enable row level security;
    grant select,insert,update on public.haccp_archive to authenticated;
    create policy owner_only on public.haccp_archive to authenticated
      using(owner_id=auth.uid()) with check(owner_id=auth.uid());
  `);
  for (const name of names) await db.query(await readFile(new URL('database/'+name+'.sql',import.meta.url),'utf8'));
  for (const record of [
    {id:'R',module:'Ricette e procedure',data:{Preparazione:'Merluzzo di prova'}},
    {id:'A',module:'Ricevimento merci',data:{Quantità:5,Esito:'Conforme',Scadenza:'2099-01-01',Ubicazione:'Congelatore pesce'}},
  ]) {
    await db.query('insert into public.haccp_archive(owner_id,record_id,module,payload) values($1,$2,$3,$4)',[owner,record.id,record.module,record]);
  }
  await db.query("insert into haccp_private.procedure_approvate(owner_id,recipe_id,revisione,dati_ricetta,riferimento_validazione) select owner_id,record_id,revision,payload->'data','SOLO COLLAUDO' from public.haccp_archive where record_id='R'");
  for (const c of [a,b]) {
    await c.query('set role authenticated');
    await c.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
  }
  const produzione = n => ({
    id:'FG-P-00000000-0000-0000-0000-00000000010'+n,module:'Produzione',
    data:{'Ricetta id':'R','Revisione ricetta':1,prelievi:{A:4}},
  });
  const register = (c,n) => c.query('select public.haccp_registra_produzione($1::jsonb)',[produzione(n)]);
  const pid = (await b.query('select pg_backend_pid() pid')).rows[0].pid;
  await a.query('begin');
  await register(a,1);
  const secondo = assert.rejects(register(b,2), e => e.code==='22023' && e.message.includes('Disponibilità insufficiente'));
  let attesa = false;
  try {
    for (let i=0;i<50;i++) {
      const {rows}=await db.query("select 1 from pg_locks where pid=$1 and locktype='advisory' and not granted",[pid]);
      if(rows.length){attesa=true; break;}
      await new Promise(f=>setTimeout(f,20));
    }
    assert.ok(attesa,'La seconda sessione deve attendere il lock della prima');
  } finally {
    await a.query('commit');
    await secondo;
  }
  const {rows} = await db.query("select prelevato::int,residuo::int from haccp_private.avvisi_prelievo where lotto_id='A'");
  assert.deepEqual(rows,[{prelevato:4,residuo:1}]);
  assert.equal((await db.query("select count(*)::int as n from public.haccp_archive where module='Produzione'")).rows[0].n,1);
  // L'ultimo kg deve tornare disponibile dopo il rollback della prima sessione.
  const ultimo = (c,n) => c.query('select public.haccp_registra_produzione($1::jsonb)',[
    {...produzione(n),data:{...produzione(n).data,prelievi:{A:1}}},
  ]);
  await a.query('begin');
  await ultimo(a,3);
  const concorrente = ultimo(b,4);
  try {
    let bloccato = false;
    for (let i=0;i<50;i++) {
      const {rows}=await db.query("select 1 from pg_locks where pid=$1 and locktype='advisory' and not granted",[pid]);
      if(rows.length){bloccato=true; break;}
      await new Promise(f=>setTimeout(f,20));
    }
    assert.ok(bloccato,'La seconda sessione deve attendere anche prima del rollback');
  } finally {
    await a.query('rollback');
    await concorrente;
  }
  const finale = await db.query("select produzione_id,prelevato::int,residuo::int from haccp_private.avvisi_prelievo order by sequenza");
  assert.deepEqual(finale.rows,[
    {produzione_id:produzione(1).id,prelevato:4,residuo:1},
    {produzione_id:produzione(4).id,prelevato:1,residuo:0},
  ]);
  console.log('PASS rollback concorrente: nessun avviso residuo, ultimo kg assegnato alla seconda sessione');
  console.log('PASS: due sessioni simultanee, seconda in attesa del lock, un solo prelievo e residuo 1 kg');
} finally {
  for(const c of clients) await c.end();
  await postgres.stop();
}
